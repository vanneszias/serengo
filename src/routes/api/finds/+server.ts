import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { find, findMedia, user } from '$lib/server/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';
import { getSignedR2Url } from '$lib/server/r2';

function generateFindId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase64url(bytes);
}

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const radius = url.searchParams.get('radius') || '50';
	const includePrivate = url.searchParams.get('includePrivate') === 'true';
	const order = url.searchParams.get('order') || 'desc';

	try {
		// Build where conditions
		const baseCondition = includePrivate
			? sql`(${find.isPublic} = 1 OR ${find.userId} = ${locals.user.id})`
			: sql`${find.isPublic} = 1`;

		let whereConditions = baseCondition;

		// Add location filtering if coordinates provided
		if (lat && lng) {
			const radiusKm = parseFloat(radius);
			const latOffset = radiusKm / 111;
			const lngOffset = radiusKm / (111 * Math.cos((parseFloat(lat) * Math.PI) / 180));

			const locationConditions = and(
				baseCondition,
				sql`${find.latitude} BETWEEN ${parseFloat(lat) - latOffset} AND ${
					parseFloat(lat) + latOffset
				}`,
				sql`${find.longitude} BETWEEN ${parseFloat(lng) - lngOffset} AND ${
					parseFloat(lng) + lngOffset
				}`
			);

			if (locationConditions) {
				whereConditions = locationConditions;
			}
		}

		// Get all finds with filtering
		const finds = await db
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
				username: user.username
			})
			.from(find)
			.innerJoin(user, eq(find.userId, user.id))
			.where(whereConditions)
			.orderBy(order === 'desc' ? desc(find.createdAt) : find.createdAt)
			.limit(100);

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
						// URLs in database are now paths, generate signed URLs directly
						const [signedUrl, signedThumbnailUrl] = await Promise.all([
							getSignedR2Url(mediaItem.url, 24 * 60 * 60), // 24 hours
							mediaItem.thumbnailUrl && !mediaItem.thumbnailUrl.startsWith('/')
								? getSignedR2Url(mediaItem.thumbnailUrl, 24 * 60 * 60)
								: Promise.resolve(mediaItem.thumbnailUrl) // Keep static placeholder paths as-is
						]);

						return {
							...mediaItem,
							url: signedUrl,
							thumbnailUrl: signedThumbnailUrl
						};
					})
				);

				return {
					...findItem,
					media: mediaWithSignedUrls
				};
			})
		);

		return json(findsWithMedia);
	} catch (err) {
		console.error('Error loading finds:', err);
		throw error(500, 'Failed to load finds');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { title, description, latitude, longitude, locationName, category, isPublic, media } = data;

	if (!title || !latitude || !longitude) {
		throw error(400, 'Title, latitude, and longitude are required');
	}

	if (title.length > 100) {
		throw error(400, 'Title must be 100 characters or less');
	}

	if (description && description.length > 500) {
		throw error(400, 'Description must be 500 characters or less');
	}

	const findId = generateFindId();

	// Create find
	const newFind = await db
		.insert(find)
		.values({
			id: findId,
			userId: locals.user.id,
			title,
			description,
			latitude: latitude.toString(),
			longitude: longitude.toString(),
			locationName,
			category,
			isPublic: isPublic ? 1 : 0
		})
		.returning();

	// Create media records if provided
	if (media && media.length > 0) {
		const mediaRecords = media.map(
			(item: { type: string; url: string; thumbnailUrl?: string }, index: number) => ({
				id: generateFindId(),
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
