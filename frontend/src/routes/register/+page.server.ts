import { fail } from '@sveltejs/kit';
import { API_URL, extractErrorMessage } from '$lib/server/api';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');

		if (
			typeof username !== 'string' ||
			!username ||
			typeof email !== 'string' ||
			!email ||
			typeof password !== 'string' ||
			!password
		) {
			return fail(400, { message: 'Username, email, and password are required' });
		}

		const registerResponse = await fetch(`${API_URL}/auth/register`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username, email, password })
		});

		if (!registerResponse.ok) {
			return fail(registerResponse.status, { message: await extractErrorMessage(registerResponse) });
		}

		return { success: true };
	}
};
