import { error } from '@sveltejs/kit';
import { API_URL } from '$lib/server/api';
import type { PageServerLoad } from './$types';

interface Author {
	id: string;
	username: string;
}

interface QuestionTag {
	id: string;
	tag: string;
}

interface AnswerItem {
	id: string;
	answer: string;
	created: string;
	author: Author;
	medalAwarders: Author[];
}

interface CommentItem {
	id: string;
	comment: string;
	created: string;
	author: Author;
}

export interface QuestionDetail {
	id: string;
	question: string;
	created: string;
	author: Author;
	tags: QuestionTag[];
	answers: AnswerItem[];
	comments: CommentItem[];
}

export const load: PageServerLoad = async ({ fetch, params }) => {
	const response = await fetch(`${API_URL}/questions/${params.id}`);

	if (response.status === 404) {
		error(404, 'Question not found');
	}

	if (!response.ok) {
		error(response.status, 'Failed to load question');
	}

	const question = (await response.json()) as QuestionDetail;
	return { question };
};
