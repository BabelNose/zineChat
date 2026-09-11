import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtAuthenticatedRequest } from '../auth/auth.types.js';

export const getCurrentUserId = (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<JwtAuthenticatedRequest>();
    return request.user.userId;
};

export const CurrentUserId = createParamDecorator(getCurrentUserId);
