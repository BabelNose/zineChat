<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from './Modal.svelte';
	import { createAuthFormEnhance } from './authFormEnhance';

	let {
		open = $bindable(false),
		onSuccess,
		onSwitchToLogin
	}: { open?: boolean; onSuccess?: () => void; onSwitchToLogin?: () => void } = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	function resetError() {
		errorMessage = '';
	}
</script>

<Modal bind:open titleId="register-title" onClose={resetError}>
	<h1 id="register-title">Sign up</h1>

	<form
		method="POST"
		action="/register"
		use:enhance={createAuthFormEnhance({
			setSubmitting: (value) => (submitting = value),
			setError: (value) => (errorMessage = value),
			closeModal: () => (open = false),
			onSuccess
		})}
	>
		<label>
			Username
			<input
				type="text"
				name="username"
				autocomplete="username"
				pattern="[a-zA-Z0-9_\-]+"
				title="Only letters, numbers, hyphens, and underscores"
				required
			/>
		</label>

		<label>
			Email
			<input type="email" name="email" autocomplete="email" required />
		</label>

		<label>
			Password
			<input type="password" name="password" autocomplete="new-password" required />
		</label>

		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}

		<button type="submit" disabled={submitting}>
			{submitting ? 'Signing up…' : 'Sign up'}
		</button>
	</form>

	{#if onSwitchToLogin}
		<p class="switch">
			Already have an account?
			<button
				type="button"
				class="link-btn"
				onclick={() => {
					resetError();
					onSwitchToLogin?.();
				}}
			>
				Log in
			</button>
		</p>
	{/if}
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

	.switch {
		margin: 1.25rem 0 0;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.link-btn {
		border: none;
		background: transparent;
		color: var(--accent-teal);
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		padding: 0;
	}

	.link-btn:hover {
		text-decoration: underline;
	}
</style>
