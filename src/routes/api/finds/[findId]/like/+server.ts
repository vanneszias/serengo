import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { findLike, find, user } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';
import { notificationService } from '$lib/server/notifications';
import { pushService } from '$lib/server/push';

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

	// Send notification to find owner if not self-like
	const findOwner = existingFind[0];
	if (findOwner.userId !== locals.user.id) {
		const shouldNotify = await notificationService.shouldNotify(findOwner.userId, 'find_liked');
		
		if (shouldNotify) {
			// Get liker's username
			const likerUser = await db
				.select({ username: user.username })
				.from(user)
				.where(eq(user.id, locals.user.id))
				.limit(1);
			
			const likerUsername = likerUser[0]?.username || 'Someone';
			const findTitle = findOwner.title || 'your find';

			await notificationService.createNotification({
				userId: findOwner.userId,
				type: 'find_liked',
				title: 'Someone liked your find',
				message: `${likerUsername} liked your find: ${findTitle}`,
				data: {
					findId: findOwner.id,
					likerId: locals.user.id,
					likerUsername,
					findTitle
				}
			});

			// Send push notification
			await pushService.sendPushNotification(findOwner.userId, {
				title: 'Someone liked your find',
				message: `${likerUsername} liked your find: ${findTitle}`,
				url: `/?find=${findOwner.id}`,
				tag: 'find_liked',
				data: {
					findId: findOwner.id,
					likerId: locals.user.id
				}
			});
		}
	}

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
