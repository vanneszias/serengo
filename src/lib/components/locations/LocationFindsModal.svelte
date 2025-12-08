<script lang="ts">
	import FindsList from '../finds/FindsList.svelte';
	import { Button } from '$lib/components/button';

	interface Find {
		id: string;
		locationId: string;
		title: string;
		description?: string;
		category?: string;
		locationName?: string;
		isPublic: number;
		userId: string;
		username: string;
		profilePictureUrl?: string | null;
		likeCount?: number;
		isLikedByUser?: boolean;
		isFromFriend?: boolean;
		media?: Array<{
			id: string;
			type: string;
			url: string;
			thumbnailUrl: string;
			orderIndex?: number | null;
		}>;
	}

	interface Location {
		id: string;
		latitude: string;
		longitude: string;
		createdAt: string;
		userId: string;
		username: string;
		findCount: number;
		finds?: Find[];
	}

	interface Props {
		isOpen: boolean;
		location: Location | null;
		currentUserId?: string;
		onClose: () => void;
		onCreateFind?: () => void;
	}

	let { isOpen, location, currentUserId, onClose, onCreateFind }: Props = $props();

	let isMobile = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const checkIsMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	});

	function handleCreateFind() {
		onCreateFind?.();
	}
</script>

{#if isOpen && location}
	<div class="modal-container" class:mobile={isMobile}>
		<div class="modal-content">
			<div class="modal-header">
				<div class="header-info">
					<h2 class="modal-title">Location Finds</h2>
					<p class="location-coords">
						{parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
					</p>
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
				{#if location.finds && location.finds.length > 0}
					<FindsList
						finds={location.finds.map((find) => ({
							id: find.id,
							title: find.title,
							description: find.description,
							category: find.category,
							locationName: find.locationName,
							isPublic: find.isPublic,
							userId: find.userId,
							user: {
								username: find.username,
								profilePictureUrl: find.profilePictureUrl
							},
							likeCount: find.likeCount,
							isLiked: find.isLikedByUser,
							media: find.media
						}))}
						hideTitle={true}
						{currentUserId}
					/>
				{:else}
					<div class="empty-state">
						<div class="empty-icon">
							<svg
								width="64"
								height="64"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
						</div>
						<h3 class="empty-title">No finds yet</h3>
						<p class="empty-message">Be the first to share a discovery at this location!</p>
					</div>
				{/if}
			</div>

			{#if currentUserId}
				<div class="modal-footer">
					<Button onclick={handleCreateFind} class="w-full">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="mr-2">
							<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
							<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
						</svg>
						Create Find Here
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-container {
		position: fixed;
		top: 80px;
		right: 20px;
		width: 40%;
		max-width: 600px;
		min-width: 500px;
		height: calc(100vh - 100px);
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
		height: 90vh;
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
		background: rgba(255, 255, 255, 0.6);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.header-info {
		flex: 1;
	}

	.modal-title {
		font-family: 'Washington', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: hsl(var(--foreground));
	}

	.location-coords {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		font-family: monospace;
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
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		height: 100%;
	}

	.empty-icon {
		margin-bottom: 1.5rem;
		color: hsl(var(--muted-foreground));
		opacity: 0.4;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: hsl(var(--foreground));
	}

	.empty-message {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		line-height: 1.5;
	}

	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	:global(.w-full) {
		width: 100%;
	}

	:global(.mr-2) {
		margin-right: 0.5rem;
	}

	@media (max-width: 767px) {
		.modal-header {
			padding: 1rem;
		}

		.modal-title {
			font-size: 1.25rem;
		}

		.modal-footer {
			padding: 1rem;
		}
	}
</style>
