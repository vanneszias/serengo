import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { findComment, user, find } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { notificationService } from '$lib/server/notifications';
import { pushService } from '$lib/server/push';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const findId = params.findId;
	if (!findId) {
		return json({ success: false, error: 'Find ID is required' }, { status: 400 });
	}

	try {
		const comments = await db
			.select({
				id: findComment.id,
				findId: findComment.findId,
				content: findComment.content,
				createdAt: findComment.createdAt,
				updatedAt: findComment.updatedAt,
				user: {
					id: user.id,
					username: user.username,
					profilePictureUrl: user.profilePictureUrl
				}
			})
			.from(findComment)
			.innerJoin(user, eq(findComment.userId, user.id))
			.where(eq(findComment.findId, findId))
			.orderBy(desc(findComment.createdAt));

		return json({
			success: true,
			data: comments,
			count: comments.length
		});
	} catch (error) {
		console.error('Error fetching comments:', error);
		return json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const session = locals.session;
	if (!session) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const findId = params.findId;
	if (!findId) {
		return json({ success: false, error: 'Find ID is required' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { content } = body;

		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			return json({ success: false, error: 'Comment content is required' }, { status: 400 });
		}

		if (content.length > 500) {
			return json(
				{ success: false, error: 'Comment too long (max 500 characters)' },
				{ status: 400 }
			);
		}

		const commentId = crypto.randomUUID();
		const now = new Date();

		const [newComment] = await db
			.insert(findComment)
			.values({
				id: commentId,
				findId,
				userId: session.userId,
				content: content.trim(),
				createdAt: now,
				updatedAt: now
			})
			.returning();

		const commentWithUser = await db
			.select({
				id: findComment.id,
				findId: findComment.findId,
				content: findComment.content,
				createdAt: findComment.createdAt,
				updatedAt: findComment.updatedAt,
				user: {
					id: user.id,
					username: user.username,
					profilePictureUrl: user.profilePictureUrl
				}
			})
			.from(findComment)
			.innerJoin(user, eq(findComment.userId, user.id))
			.where(eq(findComment.id, commentId))
			.limit(1);

		if (commentWithUser.length === 0) {
			return json({ success: false, error: 'Failed to create comment' }, { status: 500 });
		}

		// Send notification to find owner if not self-comment
		const findData = await db.select().from(find).where(eq(find.id, findId)).limit(1);
		
		if (findData.length > 0 && findData[0].userId !== session.userId) {
			const findOwner = findData[0];
			const shouldNotify = await notificationService.shouldNotify(findOwner.userId, 'find_commented');
			
			if (shouldNotify) {
				// Get commenter's username
				const commenterUser = await db
					.select({ username: user.username })
					.from(user)
					.where(eq(user.id, session.userId))
					.limit(1);
				
				const commenterUsername = commenterUser[0]?.username || 'Someone';
				const findTitle = findOwner.title || 'your find';

				await notificationService.createNotification({
					userId: findOwner.userId,
					type: 'find_commented',
					title: 'New comment on your find',
					message: `${commenterUsername} commented on: ${findTitle}`,
					data: {
						findId: findOwner.id,
						commentId,
						commenterId: session.userId,
						commenterUsername,
						findTitle,
						commentContent: content.trim().substring(0, 100)
					}
				});

				// Send push notification
				await pushService.sendPushNotification(findOwner.userId, {
					title: 'New comment on your find',
					message: `${commenterUsername} commented on: ${findTitle}`,
					url: `/?find=${findOwner.id}`,
					tag: 'find_commented',
					data: {
						findId: findOwner.id,
						commentId,
						commenterId: session.userId
					}
				});
			}
		}

		return json({
			success: true,
			data: commentWithUser[0]
		});
	} catch (error) {
		console.error('Error creating comment:', error);
		return json({ success: false, error: 'Failed to create comment' }, { status: 500 });
	}
};
