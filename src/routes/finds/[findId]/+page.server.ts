import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, url, request }) => {
	const findId = params.findId;

	if (!findId) {
		throw error(400, 'Find ID is required');
	}

	try {
		// Build API URL
		const apiUrl = new URL(`/api/finds/${findId}`, url.origin);

		// Fetch the find data - no auth required for public finds
		const response = await fetch(apiUrl.toString(), {
			headers: {
				Cookie: request.headers.get('Cookie') || ''
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Find not found');
			} else if (response.status === 403) {
				throw error(403, 'This find is private');
			}
			throw error(response.status, 'Failed to load find');
		}

		const find = await response.json();

		return {
			find
		};
	} catch (err) {
		console.error('Error loading find:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load find');
	}
};
