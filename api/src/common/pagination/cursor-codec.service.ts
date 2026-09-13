import { Injectable } from '@nestjs/common';
import { SecretService } from '../../secret/secret.service.js';
import { CursorPayload, decodeCursor, deriveCursorKey, encodeCursor } from './cursor.util.js';

@Injectable()
export class CursorCodecService {
    private readonly key: Buffer;

    constructor(private readonly secretService: SecretService) {
        this.key = deriveCursorKey(this.secretService.get('paginationCursorSecret'));
    }

    encode(payload: CursorPayload): string {
        return encodeCursor(payload, this.key);
    }

    decode(cursor: string): CursorPayload {
        return decodeCursor(cursor, this.key);
    }
}
