<script lang="ts">
	import LikeButton from './LikeButton.svelte';
	import VideoPlayer from '../media/VideoPlayer.svelte';
	import ProfilePicture from '../profile/ProfilePicture.svelte';
	import CommentsList from './CommentsList.svelte';

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
		currentUserId?: string;
	}

	let { find, onClose, currentUserId }: Props = $props();

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
			navigator
				.share({
					title: find.title,
					text: find.description || `Check out this find: ${find.title}`,
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
</script>

{#if find}
	<div class="modal-container" class:mobile={isMobile}>
		<div class="modal-content">
			<div class="modal-header">
				<div class="user-section">
					<ProfilePicture
						username={find.user.username}
						profilePictureUrl={find.user.profilePictureUrl}
						class="user-avatar"
					/>
					<div class="user-info">
						<h2 class="find-title">{find.title}</h2>
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
				<button type="button" class="close-button" onclick={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
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

				<div class="comments-section">
					<CommentsList
						findId={find.id}
						{currentUserId}
						collapsed={false}
						isScrollable={true}
						showCommentForm={true}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-container {
		position: fixed;
		top: 80px;
		right: 20px;
		width: fit-content;
		max-width: 600px;
		min-width: 400px;
		max-height: calc(100vh - 100px);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.modal-container.mobile {
		top: auto;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		min-width: 0;
		max-width: none;
		height: auto;
		max-height: calc(90vh - 20px);
		border-radius: 16px 16px 0 0;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
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

	.find-title {
		font-family: 'Washington', serif;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
		line-height: 1.3;
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

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.close-button:hover {
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		overflow: auto;
		padding: 0;
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
		padding: 1rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.5);
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

	.comments-section {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.5);
		max-height: 400px;
		overflow: hidden;
	}

	/* Mobile specific adjustments */
	@media (max-width: 640px) {
		.modal-header {
			padding: 1rem;
		}

		.user-section {
			gap: 0.5rem;
		}

		:global(.user-avatar) {
			width: 40px;
			height: 40px;
		}

		.find-title {
			font-size: 1.125rem;
		}

		.content-section {
			padding: 1rem;
		}
	}
</style>
