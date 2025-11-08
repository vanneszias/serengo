import { json, type RequestHandler } from '@sveltejs/kit';
import { pushService, VAPID_PUBLIC_KEY } from '$lib/server/push';

// GET /api/notifications/subscribe - Get VAPID public key
export const GET: RequestHandler = async () => {
	return json({ publicKey: VAPID_PUBLIC_KEY });
};

// POST /api/notifications/subscribe - Subscribe to push notifications
export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { subscription } = await request.json();
		const userAgent = request.headers.get('user-agent') || undefined;

		if (!subscription || !subscription.endpoint || !subscription.keys) {
			return json({ error: 'Invalid subscription data' }, { status: 400 });
		}

		await pushService.saveSubscription(user.id, subscription, userAgent);

		return json({ success: true });
	} catch (error) {
		console.error('Error saving subscription:', error);
		return json({ error: 'Failed to save subscription' }, { status: 500 });
	}
};

// DELETE /api/notifications/subscribe - Unsubscribe from push notifications
export const DELETE: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { endpoint } = await request.json();

		if (!endpoint) {
			return json({ error: 'Endpoint is required' }, { status: 400 });
		}

		await pushService.removeSubscription(user.id, endpoint);

		return json({ success: true });
	} catch (error) {
		console.error('Error removing subscription:', error);
		return json({ error: 'Failed to remove subscription' }, { status: 500 });
	}
};
