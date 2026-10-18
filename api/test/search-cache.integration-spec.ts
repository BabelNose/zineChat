import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Pool } from 'pg';
import { DatabaseService } from '../src/database/database.service.js';
import { createTestApp, registerAndLogin, authed, Session } from './support/integration-test-helpers.js';

const SQL_SCRIPT_PATH = fileURLToPath(new URL('../scripts/sync-search-cache.sql', import.meta.url));

// Exercises api/scripts/sync-search-cache.sql end to end: applies it against
// a real Postgres, then drives the regular REST endpoints and asserts the
// trigger-maintained question.answerCount/commentCount/tagsCache stay correct -
// this is the read-model search.service.ts relies on to avoid a Postgres read
// per search hit (see search.service.ts and the PR description).
describe('question search cache triggers', () => {
    let app: INestApplication;
    let pool: Pool;
    let asker: Session;
    let answerer1: Session;
    let answerer2: Session;

    beforeAll(async () => {
        app = await createTestApp();
        pool = await app.get(DatabaseService).getPGPool();
        await pool.query(readFileSync(SQL_SCRIPT_PATH, 'utf8'));

        asker = await registerAndLogin(app, 'cache-asker');
        answerer1 = await registerAndLogin(app, 'cache-answerer1');
        answerer2 = await registerAndLogin(app, 'cache-answerer2');
    });

    afterAll(async () => {
        await app.close();
    });

    async function getCache(questionId: string) {
        const { rows } = await pool.query(
            'SELECT "answerCount", "commentCount", "tagsCache" FROM question WHERE id = $1',
            [questionId],
        );
        return rows[0] as { answerCount: number; commentCount: number; tagsCache: { id: string; tag: string }[] };
    }

    async function createQuestion(): Promise<string> {
        const response = await authed(request(app.getHttpServer()).post('/questions'), asker).send({
            question: 'Why does the cache need triggers?',
        });
        return response.body.id;
    }

    it('starts a new question with zero counts and no tags', async () => {
        const questionId = await createQuestion();

        expect(await getCache(questionId)).toEqual({ answerCount: 0, commentCount: 0, tagsCache: [] });
    });

    it('tracks answerCount as answers are added and removed', async () => {
        const questionId = await createQuestion();

        const answer1 = await authed(request(app.getHttpServer()).post(`/questions/${questionId}/answers`), answerer1).send({
            answer: 'Because Ventstream only mirrors Postgres, it cannot join.',
        });
        expect((await getCache(questionId)).answerCount).toBe(1);

        await authed(request(app.getHttpServer()).post(`/questions/${questionId}/answers`), answerer2).send({
            answer: 'Denormalizing at write time avoids a read at search time.',
        });
        expect((await getCache(questionId)).answerCount).toBe(2);

        await authed(request(app.getHttpServer()).delete(`/answers/${answer1.body.id}`), answerer1);
        expect((await getCache(questionId)).answerCount).toBe(1);
    });

    it('tracks commentCount as comments are added and removed', async () => {
        const questionId = await createQuestion();

        await authed(request(app.getHttpServer()).post(`/questions/${questionId}/comments`), asker).send({ comment: 'first' });
        const second = await authed(request(app.getHttpServer()).post(`/questions/${questionId}/comments`), asker).send({ comment: 'second' });
        expect((await getCache(questionId)).commentCount).toBe(2);

        await authed(request(app.getHttpServer()).delete(`/comments/${second.body.id}`), asker);
        expect((await getCache(questionId)).commentCount).toBe(1);
    });

    it('tracks tagsCache as tags are attached, detached, and renamed', async () => {
        const questionId = await createQuestion();

        await authed(request(app.getHttpServer()).post(`/questions/${questionId}/tags/testing`), asker);
        await authed(request(app.getHttpServer()).post(`/questions/${questionId}/tags/typescript`), asker);

        expect((await getCache(questionId)).tagsCache.map((t) => t.tag)).toEqual(['testing', 'typescript']);

        await authed(request(app.getHttpServer()).delete(`/questions/${questionId}/tags/testing`), asker);
        const afterDetach = await getCache(questionId);
        expect(afterDetach.tagsCache.map((t) => t.tag)).toEqual(['typescript']);

        const tagId = afterDetach.tagsCache[0].id;
        await authed(request(app.getHttpServer()).patch(`/tags/${tagId}`), asker).send({ tag: 'ts' });

        expect((await getCache(questionId)).tagsCache).toEqual([{ id: tagId, tag: 'ts' }]);
    });
});
