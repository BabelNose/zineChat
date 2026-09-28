<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let {
		open = $bindable(false),
		onSuccess
	}: { open?: boolean; onSuccess?: () => void } = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	function close() {
		open = false;
		errorMessage = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="overlay" role="presentation" onclick={close}>
		<div
			class="modal"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="login-title"
			onclick={(event) => event.stopPropagation()}
		>
			<button type="button" class="close-btn" aria-label="Close" onclick={close}>×</button>

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
							close();
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
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 100;
	}

	.modal {
		position: relative;
		width: 100%;
		max-width: 22rem;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.close-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		border-radius: 999px;
	}

	.close-btn:hover {
		background: var(--bg-card);
		color: var(--text);
	}

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
