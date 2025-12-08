import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { location, find, findMedia, user, findLike, friendship } from '$lib/server/db/schema';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';
import { getLocalR2Url } from '$lib/server/r2';

function generateId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase64url(bytes);
}

// GET endpoint now returns finds for a specific location
export const GET: RequestHandler = async ({ url, locals }) => {
	const locationId = url.searchParams.get('locationId');
	const includePrivate = url.searchParams.get('includePrivate') === 'true';
	const order = url.searchParams.get('order') || 'desc';
	const includeFriends = url.searchParams.get('includeFriends') === 'true';

	if (!locationId) {
		throw error(400, 'locationId is required');
	}

	try {
		// Get user's friends if needed and user is logged in
		let friendIds: string[] = [];
		if (locals.user && (includeFriends || includePrivate)) {
			const friendships = await db
				.select({
					userId: friendship.userId,
					friendId: friendship.friendId
				})
				.from(friendship)
				.where(
					and(
						eq(friendship.status, 'accepted'),
						or(eq(friendship.userId, locals.user.id), eq(friendship.friendId, locals.user.id))
					)
				);

			friendIds = friendships.map((f) => (f.userId === locals.user!.id ? f.friendId : f.userId));
		}

		// Build privacy conditions
		const conditions = [sql`${find.isPublic} = 1`]; // Always include public finds

		if (locals.user && includePrivate) {
			// Include user's own finds (both public and private)
			conditions.push(sql`${find.userId} = ${locals.user.id}`);
		}

		if (locals.user && includeFriends && friendIds.length > 0) {
			// Include friends' finds (both public and private)
			conditions.push(
				sql`${find.userId} IN (${sql.join(
					friendIds.map((id) => sql`${id}`),
					sql`, `
				)})`
			);
		}

		const privacyCondition = sql`(${sql.join(conditions, sql` OR `)})`;
		const whereConditions = and(eq(find.locationId, locationId), privacyCondition);

		// Get all finds at this location with filtering, like counts, and user's liked status
		const finds = await db
			.select({
				id: find.id,
				locationId: find.locationId,
				title: find.title,
				description: find.description,
				locationName: find.locationName,
				category: find.category,
				isPublic: find.isPublic,
				createdAt: find.createdAt,
				userId: find.userId,
				username: user.username,
				profilePictureUrl: user.profilePictureUrl,
				likeCount: sql<number>`COALESCE(COUNT(DISTINCT ${findLike.id}), 0)`,
				isLikedByUser: locals.user
					? sql<boolean>`CASE WHEN EXISTS(
						SELECT 1 FROM ${findLike}
						WHERE ${findLike.findId} = ${find.id}
						AND ${findLike.userId} = ${locals.user.id}
					) THEN 1 ELSE 0 END`
					: sql<boolean>`0`,
				isFromFriend: locals.user
					? sql<boolean>`CASE WHEN ${
							friendIds.length > 0
								? sql`${find.userId} IN (${sql.join(
										friendIds.map((id) => sql`${id}`),
										sql`, `
									)})`
								: sql`FALSE`
						} THEN 1 ELSE 0 END`
					: sql<boolean>`0`
			})
			.from(find)
			.innerJoin(user, eq(find.userId, user.id))
			.leftJoin(findLike, eq(find.id, findLike.findId))
			.where(whereConditions)
			.groupBy(find.id, user.username, user.profilePictureUrl)
			.orderBy(order === 'desc' ? desc(find.createdAt) : find.createdAt);

		// Get media for all finds
		const findIds = finds.map((f) => f.id);
		let media: Array<{
			id: string;
			findId: string;
			type: string;
			url: string;
			thumbnailUrl: string | null;
			orderIndex: number | null;
		}> = [];

		if (findIds.length > 0) {
			media = await db
				.select({
					id: findMedia.id,
					findId: findMedia.findId,
					type: findMedia.type,
					url: findMedia.url,
					thumbnailUrl: findMedia.thumbnailUrl,
					orderIndex: findMedia.orderIndex
				})
				.from(findMedia)
				.where(
					sql`${findMedia.findId} IN (${sql.join(
						findIds.map((id) => sql`${id}`),
						sql`, `
					)})`
				)
				.orderBy(findMedia.orderIndex);
		}

		// Group media by find
		const mediaByFind = media.reduce(
			(acc, item) => {
				if (!acc[item.findId]) {
					acc[item.findId] = [];
				}
				acc[item.findId].push(item);
				return acc;
			},
			{} as Record<string, typeof media>
		);

		// Combine finds with their media and generate signed URLs
		const findsWithMedia = await Promise.all(
			finds.map(async (findItem) => {
				const findMedia = mediaByFind[findItem.id] || [];

				// Generate signed URLs for all media items
				const mediaWithSignedUrls = await Promise.all(
					findMedia.map(async (mediaItem) => {
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

				// Generate local proxy URL for user profile picture if it exists
				let userProfilePictureUrl = findItem.profilePictureUrl;
				if (userProfilePictureUrl && !userProfilePictureUrl.startsWith('http')) {
					userProfilePictureUrl = getLocalR2Url(userProfilePictureUrl);
				}

				return {
					...findItem,
					profilePictureUrl: userProfilePictureUrl,
					media: mediaWithSignedUrls,
					isLikedByUser: Boolean(findItem.isLikedByUser),
					isFromFriend: Boolean(findItem.isFromFriend)
				};
			})
		);

		return json(findsWithMedia);
	} catch (err) {
		console.error('Error loading finds:', err);
		throw error(500, 'Failed to load finds');
	}
};

// POST endpoint creates a find (post) at a location
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { locationId, title, description, locationName, category, isPublic, media } = data;

	if (!title || !locationId) {
		throw error(400, 'Title and locationId are required');
	}

	if (title.length > 100) {
		throw error(400, 'Title must be 100 characters or less');
	}

	if (description && description.length > 500) {
		throw error(400, 'Description must be 500 characters or less');
	}

	// Verify location exists
	const locationExists = await db
		.select({ id: location.id })
		.from(location)
		.where(eq(location.id, locationId))
		.limit(1);

	if (locationExists.length === 0) {
		throw error(404, 'Location not found');
	}

	const findId = generateId();

	// Create find
	const newFind = await db
		.insert(find)
		.values({
			id: findId,
			locationId,
			userId: locals.user.id,
			title,
			description,
			locationName,
			category,
			isPublic: isPublic ? 1 : 0
		})
		.returning();

	// Create media records if provided
	if (media && media.length > 0) {
		const mediaRecords = media.map(
			(item: { type: string; url: string; thumbnailUrl?: string }, index: number) => ({
				id: generateId(),
				findId,
				type: item.type,
				url: item.url,
				thumbnailUrl: item.thumbnailUrl,
				orderIndex: index
			})
		);

		await db.insert(findMedia).values(mediaRecords);
	}

	return json({ success: true, find: newFind[0] });
};
