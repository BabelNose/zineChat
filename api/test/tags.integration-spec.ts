import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, inject } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const NON_EXISTENT_ID = '00000000-0000-4000-8000-000000000000';

function uniqueTagName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe('Tags (integration)', () => {
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
      username: 'TAG_TEST',
      email: `tag-${Date.now()}-${Math.random().toString(36).slice(2)}@gmail.com`,
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

  describe('/tags (POST)', () => {
    it('creates a tag and returns it', async () => {
      const tagName = uniqueTagName('typescript');

      const response = await authed(request(app.getHttpServer()).post('/tags')).send({ tag: tagName });

      expect(response.status).toBe(201);
      expect(response.body.tag).toBe(tagName);
      expect(response.body).toHaveProperty('id');
    });

    it('returns 409 when the tag already exists', async () => {
      const tagName = uniqueTagName('duplicate');
      await authed(request(app.getHttpServer()).post('/tags')).send({ tag: tagName });

      await authed(request(app.getHttpServer()).post('/tags')).send({ tag: tagName }).expect(409);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/tags')
        .send({ tag: uniqueTagName('unauthed') })
        .expect(401);
    });

    it('returns 400 when the tag field is missing', async () => {
      await authed(request(app.getHttpServer()).post('/tags')).send({}).expect(400);
    });
  });

  describe('/tags (GET)', () => {
    it('returns all tags sorted alphabetically', async () => {
      const prefix = uniqueTagName('sort');
      const first = `${prefix}-b`;
      const second = `${prefix}-a`;
      await authed(request(app.getHttpServer()).post('/tags')).send({ tag: first });
      await authed(request(app.getHttpServer()).post('/tags')).send({ tag: second });

      const response = await request(app.getHttpServer()).get('/tags');

      expect(response.status).toBe(200);
      const relevant = response.body
        .map((tag: { tag: string }) => tag.tag)
        .filter((tag: string) => tag === first || tag === second);
      expect(relevant).toEqual([second, first]);
    });
  });

  describe('/tags/:id (GET)', () => {
    it('returns the tag', async () => {
      const tagName = uniqueTagName('findable');
      const created = await authed(request(app.getHttpServer()).post('/tags')).send({ tag: tagName });

      const response = await request(app.getHttpServer()).get(`/tags/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tag).toBe(tagName);
    });

    it('returns 404 when the tag does not exist', async () => {
      await request(app.getHttpServer()).get(`/tags/${NON_EXISTENT_ID}`).expect(404);
    });
  });

  describe('/tags/:id (PATCH)', () => {
    it('updates the tag name', async () => {
      const created = await authed(request(app.getHttpServer()).post('/tags')).send({
        tag: uniqueTagName('original'),
      });
      const newName = uniqueTagName('renamed');

      const response = await authed(request(app.getHttpServer()).patch(`/tags/${created.body.id}`)).send({
        tag: newName,
      });

      expect(response.status).toBe(200);
      expect(response.body.tag).toBe(newName);
    });

    it('returns 404 when the tag does not exist', async () => {
      await authed(request(app.getHttpServer()).patch(`/tags/${NON_EXISTENT_ID}`))
        .send({ tag: uniqueTagName('missing') })
        .expect(404);
    });

    it('returns 409 when renaming to a tag name that already exists', async () => {
      const existingName = uniqueTagName('taken');
      await authed(request(app.getHttpServer()).post('/tags')).send({ tag: existingName });
      const created = await authed(request(app.getHttpServer()).post('/tags')).send({
        tag: uniqueTagName('renameme'),
      });

      await authed(request(app.getHttpServer()).patch(`/tags/${created.body.id}`))
        .send({ tag: existingName })
        .expect(409);
    });

    it('returns 401 without authentication', async () => {
      const created = await authed(request(app.getHttpServer()).post('/tags')).send({
        tag: uniqueTagName('unauthedupdate'),
      });

      await request(app.getHttpServer())
        .patch(`/tags/${created.body.id}`)
        .send({ tag: uniqueTagName('newname') })
        .expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
