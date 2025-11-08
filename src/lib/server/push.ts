import webpush from 'web-push';
import { db } from './db';
import { notificationSubscription } from './db/schema';
import type { NotificationSubscriptionInsert } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
	VAPID_PUBLIC_KEY,
	VAPID_PRIVATE_KEY,
	VAPID_SUBJECT
} from '$env/static/private';

// Initialize web-push with VAPID keys
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
	throw new Error(
		'VAPID keys are not configured. Please set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in your environment variables.'
	);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushSubscriptionData {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

export interface PushNotificationPayload {
	title: string;
	message: string;
	data?: Record<string, unknown>;
	icon?: string;
	badge?: string;
	tag?: string;
	url?: string;
}

export class PushService {
	/**
	 * Save a push subscription for a user
	 */
	async saveSubscription(
		userId: string,
		subscription: PushSubscriptionData,
		userAgent?: string
	): Promise<void> {
		const subscriptionData: NotificationSubscriptionInsert = {
			id: nanoid(),
			userId,
			endpoint: subscription.endpoint,
			p256dhKey: subscription.keys.p256dh,
			authKey: subscription.keys.auth,
			userAgent: userAgent || null,
			isActive: true
		};

		// Check if subscription already exists
		const existing = await db
			.select()
			.from(notificationSubscription)
			.where(eq(notificationSubscription.endpoint, subscription.endpoint))
			.limit(1);

		if (existing.length > 0) {
			// Update existing subscription
			await db
				.update(notificationSubscription)
				.set({
					p256dhKey: subscription.keys.p256dh,
					authKey: subscription.keys.auth,
					userAgent: userAgent || null,
					isActive: true,
					updatedAt: new Date()
				})
				.where(eq(notificationSubscription.endpoint, subscription.endpoint));
		} else {
			// Insert new subscription
			await db.insert(notificationSubscription).values(subscriptionData);
		}
	}

	/**
	 * Remove a push subscription
	 */
	async removeSubscription(userId: string, endpoint: string): Promise<void> {
		await db
			.delete(notificationSubscription)
			.where(
				and(eq(notificationSubscription.userId, userId), eq(notificationSubscription.endpoint, endpoint))
			);
	}

	/**
	 * Get all active subscriptions for a user
	 */
	async getUserSubscriptions(userId: string) {
		return await db
			.select()
			.from(notificationSubscription)
			.where(
				and(eq(notificationSubscription.userId, userId), eq(notificationSubscription.isActive, true))
			);
	}

	/**
	 * Send push notification to a user's subscriptions
	 */
	async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
		const subscriptions = await this.getUserSubscriptions(userId);

		if (subscriptions.length === 0) {
			console.log(`No active subscriptions found for user ${userId}`);
			return;
		}

		const notificationPayload = JSON.stringify({
			title: payload.title,
			body: payload.message,
			icon: payload.icon || '/logo.svg',
			badge: payload.badge || '/logo.svg',
			tag: payload.tag,
			data: {
				url: payload.url || '/',
				...payload.data
			}
		});

		const sendPromises = subscriptions.map(async (sub) => {
			const pushSubscription: webpush.PushSubscription = {
				endpoint: sub.endpoint,
				keys: {
					p256dh: sub.p256dhKey,
					auth: sub.authKey
				}
			};

			try {
				await webpush.sendNotification(pushSubscription, notificationPayload);
			} catch (error) {
				console.error(`Failed to send push notification to ${sub.endpoint}:`, error);

				// If the subscription is invalid (410 Gone or 404), deactivate it
				if (error instanceof Error && 'statusCode' in error) {
					const statusCode = (error as { statusCode: number }).statusCode;
					if (statusCode === 410 || statusCode === 404) {
						await db
							.update(notificationSubscription)
							.set({ isActive: false })
							.where(eq(notificationSubscription.id, sub.id));
					}
				}
			}
		});

		await Promise.all(sendPromises);
	}

	/**
	 * Send push notification to multiple users
	 */
	async sendPushNotificationToUsers(
		userIds: string[],
		payload: PushNotificationPayload
	): Promise<void> {
		const sendPromises = userIds.map((userId) => this.sendPushNotification(userId, payload));
		await Promise.all(sendPromises);
	}

	/**
	 * Deactivate a subscription
	 */
	async deactivateSubscription(endpoint: string): Promise<void> {
		await db
			.update(notificationSubscription)
			.set({ isActive: false })
			.where(eq(notificationSubscription.endpoint, endpoint));
	}
}

export const pushService = new PushService();
export { VAPID_PUBLIC_KEY };
