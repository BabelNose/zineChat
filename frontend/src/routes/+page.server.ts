import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const DEFAULT_API_URL = 'http://localhost:4000';

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
	const apiUrl = env.API_URL ?? DEFAULT_API_URL;
	const response = await fetch(`${apiUrl}/questions`);

	if (!response.ok) {
		return { questions: [] as QuestionListItem[] };
	}

	const result = (await response.json()) as PaginatedResult<QuestionListItem>;
	return { questions: result.items };
};
