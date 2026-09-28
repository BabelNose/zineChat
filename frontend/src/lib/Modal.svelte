<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		titleId,
		maxWidth = '22rem',
		onClose,
		children
	}: {
		open?: boolean;
		titleId?: string;
		maxWidth?: string;
		onClose?: () => void;
		children: Snippet;
	} = $props();

	function close() {
		open = false;
		onClose?.();
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
			aria-labelledby={titleId}
			style:max-width={maxWidth}
			onclick={(event) => event.stopPropagation()}
		>
			<button type="button" class="close-btn" aria-label="Close" onclick={close}>×</button>

			{@render children()}
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
</style>
