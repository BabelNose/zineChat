import { env } from '$env/dynamic/private';

const DEFAULT_API_URL = 'http://localhost:4000';

export const API_URL = env.API_URL ?? DEFAULT_API_URL;

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export async function extractErrorMessage(
	response: Response,
	fallback: string = DEFAULT_ERROR_MESSAGE
): Promise<string> {
	const body = await response.json().catch(() => null);
	const rawMessage = body?.message;

	if (Array.isArray(rawMessage)) {
		return rawMessage.join(', ');
	}
	if (typeof rawMessage === 'string') {
		return rawMessage;
	}
	return fallback;
}
