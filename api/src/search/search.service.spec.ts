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
        searchProvider = { search: vi.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [SearchService, { provide: ISearchProvider, useValue: searchProvider }],
        }).compile();

        service = module.get<SearchService>(SearchService);
    });

    it('maps a question hit to itself as the owning question', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'How do I test this?' } },
        ]);

        const result = await service.search({ q: 'test' } as any);

        expect(result.items).toEqual([{ resourceType: 'question', resourceId: 'question-1', questionId: 'question-1' }]);
    });

    it('maps an answer hit using its questionId field', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_answer', document: { id: 'answer-1', questionId: 'question-1', answer: 'Here is how' } },
        ]);

        const result = await service.search({ q: 'how' } as any);

        expect(result.items).toEqual([{ resourceType: 'answer', resourceId: 'answer-1', questionId: 'question-1' }]);
    });

    it('maps a comment hit using its questionId field', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_comment', document: { id: 'comment-1', questionId: 'question-2', comment: 'nice answer' } },
        ]);

        const result = await service.search({ q: 'nice' } as any);

        expect(result.items).toEqual([{ resourceType: 'comment', resourceId: 'comment-1', questionId: 'question-2' }]);
    });

    it('returns no next cursor when there are no more hits than the limit', async () => {
        searchProvider.search.mockResolvedValue([{ indexUid: 'zine_question', document: { id: 'question-1', question: 'a' } }]);

        const result = await service.search({ q: 'a', limit: 5 } as any);

        expect(result.nextCursor).toBeNull();
    });

    it('returns the next offset as the cursor when more hits exist', async () => {
        searchProvider.search.mockResolvedValue([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'a' } },
            { indexUid: 'zine_question', document: { id: 'question-2', question: 'a' } },
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
        it('returns bare tag documents, with no next cursor when there are no more hits than the limit', async () => {
            searchProvider.search.mockResolvedValue([{ indexUid: 'zine_tag', document: { id: 'tag-1', tag: 'typescript' } }]);

            const result = await service.searchTags({ q: 'type', limit: 5 } as any);

            expect(result).toEqual({ items: [{ id: 'tag-1', tag: 'typescript' }], nextCursor: null });
        });

        it('returns a next cursor and trims the page when more hits exist than the limit', async () => {
            searchProvider.search.mockResolvedValue([
                { indexUid: 'zine_tag', document: { id: 'tag-1', tag: 'a' } },
                { indexUid: 'zine_tag', document: { id: 'tag-2', tag: 'b' } },
            ]);

            const result = await service.searchTags({ q: 'a', limit: 1 } as any);

            expect(result).toEqual({ items: [{ id: 'tag-1', tag: 'a' }], nextCursor: '1' });
        });

        it('queries only the tag index, restricted to the tag field', async () => {
            searchProvider.search.mockResolvedValue([]);

            await service.searchTags({ q: 'a', cursor: '40', limit: 20 } as any);

            expect(searchProvider.search).toHaveBeenCalledWith(['zine_tag'], 'a', { offset: 40, limit: 21 }, { attributesToSearchOn: ['tag'] });
        });

        it('rejects a cursor that is not a non-negative integer', async () => {
            await expect(service.searchTags({ q: 'a', cursor: 'not-a-number' } as any)).rejects.toThrow(BadRequestException);
            await expect(service.searchTags({ q: 'a', cursor: '-1' } as any)).rejects.toThrow(BadRequestException);
        });
    });
});
