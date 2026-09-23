import { API_URL } from '$lib/server/api';
import type { PageServerLoad } from './$types';

interface QuestionAuthor {
	id: string;
	username: string;
}

interface QuestionTag {
	id: string;
	tag: string;
}

export interface QuestionListItem {
	id: string;
	question: string;
	created: string;
	author: QuestionAuthor;
	tags: QuestionTag[];
}

interface PaginatedResult<T> {
	items: T[];
	nextCursor: string | null;
}

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch(`${API_URL}/questions`);

	if (!response.ok) {
		return { questions: [] as QuestionListItem[] };
	}

	const result = (await response.json()) as PaginatedResult<QuestionListItem>;
	return { questions: result.items };
};
