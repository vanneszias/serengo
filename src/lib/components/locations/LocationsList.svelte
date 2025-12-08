<script lang="ts">
	import LocationCard from './LocationCard.svelte';

	interface Location {
		id: string;
		latitude: string;
		longitude: string;
		createdAt: string;
		userId: string;
		username: string;
		profilePictureUrl?: string | null;
		findCount: number;
		distance?: number;
	}

	interface Props {
		locations: Location[];
		onLocationExplore?: (id: string) => void;
		title?: string;
		showEmpty?: boolean;
		emptyMessage?: string;
		hideTitle?: boolean;
	}

	let {
		locations,
		onLocationExplore,
		title = 'Locations',
		showEmpty = true,
		emptyMessage = 'No locations nearby',
		hideTitle = false
	}: Props = $props();

	function handleLocationExplore(id: string) {
		onLocationExplore?.(id);
	}
</script>

<section class="locations-feed">
	{#if !hideTitle}
		<div class="feed-header">
			<h2 class="feed-title">{title}</h2>
		</div>
	{/if}

	{#if locations.length > 0}
		<div class="feed-container">
			{#each locations as location (location.id)}
				<LocationCard {location} onExplore={handleLocationExplore} />
			{/each}
		</div>
	{:else if showEmpty}
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
			<h3 class="empty-title">No locations discovered yet</h3>
			<p class="empty-message">{emptyMessage}</p>
			<div class="empty-action">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
					<path
						d="M12 5v14M5 12h14"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				<span>Create a location to start sharing finds</span>
			</div>
		</div>
	{/if}
</section>

<style>
	.locations-feed {
		width: 100%;
		padding: 0 24px 24px 24px;
	}

	.feed-header {
		margin-bottom: 1.5rem;
		padding: 0 0.5rem;
	}

	.feed-title {
		font-family: 'Washington', serif;
		font-size: 1.875rem;
		font-weight: 700;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.feed-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: hsl(var(--card));
		border-radius: 12px;
		border: 1px solid hsl(var(--border));
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
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.empty-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--primary));
		font-size: 0.875rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.feed-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			margin-bottom: 1rem;
			padding: 0;
		}

		.feed-title {
			font-size: 1.5rem;
		}

		.empty-state {
			padding: 3rem 1.5rem;
		}
	}

	.feed-container {
		scroll-behavior: smooth;
	}

	:global(.location-card) {
		animation: fadeInUp 0.4s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
