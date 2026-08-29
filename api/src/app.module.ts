import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule} from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { SecretModule } from './secret/secret.module.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available everywhere without re-importing
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SecretModule,
    PassportModule.register({}),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
