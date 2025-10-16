<script lang="ts">
	import { Button } from '$lib/components/button';
	import { Badge } from '$lib/components/badge';
	import LikeButton from '$lib/components/LikeButton.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/avatar';
	import { MoreHorizontal, MessageCircle, Share } from '@lucide/svelte';

	interface FindCardProps {
		id: string;
		title: string;
		description?: string;
		category?: string;
		locationName?: string;
		user: {
			username: string;
			profilePictureUrl?: string | null;
		};
		media?: Array<{
			type: string;
			url: string;
			thumbnailUrl: string;
		}>;
		likeCount?: number;
		isLiked?: boolean;
		onExplore?: (id: string) => void;
	}

	let {
		id,
		title,
		description,
		category,
		locationName,
		user,
		media,
		likeCount = 0,
		isLiked = false,
		onExplore
	}: FindCardProps = $props();

	function handleExplore() {
		onExplore?.(id);
	}

	function getUserInitials(username: string): string {
		return username.slice(0, 2).toUpperCase();
	}
</script>

<div class="find-card">
	<!-- Post Header -->
	<div class="post-header">
		<div class="user-info">
			<Avatar class="avatar">
				{#if user.profilePictureUrl}
					<AvatarImage src={user.profilePictureUrl} alt={user.username} />
				{/if}
				<AvatarFallback class="avatar-fallback">
					{getUserInitials(user.username)}
				</AvatarFallback>
			</Avatar>
			<div class="user-details">
				<div class="username">@{user.username}</div>
				{#if locationName}
					<div class="location">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
							<path
								d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 12 1A9 9 0 0 1 21 10Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
						</svg>
						<span>{locationName}</span>
					</div>
				{/if}
			</div>
		</div>
		<Button variant="ghost" size="sm" class="more-button">
			<MoreHorizontal size={16} />
		</Button>
	</div>

	<!-- Post Content -->
	<div class="post-content">
		<div class="content-header">
			<h3 class="post-title">{title}</h3>
			{#if category}
				<Badge variant="secondary" class="category-badge">
					{category}
				</Badge>
			{/if}
		</div>

		{#if description}
			<p class="post-description">{description}</p>
		{/if}
	</div>

	<!-- Media -->
	<div class="post-media">
		{#if media && media.length > 0}
			{#if media[0].type === 'photo'}
				<img
					src={media[0].thumbnailUrl || media[0].url}
					alt={title}
					loading="lazy"
					class="media-image"
				/>
			{:else}
				<VideoPlayer
					src={media[0].url}
					poster={media[0].thumbnailUrl}
					muted={true}
					autoplay={false}
					controls={true}
					class="media-video"
				/>
			{/if}
		{:else}
			<div class="no-media">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
					<path
						d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 12 1A9 9 0 0 1 21 10Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
				</svg>
			</div>
		{/if}
	</div>

	<!-- Post Actions -->
	<div class="post-actions">
		<div class="action-buttons">
			<LikeButton findId={id} {isLiked} {likeCount} size="sm" />
			<Button variant="ghost" size="sm" class="action-button">
				<MessageCircle size={16} />
				<span>comment</span>
			</Button>
			<Button variant="ghost" size="sm" class="action-button">
				<Share size={16} />
				<span>share</span>
			</Button>
		</div>
		<Button variant="outline" size="sm" onclick={handleExplore} class="explore-button">
			explore
		</Button>
	</div>
</div>

<style>
	.find-card {
		background: white;
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 1rem;
		transition: box-shadow 0.2s ease;
	}

	.find-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	/* Post Header */
	.post-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1rem 0.75rem 1rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	:global(.avatar) {
		width: 40px;
		height: 40px;
	}

	:global(.avatar-fallback) {
		background: hsl(var(--primary));
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.username {
		font-weight: 600;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	.location {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	:global(.more-button) {
		color: hsl(var(--muted-foreground));
	}

	/* Post Content */
	.post-content {
		padding: 0 1rem 0.75rem 1rem;
	}

	.content-header {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.post-title {
		font-family: 'Washington', serif;
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.4;
		color: hsl(var(--foreground));
		margin: 0;
		flex: 1;
	}

	:global(.category-badge) {
		font-size: 0.75rem;
		height: 1.5rem;
		flex-shrink: 0;
	}

	.post-description {
		font-size: 0.875rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	/* Media */
	.post-media {
		width: 100%;
		aspect-ratio: 16/10;
		overflow: hidden;
		background: hsl(var(--muted));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.media-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:global(.media-video) {
		width: 100%;
		height: 100%;
	}

	.no-media {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--muted-foreground));
		opacity: 0.5;
	}

	/* Post Actions */
	.post-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem 1rem 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.action-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.action-button) {
		gap: 0.375rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	:global(.action-button:hover) {
		color: hsl(var(--foreground));
	}

	:global(.explore-button) {
		font-weight: 500;
		font-size: 0.875rem;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.post-actions {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.action-buttons {
			justify-content: space-around;
		}

		:global(.explore-button) {
			width: 100%;
		}
	}
</style>
