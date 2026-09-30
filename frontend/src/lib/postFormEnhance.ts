import { invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

export function createPostFormEnhance(options: {
	guard?: () => boolean;
	setSubmitting: (submitting: boolean) => void;
	setError: (message: string) => void;
	onSuccess: () => void;
}): SubmitFunction {
	const { guard, setSubmitting, setError, onSuccess } = options;

	return (input) => {
		if (guard?.()) {
			input.cancel();
			return;
		}

		setSubmitting(true);
		setError('');

		return async ({ result }) => {
			setSubmitting(false);
			if (result.type === 'failure') {
				setError((result.data?.message as string) ?? 'Something went wrong. Please try again.');
			} else if (result.type === 'success') {
				setError('');
				onSuccess();
				await invalidateAll();
			} else if (result.type === 'error') {
				setError(result.error?.message ?? 'Something went wrong');
			}
		};
	};
}
