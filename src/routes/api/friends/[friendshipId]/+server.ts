import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { friendship } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { friendshipId } = params;
	const data = await request.json();
	const { action } = data; // 'accept', 'decline', 'block'

	if (!friendshipId) {
		throw error(400, 'Friendship ID is required');
	}

	if (!action || !['accept', 'decline', 'block'].includes(action)) {
		throw error(400, 'Valid action is required (accept, decline, block)');
	}

	try {
		// Find the friendship
		const existingFriendship = await db
			.select()
			.from(friendship)
			.where(eq(friendship.id, friendshipId))
			.limit(1);

		if (existingFriendship.length === 0) {
			throw error(404, 'Friendship not found');
		}

		const friendshipRecord = existingFriendship[0];

		// Check if user is authorized to modify this friendship
		// User can only accept/decline requests sent TO them, or cancel requests they sent
		const isReceiver = friendshipRecord.friendId === locals.user.id;
		const isSender = friendshipRecord.userId === locals.user.id;

		if (!isReceiver && !isSender) {
			throw error(403, 'Not authorized to modify this friendship');
		}

		// Only receivers can accept or decline pending requests
		if ((action === 'accept' || action === 'decline') && !isReceiver) {
			throw error(403, 'Only the recipient can accept or decline friend requests');
		}

		// Only accept pending requests
		if (action === 'accept' && friendshipRecord.status !== 'pending') {
			throw error(400, 'Can only accept pending friend requests');
		}

		let newStatus: string;
		if (action === 'accept') {
			newStatus = 'accepted';
		} else if (action === 'decline') {
			newStatus = 'declined';
		} else if (action === 'block') {
			newStatus = 'blocked';
		} else {
			throw error(400, 'Invalid action');
		}

		// Update the friendship status
		const updatedFriendship = await db
			.update(friendship)
			.set({ status: newStatus })
			.where(eq(friendship.id, friendshipId))
			.returning();

		return json({ success: true, friendship: updatedFriendship[0] });
	} catch (err) {
		console.error('Error updating friendship:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update friendship');
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { friendshipId } = params;

	if (!friendshipId) {
		throw error(400, 'Friendship ID is required');
	}

	try {
		// Find the friendship
		const existingFriendship = await db
			.select()
			.from(friendship)
			.where(eq(friendship.id, friendshipId))
			.limit(1);

		if (existingFriendship.length === 0) {
			throw error(404, 'Friendship not found');
		}

		const friendshipRecord = existingFriendship[0];

		// Check if user is part of this friendship
		if (
			friendshipRecord.userId !== locals.user.id &&
			friendshipRecord.friendId !== locals.user.id
		) {
			throw error(403, 'Not authorized to delete this friendship');
		}

		// Delete the friendship
		await db.delete(friendship).where(eq(friendship.id, friendshipId));

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting friendship:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to delete friendship');
	}
};
