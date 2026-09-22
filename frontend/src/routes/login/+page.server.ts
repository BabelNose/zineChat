import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, API_SESSION_COOKIE } from '$lib/server/auth';
import type { Actions } from './$types';

const DEFAULT_API_URL = 'http://localhost:4000';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		const apiUrl = env.API_URL ?? DEFAULT_API_URL;
		const response = await fetch(`${apiUrl}/auth/login`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		if (!response.ok) {
			return fail(401, { message: 'Invalid email or password' });
		}

		const { accessToken, refreshToken } = (await response.json()) as {
			accessToken: string;
			refreshToken: string;
		};

		const setCookies = response.headers.getSetCookie?.() ?? [];
		const sessionCookiePair = setCookies[0]?.split(';')[0];

		const cookieOptions = { path: '/', httpOnly: true, sameSite: 'lax' as const };
		cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions);
		cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
		if (sessionCookiePair) {
			cookies.set(API_SESSION_COOKIE, sessionCookiePair, cookieOptions);
		}

		redirect(303, '/');
	}
};
