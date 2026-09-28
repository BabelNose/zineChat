import { invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

export function createAuthFormEnhance(options: {
	setSubmitting: (submitting: boolean) => void;
	setError: (message: string) => void;
	closeModal: () => void;
	onSuccess?: () => void;
}): SubmitFunction {
	const { setSubmitting, setError, closeModal, onSuccess } = options;

	return () => {
		setSubmitting(true);
		setError('');
		return async ({ result }) => {
			setSubmitting(false);
			if (result.type === 'failure') {
				setError((result.data?.message as string) ?? 'Something went wrong. Please try again.');
			} else if (result.type === 'success') {
				await invalidateAll();
				closeModal();
				setError('');
				onSuccess?.();
			} else if (result.type === 'error') {
				setError(result.error?.message ?? 'Something went wrong');
			}
		};
	};
}
