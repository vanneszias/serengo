import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { find, findMedia, user } from '$lib/server/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	// Get query parameters for location-based filtering
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const radius = url.searchParams.get('radius') || '50'; // Default 50km radius

	try {
		// Build where conditions
		const baseCondition = sql`(${find.isPublic} = 1 OR ${find.userId} = ${locals.user.id})`;
		let whereConditions = baseCondition;

		// Add location filtering if coordinates provided
		if (lat && lng) {
			const radiusKm = parseFloat(radius);
			// Simple bounding box query for MVP (can upgrade to proper distance calculation later)
			const latOffset = radiusKm / 111; // Approximate degrees per km for latitude
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
			.orderBy(desc(find.createdAt))
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

		// Combine finds with their media
		const findsWithMedia = finds.map((findItem) => ({
			...findItem,
			media: mediaByFind[findItem.id] || []
		}));

		return {
			finds: findsWithMedia
		};
	} catch (err) {
		console.error('Error loading finds:', err);
		return {
			finds: []
		};
	}
};
