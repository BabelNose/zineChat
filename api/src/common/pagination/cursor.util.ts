import { BadRequestException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
// Fixed application-level salt mixed into the secret so the derived key is
// bound to this specific use case rather than reusing the raw secret.
const KEY_SALT = 'zinechat-pagination-cursor-v1';

export interface CursorPayload {
    id: string;
}

/**
 * Derives an AES key for one cursor "family" (e.g. keyset vs. search-offset
 * pagination). Mixing a distinct `context` into every family's key means a
 * cursor minted for one family can't even be decrypted by another's codec -
 * not just rejected by a shape check - even though they all derive from the
 * same underlying secret.
 */
export function deriveCursorKey(secret: string, context: string): Buffer {
    return createHash('sha256').update(KEY_SALT).update(context).update(secret).digest();
}

export function encodeCursor<T>(payload: T, key: Buffer): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

export function decodeCursor<T>(cursor: string, key: Buffer, isValid: (payload: unknown) => payload is T): T {
    try {
        const raw = Buffer.from(cursor, 'base64url');
        const iv = raw.subarray(0, IV_LENGTH);
        const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

        const payload = JSON.parse(plaintext);
        if (!isValid(payload)) {
            throw new Error('Malformed cursor payload');
        }
        return payload;
    } catch {
        throw new BadRequestException('Invalid pagination cursor');
    }
}

export function isCursorPayload(payload: unknown): payload is CursorPayload {
    return typeof (payload as CursorPayload)?.id === 'string';
}
