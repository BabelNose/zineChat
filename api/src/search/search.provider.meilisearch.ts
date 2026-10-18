import { Inject, Injectable } from '@nestjs/common';
import type { FederatedMultiSearchParams } from 'meilisearch';
import { Meilisearch } from 'meilisearch';
import { MEILISEARCH_CLIENT } from './meilisearch.provider.js';
import { ISearchProvider, SearchHit, SearchOptions, SearchPagination } from './search.provider.interface.js';

@Injectable()
export class MeilisearchSearchProvider implements ISearchProvider {
    constructor(
        @Inject(MEILISEARCH_CLIENT)
        private readonly client: Meilisearch,
    ) {}

    async search(
        indexUids: string[],
        query: string,
        pagination: SearchPagination,
        options?: SearchOptions,
    ): Promise<SearchHit[]> {
        const response = await this.client.multiSearch<FederatedMultiSearchParams>({
            federation: { offset: pagination.offset, limit: pagination.limit },
            queries: indexUids.map((indexUid) => ({
                indexUid,
                q: query,
                ...(options?.attributesToSearchOn ? { attributesToSearchOn: options.attributesToSearchOn } : {}),
            })),
        });

        return response.hits.map((hit) => {
            const { _federation, ...document } = hit;
            return { indexUid: _federation?.indexUid ?? '', document };
        });
    }

    async getDocuments(indexUid: string, ids: string[]): Promise<SearchHit[]> {
        if (ids.length === 0) {
            return [];
        }

        const pks = ids.map((id) => toVentstreamPk(indexUid, id));
        const { results } = await this.client.index(indexUid).getDocuments({ ids: pks });
        return results.map((document) => ({ indexUid, document }));
    }
}

// Ventstream-written indexes use `_vs_pk` as their primary key, not the row's `id`:
// base64url (unpadded) of `public.<table>:["<id>"]`, where <table> is the index uid
// minus the `zine_` prefix (VS_MEILI_INDEX_PREFIX in search/docker-compose.yml).
// Only valid for single-column primary keys on tables without underscores.
function toVentstreamPk(indexUid: string, id: string): string {
    const table = indexUid.replace(/^zine_/, '');
    return Buffer.from(`public.${table}:${JSON.stringify([id])}`).toString('base64url');
}
