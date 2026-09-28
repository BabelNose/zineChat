import { Controller, Req, UseGuards, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { UsersService } from './users/users.service.js';
import type { ZineRequest, JwtAuthenticatedRequest } from './auth/auth.types.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: JwtAuthenticatedRequest) {
    const user = await this.usersService.findOne(req.user.userId);
    if (!user) {
      return null;
    }
    return { id: user.id, username: user.username, email: user.email };
  }

  @Get('/')
  helloWorld(@Req() req:ZineRequest) {
    return 'Hello World!';
  }
}
