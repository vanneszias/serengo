import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { findLike, find } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';

function generateLikeId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase64url(bytes);
}

export async function POST({
	params,
	locals
}: {
	params: { findId: string };
	locals: { user: { id: string } };
}) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const findId = params.findId;

	if (!findId) {
		throw error(400, 'Find ID is required');
	}

	// Check if find exists
	const existingFind = await db.select().from(find).where(eq(find.id, findId)).limit(1);
	if (existingFind.length === 0) {
		throw error(404, 'Find not found');
	}

	// Check if user already liked this find
	const existingLike = await db
		.select()
		.from(findLike)
		.where(and(eq(findLike.findId, findId), eq(findLike.userId, locals.user.id)))
		.limit(1);

	if (existingLike.length > 0) {
		throw error(409, 'Find already liked');
	}

	// Create new like
	const likeId = generateLikeId();
	await db.insert(findLike).values({
		id: likeId,
		findId,
		userId: locals.user.id
	});

	// Get updated like count
	const likeCountResult = await db
		.select({ count: count() })
		.from(findLike)
		.where(eq(findLike.findId, findId));

	const likeCount = likeCountResult[0]?.count ?? 0;

	return json({
		success: true,
		likeId,
		isLiked: true,
		likeCount
	});
}

export async function DELETE({
	params,
	locals
}: {
	params: { findId: string };
	locals: { user: { id: string } };
}) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const findId = params.findId;

	if (!findId) {
		throw error(400, 'Find ID is required');
	}

	// Remove like
	await db
		.delete(findLike)
		.where(and(eq(findLike.findId, findId), eq(findLike.userId, locals.user.id)));

	// Get updated like count
	const likeCountResult = await db
		.select({ count: count() })
		.from(findLike)
		.where(eq(findLike.findId, findId));

	const likeCount = likeCountResult[0]?.count ?? 0;

	return json({
		success: true,
		isLiked: false,
		likeCount
	});
}
