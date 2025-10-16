<script lang="ts">
	import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/sheet';
	import LikeButton from '$lib/components/LikeButton.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/avatar';

	interface Find {
		id: string;
		title: string;
		description?: string;
		latitude: string;
		longitude: string;
		locationName?: string;
		category?: string;
		createdAt: string;
		user: {
			id: string;
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
	}

	interface Props {
		find: Find | null;
		onClose: () => void;
	}

	let { find, onClose }: Props = $props();

	let showModal = $state(true);
	let currentMediaIndex = $state(0);
	let isMobile = $state(false);

	// Detect screen size
	$effect(() => {
		if (typeof window === 'undefined') return;

		const checkIsMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	});

	// Close modal when showModal changes to false
	$effect(() => {
		if (!showModal) {
			onClose();
		}
	});

	function nextMedia() {
		if (!find?.media) return;
		currentMediaIndex = (currentMediaIndex + 1) % find.media.length;
	}

	function prevMedia() {
		if (!find?.media) return;
		currentMediaIndex = currentMediaIndex === 0 ? find.media.length - 1 : currentMediaIndex - 1;
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
		if (!find) return;

		const lat = parseFloat(find.latitude);
		const lng = parseFloat(find.longitude);
		const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
		window.open(url, '_blank');
	}

	function shareFindUrl() {
		if (!find) return;

		const url = `${window.location.origin}/finds/${find.id}`;

		if (navigator.share) {
			navigator.share({
				title: find.title,
				text: find.description || `Check out this find: ${find.title}`,
				url: url
			});
		} else {
			navigator.clipboard.writeText(url);
			alert('Find URL copied to clipboard!');
		}
	}
</script>

{#if find}
	<Sheet open={showModal} onOpenChange={(open) => (showModal = open)}>
		<SheetContent side={isMobile ? 'bottom' : 'right'} class="sheet-content">
			<SheetHeader class="sheet-header">
				<div class="user-section">
					<Avatar class="user-avatar">
						{#if find.user.profilePictureUrl}
							<AvatarImage src={find.user.profilePictureUrl} alt={find.user.username} />
						{/if}
						<AvatarFallback class="avatar-fallback">
							{find.user.username.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div class="user-info">
						<SheetTitle class="find-title">{find.title}</SheetTitle>
						<div class="find-meta">
							<span class="username">@{find.user.username}</span>
							<span class="separator">•</span>
							<span class="date">{formatDate(find.createdAt)}</span>
							{#if find.category}
								<span class="separator">•</span>
								<span class="category">{find.category}</span>
							{/if}
						</div>
					</div>
				</div>
			</SheetHeader>

			<div class="sheet-body">
				{#if find.media && find.media.length > 0}
					<div class="media-container">
						<div class="media-viewer">
							{#if find.media[currentMediaIndex].type === 'photo'}
								<img src={find.media[currentMediaIndex].url} alt={find.title} class="media-image" />
							{:else}
								<VideoPlayer
									src={find.media[currentMediaIndex].url}
									poster={find.media[currentMediaIndex].thumbnailUrl}
									class="media-video"
								/>
							{/if}

							{#if find.media.length > 1}
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

						{#if find.media.length > 1}
							<div class="media-indicators">
								{#each find.media, index (index)}
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
					{#if find.description}
						<p class="description">{find.description}</p>
					{/if}

					{#if find.locationName}
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
							<span>{find.locationName}</span>
						</div>
					{/if}

					<div class="actions">
						<LikeButton
							findId={find.id}
							isLiked={find.isLiked || false}
							likeCount={find.likeCount || 0}
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
			</div>
		</SheetContent>
	</Sheet>
{/if}

<style>
	/* Base styles for sheet content */
	:global(.sheet-content) {
		padding: 0 !important;
	}

	/* Desktop styles (side sheet) */
	@media (min-width: 768px) {
		:global(.sheet-content) {
			width: 80vw !important;
			max-width: 600px !important;
			height: 100vh !important;
			border-radius: 0 !important;
		}
	}

	/* Mobile styles (bottom sheet) */
	@media (max-width: 767px) {
		:global(.sheet-content) {
			height: 80vh !important;
			border-radius: 16px 16px 0 0 !important;
		}
	}

	:global(.sheet-header) {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
		flex-shrink: 0;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	:global(.user-avatar) {
		width: 48px;
		height: 48px;
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

	:global(.find-title) {
		font-family: 'Washington', serif !important;
		font-size: 1.25rem !important;
		font-weight: 600 !important;
		margin: 0 !important;
		color: hsl(var(--foreground)) !important;
		line-height: 1.3 !important;
	}

	.find-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
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

	.sheet-body {
		flex: 1;
		overflow: hidden;
		padding: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.media-container {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.media-viewer {
		position: relative;
		width: 100%;
		background: hsl(var(--muted));
		overflow: hidden;
		flex: 1;
		min-height: 0;
	}

	/* Desktop media viewer - maximize available space */
	@media (min-width: 768px) {
		.sheet-body {
			height: calc(100vh - 140px);
		}

		.media-container {
			flex: 2;
		}

		.content-section {
			flex: 1;
			min-height: 160px;
			max-height: 300px;
		}
	}

	/* Mobile media viewer - maximize available space */
	@media (max-width: 767px) {
		.sheet-body {
			height: calc(80vh - 140px);
		}

		.media-container {
			flex: 2;
		}

		.content-section {
			flex: 1;
			min-height: 140px;
			max-height: 250px;
		}
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
		padding: 1rem 1.5rem 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.description {
		font-size: 1rem;
		line-height: 1.6;
		color: hsl(var(--foreground));
		margin: 0 0 1.25rem 0;
	}

	.location-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-top: auto;
		padding-top: 1rem;
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

	/* Mobile specific adjustments */
	@media (max-width: 640px) {
		:global(.sheet-header) {
			padding: 1rem;
		}

		.user-section {
			gap: 0.5rem;
		}

		:global(.user-avatar) {
			width: 40px;
			height: 40px;
		}

		:global(.find-title) {
			font-size: 1.125rem !important;
		}

		.content-section {
			padding: 1rem;
		}

		.actions {
			flex-direction: column;
			gap: 0.5rem;
		}

		.action-button {
			width: 100%;
		}
	}
</style>
