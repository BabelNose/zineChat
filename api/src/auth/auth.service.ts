import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SecretService } from 'src/secret/secret.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly secretService: SecretService,
        private readonly configService: ConfigService
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmailWithPassword(email);
        if(user && await this.usersService.comparePassword(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.userId };
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload, { 
                secret: this.secretService.get('jwtRefreshSecret'), 
                expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION') 
            }),
        };
    }
    
    async register(user: any) {
        const newUser = await this.usersService.addUser({
            ...user,
        });
        const { ...result } = newUser;
        return result;
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, { secret: this.secretService.get('jwtRefreshSecret') });
            //Invalidate the refresh token
            const { email, sub } = payload;
            const newPayload = { email, sub };
            return {
                access_token: this.jwtService.sign(newPayload),
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

}
