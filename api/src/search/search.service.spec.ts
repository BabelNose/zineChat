import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { Question } from '../questions/question.entity.js';
import { CursorCodecService } from '../common/pagination/cursor-codec.service.js';
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
    let cursorCodec: any;

    beforeEach(async () => {
        meilisearch = { multiSearch: vi.fn() };
        questionsRepository = { createQueryBuilder: vi.fn() };
        cursorCodec = { encode: vi.fn(), decode: vi.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SearchService,
                { provide: MEILISEARCH_CLIENT, useValue: meilisearch },
                { provide: getRepositoryToken(Question), useValue: questionsRepository },
                { provide: CursorCodecService, useValue: cursorCodec },
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

    it('returns an encoded next cursor advanced by the limit when more hits exist', async () => {
        meilisearch.multiSearch.mockResolvedValue({
            hits: [
                { id: 'question-1', question: 'a', _federation: { indexUid: 'zine_question' } },
                { id: 'question-2', question: 'a', _federation: { indexUid: 'zine_question' } },
            ],
        });
        cursorCodec.encode.mockReturnValue('encoded-cursor');

        const result = await service.search({ q: 'a', limit: 1 } as any);

        expect(cursorCodec.encode).toHaveBeenCalledWith({ offset: 1 });
        expect(result.nextCursor).toBe('encoded-cursor');
        expect(result.items).toHaveLength(1);
    });

    it('decodes an existing cursor and forwards its offset to the federated search', async () => {
        cursorCodec.decode.mockReturnValue({ offset: 40 });
        meilisearch.multiSearch.mockResolvedValue({ hits: [] });

        await service.search({ q: 'a', cursor: 'some-cursor', limit: 20 } as any);

        expect(meilisearch.multiSearch).toHaveBeenCalledWith(
            expect.objectContaining({ federation: { limit: 21, offset: 40 } }),
        );
    });

    it('rejects a cursor that does not carry an offset payload', async () => {
        cursorCodec.decode.mockReturnValue({ id: 'question-1' });

        await expect(service.search({ q: 'a', cursor: 'some-cursor' } as any)).rejects.toThrow(BadRequestException);
    });
});
