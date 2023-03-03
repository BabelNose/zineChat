import createServer from '../../../src/server';
import * as db  from '../../util/db';
import supertest, { SuperAgentTest } from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import { Express } from 'express';
import Fixtures from '../../util/fixtures';
import Helper from '../../util/helper';

let app:Express;
let firstTopicIdTest = '';
let secondTopicIdTest = '';
var csrfToken = '';

let newTopicText = 'This is an updated text for patch'

const fixtures:Fixtures = new Fixtures();
const helper:Helper = new Helper();

const admin = {
    email: `jim.jones+${shortid.generate()}@toptal.com`,
    password: 'magicMonkey',
    userName: 'B4ll1n!in'
}

const firstUserBody = {
    email: `marcos.henrique+${shortid.generate()}@toptal.com`,
    password: 'Sup3rSecret!23',
    userName: 'Marco Henrique'
};

const firstTopicBody = {
    text: 'This is a test topic',
    startDate: Date.now(),
}

const secondTopicBody = {
    text: 'This is a test second topic',
    startDate: Date.now()
}

describe('--- Topics endpoints --- Authentication Required - topics ---', function () {
    let request: supertest.SuperAgentTest;
    before(async function () {
        await db.connect();
        app = createServer();
        request = supertest.agent(app);
        csrfToken = await helper.RefreshCSRF(request);
        await fixtures.basicUserFixture(firstUserBody.email, firstUserBody.userName, firstUserBody.password);
        await fixtures.adminUserFixture(admin.email, admin.userName, admin.password);
        secondTopicIdTest = await fixtures.topicFixture(secondTopicBody.text, secondTopicBody.startDate);
    });
    after(async function () {
        await db.clearData();
        await db.closeConnection()
    });

    describe('--- With admin access ---', function () {
        before( async function() {
            await request
                .post('/auth')
                .set('x-csrf-token', csrfToken)
                .send({email: admin.email, password: admin.password});
            csrfToken = await helper.RefreshCSRF(request);
        })

        it('should allow Admin to POST to /topics', async function () {
            const res = await request.post('/topics')
                .set('x-csrf-token', csrfToken)
                .send({text: firstTopicBody.text, startDate:firstTopicBody.startDate});
            expect(res.status).to.equal(201);
            expect(res.body).not.to.be.empty;
            expect(res.body).to.be.an('object');
            expect(res.body.id).to.be.a('string');
            firstTopicIdTest = res.body.id;
        });
    
        it('should allow Admin to PATCH to /topics/:topicId', async function () {
            const res = await request
                .patch(`/topics/${firstTopicIdTest}`)
                .set('x-csrf-token', csrfToken)
                .send({
                    text: newTopicText,
                });
            expect(res.status).to.equal(204);
            expect(res.body).to.be.empty;
        });
    
        it('should allow Admin to DELETE from /topics/:topicId', async function () {
            const res = await request
                .delete(`/topics/${firstTopicIdTest}`)
                .set('x-csrf-token', csrfToken)
                .send();
            expect(res.status).to.equal(204);
            expect(res.body).to.be.empty;
        });
    })
    describe('--- With basic access ---', function () {
        before(async function () {
            await request
                .post('/auth')
                .set('x-csrf-token', csrfToken)
                .send({email: firstUserBody.email, password: firstUserBody.password});
            csrfToken = await helper.RefreshCSRF(request);
        });

        it('should allow a GET to /topics', async function () {
            const res = await request
                .get('/topics')
                .send();
            expect(res.status).to.equal(200);
            expect(res.body).not.to.be.empty;
            expect(res.body).to.be.an('array');
        });
    
        it('should allow a GET from /topics/:topicId', async function () {
            const res = await request
                .get(`/topics/${secondTopicIdTest}`)
                .send();
            expect(res.status).to.equal(200);
            expect(res.body).not.to.be.empty;
            expect(res.body).to.be.an('object');
            expect(res.body.id).to.be.a('string');
            expect(res.body.id).to.equal(secondTopicIdTest);
            expect(res.body.text).to.equal(secondTopicBody.text);
        });

        it('should disallow non-admin to POST to /topics', async function () {
            const res = await request.post('/topics')
                    .set('x-csrf-token', csrfToken)
                    .send({text: firstTopicBody.text, startDate:firstTopicBody.startDate});
                expect(res.status).to.equal(403);
        })
    
        it('should disallow non-admin to DELETE to /topics', async function () {
            const res = await request.delete(`/topics/${secondTopicIdTest}`)
                    .set('x-csrf-token', csrfToken)
                    .send({text: firstTopicBody.text, startDate:firstTopicBody.startDate});
                expect(res.status).to.equal(403);
        })

        it('should disallow non-admin to PATCH to /topics', async function () {
            const res = await request
                .patch(`/topics/${secondTopicIdTest}`)
                .set('x-csrf-token', csrfToken)
                .send({
                    text: newTopicText,
                });
                expect(res.status).to.equal(403);
        })
    })
});