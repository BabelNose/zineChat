import { API_URL } from '$lib/server/api';
import type { PageServerLoad } from './$types';

type SearchResourceType = 'question' | 'answer' | 'comment';

export interface SearchResultTag {
	id: string;
	tag: string;
}

export interface SearchResultView {
	resourceType: SearchResourceType;
	resourceId: string;
	questionId: string;
	text: string;
	created: string;
	questionText: string;
	questionCreated: string;
	answerCount: number;
	commentCount: number;
	tags: SearchResultTag[];
}

interface PaginatedResult<T> {
	items: T[];
	nextCursor: string | null;
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

	const page = (await response.json()) as PaginatedResult<SearchResultView>;

	return { q, results: page.items, nextCursor: page.nextCursor };
};
