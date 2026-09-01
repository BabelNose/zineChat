import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SecretService } from './secret/secret.service.js';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

export async function configureApp(app: INestApplication): Promise<INestApplication<any>> {
    const PgSession = connectPgSimple(session);
    const secretService = app.get(SecretService);
    const configService = app.get(ConfigService);
    const databaseService = app.get(DatabaseService);
    app.useGlobalPipes(new ValidationPipe({
    transform: true,
    }));
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
    return app;
}