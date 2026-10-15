import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination/pagination.dto.js';
import { decodeOffsetCursor } from './offset-cursor.js';
import { ISearchProvider, SearchHit } from './search.provider.interface.js';
import { SearchQueryDto } from './search-query.dto.js';
import { SearchResult } from './search-result.interface.js';

// One search index per Postgres table, kept in sync by Ventstream (search/README.md).
// zine_tag is deliberately excluded from this generic search - a tag hit maps to
// zero-or-many questions (whichever questions it's attached to), which doesn't fit
// this endpoint's one-row-per-match shape. It's searched separately via
// `searchTags` below, which returns bare tag documents instead of resource hits.
const QUESTION_INDEX = 'zine_question';
const ANSWER_INDEX = 'zine_answer';
const COMMENT_INDEX = 'zine_comment';
const TAG_INDEX = 'zine_tag';

interface QuestionDocument {
    id: string;
    question: string;
}

interface AnswerDocument {
    id: string;
    questionId: string;
    answer: string;
}

interface CommentDocument {
    id: string;
    questionId: string;
    comment: string;
}

export interface TagDocument {
    id: string;
    tag: string;
}

@Injectable()
export class SearchService {
    constructor(
        @Inject(ISearchProvider)
        private readonly searchProvider: ISearchProvider,
    ) {}

    async search(query: SearchQueryDto): Promise<PaginatedResult<SearchResult>> {
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        const offset = decodeOffsetCursor(query.cursor);

        const hits = await this.searchProvider.search(
            [QUESTION_INDEX, ANSWER_INDEX, COMMENT_INDEX],
            query.q,
            { offset, limit: limit + 1 },
        );

        const hasMore = hits.length > limit;
        const page = hasMore ? hits.slice(0, limit) : hits;

        const items = this.toSearchResults(page);
        const nextCursor = hasMore ? String(offset + limit) : null;

        return { items, nextCursor };
    }

    async searchTags(query: SearchQueryDto): Promise<PaginatedResult<TagDocument>> {
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        const offset = decodeOffsetCursor(query.cursor);

        const hits = await this.searchProvider.search([TAG_INDEX], query.q, { offset, limit: limit + 1 });

        const hasMore = hits.length > limit;
        const page = hasMore ? hits.slice(0, limit) : hits;
        const items = page.map((hit) => hit.document as unknown as TagDocument);
        const nextCursor = hasMore ? String(offset + limit) : null;

        return { items, nextCursor };
    }

    private toSearchResults(hits: SearchHit[]): SearchResult[] {
        const results: SearchResult[] = [];
        for (const hit of hits) {
            switch (hit.indexUid) {
                case QUESTION_INDEX: {
                    const doc = hit.document as unknown as QuestionDocument;
                    results.push({ resourceType: 'question', resourceId: doc.id, questionId: doc.id });
                    break;
                }
                case ANSWER_INDEX: {
                    const doc = hit.document as unknown as AnswerDocument;
                    results.push({ resourceType: 'answer', resourceId: doc.id, questionId: doc.questionId });
                    break;
                }
                case COMMENT_INDEX: {
                    const doc = hit.document as unknown as CommentDocument;
                    results.push({ resourceType: 'comment', resourceId: doc.id, questionId: doc.questionId });
                    break;
                }
            }
        }
        return results;
    }
}
