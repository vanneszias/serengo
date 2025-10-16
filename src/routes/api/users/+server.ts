import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user, friendship } from '$lib/server/db/schema';
import { eq, and, or, ilike, ne } from 'drizzle-orm';
import { getSignedR2Url } from '$lib/server/r2';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const query = url.searchParams.get('q');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	if (!query || query.trim().length < 2) {
		throw error(400, 'Search query must be at least 2 characters');
	}

	try {
		// Search for users by username, excluding current user
		const users = await db
			.select({
				id: user.id,
				username: user.username,
				profilePictureUrl: user.profilePictureUrl
			})
			.from(user)
			.where(and(ilike(user.username, `%${query.trim()}%`), ne(user.id, locals.user.id)))
			.limit(Math.min(limit, 50));

		// Get existing friendships to determine relationship status
		const userIds = users.map((u) => u.id);
		let existingFriendships: Array<{
			userId: string;
			friendId: string;
			status: string;
		}> = [];

		if (userIds.length > 0) {
			existingFriendships = await db
				.select({
					userId: friendship.userId,
					friendId: friendship.friendId,
					status: friendship.status
				})
				.from(friendship)
				.where(
					or(
						and(
							eq(friendship.userId, locals.user.id),
							or(...userIds.map((id) => eq(friendship.friendId, id)))
						),
						and(
							eq(friendship.friendId, locals.user.id),
							or(...userIds.map((id) => eq(friendship.userId, id)))
						)
					)
				);
		}

		// Create a map of friendship statuses
		const friendshipStatusMap = new Map<string, string>();
		existingFriendships.forEach((f) => {
			const otherUserId = f.userId === locals.user!.id ? f.friendId : f.userId;
			friendshipStatusMap.set(otherUserId, f.status);
		});

		// Generate signed URLs and add friendship status
		const usersWithSignedUrls = await Promise.all(
			users.map(async (userItem) => {
				let profilePictureUrl = userItem.profilePictureUrl;
				if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
					try {
						profilePictureUrl = await getSignedR2Url(profilePictureUrl, 24 * 60 * 60);
					} catch (error) {
						console.error('Failed to generate signed URL for profile picture:', error);
						profilePictureUrl = null;
					}
				}

				const friendshipStatus = friendshipStatusMap.get(userItem.id) || 'none';

				return {
					...userItem,
					profilePictureUrl,
					friendshipStatus
				};
			})
		);

		return json(usersWithSignedUrls);
	} catch (err) {
		console.error('Error searching users:', err);
		throw error(500, 'Failed to search users');
	}
};
