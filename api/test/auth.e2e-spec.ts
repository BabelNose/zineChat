import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, inject } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Auth (e2e)', () => {
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

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
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

  afterEach(async () => {
    await app.close();
  });
});