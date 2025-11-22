import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { find, findMedia, user, findLike, findComment } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getLocalR2Url } from '$lib/server/r2';

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
