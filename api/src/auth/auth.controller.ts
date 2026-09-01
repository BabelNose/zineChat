import { Controller, Post, UseGuards, Req, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard.js';
import { AuthService } from './auth.service.js';
import { JwtRefreshAuthGuard } from './jwt.refresh.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { ZineRequest } from './auth.types.js';
import { CreateUserDto } from '../users/create.user.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}
    
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Req() req: ZineRequest) {
        return this.authService.login(req.user, req.session);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @UseGuards(JwtRefreshAuthGuard)
    @Post('refresh')
    async refreshToken(@Req() req: ZineRequest) {
        const refreshToken = req.body.refreshToken;
        return this.authService.refreshToken(refreshToken, req.session);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Req() req: ZineRequest) {
        this.authService.logout(req.session);
        return { message: 'Logged out successfully' };
    }
}
