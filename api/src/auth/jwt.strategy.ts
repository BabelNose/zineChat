import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { SecretService } from 'src/secret/secret.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly secretService: SecretService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretService.get('jwtSecret'),
    });
  }

  async validate(payload: any) {
    //For CSRF maybe check session here
    return { userId: payload.sub, email: payload.email };
  }
}