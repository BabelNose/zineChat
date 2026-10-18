import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination/pagination.dto.js';
import { ISearchProvider, SearchHit } from './search.provider.interface.js';
import { SearchQueryDto } from './search-query.dto.js';
import { SearchResult, SearchResultTag } from './search-result.interface.js';

// One search index per Postgres table, kept in sync by Ventstream (search/README.md).
// zine_tag is deliberately excluded from this generic search - a tag hit maps to
// zero-or-many questions (whichever questions it's attached to), which doesn't fit
// this endpoint's one-row-per-match shape. It's searched separately via
// `searchTags` below, which returns bare tag documents instead of resource hits.
const QUESTION_INDEX = 'zine_question';
const ANSWER_INDEX = 'zine_answer';
const COMMENT_INDEX = 'zine_comment';
const TAG_INDEX = 'zine_tag';

// question.answerCount/commentCount/tagsCache are a denormalized read-model
// maintained by Postgres triggers (api/scripts/sync-search-cache.sql), not by
// application code - see question.entity.ts. Ventstream mirrors them into
// this document for free, so an answer/comment hit can be enriched with its
// owning question's stats via one extra Meilisearch lookup instead of a
// Postgres read.
//
// Ventstream writes integer and jsonb columns as strings (e.g. "4",
// "[{\"id\": ..., \"tag\": ...}]"), so toResult coerces them back.
interface QuestionDocument {
    id: string;
    question: string;
    created: string;
    answerCount: number | string;
    commentCount: number | string;
    tagsCache: SearchResultTag[] | string;
}

interface AnswerDocument {
    id: string;
    questionId: string;
    answer: string;
    created: string;
}

interface CommentDocument {
    id: string;
    questionId: string;
    comment: string;
    created: string;
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
        const offset = this.decodeOffsetCursor(query.cursor);

        const hits = await this.searchProvider.search(
            [QUESTION_INDEX, ANSWER_INDEX, COMMENT_INDEX],
            query.q,
            { offset, limit: limit + 1 },
        );

        const hasMore = hits.length > limit;
        const page = hasMore ? hits.slice(0, limit) : hits;

        const items = await this.toSearchResults(page);
        const nextCursor = hasMore ? String(offset + limit) : null;

        return { items, nextCursor };
    }

    async searchTags(query: SearchQueryDto): Promise<PaginatedResult<TagDocument>> {
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        const offset = this.decodeOffsetCursor(query.cursor);

        // Restricted to the `tag` field so a query can't match a tag by its id.
        const hits = await this.searchProvider.search([TAG_INDEX], query.q, { offset, limit: limit + 1 }, { attributesToSearchOn: ['tag'] });

        const hasMore = hits.length > limit;
        const page = hasMore ? hits.slice(0, limit) : hits;
        const items = page.map((hit) => hit.document as unknown as TagDocument);
        const nextCursor = hasMore ? String(offset + limit) : null;

        return { items, nextCursor };
    }

    // The cursor is just the position in the relevance-ranked result set - there's
    // nothing sensitive about it (a client could derive it anyway by counting pages),
    // so unlike the id-based keyset cursor, it doesn't need to be encrypted.
    private decodeOffsetCursor(cursor?: string): number {
        if (!cursor) {
            return 0;
        }
        const offset = Number(cursor);
        if (!Number.isInteger(offset) || offset < 0) {
            throw new BadRequestException('Invalid pagination cursor');
        }
        return offset;
    }

    private async toSearchResults(hits: SearchHit[]): Promise<SearchResult[]> {
        const questionsById = new Map<string, QuestionDocument>();
        const neededQuestionIds = new Set<string>();

        for (const hit of hits) {
            if (hit.indexUid === QUESTION_INDEX) {
                const doc = hit.document as unknown as QuestionDocument;
                questionsById.set(doc.id, doc);
            } else {
                neededQuestionIds.add((hit.document as unknown as AnswerDocument | CommentDocument).questionId);
            }
        }

        const missingIds = [...neededQuestionIds].filter((id) => !questionsById.has(id));
        if (missingIds.length > 0) {
            const companionHits = await this.searchProvider.getDocuments(QUESTION_INDEX, missingIds);
            for (const hit of companionHits) {
                const doc = hit.document as unknown as QuestionDocument;
                questionsById.set(doc.id, doc);
            }
        }

        const results: SearchResult[] = [];
        for (const hit of hits) {
            if (hit.indexUid === QUESTION_INDEX) {
                const doc = hit.document as unknown as QuestionDocument;
                results.push(this.toResult('question', doc.id, doc.id, doc.question, doc.created, doc));
                continue;
            }

            if (hit.indexUid === ANSWER_INDEX) {
                const doc = hit.document as unknown as AnswerDocument;
                const question = questionsById.get(doc.questionId);
                if (question) {
                    results.push(this.toResult('answer', doc.id, doc.questionId, doc.answer, doc.created, question));
                }
                continue;
            }

            if (hit.indexUid === COMMENT_INDEX) {
                const doc = hit.document as unknown as CommentDocument;
                const question = questionsById.get(doc.questionId);
                if (question) {
                    results.push(this.toResult('comment', doc.id, doc.questionId, doc.comment, doc.created, question));
                }
            }
        }
        return results;
    }

    private toResult(
        resourceType: SearchResult['resourceType'],
        resourceId: string,
        questionId: string,
        text: string,
        created: string,
        question: QuestionDocument,
    ): SearchResult {
        return {
            resourceType,
            resourceId,
            questionId,
            text,
            created,
            questionText: question.question,
            questionCreated: question.created,
            answerCount: Number(question.answerCount),
            commentCount: Number(question.commentCount),
            tags: typeof question.tagsCache === 'string' ? JSON.parse(question.tagsCache) : question.tagsCache,
        };
    }
}
