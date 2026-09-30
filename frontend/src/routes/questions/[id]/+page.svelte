<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { openLoginModal } from '$lib/authModal.svelte';
	import type { PageData } from './$types';

	const MIN_ANSWER_LENGTH = 50;

	let { data }: { data: PageData } = $props();

	let commentsOpen = $state(false);
	let showAnswerForm = $state(false);
	let answerText = $state('');
	let answerSubmitting = $state(false);
	let answerError = $state('');

	let commentText = $state('');
	let commentSubmitting = $state(false);
	let commentError = $state('');

	const question = $derived(data.question);

	function openAnswerForm() {
		if (!data.user) {
			openLoginModal(() => (showAnswerForm = true));
			return;
		}
		showAnswerForm = true;
	}

	function cancelAnswer() {
		showAnswerForm = false;
		answerText = '';
		answerError = '';
	}

	const submitAnswer: SubmitFunction = (input) => {
		if (answerText.trim().length < MIN_ANSWER_LENGTH) {
			answerError = `Answer must be at least ${MIN_ANSWER_LENGTH} characters long.`;
			input.cancel();
			return;
		}

		answerSubmitting = true;
		answerError = '';

		return async ({ result }) => {
			answerSubmitting = false;
			if (result.type === 'failure') {
				answerError = (result.data?.message as string) ?? 'Something went wrong. Please try again.';
			} else if (result.type === 'success') {
				answerText = '';
				showAnswerForm = false;
				answerError = '';
				await invalidateAll();
			} else if (result.type === 'error') {
				answerError = result.error?.message ?? 'Something went wrong';
			}
		};
	};

	const submitComment: SubmitFunction = (input) => {
		if (!data.user) {
			openLoginModal();
			input.cancel();
			return;
		}

		commentSubmitting = true;
		commentError = '';

		return async ({ result }) => {
			commentSubmitting = false;
			if (result.type === 'failure') {
				commentError = (result.data?.message as string) ?? 'Something went wrong. Please try again.';
			} else if (result.type === 'success') {
				commentText = '';
				commentError = '';
				await invalidateAll();
			} else if (result.type === 'error') {
				commentError = result.error?.message ?? 'Something went wrong';
			}
		};
	};

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatRelative(iso: string): string {
		const diffMs = Date.now() - new Date(iso).getTime();
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
		const diffHour = Math.floor(diffMin / 60);
		if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
		const diffDay = Math.floor(diffHour / 24);
		return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
	}

	function initial(username: string): string {
		return username.charAt(0).toUpperCase();
	}
</script>

<svelte:head>
	<title>{question.question} · zinechat</title>
</svelte:head>

