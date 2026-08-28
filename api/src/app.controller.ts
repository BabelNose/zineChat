import { Controller, Req, UseGuards, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import type { ZineRequest } from './auth/auth.types.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req:ZineRequest) {
    return req.user;
  }

  @Get('/')
  helloWorld(@Req() req:ZineRequest) {
    return 'Hello World!';
  }
}
