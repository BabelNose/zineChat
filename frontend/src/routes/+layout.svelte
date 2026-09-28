<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import LoginModal from '$lib/LoginModal.svelte';
	import RegisterModal from '$lib/RegisterModal.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	let showLoginModal = $state(false);
	let showRegisterModal = $state(false);

	function initial(name: string) {
		return name.trim().charAt(0).toUpperCase();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<a class="brand" href="/">
			<span class="brand-mark">z</span>
			<span class="brand-name">zine<span class="accent">chat</span></span>
		</a>

		<div class="searchbar">
			<svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
				<path d="M20 20L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<input
				class="search-input"
				type="search"
				placeholder="Search questions…"
				aria-label="Search questions"
				disabled
			/>
		</div>

		<div class="auth-area">
			{#if data.user}
				<div class="user-chip">
					<span class="avatar">{initial(data.user.username)}</span>
					<span class="username">{data.user.username}</span>
				</div>
				<form method="POST" action="/logout">
					<button type="submit" class="logout-btn">Log out</button>
				</form>
			{:else}
				<button type="button" class="login-btn" onclick={() => (showLoginModal = true)}>
					Log in
				</button>
			{/if}
		</div>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>

<LoginModal
	bind:open={showLoginModal}
	onSwitchToRegister={() => {
		showLoginModal = false;
		showRegisterModal = true;
	}}
/>
<RegisterModal
	bind:open={showRegisterModal}
	onSwitchToLogin={() => {
		showRegisterModal = false;
		showLoginModal = true;
	}}
/>

<style>
	:global(:root) {
		--bg: #0b0d13;
		--bg-elevated: #131722;
		--bg-card: #161a24;
		--border: #232838;
		--text: #e8eaf0;
		--text-muted: #9aa3b5;
		--accent-teal: #2dd4bf;
		--accent-purple: #8b7cf6;
		--tag-bg: rgba(45, 212, 191, 0.1);
		--tag-border: rgba(45, 212, 191, 0.35);
		--tag-text: #5eead4;
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--text);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-wrap: wrap;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		flex-shrink: 0;
	}
	.brand-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		border: 1px solid var(--tag-border);
		color: var(--accent-teal);
		font-weight: 700;
		font-size: 1.1rem;
	}
	.brand-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
	}
	.brand-name .accent {
		color: var(--accent-purple);
	}

	.searchbar {
		flex: 1;
		min-width: 16rem;
		max-width: 40rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 1rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--bg-card);
	}
	.search-icon {
		width: 1.1rem;
		height: 1.1rem;
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--text);
		font-size: 0.95rem;
		outline: none;
	}
	.search-input::placeholder {
		color: var(--text-muted);
	}
	.search-input:disabled {
		cursor: not-allowed;
	}

	.auth-area {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-left: auto;
		flex-shrink: 0;
	}

	.login-btn {
		padding: 0.55rem 1.1rem;
		border: 1px solid var(--tag-border);
		border-radius: 999px;
		background: transparent;
		color: var(--accent-teal);
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}
	.login-btn:hover {
		background: var(--tag-bg);
	}

	.user-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: var(--tag-bg);
		border: 1px solid var(--tag-border);
		color: var(--tag-text);
		font-weight: 700;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.username {
		color: var(--text);
		font-weight: 600;
		font-size: 0.9rem;
	}

	.logout-btn {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
	}
	.logout-btn:hover {
		background: var(--bg-card);
		color: var(--text);
	}

	.app-main {
		flex: 1;
		width: 100%;
		max-width: 60rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
</style>
