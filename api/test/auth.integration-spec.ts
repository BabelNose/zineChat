import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, inject } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Auth (integration)', () => {
  let app: INestApplication;

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
  });

  describe('Sanity Test', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('/auth/register (POST)', () => {
    const payload = {
      username:"TEST",
      email:"test@gmail.com",
      password:"welcome"
    };

    it('Should create a new user and return 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.username).toBe('TEST');
      expect(response.body.email).toBe('test@gmail.com');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('isActive');
      expect(response.body.isActive).toBe(true);
      expect(response.body).not.toHaveProperty('password');
    });

    it('Should return an error and 422 for a duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload);
      
      expect(response.status).toBe(422);
      expect(response.body.message).toBe('The entity already exists');
    });

    it('Should return 400 for missing required fields', async () => {
      const invalidPayload = {
        username: "TEST"
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidPayload);

      expect(response.status).toBe(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const registerPayload = {
      username: "LOGIN_TEST",
      email: "login@gmail.com",
      password: "welcome123"
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerPayload);
    });

    it('Should login successfully and return 200 with tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password
        });

      let sessionCookie = response.headers['set-cookie'][0];
      expect(sessionCookie).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('Should return 401 for incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: "wrongpassword"
        });

      expect(response.status).toBe(401);
    });

    it('Should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: "nonexistent@gmail.com",
          password: "password"
        });

      expect(response.status).toBe(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    const registerPayload = {
      username: 'REFRESH_TEST',
      email: 'refresh@gmail.com',
      password: 'welcome123'
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerPayload);
    });

    it('Should refresh successfully and return 200 with new tokens', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password
        });

      let sessionCookie = loginResponse.headers['set-cookie'][0];
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', sessionCookie)
        .send({
          refreshToken: loginResponse.body.refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('Should return 401 for an invalid refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password
        });

      let sessionCookie = loginResponse.headers['set-cookie'][0];
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', sessionCookie)
        .send({
          refreshToken: 'invalid.refresh.token'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    const registerPayload = {
      username: 'LOGOUT_TEST',
      email: 'logout@gmail.com',
      password: 'welcome123'
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerPayload);
    });

    it('Should logout successfully and return 200', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password
        });

      let sessionCookie = loginResponse.headers['set-cookie'][0];
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', sessionCookie)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          refreshToken: loginResponse.body.refreshToken
        });

      expect(response.status).toBe(200);
    });

    it('Should return 401 for an invalid or missing token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password
        });

      let sessionCookie = loginResponse.headers['set-cookie'][0];
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', sessionCookie)
        .send({
          refreshToken: 'invalid.refresh.token'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('/profile (GET)', () => {
    const registerPayload = {
      username: 'PROFILE_TEST',
      email: 'profile@gmail.com',
      password: 'welcome123'
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerPayload);
    });

    it('Should return the authenticated user when a valid token and session are provided', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password
        });

      const sessionCookie = loginResponse.headers['set-cookie'][0];
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId');
    });

    it('Should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/profile');

      expect(response.status).toBe(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
