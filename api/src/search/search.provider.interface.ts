export interface SearchHit {
    indexUid: string;
    document: Record<string, unknown>;
}

export interface SearchPagination {
    offset: number;
    limit: number;
}

export interface SearchOptions {
    /** Restricts matching to these fields, instead of every field in the document. */
    attributesToSearchOn?: string[];
}

export interface ISearchProvider {
    /**
     * Searches across the given indexes for `query`, returning up to
     * `pagination.limit` hits merged and ranked by relevance across all of
     * them, starting at `pagination.offset`.
     */
    search(indexUids: string[], query: string, pagination: SearchPagination, options?: SearchOptions): Promise<SearchHit[]>;

    /**
     * Fetches documents by id from a single index, in one round trip. Ids
     * with no matching document are silently omitted - no error, no hit.
     */
    getDocuments(indexUid: string, ids: string[]): Promise<SearchHit[]>;
}

export const ISearchProvider = Symbol('ISearchProvider');
