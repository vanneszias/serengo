<script lang="ts">
	import { MapLibre } from 'svelte-maplibre';
	import type { StyleSpecification } from 'svelte-maplibre';
	import { coordinates, getMapCenter, getMapZoom } from '$lib/stores/location';
	import LocationButton from './LocationButton.svelte';

	interface Props {
		style?: StyleSpecification;
		center?: [number, number];
		zoom?: number;
		class?: string;
		showLocationButton?: boolean;
		autoCenter?: boolean;
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
		showLocationButton = true,
		autoCenter = true
	}: Props = $props();

	// Reactive center and zoom based on location or props
	const mapCenter = $derived(
		$coordinates && autoCenter
			? ([$coordinates.longitude, $coordinates.latitude] as [number, number])
			: center || $getMapCenter
	);

	const mapZoom = $derived($coordinates && autoCenter ? zoom || $getMapZoom : zoom || 13);
</script>

<div class="map-container {className}">
	<MapLibre {style} center={mapCenter} zoom={mapZoom} />

	{#if showLocationButton}
		<div class="location-controls">
			<LocationButton variant="icon" size="medium" showLabel={false} />
		</div>
	{/if}
</div>

<style>
	.map-container {
		position: relative;
		height: 400px;
		width: 100%;
	}

	.map-container :global(.maplibregl-map) {
		margin: 0 auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.location-controls {
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 1000;
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
	}

	:global(.marker-inner) {
		width: 8px;
		height: 8px;
		background: #2563eb;
		border-radius: 50%;
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

	@media (max-width: 768px) {
		.map-container {
			height: 300px;
		}

		.location-controls {
			top: 8px;
			right: 8px;
		}
	}
</style>
