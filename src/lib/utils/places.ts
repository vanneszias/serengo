export interface PlaceResult {
	placeId: string;
	name: string;
	formattedAddress: string;
	latitude: number;
	longitude: number;
	types: string[];
	vicinity?: string;
	rating?: number;
	priceLevel?: number;
}

interface GooglePlacesPrediction {
	place_id: string;
	description: string;
	types: string[];
}

interface GooglePlacesResult {
	place_id: string;
	name: string;
	formatted_address?: string;
	vicinity?: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	types?: string[];
	rating?: number;
	price_level?: number;
}

export interface PlaceSearchOptions {
	query?: string;
	location?: { lat: number; lng: number };
	radius?: number;
	type?: string;
}

export class GooglePlacesService {
	private apiKey: string;
	private baseUrl = 'https://maps.googleapis.com/maps/api/place';

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	/**
	 * Search for places using text query
	 */
	async searchPlaces(
		query: string,
		location?: { lat: number; lng: number }
	): Promise<PlaceResult[]> {
		const url = new URL(`${this.baseUrl}/textsearch/json`);
		url.searchParams.set('query', query);
		url.searchParams.set('key', this.apiKey);

		if (location) {
			url.searchParams.set('location', `${location.lat},${location.lng}`);
			url.searchParams.set('radius', '50000'); // 50km radius
		}

		try {
			const response = await fetch(url.toString());
			const data = await response.json();

			if (data.status !== 'OK') {
				throw new Error(`Places API error: ${data.status}`);
			}

			return data.results.map(this.formatPlaceResult);
		} catch (error) {
			console.error('Error searching places:', error);
			throw error;
		}
	}

	/**
	 * Get place autocomplete suggestions
	 */
	async getAutocompleteSuggestions(
		input: string,
		location?: { lat: number; lng: number }
	): Promise<Array<{ placeId: string; description: string; types: string[] }>> {
		const url = new URL(`${this.baseUrl}/autocomplete/json`);
		url.searchParams.set('input', input);
		url.searchParams.set('key', this.apiKey);

		if (location) {
			url.searchParams.set('location', `${location.lat},${location.lng}`);
			url.searchParams.set('radius', '50000');
		}

		try {
			const response = await fetch(url.toString());
			const data = await response.json();

			if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
				throw new Error(`Places API error: ${data.status}`);
			}

			return (
				data.predictions?.map((prediction: GooglePlacesPrediction) => ({
					placeId: prediction.place_id,
					description: prediction.description,
					types: prediction.types
				})) || []
			);
		} catch (error) {
			console.error('Error getting autocomplete suggestions:', error);
			throw error;
		}
	}

	/**
	 * Get detailed information about a place
	 */
	async getPlaceDetails(placeId: string): Promise<PlaceResult> {
		const url = new URL(`${this.baseUrl}/details/json`);
		url.searchParams.set('place_id', placeId);
		url.searchParams.set(
			'fields',
			'place_id,name,formatted_address,geometry,types,vicinity,rating,price_level'
		);
		url.searchParams.set('key', this.apiKey);

		try {
			const response = await fetch(url.toString());
			const data = await response.json();

			if (data.status !== 'OK') {
				throw new Error(`Places API error: ${data.status}`);
			}

			return this.formatPlaceResult(data.result);
		} catch (error) {
			console.error('Error getting place details:', error);
			throw error;
		}
	}

	/**
	 * Find nearby places
	 */
	async findNearbyPlaces(
		location: { lat: number; lng: number },
		radius: number = 5000,
		type?: string
	): Promise<PlaceResult[]> {
		const url = new URL(`${this.baseUrl}/nearbysearch/json`);
		url.searchParams.set('location', `${location.lat},${location.lng}`);
		url.searchParams.set('radius', radius.toString());
		url.searchParams.set('key', this.apiKey);

		if (type) {
			url.searchParams.set('type', type);
		}

		try {
			const response = await fetch(url.toString());
			const data = await response.json();

			if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
				throw new Error(`Places API error: ${data.status}`);
			}

			return data.results?.map(this.formatPlaceResult) || [];
		} catch (error) {
			console.error('Error finding nearby places:', error);
			throw error;
		}
	}

	private formatPlaceResult = (place: GooglePlacesResult): PlaceResult => {
		return {
			placeId: place.place_id,
			name: place.name,
			formattedAddress: place.formatted_address || place.vicinity || '',
			latitude: place.geometry.location.lat,
			longitude: place.geometry.location.lng,
			types: place.types || [],
			vicinity: place.vicinity,
			rating: place.rating,
			priceLevel: place.price_level
		};
	};
}

export function createPlacesService(apiKey: string): GooglePlacesService {
	return new GooglePlacesService(apiKey);
}
