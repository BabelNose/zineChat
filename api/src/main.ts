import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { SecretService } from './secret/secret.service.js';
import { DatabaseService } from './database/database.service.js';

const PgSession = connectPgSimple(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const secretService = app.get(SecretService);
  const configService = app.get(ConfigService);
  const databaseService = app.get(DatabaseService);
  app.use(helmet());
  app.use(session({
      store: new PgSession({
      pool: await databaseService.getPGPool(),
      createTableIfMissing: true,
    }),
    secret: secretService.get('sessionSecret'),
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
      }
  }))
  databaseService.checkEntities();
  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
