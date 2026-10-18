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

        // Filter on `id` rather than using `ids`: Ventstream-written indexes use `_vs_pk`
        // as their primary key, which is what `ids` matches. Requires `id` to be a
        // filterable attribute - set by search/scripts/backfill.sh.
        const filter = `id IN [${ids.map((id) => JSON.stringify(id)).join(', ')}]`;
        const { results } = await this.client.index(indexUid).getDocuments({ filter, limit: ids.length });
        return results.map((document) => ({ indexUid, document }));
    }
}
