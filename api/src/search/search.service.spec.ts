import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { Question } from '../questions/question.entity.js';
import { MEILISEARCH_CLIENT } from './meilisearch.provider.js';

function queryBuilderReturning(rows: Array<{ questionId: string; tagId: string }>) {
    const chain = {
        innerJoin: () => chain,
        where: () => chain,
        select: () => chain,
        addSelect: () => chain,
        getRawMany: vi.fn().mockResolvedValue(rows),
    };
    return chain;
}

describe('SearchService', () => {
    let service: SearchService;
    let meilisearch: any;
    let questionsRepository: any;

    beforeEach(async () => {
        meilisearch = { multiSearch: vi.fn() };
        questionsRepository = { createQueryBuilder: vi.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SearchService,
                { provide: MEILISEARCH_CLIENT, useValue: meilisearch },
                { provide: getRepositoryToken(Question), useValue: questionsRepository },
            ],
        }).compile();

        service = module.get<SearchService>(SearchService);
    });

    it('maps a question hit to itself as the owning question', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [{ id: 'question-1', question: 'How do I test this?', _federation: { indexUid: 'zine_question' } }],
        });

        const result = await service.search({ q: 'test' } as any);

        expect(result.items).toEqual([{ resourceType: 'question', resourceId: 'question-1', questionId: 'question-1' }]);
    });

    it('maps an answer hit using its questionId field', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [
                { id: 'answer-1', questionId: 'question-1', answer: 'Here is how', _federation: { indexUid: 'zine_answer' } },
            ],
        });

        const result = await service.search({ q: 'how' } as any);

        expect(result.items).toEqual([{ resourceType: 'answer', resourceId: 'answer-1', questionId: 'question-1' }]);
    });

    it('maps a comment hit using its questionId field', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [
                { id: 'comment-1', questionId: 'question-2', comment: 'nice answer', _federation: { indexUid: 'zine_comment' } },
            ],
        });

        const result = await service.search({ q: 'nice' } as any);

        expect(result.items).toEqual([{ resourceType: 'comment', resourceId: 'comment-1', questionId: 'question-2' }]);
    });

    it('expands a tag hit into one result per question it is attached to', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [{ id: 'tag-1', tag: 'typescript', _federation: { indexUid: 'zine_tag' } }],
        });
        questionsRepository.createQueryBuilder.mockReturnValue(
            queryBuilderReturning([
                { questionId: 'question-1', tagId: 'tag-1' },
                { questionId: 'question-2', tagId: 'tag-1' },
            ]),
        );

        const result = await service.search({ q: 'typescript' } as any);

        expect(result.items).toEqual([
            { resourceType: 'tag', resourceId: 'tag-1', questionId: 'question-1' },
            { resourceType: 'tag', resourceId: 'tag-1', questionId: 'question-2' },
        ]);
    });

    it('omits a tag hit that is not attached to any question', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [{ id: 'tag-1', tag: 'unused', _federation: { indexUid: 'zine_tag' } }],
        });
        questionsRepository.createQueryBuilder.mockReturnValue(queryBuilderReturning([]));

        const result = await service.search({ q: 'unused' } as any);

        expect(result.items).toEqual([]);
    });

    it('returns no next cursor when there are no more hits than the limit', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [{ id: 'question-1', question: 'a', _federation: { indexUid: 'zine_question' } }],
        });

        const result = await service.search({ q: 'a', limit: 5 } as any);

        expect(result.nextCursor).toBeNull();
    });

    it('returns the next offset as the cursor when more hits exist', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [
                { id: 'question-1', question: 'a', _federation: { indexUid: 'zine_question' } },
                { id: 'question-2', question: 'a', _federation: { indexUid: 'zine_question' } },
            ],
        });

        const result = await service.search({ q: 'a', limit: 1 } as any);

        expect(result.nextCursor).toBe('1');
        expect(result.items).toHaveLength(1);
    });

    it('resumes from the offset carried by an existing cursor', async () => {
        meilisearch.multiSearch.mockResolvedValue({ hits: [] });

        await service.search({ q: 'a', cursor: '40', limit: 20 } as any);

        expect(meilisearch.multiSearch).toHaveBeenCalledWith(
            expect.objectContaining({ federation: { limit: 21, offset: 40 } }),
        );
    });

    it('rejects a cursor that is not a non-negative integer', async () => {
        await expect(service.search({ q: 'a', cursor: 'not-a-number' } as any)).rejects.toThrow(BadRequestException);
        await expect(service.search({ q: 'a', cursor: '-1' } as any)).rejects.toThrow(BadRequestException);
    });
});
