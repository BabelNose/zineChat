import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';

export const MEILISEARCH_CLIENT = Symbol('MEILISEARCH_CLIENT');

export function createMeilisearchClient(configService: ConfigService): Meilisearch {
    return new Meilisearch({
        host: configService.getOrThrow<string>('MEILI_HOST'),
        apiKey: configService.getOrThrow<string>('MEILI_MASTER_KEY'),
    });
}
