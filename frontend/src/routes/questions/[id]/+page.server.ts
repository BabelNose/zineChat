import { error, fail } from '@sveltejs/kit';
import { API_URL } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

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

export const actions: Actions = {
	postAnswer: async ({ request, params, locals, fetch }) => {
		const { accessToken, sessionCookie } = locals.auth;

		if (!accessToken || !sessionCookie) {
			return fail(401, { message: 'You must be logged in to answer' });
		}

		const formData = await request.formData();
		const answer = formData.get('answer');

		if (typeof answer !== 'string' || !answer.trim()) {
			return fail(400, { message: 'Answer is required' });
		}

		const response = await fetch(`${API_URL}/questions/${params.id}/answers`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${accessToken}`,
				cookie: sessionCookie
			},
			body: JSON.stringify({ answer })
		});

		if (!response.ok) {
			const errorBody = await response.json().catch(() => null);
			const rawMessage = errorBody?.message;
			const message = Array.isArray(rawMessage)
				? rawMessage.join(', ')
				: typeof rawMessage === 'string'
					? rawMessage
					: 'Something went wrong. Please try again.';
			return fail(response.status, { message });
		}

		return { success: true };
	}
};
