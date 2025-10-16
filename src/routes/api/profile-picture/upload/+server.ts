import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processAndUploadProfilePicture } from '$lib/server/media-processor';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const userId = formData.get('userId') as string;

		if (!file || !userId) {
			return json({ error: 'File and userId are required' }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			return json({ error: 'File size must be less than 5MB' }, { status: 400 });
		}

		// Process and upload profile picture
		const result = await processAndUploadProfilePicture(file, userId);

		// Update user profile picture URL in database (store the WebP path)
		await db.update(user).set({ profilePictureUrl: result.url }).where(eq(user.id, userId));

		return json({
			success: true,
			profilePictureUrl: result.url,
			thumbnailUrl: result.thumbnailUrl,
			fallbackUrl: result.fallbackUrl,
			fallbackThumbnailUrl: result.fallbackThumbnailUrl
		});
	} catch (error) {
		console.error('Profile picture upload error:', error);
		return json({ error: 'Failed to upload profile picture' }, { status: 500 });
	}
};
