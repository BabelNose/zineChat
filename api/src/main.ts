import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import session from 'express-session';
import { csrfSync } from 'csrf-sync';
import { ConfigService } from '@nestjs/config';
import { SecretService } from './secret/secret.service';
import { DatabaseService } from './database/database.service';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const secretService = app.get(SecretService);
  const configService = app.get(ConfigService);
  const databaseService = app.get(DatabaseService);
  //CSRF protection if needed
  // const { csrfSynchronisedProtection } = csrfSync({
  //   getTokenFromRequest: (req) => {
  //     // Reads the token from custom headers or form body fields
  //     return req.headers['x-csrf-token'] || req.body?.['_csrf'];
  //   },
  // });
  app.use(helmet());
  app.use(session({
    store: new (require('connect-pg-simple')(session))({
      pool: await databaseService.getPool(),
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
  //CSRF protection
  // app.use(csrfSynchronisedProtection);
  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
