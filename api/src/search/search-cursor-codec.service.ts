import { Injectable } from '@nestjs/common';
import { SecretService } from '../secret/secret.service.js';
import { decodeCursor, deriveCursorKey, encodeCursor } from '../common/pagination/cursor.util.js';

export interface SearchCursorPayload {
    offset: number;
}

function isSearchCursorPayload(payload: unknown): payload is SearchCursorPayload {
    return typeof (payload as SearchCursorPayload)?.offset === 'number';
}

/**
 * Encrypts/decrypts the offset cursor used to page through relevance-ranked
 * search results (see SearchService). Kept separate from CursorCodecService
 * (the id-based keyset cursor used by questions/answers/comments) on purpose:
 * search results aren't ordered by id, so "the last id you saw" is meaningless
 * here - the cursor has to carry a position in the ranked list instead. Giving
 * it its own type and its own derived key (via a distinct `deriveCursorKey`
 * context) means a cursor minted by one can never be mistaken for, or even
 * decrypted as, the other.
 */
@Injectable()
export class SearchCursorCodecService {
    private readonly key: Buffer;

    constructor(private readonly secretService: SecretService) {
        this.key = deriveCursorKey(this.secretService.get('paginationCursorSecret'), 'search-offset');
    }

    encode(payload: SearchCursorPayload): string {
        return encodeCursor(payload, this.key);
    }

    decode(cursor: string): SearchCursorPayload {
        return decodeCursor(cursor, this.key, isSearchCursorPayload);
    }
}
