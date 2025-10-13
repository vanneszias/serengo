<script lang="ts">
	import { Button } from '$lib/components/button';
	import { Badge } from '$lib/components/badge';

	interface FindCardProps {
		id: string;
		title: string;
		description?: string;
		category?: string;
		locationName?: string;
		user: {
			username: string;
		};
		media?: Array<{
			type: string;
			url: string;
			thumbnailUrl: string;
		}>;
		onExplore?: (id: string) => void;
	}

	let { id, title, description, category, locationName, user, media, onExplore }: FindCardProps =
		$props();

	function handleExplore() {
		onExplore?.(id);
	}

	function truncateText(text: string, maxLength: number = 120): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
	}
</script>

<div class="find-card">
	<div class="find-card-media">
		{#if media && media.length > 0}
			{#if media[0].type === 'photo'}
				<img
					src={media[0].thumbnailUrl || media[0].url}
					alt={title}
					loading="lazy"
					class="media-image"
				/>
			{:else}
				<video src={media[0].url} poster={media[0].thumbnailUrl} muted class="media-video">
					<track kind="captions" />
				</video>
			{/if}
		{:else}
			<div class="no-media">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

	<div class="find-card-content">
		<div class="find-card-header">
			<h3 class="find-card-title">{title}</h3>
			{#if category}
				<Badge variant="secondary" class="category-badge">
					{category}
				</Badge>
			{/if}
		</div>

		{#if description}
			<p class="find-card-description">
				{truncateText(description)}
			</p>
		{/if}

		<div class="find-card-meta">
			<div class="location-info">
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
						<span class="location-text">{locationName}</span>
					</div>
				{/if}
				<div class="author">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
						<path
							d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
					</svg>
					<span class="author-text">@{user.username}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="find-card-actions">
		<Button variant="default" size="sm" onclick={handleExplore} class="explore-button">
			explore this find
		</Button>
	</div>
</div>

<style>
	.find-card {
		display: flex;
		background: white;
		align-items: flex-start;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.find-card-media {
		flex-shrink: 0;
		width: 120px;
		height: 80px;
		border-radius: 8px;
		overflow: hidden;
	}

	.media-image,
	.media-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-media {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--muted));
	}

	.find-card-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.find-card-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.find-card-title {
		font-family: 'Washington', serif;
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.4;
		color: hsl(var(--foreground));
		margin: 0;
	}

	:global(.category-badge) {
		font-size: 0.75rem;
		height: 1.5rem;
	}

	.find-card-description {
		font-size: 0.875rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.find-card-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.location-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.location,
	.author {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.location-text,
	.author-text {
		font-weight: 500;
	}

	.find-card-actions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	:global(.explore-button) {
		white-space: nowrap;
		font-weight: 500;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.find-card {
			flex-direction: column;
			gap: 0.75rem;
		}

		.find-card-media {
			width: 100%;
			height: 120px;
		}

		.find-card-header {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.find-card-actions {
			align-self: stretch;
		}
	}
</style>
