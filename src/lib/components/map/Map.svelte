<script lang="ts">
	import { MapLibre, Marker } from 'svelte-maplibre';
	import type { StyleSpecification } from 'svelte-maplibre';
	import { untrack } from 'svelte';
	import {
		coordinates,
		getMapCenter,
		getMapZoom,
		shouldZoomToLocation,
		locationActions,
		isWatching
	} from '$lib/stores/location';
	import { Skeleton } from '$lib/components/skeleton';

	interface Find {
		id: string;
		title: string;
		description?: string;
		latitude: string;
		longitude: string;
		locationName?: string;
		category?: string;
		isPublic: number;
		createdAt: Date;
		userId: string;
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
		style?: StyleSpecification;
		center?: [number, number];
		zoom?: number;
		class?: string;
		autoCenter?: boolean;
		finds?: Find[];
		onFindClick?: (find: Find) => void;
	}

	let {
		style = {
			version: 8,
			sources: {
				'osm-raster': {
					type: 'raster',
					tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
					tileSize: 256,
					attribution: '© OpenStreetMap contributors'
				}
			},
			layers: [
				{
					id: 'osm-tiles',
					type: 'raster',
					source: 'osm-raster'
				}
			]
		},
		center,
		zoom,
		class: className = '',
		autoCenter = true,
		finds = [],
		onFindClick
	}: Props = $props();

	let mapLoaded = $state(false);
	let styleLoaded = $state(false);
	let isIdle = $state(false);
	let mapInstance: any = $state(null);
	let userHasMovedMap = $state(false);
	let initialCenter: [number, number] = center || [0, 51.505];
	let initialZoom: number = zoom || 13;

	// Use a plain variable (not reactive) to track programmatic moves
	let isProgrammaticMove = false;

	// Handle comprehensive map loading events
	function handleStyleLoad() {
		styleLoaded = true;
	}

	function handleIdle() {
		isIdle = true;
	}

	// Map is considered fully ready when it's loaded, style is loaded, and it's idle
	const mapReady = $derived(mapLoaded && styleLoaded && isIdle);

	// Check if map is centered on user location (approximately)
	const isCenteredOnUser = $derived.by(() => {
		if (!$coordinates || !mapInstance) return false;

		const center = mapInstance.getCenter();
		const userLng = $coordinates.longitude;
		const userLat = $coordinates.latitude;

		// Check if within ~100m (roughly 0.001 degrees)
		const threshold = 0.001;
		return Math.abs(center.lng - userLng) < threshold && Math.abs(center.lat - userLat) < threshold;
	});

	// Effect to handle recenter trigger
	$effect(() => {
		if ($shouldZoomToLocation && mapInstance && $coordinates) {
			// Use untrack to avoid tracking getMapZoom changes inside this effect
			untrack(() => {
				// Mark this as a programmatic move
				isProgrammaticMove = true;
				userHasMovedMap = false;

				// Fly to the user's location
				mapInstance.flyTo({
					center: [$coordinates.longitude, $coordinates.latitude],
					zoom: $getMapZoom,
					duration: 1000
				});

				// Clear the trigger and reset flag after animation
				setTimeout(() => {
					locationActions.clearZoomTrigger();
					isProgrammaticMove = false;
				}, 1100);
			});
		}
	});

	// Effect to center on user location when map first loads (if autoCenter is true)
	let hasInitialCentered = $state(false);
	$effect(() => {
		if (autoCenter && mapReady && $coordinates && !hasInitialCentered) {
			untrack(() => {
				isProgrammaticMove = true;
				hasInitialCentered = true;
				mapInstance.flyTo({
					center: [$coordinates.longitude, $coordinates.latitude],
					zoom: $getMapZoom,
					duration: 1000
				});

				setTimeout(() => {
					isProgrammaticMove = false;
				}, 1100);
			});
		}
	});

	// Effect to attach move listener to map instance (only depends on mapInstance)
	$effect(() => {
		if (!mapInstance) return;

		const handleMoveEnd = () => {
			// Only mark as user move if it's not programmatic
			if (!isProgrammaticMove) {
				userHasMovedMap = true;
			}
		};

		// Use 'moveend' to capture when user finishes moving the map
		mapInstance.on('moveend', handleMoveEnd);

		return () => {
			mapInstance.off('moveend', handleMoveEnd);
		};
	});

	function recenterMap() {
		if (!$coordinates) return;

		// Trigger zoom to location
		locationActions.getCurrentLocation();
	}
</script>

