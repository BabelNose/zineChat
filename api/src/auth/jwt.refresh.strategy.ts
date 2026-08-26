import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { SecretService } from 'src/secret/secret.service'; 
import { ZineRequest } from './auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
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
    if(req?.session?.userId === payload.id && req.session?.refreshToken === refreshToken){
      return { userId: payload.id };
    }
      return false
  }
}