import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { find, findMedia, user, findLike, findComment } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getLocalR2Url, deleteFromR2 } from '$lib/server/r2';

export const GET: RequestHandler = async ({ params, locals }) => {
	const findId = params.findId;

	if (!findId) {
		throw error(400, 'Find ID is required');
	}

	try {
		// Get the find with user info and like count
		const findResult = await db
			.select({
				id: find.id,
				title: find.title,
				description: find.description,
				latitude: find.latitude,
				longitude: find.longitude,
				locationName: find.locationName,
				category: find.category,
				isPublic: find.isPublic,
				createdAt: find.createdAt,
				userId: find.userId,
				username: user.username,
				profilePictureUrl: user.profilePictureUrl,
				likeCount: sql<number>`COALESCE(COUNT(DISTINCT ${findLike.id}), 0)`,
				commentCount: sql<number>`COALESCE((
					SELECT COUNT(*) FROM ${findComment}
					WHERE ${findComment.findId} = ${find.id}
				), 0)`,
				isLikedByUser: locals.user
					? sql<boolean>`CASE WHEN EXISTS(
						SELECT 1 FROM ${findLike}
						WHERE ${findLike.findId} = ${find.id}
						AND ${findLike.userId} = ${locals.user.id}
					) THEN 1 ELSE 0 END`
					: sql<boolean>`0`
			})
			.from(find)
			.innerJoin(user, eq(find.userId, user.id))
			.leftJoin(findLike, eq(find.id, findLike.findId))
			.where(eq(find.id, findId))
			.groupBy(find.id, user.username, user.profilePictureUrl)
			.limit(1);

		if (findResult.length === 0) {
			throw error(404, 'Find not found');
		}

		const findData = findResult[0];

		// Check if the find is public or if user has access
		const isOwner = locals.user && findData.userId === locals.user.id;
		const isPublic = findData.isPublic === 1;

		if (!isPublic && !isOwner) {
			throw error(403, 'This find is private');
		}

		// Get media for the find
		const media = await db
			.select({
				id: findMedia.id,
				findId: findMedia.findId,
				type: findMedia.type,
				url: findMedia.url,
				thumbnailUrl: findMedia.thumbnailUrl,
				orderIndex: findMedia.orderIndex
			})
			.from(findMedia)
			.where(eq(findMedia.findId, findId))
			.orderBy(findMedia.orderIndex);

		// Generate signed URLs for media
		const mediaWithSignedUrls = await Promise.all(
			media.map(async (mediaItem) => {
				const localUrl = getLocalR2Url(mediaItem.url);
				const localThumbnailUrl =
					mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.startsWith('/')
						? getLocalR2Url(mediaItem.thumbnailUrl)
						: mediaItem.thumbnailUrl;

				return {
					...mediaItem,
					url: localUrl,
					thumbnailUrl: localThumbnailUrl
				};
			})
		);

		// Generate local proxy URL for user profile picture
		let userProfilePictureUrl = findData.profilePictureUrl;
		if (userProfilePictureUrl && !userProfilePictureUrl.startsWith('http')) {
			userProfilePictureUrl = getLocalR2Url(userProfilePictureUrl);
		}

		return json({
			...findData,
			profilePictureUrl: userProfilePictureUrl,
			media: mediaWithSignedUrls,
			isLikedByUser: Boolean(findData.isLikedByUser)
		});
	} catch (err) {
		console.error('Error loading find:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load find');
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const findId = params.findId;

	if (!findId) {
		throw error(400, 'Find ID is required');
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
			throw error(403, 'You do not have permission to edit this find');
		}

		// Parse request body
		const data = await request.json();
		const {
			title,
			description,
			latitude,
			longitude,
			locationName,
			category,
			isPublic,
			media,
			mediaToDelete
		} = data;

		// Validate required fields
		if (!title || !latitude || !longitude) {
			throw error(400, 'Title, latitude, and longitude are required');
		}

		if (title.length > 100) {
			throw error(400, 'Title must be 100 characters or less');
		}

		if (description && description.length > 500) {
			throw error(400, 'Description must be 500 characters or less');
		}

		// Delete media items if specified
		if (mediaToDelete && Array.isArray(mediaToDelete) && mediaToDelete.length > 0) {
			// Get media URLs before deleting from database
			const mediaToRemove = await db
				.select({ url: findMedia.url, thumbnailUrl: findMedia.thumbnailUrl })
				.from(findMedia)
				.where(
					sql`${findMedia.id} IN (${sql.join(
						mediaToDelete.map((id: string) => sql`${id}`),
						sql`, `
					)})`
				);

			// Delete from R2 storage
			for (const mediaItem of mediaToRemove) {
				try {
					await deleteFromR2(mediaItem.url);
					if (mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.startsWith('/')) {
						await deleteFromR2(mediaItem.thumbnailUrl);
					}
				} catch (err) {
					console.error('Error deleting media from R2:', err);
					// Continue even if R2 deletion fails
				}
			}

			// Delete from database
			await db.delete(findMedia).where(
				sql`${findMedia.id} IN (${sql.join(
					mediaToDelete.map((id: string) => sql`${id}`),
					sql`, `
				)})`
			);
		}

		// Update the find
		const updatedFind = await db
			.update(find)
			.set({
				title,
				description: description || null,
				latitude: latitude.toString(),
				longitude: longitude.toString(),
				locationName: locationName || null,
				category: category || null,
				isPublic: isPublic ? 1 : 0,
				updatedAt: new Date()
			})
			.where(eq(find.id, findId))
			.returning();

		// Add new media records if provided
		if (media && Array.isArray(media) && media.length > 0) {
			const newMediaRecords = media
				.filter((item: { id?: string }) => !item.id) // Only insert media without IDs (new uploads)
				.map((item: { type: string; url: string; thumbnailUrl?: string }, index: number) => ({
					id: crypto.randomUUID(),
					findId,
					type: item.type,
					url: item.url,
					thumbnailUrl: item.thumbnailUrl || null,
					orderIndex: index
				}));

			if (newMediaRecords.length > 0) {
				await db.insert(findMedia).values(newMediaRecords);
			}
		}

		return json({ success: true, find: updatedFind[0] });
	} catch (err) {
		console.error('Error updating find:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update find');
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const findId = params.findId;

	if (!findId) {
		throw error(400, 'Find ID is required');
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
			throw error(403, 'You do not have permission to delete this find');
		}

		// Get all media for this find to delete from R2
		const mediaItems = await db
			.select({ url: findMedia.url, thumbnailUrl: findMedia.thumbnailUrl })
			.from(findMedia)
			.where(eq(findMedia.findId, findId));

		// Delete media from R2 storage
		for (const mediaItem of mediaItems) {
			try {
				await deleteFromR2(mediaItem.url);
				if (mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.startsWith('/')) {
					await deleteFromR2(mediaItem.thumbnailUrl);
				}
			} catch (err) {
				console.error('Error deleting media from R2:', err);
				// Continue even if R2 deletion fails
			}
		}

		// Delete the find (cascade will handle media, likes, and comments)
		await db.delete(find).where(eq(find.id, findId));

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting find:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to delete find');
	}
};
