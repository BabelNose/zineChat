import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../questions/question.entity.js';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination/pagination.dto.js';
import { ISearchProvider, SearchHit } from './search.provider.interface.js';
import { SearchQueryDto } from './search-query.dto.js';
import { SearchResult } from './search-result.interface.js';

// One search index per Postgres table, kept in sync by Ventstream (search/README.md).
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

interface TagDocument {
    id: string;
    tag: string;
}

@Injectable()
export class SearchService {
    constructor(
        @Inject(ISearchProvider)
        private readonly searchProvider: ISearchProvider,
        @InjectRepository(Question)
        private readonly questionsRepository: Repository<Question>,
    ) {}

    async search(query: SearchQueryDto): Promise<PaginatedResult<SearchResult>> {
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        const offset = this.decodeOffset(query.cursor);

        const hits = await this.searchProvider.search(
            [QUESTION_INDEX, ANSWER_INDEX, COMMENT_INDEX, TAG_INDEX],
            query.q,
            { offset, limit: limit + 1 },
        );

        const hasMore = hits.length > limit;
        const page = hasMore ? hits.slice(0, limit) : hits;

        const items = await this.toSearchResults(page);
        const nextCursor = hasMore ? String(offset + limit) : null;

        return { items, nextCursor };
    }

    // The cursor is just the position in the relevance-ranked result set - there's
    // nothing sensitive about it (a client could derive it anyway by counting pages),
    // so unlike the id-based keyset cursor, it doesn't need to be encrypted.
    private decodeOffset(cursor?: string): number {
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
        const tagHits = hits.filter((hit) => hit.indexUid === TAG_INDEX);
        const tagQuestionIds = await this.resolveTagQuestionIds(
            tagHits.map((hit) => (hit.document as unknown as TagDocument).id),
        );

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
                case TAG_INDEX: {
                    const doc = hit.document as unknown as TagDocument;
                    for (const questionId of tagQuestionIds.get(doc.id) ?? []) {
                        results.push({ resourceType: 'tag', resourceId: doc.id, questionId });
                    }
                    break;
                }
            }
        }
        return results;
    }

    // A tag can be attached to several questions (or none yet), so a tag hit maps to
    // zero or more results - one per question it's actually attached to.
    private async resolveTagQuestionIds(tagIds: string[]): Promise<Map<string, string[]>> {
        const map = new Map<string, string[]>();
        if (tagIds.length === 0) {
            return map;
        }

        const rows = await this.questionsRepository
            .createQueryBuilder('question')
            .innerJoin('question.tags', 'tag')
            .where('tag.id IN (:...tagIds)', { tagIds })
            .select('question.id', 'questionId')
            .addSelect('tag.id', 'tagId')
            .getRawMany<{ questionId: string; tagId: string }>();

        for (const row of rows) {
            const questionIds = map.get(row.tagId) ?? [];
            questionIds.push(row.questionId);
            map.set(row.tagId, questionIds);
        }
        return map;
    }
}
