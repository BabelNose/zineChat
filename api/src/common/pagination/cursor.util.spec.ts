import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { deriveCursorKey, encodeCursor, decodeCursor } from './cursor.util.js';

describe('cursor.util', () => {
    const key = deriveCursorKey('a-test-secret');
    const payload = { created: '2024-01-01T00:00:00.000Z', id: '11111111-1111-4111-8111-111111111111' };

    it('round-trips a payload through encode and decode', () => {
        const cursor = encodeCursor(payload, key);
        expect(decodeCursor(cursor, key)).toEqual(payload);
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
        const otherKey = deriveCursorKey('a-different-secret');
        expect(() => decodeCursor(cursor, otherKey)).toThrow(BadRequestException);
    });

    it('rejects a tampered cursor', () => {
        const cursor = encodeCursor(payload, key);
        const tampered = cursor.slice(0, -2) + (cursor.slice(-2) === 'AA' ? 'BB' : 'AA');
        expect(() => decodeCursor(tampered, key)).toThrow(BadRequestException);
    });

    it('rejects a cursor that is not validly encoded', () => {
        expect(() => decodeCursor('not-a-real-cursor', key)).toThrow(BadRequestException);
    });
});
