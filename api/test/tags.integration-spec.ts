import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestApp, registerAndLogin, authed, NON_EXISTENT_ID, type Session } from './support/integration-test-helpers.js';

function uniqueTagName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe('Tags (integration)', () => {
  let app: INestApplication;
  let author: Session;

  beforeEach(async () => {
    app = await createTestApp();
    author = await registerAndLogin(app, 'TAG_AUTHOR');
  });

  describe('/tags (POST)', () => {
    it('creates a tag and returns it', async () => {
      const tagName = uniqueTagName('typescript');

      const response = await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: tagName });

      expect(response.status).toBe(201);
      expect(response.body.tag).toBe(tagName);
      expect(response.body).toHaveProperty('id');
    });

    it('returns 409 when the tag already exists', async () => {
      const tagName = uniqueTagName('duplicate');
      await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: tagName });

      await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: tagName }).expect(409);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/tags')
        .send({ tag: uniqueTagName('unauthed') })
        .expect(401);
    });

    it('returns 400 when the tag field is missing', async () => {
      await authed(request(app.getHttpServer()).post('/tags'), author).send({}).expect(400);
    });
  });

  describe('/tags (GET)', () => {
    it('returns all tags sorted alphabetically', async () => {
      const prefix = uniqueTagName('sort');
      const first = `${prefix}-b`;
      const second = `${prefix}-a`;
      await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: first });
      await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: second });

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
      const created = await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: tagName });

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
      const created = await authed(request(app.getHttpServer()).post('/tags'), author).send({
        tag: uniqueTagName('original'),
      });
      const newName = uniqueTagName('renamed');

      const response = await authed(request(app.getHttpServer()).patch(`/tags/${created.body.id}`), author).send({
        tag: newName,
      });

      expect(response.status).toBe(200);
      expect(response.body.tag).toBe(newName);
    });

    it('returns 404 when the tag does not exist', async () => {
      await authed(request(app.getHttpServer()).patch(`/tags/${NON_EXISTENT_ID}`), author)
        .send({ tag: uniqueTagName('missing') })
        .expect(404);
    });

    it('returns 409 when renaming to a tag name that already exists', async () => {
      const existingName = uniqueTagName('taken');
      await authed(request(app.getHttpServer()).post('/tags'), author).send({ tag: existingName });
      const created = await authed(request(app.getHttpServer()).post('/tags'), author).send({
        tag: uniqueTagName('renameme'),
      });

      await authed(request(app.getHttpServer()).patch(`/tags/${created.body.id}`), author)
        .send({ tag: existingName })
        .expect(409);
    });

    it('returns 401 without authentication', async () => {
      const created = await authed(request(app.getHttpServer()).post('/tags'), author).send({
        tag: uniqueTagName('unauthedupdate'),
      });

      await request(app.getHttpServer())
        .patch(`/tags/${created.body.id}`)
        .send({ tag: uniqueTagName('newname') })
        .expect(401);
    });
  });

  describe('/tags/:id (DELETE)', () => {
    it('deletes the tag', async () => {
      const created = await authed(request(app.getHttpServer()).post('/tags'), author).send({
        tag: uniqueTagName('removable'),
      });

      await authed(request(app.getHttpServer()).delete(`/tags/${created.body.id}`), author).expect(204);

      await request(app.getHttpServer()).get(`/tags/${created.body.id}`).expect(404);
    });

    it('returns 404 when the tag does not exist', async () => {
      await authed(request(app.getHttpServer()).delete(`/tags/${NON_EXISTENT_ID}`), author).expect(404);
    });

    it('returns 401 without authentication', async () => {
      const created = await authed(request(app.getHttpServer()).post('/tags'), author).send({
        tag: uniqueTagName('unauthedremove'),
      });

      await request(app.getHttpServer()).delete(`/tags/${created.body.id}`).expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
