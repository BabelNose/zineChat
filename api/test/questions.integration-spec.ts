import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestApp, registerAndLogin, authed, NON_EXISTENT_ID, type Session } from './support/integration-test-helpers.js';

describe('Questions (integration)', () => {
  let app: INestApplication;
  let author: Session;

  beforeEach(async () => {
    app = await createTestApp();
    author = await registerAndLogin(app, 'QUESTION_AUTHOR');
  });

  describe('/questions (POST)', () => {
    it('creates the given tags that do not exist yet and attaches them, deduplicated', async () => {
      const response = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'What is TypeORM?',
        tags: ['orm', 'orm', 'typescript'],
      });

      expect(response.status).toBe(201);
      const tagNames = response.body.tags.map((tag: { tag: string }) => tag.tag).sort();
      expect(tagNames).toEqual(['orm', 'typescript']);
    });

    it('reuses an existing tag instead of creating a duplicate', async () => {
      const first = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'First question',
        tags: ['shared-tag'],
      });

      const second = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'Second question',
        tags: ['shared-tag'],
      });

      expect(first.body.tags[0].id).toBe(second.body.tags[0].id);
    });
  });

  describe('/questions/:id/tags/:tagName (POST, DELETE)', () => {
    let questionId: string;

    beforeEach(async () => {
      const response = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A question without tags',
      });
      questionId = response.body.id;
    });

    it('creates the tag if it does not exist yet when attaching it by name', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/tags/brand-new-tag`), author).expect(
        204,
      );

      const question = await request(app.getHttpServer()).get(`/questions/${questionId}`);
      expect(question.body.tags.map((tag: { tag: string }) => tag.tag)).toEqual(['brand-new-tag']);
    });

    it('returns 404 when detaching a tag name that was never created', async () => {
      await authed(request(app.getHttpServer()).delete(`/questions/${questionId}/tags/never-existed`), author).expect(
        404,
      );
    });

    it('detaches an attached tag', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/tags/removable-tag`), author).expect(
        204,
      );

      await authed(
        request(app.getHttpServer()).delete(`/questions/${questionId}/tags/removable-tag`),
        author,
      ).expect(204);

      const question = await request(app.getHttpServer()).get(`/questions/${questionId}`);
      expect(question.body.tags).toEqual([]);
    });
  });

  describe('/questions (GET)', () => {
    it('returns all questions', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A listed question',
      });

      const response = await request(app.getHttpServer()).get('/questions');

      expect(response.status).toBe(200);
      const ids = response.body.map((question: { id: string }) => question.id);
      expect(ids).toContain(created.body.id);
    });
  });

  describe('/questions/:id (GET)', () => {
    it('returns the question with its relations', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A detailed question',
        tags: ['detail-tag'],
      });

      const response = await request(app.getHttpServer()).get(`/questions/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.question).toBe('A detailed question');
      expect(response.body).toHaveProperty('author');
      expect(response.body).toHaveProperty('answers');
      expect(response.body).toHaveProperty('comments');
      expect(response.body.tags.map((tag: { tag: string }) => tag.tag)).toEqual(['detail-tag']);
    });

    it('returns 404 when the question does not exist', async () => {
      await request(app.getHttpServer()).get(`/questions/${NON_EXISTENT_ID}`).expect(404);
    });
  });

  describe('/questions/:id (PATCH)', () => {
    let questionId: string;

    beforeEach(async () => {
      const response = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'Original question',
      });
      questionId = response.body.id;
    });

    it('lets the author update their own question', async () => {
      const response = await authed(request(app.getHttpServer()).patch(`/questions/${questionId}`), author).send({
        question: 'Updated question',
      });

      expect(response.status).toBe(200);
      expect(response.body.question).toBe('Updated question');
    });

    it('returns 403 when a different user tries to update the question', async () => {
      const otherUser = await registerAndLogin(app, 'OTHER_QUESTIONER');

      await authed(request(app.getHttpServer()).patch(`/questions/${questionId}`), otherUser)
        .send({ question: 'Hijacked question' })
        .expect(403);
    });

    it('returns 404 when the question does not exist', async () => {
      await authed(request(app.getHttpServer()).patch(`/questions/${NON_EXISTENT_ID}`), author)
        .send({ question: 'Updated question' })
        .expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/questions/${questionId}`)
        .send({ question: 'Updated question' })
        .expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
