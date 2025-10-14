import sharp from 'sharp';
import { uploadToR2 } from './r2';

const THUMBNAIL_SIZE = 400;
const MAX_IMAGE_SIZE = 1920;

export async function processAndUploadImage(
	file: File,
	findId: string,
	index: number
): Promise<{ url: string; thumbnailUrl: string }> {
	const buffer = Buffer.from(await file.arrayBuffer());

	// Generate unique filename
	const timestamp = Date.now();
	const filename = `finds/${findId}/image-${index}-${timestamp}`;

	// Process full-size image (resize if too large, optimize)
	const processedImage = await sharp(buffer)
		.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.jpeg({ quality: 85, progressive: true })
		.toBuffer();

	// Generate thumbnail
	const thumbnail = await sharp(buffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
			fit: 'cover',
			position: 'centre'
		})
		.jpeg({ quality: 80 })
		.toBuffer();

	// Upload both to R2
	const imageFile = new File([new Uint8Array(processedImage)], `${filename}.jpg`, {
		type: 'image/jpeg'
	});
	const thumbFile = new File([new Uint8Array(thumbnail)], `${filename}-thumb.jpg`, {
		type: 'image/jpeg'
	});

	const [imagePath, thumbPath] = await Promise.all([
		uploadToR2(imageFile, `${filename}.jpg`, 'image/jpeg'),
		uploadToR2(thumbFile, `${filename}-thumb.jpg`, 'image/jpeg')
	]);

	// Return the R2 paths (not signed URLs) - signed URLs will be generated when needed
	return { url: imagePath, thumbnailUrl: thumbPath };
}

export async function processAndUploadVideo(
	file: File,
	findId: string,
	index: number
): Promise<{ url: string; thumbnailUrl: string }> {
	const timestamp = Date.now();
	const filename = `finds/${findId}/video-${index}-${timestamp}.mp4`;

	// Upload video directly (no processing on server to save resources)
	const videoPath = await uploadToR2(file, filename, 'video/mp4');

	// For video thumbnail, generate on client-side or use placeholder
	// This keeps server-side processing minimal
	const thumbnailUrl = `/video-placeholder.jpg`; // Use static placeholder

	// Return the R2 path (not signed URL) - signed URLs will be generated when needed
	return { url: videoPath, thumbnailUrl };
}
