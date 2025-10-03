import { writable, derived } from 'svelte/store';
import {
	geolocationService,
	type LocationCoordinates,
	type LocationError,
	type LocationStatus
} from '$lib/utils/geolocation';

interface LocationState {
	coordinates: LocationCoordinates | null;
	status: LocationStatus;
	error: LocationError | null;
	isWatching: boolean;
	lastUpdated: Date | null;
	shouldZoomToLocation: boolean;
}

const initialState: LocationState = {
	coordinates: null,
	status: 'idle',
	error: null,
	isWatching: false,
	lastUpdated: null,
	shouldZoomToLocation: false
};

// Main location store
export const locationStore = writable<LocationState>(initialState);

// Derived stores for easier access
export const coordinates = derived(locationStore, ($location) => $location.coordinates);
export const locationStatus = derived(locationStore, ($location) => $location.status);
export const locationError = derived(locationStore, ($location) => $location.error);
export const isLocationLoading = derived(
	locationStore,
	($location) => $location.status === 'loading'
);
export const hasLocationAccess = derived(
	locationStore,
	($location) => $location.coordinates !== null
);
export const shouldZoomToLocation = derived(
	locationStore,
	($location) => $location.shouldZoomToLocation
);

// Location actions
export const locationActions = {
	/**
	 * Get current position once
	 */
	async getCurrentLocation(options?: PositionOptions): Promise<LocationCoordinates | null> {
		locationStore.update((state) => ({
			...state,
			status: 'loading',
			error: null
		}));

		try {
			const coordinates = await geolocationService.getCurrentPosition(options);

			locationStore.update((state) => ({
				...state,
				coordinates,
				status: 'success',
				error: null,
				lastUpdated: new Date(),
				shouldZoomToLocation: true
			}));

			return coordinates;
		} catch (error) {
			const locationError = error as LocationError;

			locationStore.update((state) => ({
				...state,
				status: 'error',
				error: locationError,
				lastUpdated: new Date()
			}));

			return null;
		}
	},

	/**
	 * Start watching position changes
	 */
	startWatching(options?: PositionOptions): void {
		if (!geolocationService.isSupported()) {
			locationStore.update((state) => ({
				...state,
				status: 'error',
				error: {
					code: -1,
					message: 'Geolocation is not supported by this browser'
				}
			}));
			return;
		}

		locationStore.update((state) => ({
			...state,
			status: 'loading',
			isWatching: true,
			error: null
		}));

		geolocationService.watchPosition(
			(coordinates) => {
				locationStore.update((state) => ({
					...state,
					coordinates,
					status: 'success',
					error: null,
					lastUpdated: new Date()
				}));
			},
			(error) => {
				locationStore.update((state) => ({
					...state,
					status: 'error',
					error,
					lastUpdated: new Date()
				}));
			},
			options
		);
	},

	/**
	 * Stop watching position changes
	 */
	stopWatching(): void {
		geolocationService.clearWatch();

		locationStore.update((state) => ({
			...state,
			isWatching: false
		}));
	},

	/**
	 * Clear location data and reset state
	 */
	clearLocation(): void {
		geolocationService.clearWatch();
		locationStore.set(initialState);
	},

	/**
	 * Set coordinates manually (useful for testing or setting default location)
	 */
	setCoordinates(coordinates: LocationCoordinates): void {
		locationStore.update((state) => ({
			...state,
			coordinates,
			status: 'success',
			error: null,
			lastUpdated: new Date()
		}));
	},

	/**
	 * Check if location data is stale (older than specified minutes)
	 */
	isLocationStale(maxAgeMinutes: number = 5): boolean {
		let currentState: LocationState = initialState;

		const unsubscribe = locationStore.subscribe((state) => {
			currentState = state;
		});
		unsubscribe();

		if (!currentState.lastUpdated) return true;

		const ageInMinutes = (Date.now() - currentState.lastUpdated.getTime()) / (1000 * 60);
		return ageInMinutes > maxAgeMinutes;
	},

	/**
	 * Clear the zoom trigger flag
	 */
	clearZoomTrigger(): void {
		locationStore.update((state) => ({
			...state,
			shouldZoomToLocation: false
		}));
	}
};

// Utility function to get map center coordinates
export const getMapCenter = derived(coordinates, ($coordinates) => {
	if ($coordinates) {
		return [$coordinates.longitude, $coordinates.latitude] as [number, number];
	}
	// Default to a reasonable center (e.g., London)
	return [0, 51.505] as [number, number];
});

// Utility function to get appropriate zoom level based on accuracy
export const getMapZoom = derived([coordinates, shouldZoomToLocation], ([$coordinates, $shouldZoom]) => {
	if ($coordinates?.accuracy) {
		// More aggressive zoom levels when location button is clicked
		const baseZoom = $shouldZoom ? 2 : 0; // Add 2 zoom levels when triggered by button

		// Adjust zoom based on accuracy (lower accuracy = lower zoom)
		if ($coordinates.accuracy < 10) return Math.min(20, 18 + baseZoom); // Very accurate
		if ($coordinates.accuracy < 50) return Math.min(19, 16 + baseZoom); // Good accuracy
		if ($coordinates.accuracy < 100) return Math.min(18, 14 + baseZoom); // Moderate accuracy
		if ($coordinates.accuracy < 500) return Math.min(16, 12 + baseZoom); // Low accuracy
		return Math.min(15, 10 + baseZoom); // Very low accuracy
	}
	return $shouldZoom ? 16 : 13; // More aggressive default when triggered by button
});
