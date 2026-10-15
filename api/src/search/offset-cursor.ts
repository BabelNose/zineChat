import { BadRequestException } from '@nestjs/common';

// The cursor is just the position in the relevance-ranked result set - there's
// nothing sensitive about it (a client could derive it anyway by counting pages),
// so unlike the id-based keyset cursor, it doesn't need to be encrypted.
export function decodeOffsetCursor(cursor?: string): number {
    if (!cursor) {
        return 0;
    }
    const offset = Number(cursor);
    if (!Number.isInteger(offset) || offset < 0) {
        throw new BadRequestException('Invalid pagination cursor');
    }
    return offset;
}
