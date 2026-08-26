import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { SecretService } from 'src/secret/secret.service'; 
import { ZineRequest } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly secretService: SecretService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretService.get('jwtSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: ZineRequest, payload: any) {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if(req?.session?.userId === payload.id && req.session?.accessToken === accessToken){
      return { userId: payload.id };
    }
      return false
  }
}