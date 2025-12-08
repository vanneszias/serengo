<script lang="ts">
	import { formatDistance } from '$lib/utils/distance';

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
		location: Location;
		onExplore?: (id: string) => void;
	}

	let { location, onExplore }: Props = $props();

	function handleExplore() {
		onExplore?.(location.id);
	}
</script>

<article class="location-card">
	<div class="location-info">
		<div class="location-header">
			<div class="location-title">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="location-icon">
					<path
						d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
				</svg>
				<div>
					<h3 class="title">
						{#if location.distance !== undefined}
							{formatDistance(location.distance)} away
						{:else}
							Location
						{/if}
					</h3>
					<p class="coordinates">
						{parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
					</p>
				</div>
			</div>

			{#if location.distance !== undefined}
				<div class="distance-badge">{formatDistance(location.distance)}</div>
			{/if}
		</div>

		<div class="location-meta">
			<div class="meta-item">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" />
					<path
						d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				<span>Created by {location.username}</span>
			</div>

			<div class="meta-item">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
					<path
						d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span>{location.findCount} {location.findCount === 1 ? 'find' : 'finds'}</span>
			</div>
		</div>
	</div>

	<button type="button" class="explore-button" onclick={handleExplore}>
		<span>Explore</span>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
			<path
				d="M5 12h14M12 5l7 7-7 7"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>
</article>

<style>
	.location-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		transition: all 0.2s ease;
		gap: 1rem;
	}

	.location-card:hover {
		border-color: hsl(var(--primary) / 0.3);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.location-info {
		flex: 1;
		min-width: 0;
	}

	.location-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
		gap: 1rem;
	}

	.location-title {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		min-width: 0;
	}

	.location-icon {
		color: hsl(var(--primary));
		flex-shrink: 0;
		margin-top: 2px;
	}

	.title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: hsl(var(--foreground));
		line-height: 1.3;
	}

	.coordinates {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		font-family: monospace;
	}

	.distance-badge {
		background: hsl(var(--primary) / 0.1);
		color: hsl(var(--primary));
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.location-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.meta-item svg {
		flex-shrink: 0;
	}

	.explore-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.explore-button:hover {
		background: hsl(var(--primary) / 0.9);
		transform: translateX(2px);
	}

	.explore-button svg {
		transition: transform 0.2s ease;
	}

	.explore-button:hover svg {
		transform: translateX(2px);
	}

	@media (max-width: 640px) {
		.location-card {
			flex-direction: column;
			align-items: stretch;
		}

		.explore-button {
			width: 100%;
			justify-content: center;
		}

		.distance-badge {
			display: none;
		}
	}
</style>
