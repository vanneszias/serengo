import { writable, derived } from 'svelte/store';
import { geolocationService, type LocationCoordinates, type LocationError, type LocationStatus } from '$lib/utils/geolocation';

interface LocationState {
	coordinates: LocationCoordinates | null;
	status: LocationStatus;
	error: LocationError | null;
	isWatching: boolean;
	lastUpdated: Date | null;
}

const initialState: LocationState = {
	coordinates: null,
	status: 'idle',
	error: null,
	isWatching: false,
	lastUpdated: null
};

// Main location store
export const locationStore = writable<LocationState>(initialState);

// Derived stores for easier access
export const coordinates = derived(locationStore, ($location) => $location.coordinates);
export const locationStatus = derived(locationStore, ($location) => $location.status);
export const locationError = derived(locationStore, ($location) => $location.error);
export const isLocationLoading = derived(locationStore, ($location) => $location.status === 'loading');
export const hasLocationAccess = derived(locationStore, ($location) => $location.coordinates !== null);

// Location actions
export const locationActions = {
	/**
	 * Get current position once
	 */
	async getCurrentLocation(options?: PositionOptions): Promise<LocationCoordinates | null> {
		locationStore.update(state => ({
			...state,
			status: 'loading',
			error: null
		}));

		try {
			const coordinates = await geolocationService.getCurrentPosition(options);

			locationStore.update(state => ({
				...state,
				coordinates,
				status: 'success',
				error: null,
				lastUpdated: new Date()
			}));

			return coordinates;
		} catch (error) {
			const locationError = error as LocationError;

			locationStore.update(state => ({
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
			locationStore.update(state => ({
				...state,
				status: 'error',
				error: {
					code: -1,
					message: 'Geolocation is not supported by this browser'
				}
			}));
			return;
		}

		locationStore.update(state => ({
			...state,
			status: 'loading',
			isWatching: true,
			error: null
		}));

		geolocationService.watchPosition(
			(coordinates) => {
				locationStore.update(state => ({
					...state,
					coordinates,
					status: 'success',
					error: null,
					lastUpdated: new Date()
				}));
			},
			(error) => {
				locationStore.update(state => ({
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

		locationStore.update(state => ({
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
		locationStore.update(state => ({
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

		const unsubscribe = locationStore.subscribe(state => {
			currentState = state;
		});
		unsubscribe();

		if (!currentState.lastUpdated) return true;

		const ageInMinutes = (Date.now() - currentState.lastUpdated.getTime()) / (1000 * 60);
		return ageInMinutes > maxAgeMinutes;
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
export const getMapZoom = derived(coordinates, ($coordinates) => {
	if ($coordinates?.accuracy) {
		// Adjust zoom based on accuracy (lower accuracy = lower zoom)
		if ($coordinates.accuracy < 10) return 18; // Very accurate
		if ($coordinates.accuracy < 50) return 16; // Good accuracy
		if ($coordinates.accuracy < 100) return 14; // Moderate accuracy
		if ($coordinates.accuracy < 500) return 12; // Low accuracy
		return 10; // Very low accuracy
	}
	return 13; // Default zoom level
});
