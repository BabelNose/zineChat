import { ExecutionContext } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
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

    it('reads user off whatever request switchToHttp returns', () => {
        const getRequest = vi.fn().mockReturnValue({ user: { userId: 'another-user' } });
        const mockContext = {
            switchToHttp: () => ({ getRequest }),
        } as unknown as ExecutionContext;

        const result = getCurrentUserId(undefined, mockContext);

        expect(getRequest).toHaveBeenCalled();
        expect(result).toBe('another-user');
    });
});
