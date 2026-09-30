import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Repository } from 'typeorm';
import { Comment } from '../src/comments/comment.entity.js';
import { Answer } from '../src/answers/answer.entity.js';
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
    it('returns questions newest first', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A listed question',
      });

      const response = await request(app.getHttpServer()).get('/questions');

      expect(response.status).toBe(200);
      const ids = response.body.items.map((question: { id: string }) => question.id);
      expect(ids).toContain(created.body.id);
      expect(ids[0]).toBe(created.body.id);
    });

    it('paginates using the cursor from the previous page', async () => {
      for (const question of ['First question', 'Second question', 'Third question']) {
        await authed(request(app.getHttpServer()).post('/questions'), author).send({ question });
      }

      const firstPage = await request(app.getHttpServer()).get('/questions?limit=2');

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.items).toHaveLength(2);
      expect(firstPage.body.items.map((q: { question: string }) => q.question)).toEqual([
        'Third question',
        'Second question',
      ]);
      expect(firstPage.body.nextCursor).not.toBeNull();

      const secondPage = await request(app.getHttpServer()).get(
        `/questions?limit=2&cursor=${encodeURIComponent(firstPage.body.nextCursor)}`,
      );

      expect(secondPage.status).toBe(200);
      const secondPageQuestions = secondPage.body.items.map((q: { question: string }) => q.question);
      expect(secondPageQuestions).toContain('First question');
      expect(secondPageQuestions).not.toContain('Third question');
      expect(secondPageQuestions).not.toContain('Second question');
    });

    it('returns 400 for a limit above the hard cap of 100', async () => {
      await request(app.getHttpServer()).get('/questions?limit=101').expect(400);
    });

    it('returns 400 for a malformed cursor', async () => {
      await request(app.getHttpServer()).get('/questions?cursor=not-a-real-cursor').expect(400);
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

    it('returns comments in the order they were created', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A question with ordered comments',
      });

      await authed(request(app.getHttpServer()).post(`/questions/${created.body.id}/comments`), author).send({
        comment: 'First comment',
      });
      await authed(request(app.getHttpServer()).post(`/questions/${created.body.id}/comments`), author).send({
        comment: 'Second comment',
      });

      const response = await request(app.getHttpServer()).get(`/questions/${created.body.id}`);

      expect(response.body.comments.map((comment: { comment: string }) => comment.comment)).toEqual([
        'First comment',
        'Second comment',
      ]);
    });

    it('returns answers in the order they were created', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A question with ordered answers',
      });

      await authed(request(app.getHttpServer()).post(`/questions/${created.body.id}/answers`), author).send({
        answer: 'First answer',
      });
      const secondAuthor = await registerAndLogin(app, 'SECOND_ANSWERER_DEFAULT_ORDER');
      await authed(request(app.getHttpServer()).post(`/questions/${created.body.id}/answers`), secondAuthor).send({
        answer: 'Second answer',
      });

      const response = await request(app.getHttpServer()).get(`/questions/${created.body.id}`);

      expect(response.body.answers.map((answer: { answer: string }) => answer.answer)).toEqual([
        'First answer',
        'Second answer',
      ]);
    });

    it('returns comments ordered by their specified creation date, even when it disagrees with insertion order', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A question with backdated comments',
      });

      const insertedFirst = await authed(
        request(app.getHttpServer()).post(`/questions/${created.body.id}/comments`),
        author,
      ).send({ comment: 'Inserted first, but dated later' });
      const insertedSecond = await authed(
        request(app.getHttpServer()).post(`/questions/${created.body.id}/comments`),
        author,
      ).send({ comment: 'Inserted second, but dated earlier' });

      // Force the two comments' `created` timestamps out of insertion order, the
      // way older seed data with a non-time-ordered id can end up out of order.
      const commentRepository: Repository<Comment> = app.get(getRepositoryToken(Comment));
      await commentRepository.update(insertedFirst.body.id, { created: new Date('2030-01-02T00:00:00Z') });
      await commentRepository.update(insertedSecond.body.id, { created: new Date('2030-01-01T00:00:00Z') });

      const response = await request(app.getHttpServer()).get(`/questions/${created.body.id}`);

      expect(response.body.comments.map((comment: { comment: string }) => comment.comment)).toEqual([
        'Inserted second, but dated earlier',
        'Inserted first, but dated later',
      ]);
    });

    it('returns answers ordered by their specified creation date, even when it disagrees with insertion order', async () => {
      const created = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'A question with backdated answers',
      });

      const insertedFirst = await authed(
        request(app.getHttpServer()).post(`/questions/${created.body.id}/answers`),
        author,
      ).send({ answer: 'Inserted first, but dated later' });
      const otherAuthor = await registerAndLogin(app, 'SECOND_ANSWERER');
      const insertedSecond = await authed(
        request(app.getHttpServer()).post(`/questions/${created.body.id}/answers`),
        otherAuthor,
      ).send({ answer: 'Inserted second, but dated earlier' });

      const answerRepository: Repository<Answer> = app.get(getRepositoryToken(Answer));
      await answerRepository.update(insertedFirst.body.id, { created: new Date('2030-01-02T00:00:00Z') });
      await answerRepository.update(insertedSecond.body.id, { created: new Date('2030-01-01T00:00:00Z') });

      const response = await request(app.getHttpServer()).get(`/questions/${created.body.id}`);

      expect(response.body.answers.map((answer: { answer: string }) => answer.answer)).toEqual([
        'Inserted second, but dated earlier',
        'Inserted first, but dated later',
      ]);
    });
  });

  describe('/questions/:id (DELETE)', () => {
    let questionId: string;

    beforeEach(async () => {
      const response = await authed(request(app.getHttpServer()).post('/questions'), author).send({
        question: 'Original question',
      });
      questionId = response.body.id;
    });

    it('lets the author delete their own question', async () => {
      await authed(request(app.getHttpServer()).delete(`/questions/${questionId}`), author).expect(204);

      await request(app.getHttpServer()).get(`/questions/${questionId}`).expect(404);
    });

    it('returns 403 when a different user tries to delete the question', async () => {
      const otherUser = await registerAndLogin(app, 'OTHER_QUESTIONER');

      await authed(request(app.getHttpServer()).delete(`/questions/${questionId}`), otherUser).expect(403);
    });

    it('returns 404 when the question does not exist', async () => {
      await authed(request(app.getHttpServer()).delete(`/questions/${NON_EXISTENT_ID}`), author).expect(404);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer()).delete(`/questions/${questionId}`).expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
