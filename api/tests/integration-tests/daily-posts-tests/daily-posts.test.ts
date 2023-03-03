import createServer from '../../../src/server';
import * as db  from '../../util/db';
import supertest, { SuperAgentTest } from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import { Express } from 'express';
import Fixtures from '../../util/fixtures';
import Helper from '../../util/helper';

let app:Express;
let testTopicId = '';
let firstDailyPostIdTest = '';
var csrfToken = '';

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

const firstTopicBody ={
    text: 'This is a test topic',
    startDate: Date.now(),
}

const firstPostBody = {
    text: 'This is a test post'
}

describe('--- Daily Posts endpoints --- Authentication Required - daily-posts ---', function () {
    let request: supertest.SuperAgentTest;
    before(async function () {
        await db.connect();
        app = createServer();
        request = supertest.agent(app);
        csrfToken = await helper.RefreshCSRF(request);
        await fixtures.basicUserFixture(firstUserBody.email, firstUserBody.userName, firstUserBody.password);
        await fixtures.adminUserFixture(admin.email, admin.userName, admin.password);
        testTopicId = await fixtures.topicFixture(firstTopicBody.text, firstTopicBody.startDate);
        await request
            .post('/auth')
            .set('x-csrf-token', csrfToken)
            .send({email: firstUserBody.email, password: firstUserBody.password});
        csrfToken = await helper.RefreshCSRF(request);
    });
    after(async function () {
        await db.clearData();
        await db.closeConnection()
    });

    it('should allow a POST to /daily-posts', async function () {
        const res = await request.post('/daily-posts').set('x-csrf-token', csrfToken).send({text: firstPostBody.text, topicId: testTopicId});
        expect(res.status).to.equal(201);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body.id).to.be.a('string');
        firstDailyPostIdTest = res.body.id;
    })

    it('should allow a GET to /daily-posts', async function () {
        const res = await request.get('/daily-posts').send();
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
    })

    it('should allow a GET from /daily-posts/:postId', async function () {
        const res = await request
            .get(`/daily-posts/${firstDailyPostIdTest}`)
            .send();
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body.id).to.be.a('string');
        expect(res.body.id).to.equal(firstDailyPostIdTest);
        expect(res.body.text).to.equal(firstPostBody.text);
    });
});