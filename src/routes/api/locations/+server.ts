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

export const GET: RequestHandler = async ({ url, locals }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const radius = url.searchParams.get('radius') || '50';
	const includePrivate = url.searchParams.get('includePrivate') === 'true';
	const order = url.searchParams.get('order') || 'desc';

	const includeFriends = url.searchParams.get('includeFriends') === 'true';

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

		// Build base condition for locations (always public since locations don't have privacy)
		let whereConditions = sql`1=1`;

		// Add location filtering if coordinates provided
		if (lat && lng) {
			const radiusKm = parseFloat(radius);
			const latOffset = radiusKm / 111;
			const lngOffset = radiusKm / (111 * Math.cos((parseFloat(lat) * Math.PI) / 180));

			whereConditions = and(
				whereConditions,
				sql`${location.latitude} BETWEEN ${parseFloat(lat) - latOffset} AND ${
					parseFloat(lat) + latOffset
				}`,
				sql`${location.longitude} BETWEEN ${parseFloat(lng) - lngOffset} AND ${
					parseFloat(lng) + lngOffset
				}`
			)!;
		}

		// Get all locations with their find counts
		const locations = await db
			.select({
				id: location.id,
				latitude: location.latitude,
				longitude: location.longitude,
				locationName: location.locationName,
				createdAt: location.createdAt,
				userId: location.userId,
				username: user.username,
				profilePictureUrl: user.profilePictureUrl,
				findCount: sql<number>`COALESCE(COUNT(DISTINCT ${find.id}), 0)`
			})
			.from(location)
			.innerJoin(user, eq(location.userId, user.id))
			.leftJoin(find, eq(location.id, find.locationId))
			.where(whereConditions)
			.groupBy(location.id, user.username, user.profilePictureUrl)
			.orderBy(order === 'desc' ? desc(location.createdAt) : location.createdAt)
			.limit(100);

		// For each location, get finds with privacy filtering
		const locationsWithFinds = await Promise.all(
			locations.map(async (loc) => {
				// Build privacy conditions for finds
				const findConditions = [sql`${find.isPublic} = 1`]; // Always include public finds

				if (locals.user && includePrivate) {
					// Include user's own finds
					findConditions.push(sql`${find.userId} = ${locals.user.id}`);
				}

				if (locals.user && includeFriends && friendIds.length > 0) {
					// Include friends' finds
					findConditions.push(
						sql`${find.userId} IN (${sql.join(
							friendIds.map((id) => sql`${id}`),
							sql`, `
						)})`
					);
				}

				const findPrivacyCondition = sql`(${sql.join(findConditions, sql` OR `)})`;

				// Get finds for this location
				const finds = await db
					.select({
						id: find.id,
						title: find.title,
						description: find.description,
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
							: sql<boolean>`0`
					})
					.from(find)
					.innerJoin(user, eq(find.userId, user.id))
					.leftJoin(findLike, eq(find.id, findLike.findId))
					.where(and(eq(find.locationId, loc.id), findPrivacyCondition))
					.groupBy(find.id, user.username, user.profilePictureUrl)
					.orderBy(desc(find.createdAt));

				// Get media for all finds at this location
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
							isLikedByUser: Boolean(findItem.isLikedByUser)
						};
					})
				);

				// Generate local proxy URL for location creator profile picture
				let locProfilePictureUrl = loc.profilePictureUrl;
				if (locProfilePictureUrl && !locProfilePictureUrl.startsWith('http')) {
					locProfilePictureUrl = getLocalR2Url(locProfilePictureUrl);
				}

				return {
					...loc,
					profilePictureUrl: locProfilePictureUrl,
					finds: findsWithMedia
				};
			})
		);

		return json(locationsWithFinds);
	} catch (err) {
		console.error('Error loading locations:', err);
		throw error(500, 'Failed to load locations');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { latitude, longitude, locationName } = data;

	if (!latitude || !longitude) {
		throw error(400, 'Latitude and longitude are required');
	}

	const locationId = generateId();

	// Create location
	const newLocation = await db
		.insert(location)
		.values({
			id: locationId,
			userId: locals.user.id,
			latitude: latitude.toString(),
			longitude: longitude.toString(),
			locationName: locationName || null
		})
		.returning();

	return json({ success: true, location: newLocation[0] });
};
