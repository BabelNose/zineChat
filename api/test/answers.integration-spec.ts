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

describe('Answers (integration)', () => {
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
      question: 'A question to answer',
    });
    return response.body.id;
  }

  beforeEach(async () => {
    author = await registerAndLogin('ANSWER_AUTHOR');
    questionId = await createQuestion(author);
  });

  describe('/questions/:questionId/answers (POST)', () => {
    it('creates an answer for the question and returns it with the author', async () => {
      const response = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/answers`),
        author,
      ).send({ answer: 'This is my answer' });

      expect(response.status).toBe(201);
      expect(response.body.answer).toBe('This is my answer');
      expect(response.body.author).toHaveProperty('id');
    });

    it('returns 404 when the question does not exist', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${NON_EXISTENT_ID}/answers`), author)
        .send({ answer: 'Answer' })
        .expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/questions/${questionId}/answers`)
        .send({ answer: 'Answer' })
        .expect(401);
    });

    it('returns 400 when the answer field is missing', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/answers`), author)
        .send({})
        .expect(400);
    });
  });

  describe('/questions/:questionId/answers (GET)', () => {
    it('returns the answers for a question ordered by creation', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/answers`), author).send({
        answer: 'First answer',
      });
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/answers`), author).send({
        answer: 'Second answer',
      });

      const response = await request(app.getHttpServer()).get(`/questions/${questionId}/answers`);

      expect(response.status).toBe(200);
      expect(response.body.map((answer: { answer: string }) => answer.answer)).toEqual([
        'First answer',
        'Second answer',
      ]);
    });

    it('returns 404 when the question does not exist', async () => {
      await request(app.getHttpServer()).get(`/questions/${NON_EXISTENT_ID}/answers`).expect(404);
    });
  });

  describe('/answers/:id (GET)', () => {
    it('returns the answer', async () => {
      const created = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/answers`),
        author,
      ).send({ answer: 'Findable answer' });

      const response = await request(app.getHttpServer()).get(`/answers/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe('Findable answer');
    });

    it('returns 404 when the answer does not exist', async () => {
      await request(app.getHttpServer()).get(`/answers/${NON_EXISTENT_ID}`).expect(404);
    });
  });

  describe('/answers/:id (PATCH)', () => {
    let answerId: string;

    beforeEach(async () => {
      const created = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/answers`),
        author,
      ).send({ answer: 'Original answer' });
      answerId = created.body.id;
    });

    it('lets the author update their own answer', async () => {
      const response = await authed(request(app.getHttpServer()).patch(`/answers/${answerId}`), author).send({
        answer: 'Updated answer',
      });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe('Updated answer');
    });

    it('returns 403 when a different user tries to update the answer', async () => {
      const otherUser = await registerAndLogin('OTHER_ANSWERER');

      await authed(request(app.getHttpServer()).patch(`/answers/${answerId}`), otherUser)
        .send({ answer: 'Hijacked answer' })
        .expect(403);
    });

    it('returns 404 when the answer does not exist', async () => {
      await authed(request(app.getHttpServer()).patch(`/answers/${NON_EXISTENT_ID}`), author)
        .send({ answer: 'Updated answer' })
        .expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/answers/${answerId}`)
        .send({ answer: 'Updated answer' })
        .expect(401);
    });
  });

  describe('/answers/:id/medals (POST, DELETE)', () => {
    let answerId: string;

    beforeEach(async () => {
      const created = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/answers`),
        author,
      ).send({ answer: 'Medal-worthy answer' });
      answerId = created.body.id;
    });

    it('awards a medal to the answer', async () => {
      await authed(request(app.getHttpServer()).post(`/answers/${answerId}/medals`), author).expect(201);
    });

    it('returns 409 when the same user awards a medal twice', async () => {
      await authed(request(app.getHttpServer()).post(`/answers/${answerId}/medals`), author).expect(201);

      await authed(request(app.getHttpServer()).post(`/answers/${answerId}/medals`), author).expect(409);
    });

    it('returns 404 when awarding a medal to a non-existent answer', async () => {
      await authed(request(app.getHttpServer()).post(`/answers/${NON_EXISTENT_ID}/medals`), author).expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer()).post(`/answers/${answerId}/medals`).expect(401);
    });

    it('revokes a previously awarded medal', async () => {
      await authed(request(app.getHttpServer()).post(`/answers/${answerId}/medals`), author).expect(201);

      await authed(request(app.getHttpServer()).delete(`/answers/${answerId}/medals`), author).expect(204);
    });

    it('returns 404 when revoking a medal that was never awarded', async () => {
      await authed(request(app.getHttpServer()).delete(`/answers/${answerId}/medals`), author).expect(404);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
