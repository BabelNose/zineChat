import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { ISearchProvider } from './search.provider.interface.js';

const INDEX_UIDS = ['zine_question', 'zine_answer', 'zine_comment'];

describe('SearchService', () => {
    let service: SearchService;
    let searchProvider: any;

    beforeEach(async () => {
        searchProvider = { search: vi.fn(), getDocuments: vi.fn().mockResolvedValue([]) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [SearchService, { provide: ISearchProvider, useValue: searchProvider }],
        }).compile();

        service = module.get<SearchService>(SearchService);
    });

    it('maps a question hit to itself, using its own cached stats', async () => {
        searchProvider.search.mockResolvedValue([
            {
                indexUid: 'zine_question',
                document: {
                    id: 'question-1',
                    question: 'How do I test this?',
                    created: '2026-01-01T00:00:00.000Z',
                    answerCount: 3,
                    commentCount: 5,
                    tagsCache: [{ id: 'tag-1', tag: 'testing' }],
                },
            },
        ]);

        const result = await service.search({ q: 'test' } as any);

        expect(result.items).toEqual([
            {
                resourceType: 'question',
                resourceId: 'question-1',
                questionId: 'question-1',
                text: 'How do I test this?',
                created: '2026-01-01T00:00:00.000Z',
                questionText: 'How do I test this?',
                questionCreated: '2026-01-01T00:00:00.000Z',
                answerCount: 3,
                commentCount: 5,
                tags: [{ id: 'tag-1', tag: 'testing' }],
            },
        ]);
        expect(searchProvider.getDocuments).not.toHaveBeenCalled();
    });

    it('enriches an answer hit with its owning question, fetched by id', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_answer', document: { id: 'answer-1', questionId: 'question-1', answer: 'Here is how', created: '2026-01-02T00:00:00.000Z' } },
        ]);
        searchProvider.getDocuments.mockResolvedValue([
            {
                indexUid: 'zine_question',
                document: {
                    id: 'question-1',
                    question: 'How do I test this?',
                    created: '2026-01-01T00:00:00.000Z',
                    answerCount: 1,
                    commentCount: 0,
                    tagsCache: [],
                },
            },
        ]);

        const result = await service.search({ q: 'how' } as any);

        expect(searchProvider.getDocuments).toHaveBeenCalledWith('zine_question', ['question-1']);
        expect(result.items).toEqual([
            {
                resourceType: 'answer',
                resourceId: 'answer-1',
                questionId: 'question-1',
                text: 'Here is how',
                created: '2026-01-02T00:00:00.000Z',
                questionText: 'How do I test this?',
                questionCreated: '2026-01-01T00:00:00.000Z',
                answerCount: 1,
                commentCount: 0,
                tags: [],
            },
        ]);
    });

    it('enriches a comment hit the same way, using its questionId field', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_comment', document: { id: 'comment-1', questionId: 'question-2', comment: 'nice answer', created: '2026-01-03T00:00:00.000Z' } },
        ]);
        searchProvider.getDocuments.mockResolvedValue([
            {
                indexUid: 'zine_question',
                document: { id: 'question-2', question: 'q2', created: '2026-01-01T00:00:00.000Z', answerCount: 2, commentCount: 1, tagsCache: [] },
            },
        ]);

        const result = await service.search({ q: 'nice' } as any);

        expect(result.items).toEqual([
            {
                resourceType: 'comment',
                resourceId: 'comment-1',
                questionId: 'question-2',
                text: 'nice answer',
                created: '2026-01-03T00:00:00.000Z',
                questionText: 'q2',
                questionCreated: '2026-01-01T00:00:00.000Z',
                answerCount: 2,
                commentCount: 1,
                tags: [],
            },
        ]);
    });

    it('fetches each owning question only once, even with multiple answer/comment hits on it', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_answer', document: { id: 'answer-1', questionId: 'question-1', answer: 'a', created: 'c' } },
            { indexUid: 'zine_comment', document: { id: 'comment-1', questionId: 'question-1', comment: 'b', created: 'c' } },
        ]);
        searchProvider.getDocuments.mockResolvedValue([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'q', created: 'c', answerCount: 1, commentCount: 1, tagsCache: [] } },
        ]);

        await service.search({ q: 'x' } as any);

        expect(searchProvider.getDocuments).toHaveBeenCalledTimes(1);
        expect(searchProvider.getDocuments).toHaveBeenCalledWith('zine_question', ['question-1']);
    });

    it('does not re-fetch a question that is already a direct hit on the same page', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'q', created: 'c', answerCount: 1, commentCount: 0, tagsCache: [] } },
            { indexUid: 'zine_answer', document: { id: 'answer-1', questionId: 'question-1', answer: 'a', created: 'c' } },
        ]);

        const result = await service.search({ q: 'x' } as any);

        expect(searchProvider.getDocuments).not.toHaveBeenCalled();
        expect(result.items).toHaveLength(2);
        expect(result.items[1]).toMatchObject({ resourceType: 'answer', answerCount: 1 });
    });

    it('drops an answer/comment hit whose owning question cannot be found', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_answer', document: { id: 'answer-1', questionId: 'missing-question', answer: 'a', created: 'c' } },
        ]);
        searchProvider.getDocuments.mockResolvedValue([]);

        const result = await service.search({ q: 'x' } as any);

        expect(result.items).toEqual([]);
    });

    it('returns no next cursor when there are no more hits than the limit', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'a', created: 'c', answerCount: 0, commentCount: 0, tagsCache: [] } },
        ]);

        const result = await service.search({ q: 'a', limit: 5 } as any);

        expect(result.nextCursor).toBeNull();
    });

    it('returns the next offset as the cursor when more hits exist', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'a', created: 'c', answerCount: 0, commentCount: 0, tagsCache: [] } },
            { indexUid: 'zine_question', document: { id: 'question-2', question: 'a', created: 'c', answerCount: 0, commentCount: 0, tagsCache: [] } },
        ]);

        const result = await service.search({ q: 'a', limit: 1 } as any);

        expect(result.nextCursor).toBe('1');
        expect(result.items).toHaveLength(1);
    });

    it('resumes from the offset carried by an existing cursor and queries all three indexes', async () => {
        searchProvider.search.mockResolvedValue([]);

        await service.search({ q: 'a', cursor: '40', limit: 20 } as any);

        expect(searchProvider.search).toHaveBeenCalledWith(INDEX_UIDS, 'a', { offset: 40, limit: 21 });
    });

    it('rejects a cursor that is not a non-negative integer', async () => {
        await expect(service.search({ q: 'a', cursor: 'not-a-number' } as any)).rejects.toThrow(BadRequestException);
        await expect(service.search({ q: 'a', cursor: '-1' } as any)).rejects.toThrow(BadRequestException);
    });

    describe('searchTags', () => {
        it('returns bare tag documents, unlike the resourceType-wrapped hits from search()', async () => {
            searchProvider.search.mockResolvedValue([{ indexUid: 'zine_tag', document: { id: 'tag-1', tag: 'typescript' } }]);

            const result = await service.searchTags({ q: 'type' } as any);

            expect(result.items).toEqual([{ id: 'tag-1', tag: 'typescript' }]);
        });

        it('queries only the tag index, restricted to the tag field', async () => {
            searchProvider.search.mockResolvedValue([]);

            await service.searchTags({ q: 'a', cursor: '40', limit: 20 } as any);

            expect(searchProvider.search).toHaveBeenCalledWith(['zine_tag'], 'a', { offset: 40, limit: 21 }, { attributesToSearchOn: ['tag'] });
        });
    });
});
