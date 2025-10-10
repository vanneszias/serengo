import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { find, findMedia, user } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';

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
	const radius = url.searchParams.get('radius') || '10';

	if (!lat || !lng) {
		throw error(400, 'Latitude and longitude are required');
	}

	// Query finds within radius (simplified - in production use PostGIS)
	// For MVP, using a simple bounding box approach
	const latNum = parseFloat(lat);
	const lngNum = parseFloat(lng);
	const radiusNum = parseFloat(radius);

	// Rough conversion: 1 degree ≈ 111km
	const latDelta = radiusNum / 111;
	const lngDelta = radiusNum / (111 * Math.cos((latNum * Math.PI) / 180));

	const finds = await db
		.select({
			find: find,
			user: {
				id: user.id,
				username: user.username
			}
		})
		.from(find)
		.innerJoin(user, eq(find.userId, user.id))
		.where(
			and(
				eq(find.isPublic, 1),
				// Simple bounding box filter
				sql`CAST(${find.latitude} AS NUMERIC) BETWEEN ${latNum - latDelta} AND ${latNum + latDelta}`,
				sql`CAST(${find.longitude} AS NUMERIC) BETWEEN ${lngNum - lngDelta} AND ${lngNum + lngDelta}`
			)
		)
		.orderBy(find.createdAt);

	// Get media for each find
	const findsWithMedia = await Promise.all(
		finds.map(async (item) => {
			const media = await db
				.select()
				.from(findMedia)
				.where(eq(findMedia.findId, item.find.id))
				.orderBy(findMedia.orderIndex);

			return {
				...item.find,
				user: item.user,
				media: media
			};
		})
	);

	return json(findsWithMedia);
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
