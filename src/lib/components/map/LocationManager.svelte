<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { locationActions, isWatching, coordinates } from '$lib/stores/location';

	interface Props {
		autoStart?: boolean;
		enableHighAccuracy?: boolean;
		timeout?: number;
		maximumAge?: number;
	}

	let {
		autoStart = true,
		enableHighAccuracy = true,
		timeout = 15000,
		maximumAge = 60000
	}: Props = $props();

	// Location watching options
	const watchOptions = {
		enableHighAccuracy,
		timeout,
		maximumAge
	};

	onMount(() => {
		if (!browser || !autoStart) return;

		// Check if geolocation is supported
		if (!navigator.geolocation) {
			console.warn('Geolocation is not supported by this browser');
			return;
		}

		// Check if we already have coordinates and aren't watching
		if ($coordinates && !$isWatching) {
			// Start watching immediately if we have previous coordinates
			startLocationWatching();
			return;
		}

		// If no coordinates, try to get current location first
		if (!$coordinates) {
			getCurrentLocationThenWatch();
		}
	});

	async function getCurrentLocationThenWatch() {
		try {
			const result = await locationActions.getCurrentLocation(watchOptions);
			if (result) {
				// Successfully got location, now start watching
				startLocationWatching();
			}
		} catch {
			// If we can't get location due to permissions, don't auto-start watching
			console.log('Could not get initial location, location watching not started automatically');
		}
	}

	function startLocationWatching() {
		if (!$isWatching) {
			locationActions.startWatching(watchOptions);
		}
	}

	// Cleanup function to stop watching when component is destroyed
	function cleanup() {
		if ($isWatching) {
			locationActions.stopWatching();
		}
	}

	// Stop watching when the component is destroyed
	onMount(() => {
		return cleanup;
	});
</script>

<!-- This component doesn't render anything, it just manages location watching -->
