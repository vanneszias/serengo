<script lang="ts">
	import { Map } from '$lib';
	import LikeButton from '$lib/components/finds/LikeButton.svelte';
	import VideoPlayer from '$lib/components/media/VideoPlayer.svelte';
	import ProfilePicture from '$lib/components/profile/ProfilePicture.svelte';
	import CommentsList from '$lib/components/finds/CommentsList.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let currentMediaIndex = $state(0);

	function nextMedia() {
		if (!data.find?.media) return;
		currentMediaIndex = (currentMediaIndex + 1) % data.find.media.length;
	}

	function prevMedia() {
		if (!data.find?.media) return;
		currentMediaIndex =
			currentMediaIndex === 0 ? data.find.media.length - 1 : currentMediaIndex - 1;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getDirections() {
		if (!data.find) return;

		const lat = parseFloat(data.find.latitude);
		const lng = parseFloat(data.find.longitude);
		const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
		window.open(url, '_blank');
	}

	function shareFindUrl() {
		if (!data.find) return;

		const url = `${window.location.origin}/finds/${data.find.id}`;

		if (navigator.share) {
			navigator.share({
				title: data.find.title,
				text: data.find.description || `Check out this find: ${data.find.title}`,
				url: url
			});
		} else {
			navigator.clipboard.writeText(url);
			alert('Find URL copied to clipboard!');
		}
	}

	// Create the map find format
	let mapFinds = $derived(
		data.find
			? [
					{
						id: data.find.id,
						title: data.find.title,
						description: data.find.description,
						latitude: data.find.latitude,
						longitude: data.find.longitude,
						locationName: data.find.locationName,
						category: data.find.category,
						isPublic: data.find.isPublic,
						createdAt: new Date(data.find.createdAt),
						userId: data.find.userId,
						user: {
							id: data.find.userId,
							username: data.find.username,
							profilePictureUrl: data.find.profilePictureUrl
						},
						likeCount: data.find.likeCount,
						isLiked: data.find.isLikedByUser,
						media: data.find.media?.map(
							(m: { type: string; url: string; thumbnailUrl: string | null }) => ({
								type: m.type,
								url: m.url,
								thumbnailUrl: m.thumbnailUrl || m.url
							})
						)
					}
				]
			: []
	);

	// Get first media for OG image
	let ogImage = $derived(data.find?.media?.[0]?.url || '');
</script>

<svelte:head>
	<title>{data.find ? `${data.find.title} - Serengo` : 'Find - Serengo'}</title>
	<meta
		name="description"
		content={data.find?.description ||
			`Check out this find on Serengo: ${data.find?.title || 'Unknown'}`}
	/>
	<meta
		property="og:title"
		content={data.find ? `${data.find.title} - Serengo` : 'Find - Serengo'}
	/>
	<meta
		property="og:description"
		content={data.find?.description ||
			`Check out this find on Serengo: ${data.find?.title || 'Unknown'}`}
	/>
	<meta property="og:type" content="article" />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content={data.find ? `${data.find.title} - Serengo` : 'Find - Serengo'}
	/>
	<meta
		name="twitter:description"
		content={data.find?.description ||
			`Check out this find on Serengo: ${data.find?.title || 'Unknown'}`}
	/>
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>

<div class="public-find-page">
	<div class="map-section">
		<Map
			autoCenter={true}
			center={[parseFloat(data.find?.longitude || '0'), parseFloat(data.find?.latitude || '0')]}
			finds={mapFinds}
			onFindClick={() => {}}
		/>
	</div>

	<div class="find-details">
		{#if data.find}
			<div class="details-content">
				<div class="details-header">
					<div class="user-section">
						<ProfilePicture
							username={data.find.username}
							profilePictureUrl={data.find.profilePictureUrl}
							class="user-avatar"
						/>
						<div class="user-info">
							<h1 class="find-title">{data.find.title}</h1>
							<div class="find-meta">
								<span class="username">@{data.find.username}</span>
								<span class="separator">•</span>
								<span class="date">{formatDate(data.find.createdAt)}</span>
								{#if data.find.category}
									<span class="separator">•</span>
									<span class="category">{data.find.category}</span>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<div class="details-body">
					{#if data.find.media && data.find.media.length > 0}
						<div class="media-container">
							<div class="media-viewer">
								{#if data.find.media[currentMediaIndex].type === 'photo'}
									<img
										src={data.find.media[currentMediaIndex].url}
										alt={data.find.title}
										class="media-image"
									/>
								{:else}
									<VideoPlayer
										src={data.find.media[currentMediaIndex].url}
										poster={data.find.media[currentMediaIndex].thumbnailUrl}
										class="media-video"
									/>
								{/if}

								{#if data.find.media.length > 1}
									<button class="media-nav prev" onclick={prevMedia} aria-label="Previous media">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
											<path
												d="M15 18L9 12L15 6"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</button>
									<button class="media-nav next" onclick={nextMedia} aria-label="Next media">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
											<path
												d="M9 18L15 12L9 6"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</button>
								{/if}
							</div>

							{#if data.find.media.length > 1}
								<div class="media-indicators">
									{#each data.find.media as _, index (index)}
										<button
											class="indicator"
											class:active={index === currentMediaIndex}
											onclick={() => (currentMediaIndex = index)}
											aria-label={`View media ${index + 1}`}
										></button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<div class="content-section">
						{#if data.find.description}
							<p class="description">{data.find.description}</p>
						{/if}

						{#if data.find.locationName}
							<div class="location-info">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path
										d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 12 1A9 9 0 0 1 21 10Z"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
								</svg>
								<span>{data.find.locationName}</span>
							</div>
						{/if}

						<div class="actions">
							<LikeButton
								findId={data.find.id}
								isLiked={data.find.isLikedByUser || false}
								likeCount={data.find.likeCount || 0}
								size="default"
								class="like-action"
							/>

							<button class="action-button primary" onclick={getDirections}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path
										d="M3 11L22 2L13 21L11 13L3 11Z"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Directions
							</button>

							<button class="action-button secondary" onclick={shareFindUrl}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path
										d="M4 12V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V12"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<polyline
										points="16,6 12,2 8,6"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Share
							</button>
						</div>
					</div>

					<div class="comments-section">
						<CommentsList
							findId={data.find.id}
							currentUserId={data.user?.id}
							collapsed={false}
							isScrollable={true}
							showCommentForm={data.user ? true : false}
						/>
					</div>
				</div>
			</div>
		{:else}
			<div class="error-state">
				<h1>Find not found</h1>
				<p>This find does not exist or is private.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.public-find-page {
		display: flex;
		flex-direction: row;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	.map-section {
		flex: 1;
		height: 100vh;
		overflow: hidden;
	}

	.map-section :global(.map-container) {
		height: 100vh;
		border-radius: 0;
	}

	.find-details {
		width: 45%;
		max-width: 650px;
		min-width: 400px;
		height: 100vh;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.details-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.details-header {
		padding: 1.5rem 2rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.8);
		flex-shrink: 0;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	:global(.user-avatar) {
		width: 56px;
		height: 56px;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.find-title {
		font-family: 'Washington', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
		line-height: 1.3;
	}

	.find-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		flex-wrap: wrap;
	}

	.username {
		font-weight: 500;
		color: hsl(var(--primary));
	}

	.separator {
		color: hsl(var(--muted-foreground));
		opacity: 0.5;
	}

	.category {
		background: hsl(var(--muted));
		padding: 0.125rem 0.5rem;
		border-radius: 8px;
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.details-body {
		display: flex;
		flex-direction: column;
		overflow: auto;
		flex: 1;
	}

	.media-container {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.media-viewer {
		position: relative;
		width: 100%;
		max-height: 450px;
		background: hsl(var(--muted));
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.media-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	:global(.media-video) {
		width: 100%;
		height: 100%;
	}

	.media-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
		z-index: 10;
	}

	.media-nav:hover {
		background: rgba(0, 0, 0, 0.8);
	}

	.media-nav.prev {
		left: 1rem;
	}

	.media-nav.next {
		right: 1rem;
	}

	.media-indicators {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem 0;
		flex-shrink: 0;
	}

	.indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: none;
		background: hsl(var(--muted-foreground));
		opacity: 0.3;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.indicator.active {
		background: hsl(var(--primary));
		opacity: 1;
		transform: scale(1.2);
	}

	.content-section {
		padding: 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.description {
		font-size: 1rem;
		line-height: 1.6;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.location-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding-top: 0.5rem;
	}

	:global(.like-action) {
		flex-shrink: 0;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: center;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.action-button.primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.action-button.primary:hover {
		background: hsl(var(--primary) / 0.9);
	}

	.action-button.secondary {
		background: hsl(var(--secondary));
		color: hsl(var(--secondary-foreground));
	}

	.action-button.secondary:hover {
		background: hsl(var(--secondary) / 0.8);
	}

	.comments-section {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.error-state {
		padding: 2rem;
		text-align: center;
	}

	.error-state h1 {
		font-family: 'Washington', serif;
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 1024px) {
		.public-find-page {
			flex-direction: column;
		}

		.map-section {
			height: 40vh;
		}

		.find-details {
			width: 100%;
			max-width: none;
			min-width: 0;
			height: 60vh;
		}
	}

	@media (max-width: 640px) {
		.details-header,
		.content-section {
			padding: 1rem 1.25rem;
		}

		.find-title {
			font-size: 1.25rem;
		}

		:global(.user-avatar) {
			width: 48px;
			height: 48px;
		}
	}
</style>
