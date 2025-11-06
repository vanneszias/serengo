<script lang="ts">
	import { Button } from '$lib/components/button';
	import ProfilePicture from '$lib/components/ProfilePicture.svelte';
	import { Trash2 } from '@lucide/svelte';
	import type { CommentState } from '$lib/stores/api-sync';

	interface CommentProps {
		comment: CommentState;
		showDeleteButton?: boolean;
		onDelete?: (commentId: string) => void;
	}

	let { comment, showDeleteButton = false, onDelete }: CommentProps = $props();

	function handleDelete() {
		if (onDelete) {
			onDelete(comment.id);
		}
	}

	function formatDate(date: Date | string): string {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		const now = new Date();
		const diff = now.getTime() - dateObj.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) {
			return 'just now';
		} else if (minutes < 60) {
			return `${minutes}m`;
		} else if (hours < 24) {
			return `${hours}h`;
		} else if (days < 7) {
			return `${days}d`;
		} else {
			return dateObj.toLocaleDateString();
		}
	}
</script>

<div class="comment">
	<div class="comment-avatar">
		<ProfilePicture
			username={comment.user.username}
			profilePictureUrl={comment.user.profilePictureUrl}
			class="avatar-small"
		/>
	</div>

	<div class="comment-content">
		<div class="comment-header">
			<span class="comment-username">@{comment.user.username}</span>
			<span class="comment-time">{formatDate(comment.createdAt)}</span>
		</div>

		<div class="comment-text">
			{comment.content}
		</div>
	</div>

	{#if showDeleteButton}
		<div class="comment-actions">
			<Button variant="ghost" size="sm" class="delete-button" onclick={handleDelete}>
				<Trash2 size={14} />
			</Button>
		</div>
	{/if}
</div>

<style>
	.comment {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.comment:last-child {
		border-bottom: none;
	}

	.comment-avatar {
		flex-shrink: 0;
	}

	:global(.avatar-small) {
		width: 32px;
		height: 32px;
	}

	.comment-content {
		flex: 1;
		min-width: 0;
	}

	.comment-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.comment-username {
		font-weight: 600;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	.comment-time {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.comment-text {
		font-size: 0.875rem;
		line-height: 1.4;
		color: hsl(var(--foreground));
		word-wrap: break-word;
	}

	.comment-actions {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
		padding-top: 0.25rem;
	}

	:global(.delete-button) {
		color: hsl(var(--muted-foreground));
		padding: 0.25rem;
		height: auto;
		min-height: 0;
	}

	:global(.delete-button:hover) {
		color: hsl(var(--destructive));
		background: hsl(var(--destructive) / 0.1);
	}
</style>
