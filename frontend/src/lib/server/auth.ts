export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Holds the "name=value" pair from the API's Set-Cookie header verbatim, so it can be
// replayed as-is in the Cookie header on future API requests. The API's JWT guards check
// the access/refresh token against what is stored in this session, so it must travel
// alongside the tokens on every authenticated request.
export const API_SESSION_COOKIE = 'api_session';

export type AuthLocals = {
	accessToken: string | null;
	refreshToken: string | null;
	sessionCookie: string | null;
};
