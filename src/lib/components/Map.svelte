<script lang="ts">
	import { MapLibre } from 'svelte-maplibre';
	import type { StyleSpecification } from 'svelte-maplibre';

	interface Props {
		style?: StyleSpecification;
		center?: [number, number];
		zoom?: number;
		class?: string;
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
		center = [0, 0],
		zoom = 2,
		class: className = ''
	}: Props = $props();
</script>

<div class="map-container {className}">
	<MapLibre {style} {center} {zoom} />
</div>

<style>
	.map-container :global(.maplibregl-map) {
		margin: 0 auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}
</style>
