
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { User } from '../users/user.entity.js';

class InvalidCredentialsException extends UnprocessableEntityException {
  constructor() {
    super('The email or password you entered is incorrect');
  }
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(username: string, password: string): Promise<Partial<User>> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    return user;
  }
}