import { json, type RequestHandler } from '@sveltejs/kit';
import { notificationService } from '$lib/server/notifications';

// GET /api/notifications/count - Get unread notification count
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const count = await notificationService.getUnreadCount(user.id);
		return json({ count });
	} catch (error) {
		console.error('Error fetching unread count:', error);
		return json({ error: 'Failed to fetch unread count' }, { status: 500 });
	}
};
