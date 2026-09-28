import { API_URL } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

export interface CurrentUser {
	id: string;
	username: string;
	email: string;
}

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	const { accessToken, sessionCookie } = locals.auth;

	if (!accessToken || !sessionCookie) {
		return { user: null };
	}

	const response = await fetch(`${API_URL}/profile`, {
		headers: {
			authorization: `Bearer ${accessToken}`,
			cookie: sessionCookie
		}
	});

	if (!response.ok) {
		return { user: null };
	}

	const user = (await response.json()) as CurrentUser | null;
	return { user };
};
