import { db } from './db';
import { notification, notificationPreferences } from './db/schema';
import type { NotificationInsert } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type NotificationType =
	| 'friend_request'
	| 'friend_accepted'
	| 'find_liked'
	| 'find_commented';

export interface CreateNotificationData {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	data?: Record<string, unknown>;
}

export interface GetNotificationsOptions {
	limit?: number;
	offset?: number;
	unreadOnly?: boolean;
}

export class NotificationService {
	/**
	 * Create a new notification record in the database
	 */
	async createNotification(data: CreateNotificationData): Promise<void> {
		const notificationData: NotificationInsert = {
			id: nanoid(),
			userId: data.userId,
			type: data.type,
			title: data.title,
			message: data.message,
			data: data.data || null,
			isRead: false
		};

		await db.insert(notification).values(notificationData);
	}

	/**
	 * Check if user has notifications enabled for a specific type
	 */
	async shouldNotify(userId: string, type: NotificationType): Promise<boolean> {
		const prefs = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, userId))
			.limit(1);

		// If no preferences exist, default to true
		if (prefs.length === 0) {
			return true;
		}

		const pref = prefs[0];

		// Check if push is enabled and specific notification type is enabled
		if (!pref.pushEnabled) {
			return false;
		}

		switch (type) {
			case 'friend_request':
				return pref.friendRequests ?? true;
			case 'friend_accepted':
				return pref.friendAccepted ?? true;
			case 'find_liked':
				return pref.findLiked ?? true;
			case 'find_commented':
				return pref.findCommented ?? true;
			default:
				return true;
		}
	}

	/**
	 * Get user notifications with pagination and filtering
	 */
	async getUserNotifications(userId: string, options: GetNotificationsOptions = {}) {
		const { limit = 20, offset = 0, unreadOnly = false } = options;

		let query = db
			.select()
			.from(notification)
			.where(eq(notification.userId, userId))
			.orderBy(desc(notification.createdAt))
			.limit(limit)
			.offset(offset);

		if (unreadOnly) {
			query = db
				.select()
				.from(notification)
				.where(and(eq(notification.userId, userId), eq(notification.isRead, false)))
				.orderBy(desc(notification.createdAt))
				.limit(limit)
				.offset(offset);
		}

		return await query;
	}

	/**
	 * Mark notifications as read
	 */
	async markAsRead(notificationIds: string[]): Promise<void> {
		for (const id of notificationIds) {
			await db.update(notification).set({ isRead: true }).where(eq(notification.id, id));
		}
	}

	/**
	 * Mark a single notification as read
	 */
	async markOneAsRead(notificationId: string): Promise<void> {
		await db.update(notification).set({ isRead: true }).where(eq(notification.id, notificationId));
	}

	/**
	 * Mark all notifications as read for a user
	 */
	async markAllAsRead(userId: string): Promise<void> {
		await db.update(notification).set({ isRead: true }).where(eq(notification.userId, userId));
	}

	/**
	 * Get unread notification count for a user
	 */
	async getUnreadCount(userId: string): Promise<number> {
		const notifications = await db
			.select()
			.from(notification)
			.where(and(eq(notification.userId, userId), eq(notification.isRead, false)));

		return notifications.length;
	}

	/**
	 * Delete a notification
	 */
	async deleteNotification(notificationId: string, userId: string): Promise<void> {
		await db
			.delete(notification)
			.where(and(eq(notification.id, notificationId), eq(notification.userId, userId)));
	}

	/**
	 * Delete all notifications for a user
	 */
	async deleteAllNotifications(userId: string): Promise<void> {
		await db.delete(notification).where(eq(notification.userId, userId));
	}
}

export const notificationService = new NotificationService();
