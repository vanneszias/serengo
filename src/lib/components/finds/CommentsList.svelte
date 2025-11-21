<script lang="ts">
	import Comment from './Comment.svelte';
	import CommentForm from './CommentForm.svelte';
	import { Skeleton } from '$lib/components/skeleton';
	import { apiSync } from '$lib/stores/api-sync';
	import { onMount } from 'svelte';

	interface CommentsListProps {
		findId: string;
		currentUserId?: string;
		collapsed?: boolean;
		maxComments?: number;
		showCommentForm?: boolean;
		isScrollable?: boolean;
	}

	let {
		findId,
		currentUserId,
		collapsed = true,
		maxComments,
		showCommentForm = true,
		isScrollable = false
	}: CommentsListProps = $props();

	let isExpanded = $state(!collapsed);
	let hasLoadedComments = $state(false);

	const commentsState = apiSync.subscribeFindComments(findId);

	onMount(() => {
		if (isExpanded && !hasLoadedComments) {
			loadComments();
		}
	});

	async function loadComments() {
		if (hasLoadedComments) return;

		hasLoadedComments = true;
		await apiSync.loadComments(findId);
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
		if (isExpanded && !hasLoadedComments) {
			loadComments();
		}
	}

	async function handleAddComment(content: string) {
		await apiSync.addComment(findId, content);
	}

	async function handleDeleteComment(commentId: string) {
		await apiSync.deleteComment(commentId, findId);
	}

	function canDeleteComment(comment: { user: { id: string } }): boolean {
		return Boolean(
			currentUserId && (comment.user.id === currentUserId || comment.user.id === 'current-user')
		);
	}
</script>

{#snippet loadingSkeleton()}
	<div class="loading-skeleton">
		{#each Array(3) as _, index (index)}
			<div class="comment-skeleton">
				<Skeleton class="avatar-skeleton" />
				<div class="content-skeleton">
					<Skeleton class="header-skeleton" />
					<Skeleton class="text-skeleton" />
				</div>
			</div>
		{/each}
	</div>
{/snippet}

<div class="comments-list">
	{#if collapsed}
		<button class="toggle-button" onclick={toggleExpanded}>
			{#if isExpanded}
				Hide comments ({$commentsState.commentCount})
			{:else if $commentsState.commentCount > 0}
				View comments ({$commentsState.commentCount})
			{:else}
				Add comment
			{/if}
		</button>
	{/if}

	{#if isExpanded}
		<div class="comments-container">
			{#if $commentsState.isLoading && !hasLoadedComments}
				{@render loadingSkeleton()}
			{:else if $commentsState.error}
				<div class="error-message">
					Failed to load comments.
					<button class="retry-button" onclick={loadComments}> Try again </button>
				</div>
			{:else}
				<div class="comments" class:scrollable={isScrollable}>
					{#each maxComments ? $commentsState.comments.slice(0, maxComments) : $commentsState.comments as comment (comment.id)}
						<Comment
							{comment}
							showDeleteButton={canDeleteComment(comment)}
							onDelete={handleDeleteComment}
						/>
					{:else}
						<div class="no-comments">No comments yet. Be the first to comment!</div>
					{/each}
					{#if maxComments && $commentsState.comments.length > maxComments}
						<div class="see-more">
							<div class="see-more-text">
								+{$commentsState.comments.length - maxComments} more comments
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if showCommentForm}
				<CommentForm onSubmit={handleAddComment} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.comments-list {
		width: 100%;
	}

	.toggle-button {
		background: none;
		border: none;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.5rem 0;
		transition: color 0.2s ease;
	}

	.toggle-button:hover {
		color: hsl(var(--foreground));
	}

	.comments-container {
		border-top: 1px solid hsl(var(--border));
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.comments {
		padding: 0.75rem 0;
	}

	.comments.scrollable {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1rem;
		min-height: 0;
	}

	.see-more {
		padding: 0.5rem 0;
		border-top: 1px solid hsl(var(--border));
		margin-top: 0.5rem;
	}

	.see-more-text {
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		font-style: italic;
	}

	.no-comments {
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		padding: 1.5rem 0;
		font-style: italic;
	}

	.error-message {
		text-align: center;
		color: hsl(var(--destructive));
		font-size: 0.875rem;
		padding: 1rem 0;
	}

	.retry-button {
		background: none;
		border: none;
		color: hsl(var(--primary));
		text-decoration: underline;
		cursor: pointer;
		font-size: inherit;
	}

	.retry-button:hover {
		color: hsl(var(--primary) / 0.8);
	}

	.loading-skeleton {
		padding: 0.75rem 0;
	}

	.comment-skeleton {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 0;
	}

	:global(.avatar-skeleton) {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}

	.content-skeleton {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.header-skeleton) {
		width: 120px;
		height: 16px;
	}

	:global(.text-skeleton) {
		width: 80%;
		height: 14px;
	}
</style>
