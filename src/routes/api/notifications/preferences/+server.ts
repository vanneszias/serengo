import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { notificationPreferences } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch user's notification preferences
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get user's preferences
		const [preferences] = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, locals.user.id))
			.limit(1);

		// If no preferences exist, return defaults
		if (!preferences) {
			return json({
				friendRequests: true,
				friendAccepted: true,
				findLiked: true,
				findCommented: true,
				pushEnabled: true
			});
		}

		return json({
			friendRequests: preferences.friendRequests,
			friendAccepted: preferences.friendAccepted,
			findLiked: preferences.findLiked,
			findCommented: preferences.findCommented,
			pushEnabled: preferences.pushEnabled
		});
	} catch (err) {
		console.error('Error fetching notification preferences:', err);
		throw error(500, 'Failed to fetch notification preferences');
	}
};

// POST - Update user's notification preferences
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const { friendRequests, friendAccepted, findLiked, findCommented, pushEnabled } = body;

		// Validate boolean values
		const preferences = {
			friendRequests: typeof friendRequests === 'boolean' ? friendRequests : true,
			friendAccepted: typeof friendAccepted === 'boolean' ? friendAccepted : true,
			findLiked: typeof findLiked === 'boolean' ? findLiked : true,
			findCommented: typeof findCommented === 'boolean' ? findCommented : true,
			pushEnabled: typeof pushEnabled === 'boolean' ? pushEnabled : true
		};

		// Check if preferences exist
		const [existing] = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, locals.user.id))
			.limit(1);

		if (existing) {
			// Update existing preferences
			await db
				.update(notificationPreferences)
				.set({
					...preferences,
					updatedAt: new Date()
				})
				.where(eq(notificationPreferences.userId, locals.user.id));
		} else {
			// Create new preferences
			await db.insert(notificationPreferences).values({
				userId: locals.user.id,
				...preferences
			});
		}

		return json({ success: true, preferences });
	} catch (err) {
		console.error('Error updating notification preferences:', err);
		throw error(500, 'Failed to update notification preferences');
	}
};
