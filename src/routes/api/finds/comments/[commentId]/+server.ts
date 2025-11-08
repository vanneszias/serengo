import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { findComment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const commentId = params.commentId;
	if (!commentId) {
		return json({ success: false, error: 'Comment ID is required' }, { status: 400 });
	}

	try {
		const existingComment = await db
			.select()
			.from(findComment)
			.where(eq(findComment.id, commentId))
			.limit(1);

		if (existingComment.length === 0) {
			return json({ success: false, error: 'Comment not found' }, { status: 404 });
		}

		if (existingComment[0].userId !== session.userId) {
			return json(
				{ success: false, error: 'Not authorized to delete this comment' },
				{ status: 403 }
			);
		}

		await db.delete(findComment).where(eq(findComment.id, commentId));

		return json({
			success: true,
			data: { id: commentId }
		});
	} catch (error) {
		console.error('Error deleting comment:', error);
		return json({ success: false, error: 'Failed to delete comment' }, { status: 500 });
	}
};
