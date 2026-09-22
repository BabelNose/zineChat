import type { Handle } from '@sveltejs/kit';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, API_SESSION_COOKIE } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = {
		accessToken: event.cookies.get(ACCESS_TOKEN_COOKIE) ?? null,
		refreshToken: event.cookies.get(REFRESH_TOKEN_COOKIE) ?? null,
		sessionCookie: event.cookies.get(API_SESSION_COOKIE) ?? null
	};

	return resolve(event);
};
