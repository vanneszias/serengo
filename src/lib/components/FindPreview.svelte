<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

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
		};
		media?: Array<{
			type: string;
			url: string;
			thumbnailUrl: string;
		}>;
	}

	interface Props {
		find: Find | null;
		onClose: () => void;
	}

	let { find, onClose }: Props = $props();

	let showModal = $state(true);
	let currentMediaIndex = $state(0);

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
	<Modal bind:showModal positioning="center">
		{#snippet header()}
			<div class="find-header">
				<div class="find-info">
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
		{/snippet}

		<div class="find-content">
			{#if find.media && find.media.length > 0}
				<div class="media-container">
					<div class="media-viewer">
						{#if find.media[currentMediaIndex].type === 'photo'}
							<img src={find.media[currentMediaIndex].url} alt={find.title} class="media-image" />
						{:else}
							<video
								src={find.media[currentMediaIndex].url}
								controls
								class="media-video"
								poster={find.media[currentMediaIndex].thumbnailUrl}
							>
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>
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

			<div class="find-details">
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
					<button class="button primary" onclick={getDirections}>
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

					<button class="button secondary" onclick={shareFindUrl}>
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
							<line
								x1="12"
								y1="2"
								x2="12"
								y2="15"
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
	</Modal>
{/if}

<style>
	.find-content {
		max-height: 80vh;
		overflow-y: auto;
	}

	.find-header {
		width: 100%;
	}

	.find-title {
		font-family: 'Washington', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: #333;
		line-height: 1.3;
	}

	.find-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
		font-size: 0.9rem;
		color: #666;
	}

	.username {
		font-weight: 500;
		color: #3b82f6;
	}

	.separator {
		color: #ccc;
	}

	.category {
		background: #f0f0f0;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 0.8rem;
		text-transform: capitalize;
	}

	.media-container {
		position: relative;
		margin-bottom: 20px;
	}

	.media-viewer {
		position: relative;
		width: 100%;
		height: 300px;
		border-radius: 12px;
		overflow: hidden;
		background: #f5f5f5;
	}

	.media-image,
	.media-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.media-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.5);
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
	}

	.media-nav:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	.media-nav.prev {
		left: 12px;
	}

	.media-nav.next {
		right: 12px;
	}

	.media-indicators {
		display: flex;
		justify-content: center;
		gap: 8px;
		margin-top: 12px;
	}

	.indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: none;
		background: #ddd;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.indicator.active {
		background: #3b82f6;
	}

	.find-details {
		padding: 0 24px 24px;
	}

	.description {
		font-size: 1rem;
		line-height: 1.6;
		color: #333;
		margin: 0 0 20px 0;
	}

	.location-info {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #666;
		font-size: 0.9rem;
		margin-bottom: 24px;
	}

	.actions {
		display: flex;
		gap: 12px;
	}

	.actions :global(.button) {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		justify-content: center;
	}

	@media (max-width: 640px) {
		.find-title {
			font-size: 1.3rem;
		}

		.find-details {
			padding: 0 16px 16px;
		}

		.media-viewer {
			height: 250px;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
