export interface LocationCoordinates {
	latitude: number;
	longitude: number;
	accuracy?: number;
}

export interface LocationError {
	code: number;
	message: string;
}

export type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

export class GeolocationService {
	private static instance: GeolocationService;
	private currentPosition: LocationCoordinates | null = null;
	private status: LocationStatus = 'idle';
	private error: LocationError | null = null;
	private watchId: number | null = null;

	static getInstance(): GeolocationService {
		if (!GeolocationService.instance) {
			GeolocationService.instance = new GeolocationService();
		}
		return GeolocationService.instance;
	}

	/**
	 * Check if geolocation is supported by the browser
	 */
	isSupported(): boolean {
		return 'geolocation' in navigator;
	}

	/**
	 * Get current position once
	 */
	async getCurrentPosition(options?: PositionOptions): Promise<LocationCoordinates> {
		if (!this.isSupported()) {
			throw new Error('Geolocation is not supported by this browser');
		}

		this.status = 'loading';
		this.error = null;

		const defaultOptions: PositionOptions = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 300000, // 5 minutes
			...options
		};

		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const coordinates: LocationCoordinates = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy
					};

					this.currentPosition = coordinates;
					this.status = 'success';
					resolve(coordinates);
				},
				(error) => {
					const locationError: LocationError = {
						code: error.code,
						message: this.getErrorMessage(error.code)
					};

					this.error = locationError;
					this.status = 'error';
					reject(locationError);
				},
				defaultOptions
			);
		});
	}

	/**
	 * Watch position changes
	 */
	watchPosition(
		onSuccess: (coordinates: LocationCoordinates) => void,
		onError?: (error: LocationError) => void,
		options?: PositionOptions
	): number | null {
		if (!this.isSupported()) {
			const error: LocationError = {
				code: -1,
				message: 'Geolocation is not supported by this browser'
			};
			onError?.(error);
			return null;
		}

		const defaultOptions: PositionOptions = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 60000, // 1 minute for watch
			...options
		};

		this.watchId = navigator.geolocation.watchPosition(
			(position) => {
				const coordinates: LocationCoordinates = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					accuracy: position.coords.accuracy
				};

				this.currentPosition = coordinates;
				this.status = 'success';
				onSuccess(coordinates);
			},
			(error) => {
				const locationError: LocationError = {
					code: error.code,
					message: this.getErrorMessage(error.code)
				};

				this.error = locationError;
				this.status = 'error';
				onError?.(locationError);
			},
			defaultOptions
		);

		return this.watchId;
	}

	/**
	 * Stop watching position
	 */
	clearWatch(): void {
		if (this.watchId !== null) {
			navigator.geolocation.clearWatch(this.watchId);
			this.watchId = null;
		}
	}

	/**
	 * Get the last known position
	 */
	getLastKnownPosition(): LocationCoordinates | null {
		return this.currentPosition;
	}

	/**
	 * Get current status
	 */
	getStatus(): LocationStatus {
		return this.status;
	}

	/**
	 * Get current error
	 */
	getError(): LocationError | null {
		return this.error;
	}

	/**
	 * Convert error code to human-readable message
	 */
	private getErrorMessage(code: number): string {
		switch (code) {
			case 1: // PERMISSION_DENIED
				return 'Location access denied by user. Please enable location permissions to use this feature.';
			case 2: // POSITION_UNAVAILABLE
				return 'Location information is unavailable. Please check your device settings.';
			case 3: // TIMEOUT
				return 'Location request timed out. Please try again.';
			default:
				return 'An unknown error occurred while retrieving location.';
		}
	}

	/**
	 * Calculate distance between two coordinates in kilometers
	 */
	static calculateDistance(
		coord1: LocationCoordinates,
		coord2: LocationCoordinates
	): number {
		const R = 6371; // Earth's radius in kilometers
		const dLat = this.toRadians(coord2.latitude - coord1.latitude);
		const dLon = this.toRadians(coord2.longitude - coord1.longitude);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(this.toRadians(coord1.latitude)) *
				Math.cos(this.toRadians(coord2.latitude)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	private static toRadians(degrees: number): number {
		return (degrees * Math.PI) / 180;
	}
}

// Export singleton instance for easy use
export const geolocationService = GeolocationService.getInstance();
