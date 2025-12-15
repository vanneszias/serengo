<script lang="ts">
	import { Map } from '$lib';
	import { goto } from '$app/navigation';
	import LikeButton from '$lib/components/finds/LikeButton.svelte';
	import VideoPlayer from '$lib/components/media/VideoPlayer.svelte';
	import ProfilePicture from '$lib/components/profile/ProfilePicture.svelte';
	import CommentsList from '$lib/components/finds/CommentsList.svelte';
	import EditFindModal from '$lib/components/finds/EditFindModal.svelte';
	import { Button } from '$lib/components/button';
	import { Edit, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { apiSync } from '$lib/stores/api-sync';

	let { data }: { data: PageData } = $props();

	let currentMediaIndex = $state(0);
	let isPanelVisible = $state(true);
	let showEditModal = $state(false);
	let isDeleting = $state(false);

	const isOwner = $derived(data.user && data.find && data.user.id === data.find.userId);

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
			navigator
				.share({
					title: data.find.title,
					text: data.find.description || `Check out this find: ${data.find.title}`,
					url: url
				})
				.catch((error) => {
					// User cancelled or error occurred
					if (error.name !== 'AbortError') {
						console.error('Error sharing:', error);
					}
				});
		} else {
			// Fallback: Copy to clipboard
			navigator.clipboard
				.writeText(url)
				.then(() => {
					alert('Find URL copied to clipboard!');
				})
				.catch((error) => {
					console.error('Error copying to clipboard:', error);
				});
		}
	}

	function togglePanel() {
		isPanelVisible = !isPanelVisible;
	}

	function handleEdit() {
		showEditModal = true;
	}

	async function handleDelete() {
		if (!data.find) return;

		if (!confirm('Are you sure you want to delete this find? This action cannot be undone.')) {
			return;
		}

		isDeleting = true;
		try {
			await apiSync.deleteFind(data.find.id);

			// Redirect to home page after successful deletion
			goto('/');
		} catch (error) {
			console.error('Error deleting find:', error);
			alert('Failed to delete find. Please try again.');
			isDeleting = false;
		}
	}

	function handleFindUpdated() {
		showEditModal = false;
		// Reload the page to get updated data
		window.location.reload();
	}

	function handleFindDeleted() {
		showEditModal = false;
		goto('/');
	}

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
	<!-- Fullscreen map -->
	<div class="map-section">
		<Map
			autoCenter={true}
			center={[parseFloat(data.find?.longitude || '0'), parseFloat(data.find?.latitude || '0')]}
		/>
	</div>

	<!-- Details panel container -->
	<div class="panel-container">
		<!-- Details panel -->
		<div class="find-details-panel" class:hidden={!isPanelVisible}>
			{#if data.find}
				<div class="panel-content">
					<div class="panel-header">
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
						{#if isOwner}
							<div class="action-buttons-header">
								<Button variant="outline" size="sm" onclick={handleEdit}>
									<Edit size={16} />
									<span>Edit</span>
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onclick={handleDelete}
									disabled={isDeleting}
								>
									<Trash2 size={16} />
									<span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
								</Button>
							</div>
						{/if}
					</div>

					<div class="panel-body">
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
					<a href="/" class="back-button">Back to Home</a>
				</div>
			{/if}
		</div>

		<!-- Toggle button -->
		<button
			class="panel-toggle"
			class:collapsed={!isPanelVisible}
			onclick={togglePanel}
			aria-label="Toggle find details"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				{#if isPanelVisible}
					<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				{:else}
					<path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				{/if}
			</svg>
		</button>
	</div>
</div>

{#if showEditModal && isOwner && data.find}
	<EditFindModal
		isOpen={showEditModal}
		find={{
			id: data.find.id,
			title: data.find.title,
			description: data.find.description || null,
			latitude: data.find.latitude,
			longitude: data.find.longitude,
			locationName: data.find.locationName || null,
			category: data.find.category || null,
			isPublic: data.find.isPublic ?? 1,
			media: data.find.media || []
		}}
		onClose={() => (showEditModal = false)}
		onFindUpdated={handleFindUpdated}
		onFindDeleted={handleFindDeleted}
	/>
{/if}

<style>
	.public-find-page {
		position: relative;
	}

	.map-section {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		overflow: hidden;
	}

	.map-section :global(.map-container) {
		height: 100vh;
		border-radius: 0;
	}

	.map-section :global(.maplibregl-map) {
		border-radius: 0 !important;
		box-shadow: none !important;
	}

	.panel-container {
		display: flex;
		flex-direction: row;
		margin-left: 20px;
		gap: 12px;
	}

	.panel-toggle {
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border: none;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.panel-toggle:hover {
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
	}

	.panel-toggle svg {
		color: #333;
	}

	.find-details-panel {
		width: 40%;
		max-width: 1000px;
		min-width: 500px;
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-sizing: border-box;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
	}

	.find-details-panel.hidden {
		display: none;
		transform: translateX(-100%);
		opacity: 0;
		pointer-events: none;
	}

	.panel-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.panel-header {
		padding: 1.5rem 2rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-buttons-header {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.action-buttons-header :global(button) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
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

	:global(.avatar-fallback) {
		background: hsl(var(--primary));
		color: white;
		font-size: 1rem;
		font-weight: 600;
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

	.panel-body {
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
		max-height: 400px;
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
		background: rgba(255, 255, 255, 0.5);
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
		background: rgba(255, 255, 255, 0.5);
	}

	.error-state {
		padding: 2rem;
		text-align: center;
		background: rgba(255, 255, 255, 0.5);
	}

	.error-state h1 {
		font-family: 'Washington', serif;
		font-size: 2rem;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.error-state p {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--primary) / 0.9);
	}

	@media (max-width: 768px) {
		.panel-container {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			flex-direction: column-reverse;
			align-items: center;
			margin: 0;
		}

		.panel-toggle.collapsed {
			margin: 12px auto;
		}

		.panel-toggle svg {
			transform: rotate(-90deg);
		}

		.find-details-panel {
			width: 100%;
			max-width: 100vw;
			min-width: 0;
			border-radius: 20px 20px 0 0;
			box-sizing: border-box;
		}

		.find-details-panel.hidden {
			display: none;
			transform: translateX(-100%);
			opacity: 0;
			pointer-events: none;
		}

		.panel-header {
			padding: 1rem 1.25rem;
		}

		.find-title {
			font-size: 1.25rem;
		}

		:global(.user-avatar) {
			width: 48px;
			height: 48px;
		}

		.content-section {
			padding: 1rem 1.25rem;
		}

		.map-section :global(.map-container) {
			height: 100vh;
		}
	}

	@media (max-width: 480px) {
		.find-details-panel {
			height: 60vh;
		}

		.panel-header,
		.content-section {
			padding: 1rem;
		}
	}
</style>
