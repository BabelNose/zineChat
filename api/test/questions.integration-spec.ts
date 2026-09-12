import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, inject } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Questions (integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  let sessionCookie: string;

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

    const registerPayload = {
      username: 'QUESTION_TEST',
      email: `question-${Date.now()}@gmail.com`,
      password: 'welcome123',
    };
    await request(app.getHttpServer()).post('/auth/register').send(registerPayload);
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerPayload.email, password: registerPayload.password });
    accessToken = loginResponse.body.accessToken;
    sessionCookie = loginResponse.headers['set-cookie'][0];
  });

  function authed(req: request.Test) {
    return req.set('Authorization', `Bearer ${accessToken}`).set('Cookie', sessionCookie);
  }

  describe('/questions (POST)', () => {
    it('creates the given tags that do not exist yet and attaches them, deduplicated', async () => {
      const response = await authed(request(app.getHttpServer()).post('/questions')).send({
        question: 'What is TypeORM?',
        tags: ['orm', 'orm', 'typescript'],
      });

      expect(response.status).toBe(201);
      const tagNames = response.body.tags.map((tag: { tag: string }) => tag.tag).sort();
      expect(tagNames).toEqual(['orm', 'typescript']);
    });

    it('reuses an existing tag instead of creating a duplicate', async () => {
      const first = await authed(request(app.getHttpServer()).post('/questions')).send({
        question: 'First question',
        tags: ['shared-tag'],
      });

      const second = await authed(request(app.getHttpServer()).post('/questions')).send({
        question: 'Second question',
        tags: ['shared-tag'],
      });

      expect(first.body.tags[0].id).toBe(second.body.tags[0].id);
    });
  });

  describe('/questions/:id/tags/:tagName (POST, DELETE)', () => {
    let questionId: string;

    beforeEach(async () => {
      const response = await authed(request(app.getHttpServer()).post('/questions')).send({
        question: 'A question without tags',
      });
      questionId = response.body.id;
    });

    it('creates the tag if it does not exist yet when attaching it by name', async () => {
      await authed(request(app.getHttpServer()).post(`/questions/${questionId}/tags/brand-new-tag`)).expect(204);

      const question = await request(app.getHttpServer()).get(`/questions/${questionId}`);
      expect(question.body.tags.map((tag: { tag: string }) => tag.tag)).toEqual(['brand-new-tag']);
    });

    it('returns 404 when detaching a tag name that was never created', async () => {
      await authed(request(app.getHttpServer()).delete(`/questions/${questionId}/tags/never-existed`)).expect(404);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
