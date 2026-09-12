import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { inject } from 'vitest';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

export const NON_EXISTENT_ID = '00000000-0000-4000-8000-000000000000';

export interface Session {
  accessToken: string;
  sessionCookie: string;
}

export async function createTestApp(): Promise<INestApplication> {
  process.env.POSTGRES_HOST = inject('POSTGRES_HOST');
  process.env.POSTGRES_PORT = inject('POSTGRES_PORT');
  process.env.POSTGRES_USER = inject('POSTGRES_USER');
  process.env.POSTGRES_PASSWORD = inject('POSTGRES_PASSWORD');
  process.env.POSTGRES_DB = inject('POSTGRES_DB');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await configureApp(app);
  await app.init();
  return app;
}

export async function registerAndLogin(app: INestApplication, usernamePrefix: string): Promise<Session> {
  const email = `${usernamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@gmail.com`;
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ username: usernamePrefix, email, password: 'welcome123' });
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'welcome123' });
  return {
    accessToken: loginResponse.body.accessToken,
    sessionCookie: loginResponse.headers['set-cookie'][0],
  };
}

export function authed(req: request.Test, session: Session) {
  return req.set('Authorization', `Bearer ${session.accessToken}`).set('Cookie', session.sessionCookie);
}
