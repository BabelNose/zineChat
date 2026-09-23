import { env } from '$env/dynamic/private';

const DEFAULT_API_URL = 'http://localhost:4000';

export const API_URL = env.API_URL ?? DEFAULT_API_URL;