<div class="question-page">
	<header class="question-header">
		<h1>{question.question}</h1>

		{#if question.tags.length > 0}
			<div class="tags">
				{#each question.tags as tag (tag.id)}
					<span class="tag">#{tag.tag}</span>
				{/each}
			</div>
		{/if}

		<p class="meta">
			Asked by <span class="author">@{question.author.username}</span>
			· {formatRelative(question.created)}
		</p>
	</header>

	<section class="answers-section">
		<div class="answers-header">
			<h2>Community Answers ({question.answers.length})</h2>
			<button class="answer-btn" type="button" onclick={openAnswerForm}>
				+ Answer Question
			</button>
		</div>

		{#if showAnswerForm}
			<form class="answer-composer" method="POST" action="?/postAnswer" use:enhance={submitAnswer}>
				<textarea
					class="answer-textarea"
					name="answer"
					rows="5"
					placeholder="Share your knowledge… (minimum {MIN_ANSWER_LENGTH} characters)"
					bind:value={answerText}
					disabled={answerSubmitting}
				></textarea>

				{#if answerError}
					<p class="field-error" role="alert">{answerError}</p>
				{/if}

				<div class="answer-composer-actions">
					<button type="button" class="cancel-btn" onclick={cancelAnswer} disabled={answerSubmitting}>
						Cancel
					</button>
					<button type="submit" class="post-btn" disabled={answerSubmitting}>
						{answerSubmitting ? 'Posting…' : 'Post'}
					</button>
				</div>
			</form>
		{/if}

		{#if question.answers.length === 0}
			<p class="empty">No answers yet. Be the first to help out.</p>
		{:else}
			<ul class="answer-list">
				{#each question.answers as a (a.id)}
					<li class="answer-card">
						<div class="answer-card-header">
							<div class="avatar">{initial(a.author.username)}</div>
							<div class="answer-author-block">
								<span class="answer-author-name">@{a.author.username}</span>
								<span class="answer-date">Answered {formatDate(a.created)}</span>
							</div>
							{#if a.medalAwarders.length > 0}
								<span class="medal-badge"
									>{a.medalAwarders.length} medal{a.medalAwarders.length === 1 ? '' : 's'}</span
								>
							{/if}
						</div>
						<p class="answer-text">{a.answer}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<footer class="comments-footer" class:open={commentsOpen}>
	<div class="comments-inner">
		<button
			class="comments-toggle"
			type="button"
			aria-expanded={commentsOpen}
			onclick={() => (commentsOpen = !commentsOpen)}
		>
			<svg class="comments-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M4 4h16v12H7l-3 3V4z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"
				/>
			</svg>
			<span>Comments &amp; Discussion ({question.comments.length})</span>
			<svg
				class="chevron"
				class:flipped={commentsOpen}
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="M6 9l6 6 6-6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		{#if commentsOpen}
			<div class="comments-body">
				{#if question.comments.length === 0}
					<p class="empty">No comments yet.</p>
				{:else}
					<ul class="comment-list">
						{#each question.comments as c (c.id)}
							<li class="comment-item">
								<div class="avatar small">{initial(c.author.username)}</div>
								<div class="comment-content">
									<p class="comment-meta">
										<span class="comment-author">@{c.author.username}</span>
										· {formatRelative(c.created)}
									</p>
									<p class="comment-text">{c.comment}</p>
								</div>
							</li>
						{/each}
					</ul>
				{/if}

				{#if commentError}
					<p class="field-error" role="alert">{commentError}</p>
				{/if}

				<form class="composer" method="POST" action="?/postComment" use:enhance={submitComment}>
					<input
						class="composer-input"
						type="text"
						name="comment"
						placeholder="Write a comment… (post as many as you want)"
						bind:value={commentText}
						disabled={commentSubmitting}
					/>
					<button
						class="composer-send"
						type="submit"
						disabled={commentSubmitting || !commentText.trim()}
						aria-label="Post comment"
					>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M4 12l16-8-6 16-2-7-8-1z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</form>
			</div>
		{/if}
	</div>
</footer>

<style>
	.question-page {
		padding-bottom: 4.5rem;
	}

	.question-header h1 {
		margin: 0 0 0.75rem;
		font-size: 1.5rem;
		line-height: 1.3;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
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
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.author {
		color: var(--accent-purple);
	}

	.empty {
		color: var(--text-muted);
	}

	.answers-section {
		margin-top: 2rem;
	}

	.answers-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.answers-header h2 {
		margin: 0;
		font-size: 1rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.answer-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		border: 1px solid var(--tag-border);
		background: var(--tag-bg);
		color: var(--accent-teal);
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.answer-btn:hover {
		background: rgba(45, 212, 191, 0.18);
	}

	.answer-composer {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 1.25rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--bg-card);
	}

	.answer-textarea {
		width: 100%;
		resize: vertical;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-elevated);
		color: var(--text);
		font-family: inherit;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.answer-textarea:focus {
		outline: 2px solid var(--accent-teal);
		outline-offset: 1px;
	}

	.answer-textarea:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.field-error {
		margin: 0;
		color: #f87171;
		font-size: 0.85rem;
	}

	.answer-composer-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
	}

	.cancel-btn {
		padding: 0.55rem 1rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: transparent;
		color: var(--text-muted);
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: var(--bg-elevated);
		color: var(--text);
	}

	.cancel-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.post-btn {
		padding: 0.55rem 1.25rem;
		border: none;
		border-radius: 999px;
		background: var(--accent-teal);
		color: #04201c;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.post-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.answer-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.answer-card {
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--bg-card);
		padding: 1.25rem 1.5rem;
	}

	.answer-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.avatar {
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--accent-teal);
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar.small {
		width: 1.75rem;
		height: 1.75rem;
		font-size: 0.85rem;
	}

	.answer-author-block {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.answer-author-name {
		font-weight: 600;
		color: var(--text);
	}

	.answer-date {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.medal-badge {
		flex-shrink: 0;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		background: rgba(245, 179, 66, 0.12);
		border: 1px solid rgba(245, 179, 66, 0.35);
		color: #f5b942;
	}

	.answer-text {
		margin: 0;
		line-height: 1.6;
		color: var(--text);
		white-space: pre-wrap;
	}

	.comments-footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		background: var(--bg-elevated);
		border-top: 1px solid var(--border);
	}

	.comments-inner {
		max-width: 60rem;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.comments-toggle {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		border: none;
		background: transparent;
		color: var(--text);
		font-size: 0.95rem;
		font-weight: 600;
		padding: 1rem 0;
		cursor: pointer;
		text-align: left;
	}

	.comments-icon {
		width: 1.1rem;
		height: 1.1rem;
		color: var(--accent-purple);
		flex-shrink: 0;
	}

	.comments-toggle span {
		flex: 1;
	}

	.chevron {
		width: 1.1rem;
		height: 1.1rem;
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.chevron.flipped {
		transform: rotate(180deg);
	}

	.comments-body {
		display: flex;
		flex-direction: column;
		padding-bottom: 1rem;
		border-top: 1px solid var(--border);
	}

	.comment-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 40vh;
		overflow-y: auto;
		padding-top: 1rem;
	}

	.comment-item {
		display: flex;
		gap: 0.75rem;
	}

	.comment-content {
		flex: 1;
		min-width: 0;
	}

	.comment-meta {
		margin: 0 0 0.2rem;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.comment-author {
		color: var(--accent-purple);
		font-weight: 600;
	}

	.comment-text {
		margin: 0;
		line-height: 1.5;
		color: var(--text);
	}

	.composer {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 1rem;
		padding: 0.6rem 1rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--bg-card);
	}

	.composer-input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--text);
		font-size: 0.9rem;
		outline: none;
	}

	.composer-input::placeholder {
		color: var(--text-muted);
	}

	.composer-input:disabled {
		cursor: not-allowed;
	}

	.composer-send {
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		border: none;
		background: var(--accent-purple);
		color: var(--bg);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.composer-send:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.composer-send svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	@media (max-width: 32rem) {
		.answers-header {
			align-items: flex-start;
		}
	}
</style>
