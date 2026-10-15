import { Inject, Injectable } from '@nestjs/common';
import type { FederatedMultiSearchParams } from 'meilisearch';
import { Meilisearch } from 'meilisearch';
import { MEILISEARCH_CLIENT } from './meilisearch.provider.js';
import { ISearchProvider, SearchHit, SearchPagination } from './search.provider.interface.js';

@Injectable()
export class MeilisearchSearchProvider implements ISearchProvider {
    constructor(
        @Inject(MEILISEARCH_CLIENT)
        private readonly client: Meilisearch,
    ) {}

    async search(indexUids: string[], query: string, pagination: SearchPagination): Promise<SearchHit[]> {
        const response = await this.client.multiSearch<FederatedMultiSearchParams>({
            federation: { offset: pagination.offset, limit: pagination.limit },
            queries: indexUids.map((indexUid) => ({ indexUid, q: query })),
        });

        return response.hits.map((hit) => {
            const { _federation, ...document } = hit;
            return { indexUid: _federation?.indexUid ?? '', document };
        });
    }
}
