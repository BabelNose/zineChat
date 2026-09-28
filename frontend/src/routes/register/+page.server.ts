import { fail } from '@sveltejs/kit';
import { API_URL } from '$lib/server/api';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, API_SESSION_COOKIE } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
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
			const errorBody = await registerResponse.json().catch(() => null);
			const rawMessage = errorBody?.message;
			const message = Array.isArray(rawMessage)
				? rawMessage.join(', ')
				: typeof rawMessage === 'string'
					? rawMessage
					: 'Something went wrong. Please try again.';
			return fail(registerResponse.status, { message });
		}

		const loginResponse = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		if (!loginResponse.ok) {
			return { success: true, autoLoginFailed: true };
		}

		const { accessToken, refreshToken } = (await loginResponse.json()) as {
			accessToken: string;
			refreshToken: string;
		};

		const setCookies = loginResponse.headers.getSetCookie?.() ?? [];
		const sessionCookiePair = setCookies[0]?.split(';')[0];

		const cookieOptions = { path: '/', httpOnly: true, sameSite: 'lax' as const };
		cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions);
		cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
		if (sessionCookiePair) {
			cookies.set(API_SESSION_COOKIE, sessionCookiePair, cookieOptions);
		}

		return { success: true };
	}
};
