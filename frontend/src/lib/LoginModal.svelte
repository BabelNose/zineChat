<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Modal from './Modal.svelte';

	let {
		open = $bindable(false),
		onSuccess
	}: { open?: boolean; onSuccess?: () => void } = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	function resetError() {
		errorMessage = '';
	}
</script>

<Modal bind:open titleId="login-title" onClose={resetError}>
	<h1 id="login-title">Log in</h1>

	<form
		method="POST"
		action="/login"
		use:enhance={() => {
			submitting = true;
			errorMessage = '';
			return async ({ result }) => {
				submitting = false;
				if (result.type === 'failure') {
					errorMessage = (result.data?.message as string) ?? 'Invalid email or password';
				} else if (result.type === 'success') {
					await invalidateAll();
					open = false;
					resetError();
					onSuccess?.();
				} else if (result.type === 'error') {
					errorMessage = result.error?.message ?? 'Something went wrong';
				}
			};
		}}
	>
		<label>
			Email
			<input type="email" name="email" autocomplete="username" required />
		</label>

		<label>
			Password
			<input type="password" name="password" autocomplete="current-password" required />
		</label>

		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}

		<button type="submit" disabled={submitting}>
			{submitting ? 'Logging in…' : 'Log in'}
		</button>
	</form>
</Modal>

<style>
	h1 {
		margin: 0 0 1.5rem;
		font-size: 1.25rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		color: var(--text);
		font-size: 0.95rem;
	}

	input:focus {
		outline: 2px solid var(--accent-teal);
		outline-offset: 1px;
	}

	.error {
		margin: 0;
		color: #f87171;
		font-size: 0.9rem;
	}

	button[type='submit'] {
		margin-top: 0.25rem;
		padding: 0.65rem 1rem;
		border: none;
		border-radius: 999px;
		background: var(--accent-teal);
		color: #04201c;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
	}

	button[type='submit']:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
