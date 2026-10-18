import { describe, it, expect, vi } from 'vitest';
import { MeilisearchSearchProvider } from './search.provider.meilisearch.js';

describe('MeilisearchSearchProvider', () => {
    it('translates a federated multiSearch response into provider-agnostic hits', async () => {
        const client: any = {
            multiSearch: vi.fn().mockResolvedValue({
                hits: [
                    { id: 'question-1', question: 'a', _federation: { indexUid: 'zine_question' } },
                    { id: 'answer-1', questionId: 'question-1', answer: 'b', _federation: { indexUid: 'zine_answer' } },
                ],
            }),
        };
        const provider = new MeilisearchSearchProvider(client);

        const hits = await provider.search(['zine_question', 'zine_answer'], 'test', { offset: 0, limit: 20 });

        expect(hits).toEqual([
            { indexUid: 'zine_question', document: { id: 'question-1', question: 'a' } },
            { indexUid: 'zine_answer', document: { id: 'answer-1', questionId: 'question-1', answer: 'b' } },
        ]);
    });

    it('issues one federated query per index, sharing the same pagination', async () => {
        const client: any = { multiSearch: vi.fn().mockResolvedValue({ hits: [] }) };
        const provider = new MeilisearchSearchProvider(client);

        await provider.search(['zine_question', 'zine_tag'], 'hello', { offset: 20, limit: 10 });

        expect(client.multiSearch).toHaveBeenCalledWith({
            federation: { offset: 20, limit: 10 },
            queries: [
                { indexUid: 'zine_question', q: 'hello' },
                { indexUid: 'zine_tag', q: 'hello' },
            ],
        });
    });

    it('restricts matching to the given attributes when attributesToSearchOn is passed', async () => {
        const client: any = { multiSearch: vi.fn().mockResolvedValue({ hits: [] }) };
        const provider = new MeilisearchSearchProvider(client);

        await provider.search(['zine_tag'], 'hello', { offset: 0, limit: 20 }, { attributesToSearchOn: ['tag'] });

        expect(client.multiSearch).toHaveBeenCalledWith({
            federation: { offset: 0, limit: 20 },
            queries: [{ indexUid: 'zine_tag', q: 'hello', attributesToSearchOn: ['tag'] }],
        });
    });

    describe('getDocuments', () => {
        it('fetches documents by id from the given index', async () => {
            const index = { getDocuments: vi.fn().mockResolvedValue({ results: [{ id: 'question-1', question: 'a' }] }) };
            const client: any = { index: vi.fn().mockReturnValue(index) };
            const provider = new MeilisearchSearchProvider(client);

            const hits = await provider.getDocuments('zine_question', ['question-1']);

            expect(client.index).toHaveBeenCalledWith('zine_question');
            expect(hits).toEqual([{ indexUid: 'zine_question', document: { id: 'question-1', question: 'a' } }]);
        });

        it("looks documents up by Ventstream's `_vs_pk` primary key rather than the raw row id", async () => {
            const index = { getDocuments: vi.fn().mockResolvedValue({ results: [] }) };
            const client: any = { index: vi.fn().mockReturnValue(index) };
            const provider = new MeilisearchSearchProvider(client);

            await provider.getDocuments('zine_question', ['01a0cf03-255e-79b1-95ce-998bb994947e']);

            // Real `_vs_pk` taken from a Ventstream-populated zine_question index.
            expect(index.getDocuments).toHaveBeenCalledWith({
                ids: ['cHVibGljLnF1ZXN0aW9uOlsiMDFhMGNmMDMtMjU1ZS03OWIxLTk1Y2UtOTk4YmI5OTQ5NDdlIl0'],
            });
        });

        it('skips the request entirely for an empty id list', async () => {
            const client: any = { index: vi.fn() };
            const provider = new MeilisearchSearchProvider(client);

            const hits = await provider.getDocuments('zine_question', []);

            expect(hits).toEqual([]);
            expect(client.index).not.toHaveBeenCalled();
        });
    });
});
