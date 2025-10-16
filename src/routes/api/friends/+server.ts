import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { friendship, user } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';
import { getSignedR2Url } from '$lib/server/r2';

function generateFriendshipId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase64url(bytes);
}

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const status = url.searchParams.get('status') || 'accepted';
	const type = url.searchParams.get('type') || 'friends'; // 'friends', 'sent', 'received'

	try {
		let friendships;

		if (type === 'friends') {
			// Get accepted friendships where user is either sender or receiver
			friendships = await db
				.select({
					id: friendship.id,
					userId: friendship.userId,
					friendId: friendship.friendId,
					status: friendship.status,
					createdAt: friendship.createdAt,
					friendUsername: user.username,
					friendProfilePictureUrl: user.profilePictureUrl
				})
				.from(friendship)
				.innerJoin(
					user,
					or(
						and(eq(friendship.friendId, user.id), eq(friendship.userId, locals.user.id)),
						and(eq(friendship.userId, user.id), eq(friendship.friendId, locals.user.id))
					)
				)
				.where(
					and(
						eq(friendship.status, status),
						or(eq(friendship.userId, locals.user.id), eq(friendship.friendId, locals.user.id))
					)
				);
		} else if (type === 'sent') {
			// Get friend requests sent by current user
			friendships = await db
				.select({
					id: friendship.id,
					userId: friendship.userId,
					friendId: friendship.friendId,
					status: friendship.status,
					createdAt: friendship.createdAt,
					friendUsername: user.username,
					friendProfilePictureUrl: user.profilePictureUrl
				})
				.from(friendship)
				.innerJoin(user, eq(friendship.friendId, user.id))
				.where(and(eq(friendship.userId, locals.user.id), eq(friendship.status, status)));
		} else if (type === 'received') {
			// Get friend requests received by current user
			friendships = await db
				.select({
					id: friendship.id,
					userId: friendship.userId,
					friendId: friendship.friendId,
					status: friendship.status,
					createdAt: friendship.createdAt,
					friendUsername: user.username,
					friendProfilePictureUrl: user.profilePictureUrl
				})
				.from(friendship)
				.innerJoin(user, eq(friendship.userId, user.id))
				.where(and(eq(friendship.friendId, locals.user.id), eq(friendship.status, status)));
		}

		// Generate signed URLs for profile pictures
		const friendshipsWithSignedUrls = await Promise.all(
			(friendships || []).map(async (friendship) => {
				let profilePictureUrl = friendship.friendProfilePictureUrl;
				if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
					try {
						profilePictureUrl = await getSignedR2Url(profilePictureUrl, 24 * 60 * 60);
					} catch (error) {
						console.error('Failed to generate signed URL for profile picture:', error);
						profilePictureUrl = null;
					}
				}

				return {
					...friendship,
					friendProfilePictureUrl: profilePictureUrl
				};
			})
		);

		return json(friendshipsWithSignedUrls);
	} catch (err) {
		console.error('Error loading friendships:', err);
		throw error(500, 'Failed to load friendships');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { friendId } = data;

	if (!friendId) {
		throw error(400, 'Friend ID is required');
	}

	if (friendId === locals.user.id) {
		throw error(400, 'Cannot send friend request to yourself');
	}

	try {
		// Check if friend exists
		const friendExists = await db.select().from(user).where(eq(user.id, friendId)).limit(1);
		if (friendExists.length === 0) {
			throw error(404, 'User not found');
		}

		// Check if friendship already exists
		const existingFriendship = await db
			.select()
			.from(friendship)
			.where(
				or(
					and(eq(friendship.userId, locals.user.id), eq(friendship.friendId, friendId)),
					and(eq(friendship.userId, friendId), eq(friendship.friendId, locals.user.id))
				)
			)
			.limit(1);

		if (existingFriendship.length > 0) {
			const status = existingFriendship[0].status;
			if (status === 'accepted') {
				throw error(400, 'Already friends');
			} else if (status === 'pending') {
				throw error(400, 'Friend request already sent');
			} else if (status === 'blocked') {
				throw error(400, 'Cannot send friend request');
			}
		}

		// Create new friend request
		const newFriendship = await db
			.insert(friendship)
			.values({
				id: generateFriendshipId(),
				userId: locals.user.id,
				friendId,
				status: 'pending'
			})
			.returning();

		return json({ success: true, friendship: newFriendship[0] });
	} catch (err) {
		console.error('Error sending friend request:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to send friend request');
	}
};
