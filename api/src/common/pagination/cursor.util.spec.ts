import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { deriveCursorKey, encodeCursor, decodeCursor, isCursorPayload } from './cursor.util.js';

describe('cursor.util', () => {
    const key = deriveCursorKey('a-test-secret', 'keyset');
    const payload = { id: '11111111-1111-4111-8111-111111111111' };

    it('round-trips a payload through encode and decode', () => {
        const cursor = encodeCursor(payload, key);
        expect(decodeCursor(cursor, key, isCursorPayload)).toEqual(payload);
    });

    it('does not leak the id in the encoded cursor', () => {
        const cursor = encodeCursor(payload, key);
        expect(cursor).not.toContain(payload.id);
    });

    it('produces different ciphertext for the same payload on each call', () => {
        expect(encodeCursor(payload, key)).not.toBe(encodeCursor(payload, key));
    });

    it('rejects a cursor decoded with the wrong key', () => {
        const cursor = encodeCursor(payload, key);
        const otherKey = deriveCursorKey('a-different-secret', 'keyset');
        expect(() => decodeCursor(cursor, otherKey, isCursorPayload)).toThrow(BadRequestException);
    });

    it('rejects a tampered cursor', () => {
        const cursor = encodeCursor(payload, key);
        const tampered = cursor.slice(0, -2) + (cursor.slice(-2) === 'AA' ? 'BB' : 'AA');
        expect(() => decodeCursor(tampered, key, isCursorPayload)).toThrow(BadRequestException);
    });

    it('rejects a cursor that is not validly encoded', () => {
        expect(() => decodeCursor('not-a-real-cursor', key, isCursorPayload)).toThrow(BadRequestException);
    });

    it('rejects a decoded payload that does not match the expected shape', () => {
        const cursor = encodeCursor({ offset: 40 }, key);
        expect(() => decodeCursor(cursor, key, isCursorPayload)).toThrow(BadRequestException);
    });

    it('derives a different key per context, even from the same secret', () => {
        const keysetKey = deriveCursorKey('shared-secret', 'keyset');
        const searchKey = deriveCursorKey('shared-secret', 'search-offset');
        const cursor = encodeCursor(payload, keysetKey);

        // A cursor minted under one context's key can't be decrypted under another's,
        // even though both ultimately derive from the same underlying secret.
        expect(() => decodeCursor(cursor, searchKey, isCursorPayload)).toThrow(BadRequestException);
    });
});