<div class="map-container {className}">
	{#if !mapReady}
		<div class="map-skeleton">
			<Skeleton class="h-full w-full rounded-xl" />
			<div class="skeleton-overlay">
				<Skeleton class="mb-2 h-4 w-16" />
				<Skeleton class="h-3 w-24" />
			</div>
		</div>
	{/if}

	<div class="map-wrapper" class:hidden={!mapReady}>
		<MapLibre
			{style}
			center={initialCenter}
			zoom={initialZoom}
			bind:map={mapInstance}
			bind:loaded={mapLoaded}
			onstyleload={handleStyleLoad}
			onidle={handleIdle}
		>
			{#if $coordinates}
				<Marker lngLat={[$coordinates.longitude, $coordinates.latitude]}>
					<div class="location-marker" class:watching={$isWatching}>
						<div class="marker-pulse" class:watching={$isWatching}></div>
						<div class="marker-outer" class:watching={$isWatching}>
							<div class="marker-inner" class:watching={$isWatching}></div>
						</div>
						{#if $isWatching}
							<div class="watching-ring"></div>
						{/if}
					</div>
				</Marker>
			{/if}

			{#each finds as find (find.id)}
				<Marker lngLat={[parseFloat(find.longitude), parseFloat(find.latitude)]}>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="find-marker"
						role="button"
						tabindex="0"
						onclick={() => onFindClick?.(find)}
						title={find.title}
					>
						<div class="find-marker-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
								<path
									d="M12 2L13.09 8.26L19 9.27L13.09 10.28L12 16.54L10.91 10.28L5 9.27L10.91 8.26L12 2Z"
									fill="currentColor"
								/>
							</svg>
						</div>
						{#if find.media && find.media.length > 0}
							<div class="find-marker-preview">
								<img src={find.media[0].thumbnailUrl} alt={find.title} />
							</div>
						{/if}
					</div>
				</Marker>
			{/each}
		</MapLibre>

		<!-- Recenter button - only show when user has moved map and has coordinates -->
		{#if userHasMovedMap && !isCenteredOnUser && $coordinates}
			<button
				class="recenter-button"
				onclick={recenterMap}
				type="button"
				aria-label="Recenter on my location"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<circle cx="12" cy="12" r="3"></circle>
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.map-container {
		position: relative;
		height: 400px;
		width: 100%;
	}

	.map-skeleton {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.skeleton-overlay {
		position: absolute;
		top: 20px;
		left: 20px;
		z-index: 10;
	}

	.map-wrapper {
		width: 100%;
		height: 100%;
	}

	.map-wrapper.hidden {
		display: none;
	}

	.map-container :global(.maplibregl-map) {
		margin: 0 auto;
		overflow: hidden;
	}

	/* Location marker styles */
	:global(.location-marker) {
		width: 24px;
		height: 24px;
		cursor: pointer;
	}

	:global(.marker-outer) {
		width: 24px;
		height: 24px;
		background: rgba(37, 99, 235, 0.2);
		border: 2px solid #2563eb;
		border-radius: 50%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	:global(.marker-outer.watching) {
		background: rgba(245, 158, 11, 0.2);
		border-color: #f59e0b;
		box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
	}

	:global(.marker-inner) {
		width: 8px;
		height: 8px;
		background: #2563eb;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	:global(.marker-inner.watching) {
		background: #f59e0b;
		animation: pulse-glow 2s infinite;
	}

	:global(.marker-pulse) {
		position: absolute;
		top: -2px;
		left: -2px;
		width: 24px;
		height: 24px;
		border: 2px solid rgba(37, 99, 235, 0.6);
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	:global(.marker-pulse.watching) {
		border-color: rgba(245, 158, 11, 0.6);
		animation: pulse-watching 1.5s infinite;
	}

	:global(.watching-ring) {
		position: absolute;
		top: -8px;
		left: -8px;
		width: 36px;
		height: 36px;
		border: 2px solid rgba(245, 158, 11, 0.4);
		border-radius: 50%;
		animation: expand-ring 3s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	@keyframes pulse-watching {
		0% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.5);
			opacity: 0.4;
		}
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.2);
		}
	}

	@keyframes expand-ring {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		50% {
			transform: scale(1.3);
			opacity: 0.3;
		}
		100% {
			transform: scale(1.6);
			opacity: 0;
		}
	}

	/* Find marker styles */
	:global(.find-marker) {
		width: 40px;
		height: 40px;
		cursor: pointer;
		position: relative;
		transform: translate(-50%, -50%);
		transition: all 0.2s ease;
	}

	:global(.find-marker:hover) {
		transform: translate(-50%, -50%) scale(1.1);
		z-index: 100;
	}

	:global(.find-marker-icon) {
		width: 32px;
		height: 32px;
		background: #ff6b35;
		border: 3px solid white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		position: relative;
		z-index: 2;
	}

	:global(.find-marker-preview) {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
		z-index: 3;
	}

	:global(.find-marker-preview img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.recenter-button {
		position: absolute;
		top: 100px;
		right: 20px;
		width: 44px;
		height: 44px;
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
		z-index: 10;
		color: #2563eb;
	}

	.recenter-button:hover {
		background: #f0f9ff;
		border-color: #2563eb;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
	}

	.recenter-button:active {
		transform: scale(0.95);
	}

	@media (max-width: 768px) {
		.map-container {
			height: 300px;
		}

		.location-controls {
			top: 8px;
			right: 8px;
		}

		.recenter-button {
			bottom: 12px;
			right: 12px;
			width: 40px;
			height: 40px;
		}
	}
</style>
