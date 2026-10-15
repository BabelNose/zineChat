export interface SearchHit {
    indexUid: string;
    document: Record<string, unknown>;
}

export interface SearchPagination {
    offset: number;
    limit: number;
}

export interface ISearchProvider {
    /**
     * Searches across the given indexes for `query`, returning up to
     * `pagination.limit` hits merged and ranked by relevance across all of
     * them, starting at `pagination.offset`.
     */
    search(indexUids: string[], query: string, pagination: SearchPagination): Promise<SearchHit[]>;
}

export const ISearchProvider = Symbol('ISearchProvider');
