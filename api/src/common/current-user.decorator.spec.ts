import { ExecutionContext } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { getCurrentUserId } from './current-user.decorator.js';

describe('getCurrentUserId', () => {
    it('returns the userId from the request user', () => {
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: { userId: 'user-123' } }),
            }),
        } as unknown as ExecutionContext;

        const result = getCurrentUserId(undefined, mockContext);

        expect(result).toBe('user-123');
    });

});
