import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createPlacesService } from '$lib/utils/places';

const getPlacesService = () => {
	const apiKey = env.GOOGLE_MAPS_API_KEY;
	if (!apiKey) {
		throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
	}
	return createPlacesService(apiKey);
};

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const action = url.searchParams.get('action');
	const query = url.searchParams.get('query');
	const placeId = url.searchParams.get('placeId');
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const radius = url.searchParams.get('radius');
	const type = url.searchParams.get('type');

	try {
		const placesService = getPlacesService();

		let location;
		if (lat && lng) {
			location = { lat: parseFloat(lat), lng: parseFloat(lng) };
		}

		switch (action) {
			case 'search': {
				if (!query) {
					throw error(400, 'Query parameter is required for search');
				}
				const searchResults = await placesService.searchPlaces(query, location);
				return json(searchResults);
			}

			case 'autocomplete': {
				if (!query) {
					throw error(400, 'Query parameter is required for autocomplete');
				}
				const suggestions = await placesService.getAutocompleteSuggestions(query, location);
				return json(suggestions);
			}

			case 'details': {
				if (!placeId) {
					throw error(400, 'PlaceId parameter is required for details');
				}
				const placeDetails = await placesService.getPlaceDetails(placeId);
				return json(placeDetails);
			}

			case 'nearby': {
				if (!location) {
					throw error(400, 'Location parameters (lat, lng) are required for nearby search');
				}
				const radiusNum = radius ? parseInt(radius) : 5000;
				const nearbyResults = await placesService.findNearbyPlaces(
					location,
					radiusNum,
					type || undefined
				);
				return json(nearbyResults);
			}

			default:
				throw error(400, 'Invalid action parameter');
		}
	} catch (err) {
		console.error('Places API error:', err);
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'Failed to fetch places data');
	}
};
