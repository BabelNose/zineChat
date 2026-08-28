import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const postgresContainer = await new PostgreSqlContainer('postgres:latest')
    .withEnvironment({
      POSTGRES_DB: process.env.POSTGRES_DB ? process.env.POSTGRES_DB : '',
      POSTGRES_USER: process.env.POSTGRES_USER ? process.env.POSTGRES_USER : '',
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? process.env.POSTGRES_PASSWORD : '',
    })
    .start();

  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
  });

  afterEach(async () => {
    await app.close();
  });
});
