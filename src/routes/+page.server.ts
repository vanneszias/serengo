import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, fetch, request }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	// Build API URL with query parameters
	const apiUrl = new URL('/api/finds', url.origin);

	// Forward location filtering parameters
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const radius = url.searchParams.get('radius') || '50';

	if (lat) apiUrl.searchParams.set('lat', lat);
	if (lng) apiUrl.searchParams.set('lng', lng);
	apiUrl.searchParams.set('radius', radius);
	apiUrl.searchParams.set('includePrivate', 'true'); // Include user's private finds
	apiUrl.searchParams.set('order', 'desc'); // Newest first

	try {
		const response = await fetch(apiUrl.toString(), {
			headers: {
				Cookie: request.headers.get('Cookie') || ''
			}
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		const finds = await response.json();

		return {
			finds
		};
	} catch (err) {
		console.error('Error loading finds:', err);
		return {
			finds: []
		};
	}
};
