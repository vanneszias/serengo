import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch friends, sent requests, and received requests in parallel
		const [friendsResponse, sentResponse, receivedResponse] = await Promise.all([
			fetch('/api/friends?type=friends&status=accepted'),
			fetch('/api/friends?type=sent&status=pending'),
			fetch('/api/friends?type=received&status=pending')
		]);

		if (!friendsResponse.ok || !sentResponse.ok || !receivedResponse.ok) {
			throw error(500, 'Failed to load friends data');
		}

		const [friends, sentRequests, receivedRequests] = await Promise.all([
			friendsResponse.json(),
			sentResponse.json(),
			receivedResponse.json()
		]);

		return {
			friends,
			sentRequests,
			receivedRequests
		};
	} catch (err) {
		console.error('Error loading friends page:', err);
		throw error(500, 'Failed to load friends');
	}
};
