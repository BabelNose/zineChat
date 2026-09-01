import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { SecretService } from '../secret/secret.service.js'; 
import { ZineRequest } from './auth.types.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger:Logger = new Logger(JwtRefreshStrategy.name);
  constructor(private readonly secretService: SecretService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secretService.get('jwtRefreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: ZineRequest, payload: any) {
    const refreshToken = ExtractJwt.fromBodyField('refreshToken')(req)
    this.logger.log("SESSSION???", req.session);
    if(req?.session?.userId === payload.id && req.session?.refreshToken === refreshToken){
      return { userId: payload.id };
    }
      return false
  }
}