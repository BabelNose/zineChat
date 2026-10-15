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
});
