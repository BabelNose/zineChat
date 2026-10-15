import { API_URL } from '$lib/server/api';
import type { PageServerLoad } from './$types';

interface Author {
	id: string;
	username: string;
}

type SearchResourceType = 'question' | 'answer' | 'comment';

interface SearchHit {
	resourceType: SearchResourceType;
	resourceId: string;
	questionId: string;
}

interface PaginatedResult<T> {
	items: T[];
	nextCursor: string | null;
}

export interface SearchResultView {
	resourceType: SearchResourceType;
	resourceId: string;
	questionId: string;
	text: string;
	questionText: string;
	author: Author;
	created: string;
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const cursor = url.searchParams.get('cursor') ?? undefined;

	if (!q) {
		return { q, results: [] as SearchResultView[], nextCursor: null as string | null };
	}

	const params = new URLSearchParams({ q });
	if (cursor) {
		params.set('cursor', cursor);
	}

	const response = await fetch(`${API_URL}/search?${params}`);
	if (!response.ok) {
		return { q, results: [] as SearchResultView[], nextCursor: null as string | null };
	}

	const page = (await response.json()) as PaginatedResult<SearchHit>;
	const hydrated = await Promise.all(page.items.map((hit) => hydrate(hit, fetch)));
	const results = hydrated.filter((r): r is SearchResultView => r !== null);

	return { q, results, nextCursor: page.nextCursor };
};

async function hydrate(
	hit: SearchHit,
	fetch: typeof globalThis.fetch
): Promise<SearchResultView | null> {
	if (hit.resourceType === 'question') {
		const response = await fetch(`${API_URL}/questions/${hit.resourceId}`);
		if (!response.ok) {
			return null;
		}
		const question = await response.json();
		return {
			resourceType: 'question',
			resourceId: hit.resourceId,
			questionId: hit.questionId,
			text: question.question,
			questionText: question.question,
			author: question.author,
			created: question.created
		};
	}

	if (hit.resourceType === 'answer') {
		const response = await fetch(`${API_URL}/answers/${hit.resourceId}`);
		if (!response.ok) {
			return null;
		}
		const answer = await response.json();
		return {
			resourceType: 'answer',
			resourceId: hit.resourceId,
			questionId: hit.questionId,
			text: answer.answer,
			questionText: answer.question.question,
			author: answer.author,
			created: answer.created
		};
	}

	const response = await fetch(`${API_URL}/comments/${hit.resourceId}`);
	if (!response.ok) {
		return null;
	}
	const comment = await response.json();
	return {
		resourceType: 'comment',
		resourceId: hit.resourceId,
		questionId: hit.questionId,
		text: comment.comment,
		questionText: comment.question.question,
		author: comment.author,
		created: comment.created
	};
}
