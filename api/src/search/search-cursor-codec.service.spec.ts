import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SearchCursorCodecService } from './search-cursor-codec.service.js';
import { CursorCodecService } from '../common/pagination/cursor-codec.service.js';
import { SecretService } from '../secret/secret.service.js';

describe('SearchCursorCodecService', () => {
    const secretService = { get: () => 'a-test-secret' } as unknown as SecretService;

    it('round-trips a payload through encode and decode', () => {
        const service = new SearchCursorCodecService(secretService);
        const payload = { offset: 20 };

        expect(service.decode(service.encode(payload))).toEqual(payload);
    });

    it('rejects a cursor produced with a different secret', () => {
        const service = new SearchCursorCodecService(secretService);
        const otherService = new SearchCursorCodecService({ get: () => 'other-secret' } as unknown as SecretService);
        const cursor = otherService.encode({ offset: 20 });

        expect(() => service.decode(cursor)).toThrow(BadRequestException);
    });

    it('rejects a cursor minted by the id-based keyset codec, even with the same secret', () => {
        const service = new SearchCursorCodecService(secretService);
        const keysetService = new CursorCodecService(secretService);
        const keysetCursor = keysetService.encode({ id: 'question-1' });

        expect(() => service.decode(keysetCursor)).toThrow(BadRequestException);
    });
});
