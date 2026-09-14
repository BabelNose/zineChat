import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestApp, registerAndLogin, authed, NON_EXISTENT_ID, type Session } from './support/integration-test-helpers.js';

describe('Answers (integration)', () => {
  let app: INestApplication;
  let author: Session;
  let questionId: string;

  beforeEach(async () => {
    app = await createTestApp();
  });

  async function createQuestion(session: Session): Promise<string> {
    const response = await authed(request(app.getHttpServer()).post('/questions'), session).send({
      question: 'A question to answer',
    });
    return response.body.id;
  }

  beforeEach(async () => {
    author = await registerAndLogin(app, 'ANSWER_AUTHOR');
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
      expect(response.body.items.map((answer: { answer: string }) => answer.answer)).toEqual([
        'First answer',
        'Second answer',
      ]);
      expect(response.body.nextCursor).toBeNull();
    });

    it('returns 404 when the question does not exist', async () => {
      await request(app.getHttpServer()).get(`/questions/${NON_EXISTENT_ID}/answers`).expect(404);
    });

    it('paginates using the cursor from the previous page', async () => {
      for (const answer of ['First answer', 'Second answer', 'Third answer']) {
        await authed(request(app.getHttpServer()).post(`/questions/${questionId}/answers`), author).send({
          answer,
        });
      }

      const firstPage = await request(app.getHttpServer()).get(
        `/questions/${questionId}/answers?limit=2`,
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.items.map((answer: { answer: string }) => answer.answer)).toEqual([
        'First answer',
        'Second answer',
      ]);
      expect(firstPage.body.nextCursor).not.toBeNull();

      const secondPage = await request(app.getHttpServer()).get(
        `/questions/${questionId}/answers?limit=2&cursor=${encodeURIComponent(firstPage.body.nextCursor)}`,
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.items.map((answer: { answer: string }) => answer.answer)).toEqual(['Third answer']);
      expect(secondPage.body.nextCursor).toBeNull();
    });

    it('returns 400 for a limit above the hard cap of 100', async () => {
      await request(app.getHttpServer()).get(`/questions/${questionId}/answers?limit=101`).expect(400);
    });

    it('returns 400 for a malformed cursor', async () => {
      await request(app.getHttpServer())
        .get(`/questions/${questionId}/answers?cursor=not-a-real-cursor`)
        .expect(400);
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

  describe('/answers/:id (DELETE)', () => {
    let answerId: string;

    beforeEach(async () => {
      const created = await authed(
        request(app.getHttpServer()).post(`/questions/${questionId}/answers`),
        author,
      ).send({ answer: 'Original answer' });
      answerId = created.body.id;
    });

    it('lets the author delete their own answer', async () => {
      await authed(request(app.getHttpServer()).delete(`/answers/${answerId}`), author).expect(204);

      await request(app.getHttpServer()).get(`/answers/${answerId}`).expect(404);
    });

    it('returns 403 when a different user tries to delete the answer', async () => {
      const otherUser = await registerAndLogin(app, 'OTHER_ANSWERER');

      await authed(request(app.getHttpServer()).delete(`/answers/${answerId}`), otherUser).expect(403);
    });

    it('returns 404 when the answer does not exist', async () => {
      await authed(request(app.getHttpServer()).delete(`/answers/${NON_EXISTENT_ID}`), author).expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer()).delete(`/answers/${answerId}`).expect(401);
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
