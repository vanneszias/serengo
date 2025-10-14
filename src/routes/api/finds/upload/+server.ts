import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processAndUploadImage, processAndUploadVideo } from '$lib/server/media-processor';
import { encodeBase64url } from '@oslojs/encoding';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

function generateFindId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase64url(bytes);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const files = formData.getAll('files') as File[];
	const findId = (formData.get('findId') as string) || generateFindId(); // Generate if creating new Find

	if (files.length === 0 || files.length > MAX_FILES) {
		throw error(400, `Must upload between 1 and ${MAX_FILES} files`);
	}

	const uploadedMedia: Array<{
		type: string;
		url: string;
		thumbnailUrl: string;
		fallbackUrl?: string;
		fallbackThumbnailUrl?: string;
	}> = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			throw error(400, `File ${file.name} exceeds maximum size of 100MB`);
		}

		// Process based on type
		if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
			const result = await processAndUploadImage(file, findId, i);
			uploadedMedia.push({ type: 'photo', ...result });
		} else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
			const result = await processAndUploadVideo(file, findId, i);
			uploadedMedia.push({ type: 'video', ...result });
		} else {
			throw error(400, `File type ${file.type} not allowed`);
		}
	}

	return json({ findId, media: uploadedMedia });
};
