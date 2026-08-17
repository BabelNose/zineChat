import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      //Todo: Create a secret service that can take secrets from multiple sources
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    //For CSRF maybe check session here
    return { userId: payload.sub, email: payload.email };
  }
}