import { json, type RequestHandler } from '@sveltejs/kit';
import { notificationService } from '$lib/server/notifications';

// GET /api/notifications - Get user notifications
export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

	try {
		const notifications = await notificationService.getUserNotifications(user.id, {
			limit,
			offset,
			unreadOnly
		});

		return json({ notifications });
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return json({ error: 'Failed to fetch notifications' }, { status: 500 });
	}
};

// PATCH /api/notifications - Mark notifications as read
export const PATCH: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { notificationIds, markAll } = await request.json();

		if (markAll) {
			await notificationService.markAllAsRead(user.id);
		} else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
			await notificationService.markAsRead(notificationIds);
		} else {
			return json(
				{ error: 'Invalid request: provide notificationIds or markAll' },
				{ status: 400 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error marking notifications as read:', error);
		return json({ error: 'Failed to mark notifications as read' }, { status: 500 });
	}
};

// DELETE /api/notifications - Delete notifications
export const DELETE: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { notificationId, deleteAll } = await request.json();

		if (deleteAll) {
			await notificationService.deleteAllNotifications(user.id);
		} else if (notificationId) {
			await notificationService.deleteNotification(notificationId, user.id);
		} else {
			return json(
				{ error: 'Invalid request: provide notificationId or deleteAll' },
				{ status: 400 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting notifications:', error);
		return json({ error: 'Failed to delete notifications' }, { status: 500 });
	}
};
