import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard.js';
import { AuthService } from './auth.service.js';
import { JwtRefreshAuthGuard } from './jwt.refresh.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { ZineRequest } from './auth.types.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}
    
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req: ZineRequest) {
        return this.authService.login(req.user, req.session);
    }

    @Post('register')
    async register(@Req() req: ZineRequest) {
        return this.authService.register(req.body);
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
