import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, inject } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const NON_EXISTENT_ID = '00000000-0000-4000-8000-000000000000';

interface Session {
  accessToken: string;
  sessionCookie: string;
}

describe('Comments (integration)', () => {
  let app: INestApplication;
  let author: Session;
  let questionId: string;

  beforeEach(async () => {
    process.env.POSTGRES_HOST = inject('POSTGRES_HOST')
    process.env.POSTGRES_PORT = inject('POSTGRES_PORT')
    process.env.POSTGRES_USER = inject('POSTGRES_USER')
    process.env.POSTGRES_PASSWORD = inject('POSTGRES_PASSWORD')
    process.env.POSTGRES_DB = inject('POSTGRES_DB')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app = await configureApp(app);
    await app.init();
  });

  async function registerAndLogin(usernamePrefix: string): Promise<Session> {
    const email = `${usernamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@gmail.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: usernamePrefix, email, password: 'welcome123' });
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'welcome123' });
    return {
      accessToken: loginResponse.body.accessToken,
      sessionCookie: loginResponse.headers['set-cookie'][0],
    };
  }

  function authed(req: request.Test, session: Session) {
    return req.set('Authorization', `Bearer ${session.accessToken}`).set('Cookie', session.sessionCookie);
  }

  async function createQuestion(session: Session): Promise<string> {
    const response = await authed(request(app.getHttpServer()).post('/questions'), session).send({
      question: 'A question to comment on',
    });
    return response.body.id;
  }

  beforeEach(async () => {
    author = await registerAndLogin('COMMENT_AUTHOR');
    questionId = await createQuestion(author);
  });

  describe('/questions/:questionId/comments (POST)', () => {
    it('creates a comment for the question and returns it with the author', async () => {
      const response = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/comments`),
        author,
      ).send({ comment: 'This is my comment' });

      expect(response.status).toBe(201);
      expect(response.body.comment).toBe('This is my comment');
      expect(response.body.author).toHaveProperty('id');
    });

    it('returns 404 when the question does not exist', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${NON_EXISTENT_ID}/comments`), author)
        .send({ comment: 'Comment' })
        .expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/questions/${questionId}/comments`)
        .send({ comment: 'Comment' })
        .expect(401);
    });

    it('returns 400 when the comment field is missing', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/comments`), author)
        .send({})
        .expect(400);
    });
  });

  describe('/questions/:questionId/comments (GET)', () => {
    it('returns the comments for a question ordered by creation', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/comments`), author).send({
        comment: 'First comment',
      });
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/comments`), author).send({
        comment: 'Second comment',
      });

      const response = await request(app.getHttpServer()).get(`/questions/${questionId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.map((comment: { comment: string }) => comment.comment)).toEqual([
        'First comment',
        'Second comment',
      ]);
    });

    it('returns 404 when the question does not exist', async () => {
      await request(app.getHttpServer()).get(`/questions/${NON_EXISTENT_ID}/comments`).expect(404);
    });
  });

  describe('/comments/:id (GET)', () => {
    it('returns the comment', async () => {
      const created = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/comments`),
        author,
      ).send({ comment: 'Findable comment' });

      const response = await request(app.getHttpServer()).get(`/comments/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.comment).toBe('Findable comment');
    });

    it('returns 404 when the comment does not exist', async () => {
      await request(app.getHttpServer()).get(`/comments/${NON_EXISTENT_ID}`).expect(404);
    });
  });

  describe('/comments/:id (PATCH)', () => {
    let commentId: string;

    beforeEach(async () => {
      const created = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/comments`),
        author,
      ).send({ comment: 'Original comment' });
      commentId = created.body.id;
    });

    it('lets the author update their own comment', async () => {
      const response = await authed(request(app.getHttpServer()).patch(`/comments/${commentId}`), author).send({
        comment: 'Updated comment',
      });

      expect(response.status).toBe(200);
      expect(response.body.comment).toBe('Updated comment');
    });

    it('returns 403 when a different user tries to update the comment', async () => {
      const otherUser = await registerAndLogin('OTHER_COMMENTER');

      await authed(request(app.getHttpServer()).patch(`/comments/${commentId}`), otherUser)
        .send({ comment: 'Hijacked comment' })
        .expect(403);
    });

    it('returns 404 when the comment does not exist', async () => {
      await authed(request(app.getHttpServer()).patch(`/comments/${NON_EXISTENT_ID}`), author)
        .send({ comment: 'Updated comment' })
        .expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .send({ comment: 'Updated comment' })
        .expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
