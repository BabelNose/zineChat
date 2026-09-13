import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CursorCodecService } from './cursor-codec.service.js';
import { SecretService } from '../../secret/secret.service.js';

describe('CursorCodecService', () => {
    let service: CursorCodecService;

    beforeEach(() => {
        const secretService = { get: () => 'a-test-secret' } as unknown as SecretService;
        service = new CursorCodecService(secretService);
    });

    it('round-trips a payload through encode and decode', () => {
        const payload = { created: '2024-01-01T00:00:00.000Z', id: 'question-1' };
        expect(service.decode(service.encode(payload))).toEqual(payload);
    });

    it('rejects a cursor produced with a different secret', () => {
        const otherService = new CursorCodecService({ get: () => 'other-secret' } as unknown as SecretService);
        const cursor = otherService.encode({ created: '2024-01-01T00:00:00.000Z', id: 'question-1' });

        expect(() => service.decode(cursor)).toThrow(BadRequestException);
    });
});
