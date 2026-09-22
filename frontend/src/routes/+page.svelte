<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Questions · zinechat</title>
</svelte:head>

<section class="questions">
	<h1>Questions</h1>

	{#if data.questions.length === 0}
		<p class="empty">No questions yet.</p>
	{:else}
		<ul class="question-list">
			{#each data.questions as q (q.id)}
				<li class="question-card">
					<a class="question-link" href={`/questions/${q.id}`}>
						<h2>{q.question}</h2>
					</a>

					{#if q.tags.length > 0}
						<div class="tags">
							{#each q.tags as tag (tag.id)}
								<span class="tag">#{tag.tag}</span>
							{/each}
						</div>
					{/if}

					<p class="meta">
						Asked by <span class="author">@{q.author.username}</span>
						· {formatDate(q.created)}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.questions h1 {
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
	}

	.empty {
		color: var(--text-muted);
	}

	.question-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.question-card {
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--bg-card);
		padding: 1.25rem 1.5rem;
	}

	.question-link {
		text-decoration: none;
		color: inherit;
	}

	.question-link h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text);
	}

	.question-link:hover h2 {
		color: var(--accent-teal);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.tag {
		font-size: 0.8rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: var(--tag-bg);
		border: 1px solid var(--tag-border);
		color: var(--tag-text);
	}

	.meta {
		margin: 0.75rem 0 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.author {
		color: var(--accent-purple);
	}
</style>
