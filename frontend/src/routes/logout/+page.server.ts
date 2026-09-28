import { redirect } from '@sveltejs/kit';
import { API_URL } from '$lib/server/api';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, API_SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ locals, cookies, fetch }) => {
		const { accessToken, sessionCookie } = locals.auth;

		if (accessToken && sessionCookie) {
			try {
				await fetch(`${API_URL}/auth/logout`, {
					method: 'POST',
					headers: { authorization: `Bearer ${accessToken}`, cookie: sessionCookie }
				});
			} catch {
				// best-effort: still clear local cookies below even if the API call fails
			}
		}

		cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
		cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/' });
		cookies.delete(API_SESSION_COOKIE, { path: '/' });

		redirect(303, '/');
	}
};
