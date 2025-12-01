import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { find, findMedia } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteFromR2 } from '$lib/server/r2';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { findId, mediaId } = params;

	if (!findId || !mediaId) {
		throw error(400, 'Find ID and Media ID are required');
	}

	try {
		// First, verify the find exists and user owns it
		const existingFind = await db
			.select({ userId: find.userId })
			.from(find)
			.where(eq(find.id, findId))
			.limit(1);

		if (existingFind.length === 0) {
			throw error(404, 'Find not found');
		}

		if (existingFind[0].userId !== locals.user.id) {
			throw error(403, 'You do not have permission to delete this media');
		}

		// Get the media item to delete
		const mediaItem = await db
			.select({ url: findMedia.url, thumbnailUrl: findMedia.thumbnailUrl })
			.from(findMedia)
			.where(and(eq(findMedia.id, mediaId), eq(findMedia.findId, findId)))
			.limit(1);

		if (mediaItem.length === 0) {
			throw error(404, 'Media not found');
		}

		// Delete from R2 storage
		try {
			await deleteFromR2(mediaItem[0].url);
			if (mediaItem[0].thumbnailUrl && !mediaItem[0].thumbnailUrl.startsWith('/')) {
				await deleteFromR2(mediaItem[0].thumbnailUrl);
			}
		} catch (err) {
			console.error('Error deleting media from R2:', err);
			// Continue even if R2 deletion fails
		}

		// Delete from database
		await db.delete(findMedia).where(eq(findMedia.id, mediaId));

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting media:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to delete media');
	}
};
