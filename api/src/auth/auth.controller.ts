import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { JwtRefreshAuthGuard } from './jwt.refresh.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}
    
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user, req.session);
    }

    @Post('register')
    async register(@Request() req) {
        return this.authService.register(req.body);
    }

    @UseGuards(JwtRefreshAuthGuard)
    @Post('refresh')
    async refreshToken(@Request() req) {
        const refreshToken = req.body.refreshToken;
        return this.authService.refreshToken(refreshToken, req.session);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Request() req) {
        this.authService.logout(req.session);
        return { message: 'Logged out successfully' };
    }
}
