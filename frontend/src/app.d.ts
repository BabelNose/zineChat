// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AuthLocals } from '$lib/server/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: AuthLocals;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
