<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
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
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>

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
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
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

	.app-main {
		flex: 1;
		width: 100%;
		max-width: 60rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
</style>
