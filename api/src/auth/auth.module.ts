import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { LocalStrategy } from './local.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { SecretModule } from '../secret/secret.module.js';
import { SecretService } from '../secret/secret.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt.refresh.strategy.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({}),
    ConfigModule,
    SecretModule,
    JwtModule.registerAsync({
      imports:[SecretModule, ConfigModule],
      inject:[SecretService, ConfigService],
      useFactory: async (secretService: SecretService, configService: ConfigService) => ({
        secret: secretService.get('jwtSecret'),
        signOptions: { expiresIn: configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION') },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}