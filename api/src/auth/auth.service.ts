import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { SecretService } from '../secret/secret.service.js';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity.js';
import { ZineSession } from './auth.types.js';
import { CreateUserDto } from '../users/create.user.dto.js';

type UserPayload = {
        id: string;
    }

class AlreadyExistsException extends UnprocessableEntityException {
    constructor() {
        super('The entity already exists');
    }
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly secretService: SecretService,
        private readonly configService: ConfigService
    ) {}

    async validateUser(email: string, password: string): Promise<Partial<User> | null> {
        const user = await this.usersService.findByEmailWithPassword(email);
        if(user && await this.usersService.comparePassword(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: User, session: Partial<ZineSession>) {
        const payload: UserPayload = { id: user.id };
        const refreshToken = this.generateRefreshToken(payload);
        const accessToken = this.jwtService.sign(payload);

        session.refreshToken = refreshToken;
        session.accessToken = accessToken;
        session.userId = user.id;

        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
        };
    }

    async logout(session: ZineSession){
        session.destroy((error) => {
            if(error){
                throw new Error(error);
            }
            return true;
        });
    }
    
    async register(user: CreateUserDto) {
        try {
            const newUser = await this.usersService.addUser(user);
            const { password, ...result } = newUser;
            return result;
        } catch (error:any) {
            if(error.code === '23505'){ //Unique violation code from PG
                throw new AlreadyExistsException();    
            }

            throw new Error(error);
        }
    }

    async refreshToken(refreshToken: string, session: Partial<ZineSession>) {
        try {
            const payload = this.jwtService.verify(refreshToken, { secret: this.secretService.get('jwtRefreshSecret') });
            const newAccessToken = this.jwtService.sign({id: payload.id});
            const newRefreshToken = this.generateRefreshToken({id: payload.id});

            session.refreshToken = newRefreshToken;
            session.accessToken = newAccessToken;

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error:any) {
            throw new Error(error);
        }
    }

    private generateRefreshToken(payload:UserPayload){
        return this.jwtService.sign(payload, { 
            secret: this.secretService.get('jwtRefreshSecret'), 
            expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION') 
        });
    }
}
