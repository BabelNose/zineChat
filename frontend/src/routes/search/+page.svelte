<script lang="ts">
	import { highlightMatches } from '$lib/searchHighlight';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const typeLabel: Record<string, string> = {
		question: 'Question',
		answer: 'Answer',
		comment: 'Comment'
	};

	function resultHref(resourceType: string, resourceId: string, questionId: string): string {
		return `/questions/${questionId}#${resourceType}-${resourceId}`;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.q ? `Search · ${data.q}` : 'Search'} · zinechat</title>
</svelte:head>

<section class="search-results">
	{#if !data.q}
		<p class="empty">Type something in the search bar to find questions, answers, and comments.</p>
	{:else}
		<h1>Results for &ldquo;{data.q}&rdquo;</h1>

		{#if data.results.length === 0}
			<p class="empty">No results found.</p>
		{:else}
			<ul class="result-list">
				{#each data.results as r (`${r.resourceType}-${r.resourceId}`)}
					<li class="result-card">
						<a class="result-link" href={resultHref(r.resourceType, r.resourceId, r.questionId)}>
							<span class="result-type" data-type={r.resourceType}>{typeLabel[r.resourceType]}</span>
							<p class="result-text">{@html highlightMatches(r.text, data.q)}</p>
						</a>

						{#if r.resourceType !== 'question'}
							<p class="result-context">
								in <span class="question-text">{r.questionText}</span>
							</p>
						{/if}

						<p class="meta">
							<span class="author">@{r.author.username}</span>
							· {formatDate(r.created)}
						</p>
					</li>
				{/each}
			</ul>

			{#if data.nextCursor}
				<a
					class="load-more"
					href={`/search?q=${encodeURIComponent(data.q)}&cursor=${data.nextCursor}`}
				>
					More results →
				</a>
			{/if}
		{/if}
	{/if}
</section>

<style>
	.search-results h1 {
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
	}

	.empty {
		color: var(--text-muted);
	}

	.result-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.result-card {
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--bg-card);
		padding: 1.25rem 1.5rem;
	}

	.result-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.result-type {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		margin-bottom: 0.6rem;
		background: var(--tag-bg);
		border: 1px solid var(--tag-border);
		color: var(--tag-text);
	}

	.result-type[data-type='answer'] {
		background: rgba(139, 124, 246, 0.1);
		border-color: rgba(139, 124, 246, 0.35);
		color: var(--accent-purple);
	}

	.result-type[data-type='comment'] {
		background: rgba(245, 179, 66, 0.1);
		border-color: rgba(245, 179, 66, 0.35);
		color: #f5b942;
	}

	.result-text {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--text);
	}

	.result-link:hover .result-text {
		color: var(--accent-teal);
	}

	.result-text :global(mark) {
		background: rgba(45, 212, 191, 0.3);
		color: var(--text);
		border-radius: 0.2rem;
		padding: 0 0.1rem;
	}

	.result-context {
		margin: 0.6rem 0 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.question-text {
		color: var(--text);
	}

	.meta {
		margin: 0.75rem 0 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.author {
		color: var(--accent-purple);
	}

	.load-more {
		display: inline-block;
		margin-top: 1.5rem;
		color: var(--accent-teal);
		text-decoration: none;
		font-weight: 600;
	}

	.load-more:hover {
		text-decoration: underline;
	}
</style>
