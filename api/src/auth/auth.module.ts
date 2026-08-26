import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { SecretModule } from '../secret/secret.module';
import { SecretService } from '../secret/secret.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt.refresh.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
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