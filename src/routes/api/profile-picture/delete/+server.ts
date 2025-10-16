import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteFromR2 } from '$lib/server/r2';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		// Get current user to find profile picture URL
		const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);

		if (!currentUser.length) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const userRecord = currentUser[0];

		if (!userRecord.profilePictureUrl) {
			return json({ error: 'No profile picture to delete' }, { status: 400 });
		}

		// Extract the base path from the stored URL (should be like users/123/profile-1234567890-abcdef.webp)
		const basePath = userRecord.profilePictureUrl.replace('.webp', '');

		// Delete all variants (WebP and JPEG, main and thumbnails)
		const deletePromises = [
			deleteFromR2(`${basePath}.webp`),
			deleteFromR2(`${basePath}.jpg`),
			deleteFromR2(`${basePath}-thumb.webp`),
			deleteFromR2(`${basePath}-thumb.jpg`)
		];

		// Execute all deletions, but don't fail if some files don't exist
		await Promise.allSettled(deletePromises);

		// Update user profile picture URL in database
		await db.update(user).set({ profilePictureUrl: null }).where(eq(user.id, userId));

		return json({ success: true });
	} catch (error) {
		console.error('Profile picture delete error:', error);
		return json({ error: 'Failed to delete profile picture' }, { status: 500 });
	}
};
