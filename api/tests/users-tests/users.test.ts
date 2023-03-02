import createServer from '../../src/server';
import * as db  from '../util/db';
import supertest, { SuperAgentTest } from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import { Express } from 'express';
import DataTransformer from '../util/DataTransformer';
import Fixtures from '../util/fixtures';
import { PermissionFlag } from '../../src/common/enums/common.permissionflag.enum';

let app:Express;
let firstUserIdTest = ''; // will later hold a value returned by our API
let secondUserIdTest = ''; // will later hold a value returned by our API
var csrfToken = '';

const transformer:DataTransformer = new DataTransformer();
const fixtures:Fixtures = new Fixtures();

const admin = {
    email: `jim.jones+${shortid.generate()}@toptal.com`,
    password: 'magicMonkey',
    userName: 'B4ll1n!in'
}

const firstUserBody = {
    email: `marcos.henrique+${shortid.generate()}@toptal.com`,
    password: 'Sup3rSecret!23',
};

const secondUserBody = {
    email: `penn.gillet+${shortid.generate()}@toptal.com`,
    password: 'm1xM4ni@',
}

const RefreshCSRF = async (request:SuperAgentTest) => {
    const csrfRes = await request.get('/auth').send();
    csrfToken = csrfRes.body.token;
}

const newUsername = 'Jose';
const newUsername2 = 'Paulo';

describe('--- Users and Auth endpoints ---', function () {
    let request: supertest.SuperAgentTest;
    before(async function () {
        //Spin up and connect to the test DB
        await db.connect();
        app = createServer();
        request = supertest.agent(app);
        await RefreshCSRF(request);
        fixtures.adminUserFixture(admin.email,admin.userName,admin.password);
    });
    after(async function () {
        await db.clearData();
        await db.closeConnection()
    });

    it('should allow a POST to /users', async function () {
        const res = await request.post('/users').set('x-csrf-token', csrfToken).send(firstUserBody);
        expect(res.status).to.equal(201);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body.id).to.be.a('string');
        firstUserIdTest = res.body.id;
    });

    it('should allow a POST to /auth and return auth Tokens', async function () {
        const res = await request.post('/auth').set('x-csrf-token', csrfToken).send(firstUserBody);
        await RefreshCSRF(request);
        const cookies = transformer.parseCookieArray(res.headers["set-cookie"]);
        expect(res.status).to.equal(201);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body.userId).to.be.a('string');
        expect(cookies.accessToken.accessToken).to.be.a('string');
        expect(cookies.refreshToken.refreshToken).to.be.a('string');
    });

    describe('--- With a valid access token ---', function () {
        it('should allow a GET from /users/:userId', async function () {
            const res = await request
                .get(`/users/${firstUserIdTest}`)
                .send();
            expect(res.status).to.equal(200);
            expect(res.body).not.to.be.empty;
            expect(res.body).to.be.an('object');
            expect(res.body.id).to.be.a('string');
            expect(res.body.id).to.equal(firstUserIdTest);
            expect(res.body.email).to.equal(firstUserBody.email);
        });

        
        it('should allow a PATCH to /users/:userId', async function () {
            const res = await request
                .patch(`/users/${firstUserIdTest}`)
                .set('x-csrf-token', csrfToken)
                .send({
                    username: newUsername,
                });
            expect(res.status).to.equal(204);
        });

        it('should disallow a PATCH to /users/:userId if not self', async function () {
            //Setup second user
            const newUserRes = await request
                .post('/users')
                .set('x-csrf-token', csrfToken)
                .send(secondUserBody);
            secondUserIdTest = newUserRes.body.id;
            //Test
            const res = await request
                .patch(`/users/${secondUserIdTest}`)
                .set('x-csrf-token', csrfToken)
                .send({
                    username: newUsername,
                });
            expect(res.status).to.equal(403);
        });
            
        it('should disallow a GET from /users if not admin', async function () {
            const res = await request
                .get(`/users`)
                .send();
            expect(res.status).to.equal(403);
        });

        it('should allow a POST to /auth/refresh-token', async function () {
            const res = await request
                .post('/auth/refresh-token')
                .set('x-csrf-token', csrfToken)
                .send();
            await RefreshCSRF(request);
            const cookies = transformer.parseCookieArray(res.headers["set-cookie"]);
            expect(res.status).to.equal(201);
            expect(res.body).not.to.be.empty;
            expect(res.body).to.be.an('object');
            expect(cookies.accessToken.accessToken).to.be.a('string');
            expect(cookies.refreshToken.refreshToken).to.be.a('string');
        });

        it('should allow a DELETE from /users/:userId', async function () {
            const res = await request
                .delete(`/users/${firstUserIdTest}`)
                .set('x-csrf-token', csrfToken)
                .send();
            expect(res.status).to.equal(204);
        });

        describe('--- With admin access ---', function () {
            it('should allow admin to change user permissions', async function () {
                await request.post('/auth').set('x-csrf-token', csrfToken).send({email: admin.email, password:admin.password});
                await RefreshCSRF(request);
                const res = await request
                    .put(`/users/${secondUserIdTest}/permissionFlags/${PermissionFlag.LEVEL1_PERMISSION}`)
                    .set('x-csrf-token', csrfToken)
                    .send();
                expect(res.status).to.equal(204);
                const checkRes = await request.get(`/users/${secondUserIdTest}`).send();
                expect(checkRes.status).to.equal(200);
                expect(checkRes.body.permissionFlags).to.equal(PermissionFlag.LEVEL1_PERMISSION);
            })

            it('should allow admin to get all users', async function () {
                const res = await request.get(`/users`).send();
                expect(res.status).to.equal(200);
                expect(res.body).to.be.an('array');
            })
        })
    });
});