import sharp from 'sharp';
import { uploadToR2 } from './r2';

const THUMBNAIL_SIZE = 400;
const MAX_IMAGE_SIZE = 1920;

export async function processAndUploadImage(
	file: File,
	findId: string,
	index: number
): Promise<{
	url: string;
	thumbnailUrl: string;
	fallbackUrl?: string;
	fallbackThumbnailUrl?: string;
}> {
	const buffer = Buffer.from(await file.arrayBuffer());

	// Generate unique filename
	const timestamp = Date.now();
	const filename = `finds/${findId}/image-${index}-${timestamp}`;

	// Process full-size image in WebP format (with JPEG fallback)
	const processedWebP = await sharp(buffer)
		.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: 85, effort: 4 })
		.toBuffer();

	// Generate JPEG fallback for older browsers
	const processedJPEG = await sharp(buffer)
		.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.jpeg({ quality: 85, progressive: true })
		.toBuffer();

	// Generate thumbnail in WebP format
	const thumbnailWebP = await sharp(buffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
			fit: 'cover',
			position: 'centre'
		})
		.webp({ quality: 80, effort: 4 })
		.toBuffer();

	// Generate JPEG thumbnail fallback
	const thumbnailJPEG = await sharp(buffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
			fit: 'cover',
			position: 'centre'
		})
		.jpeg({ quality: 80 })
		.toBuffer();

	// Upload all variants to R2
	const webpFile = new File([new Uint8Array(processedWebP)], `${filename}.webp`, {
		type: 'image/webp'
	});
	const jpegFile = new File([new Uint8Array(processedJPEG)], `${filename}.jpg`, {
		type: 'image/jpeg'
	});
	const thumbWebPFile = new File([new Uint8Array(thumbnailWebP)], `${filename}-thumb.webp`, {
		type: 'image/webp'
	});
	const thumbJPEGFile = new File([new Uint8Array(thumbnailJPEG)], `${filename}-thumb.jpg`, {
		type: 'image/jpeg'
	});

	const [webpPath, jpegPath, thumbWebPPath, thumbJPEGPath] = await Promise.all([
		uploadToR2(webpFile, `${filename}.webp`, 'image/webp'),
		uploadToR2(jpegFile, `${filename}.jpg`, 'image/jpeg'),
		uploadToR2(thumbWebPFile, `${filename}-thumb.webp`, 'image/webp'),
		uploadToR2(thumbJPEGFile, `${filename}-thumb.jpg`, 'image/jpeg')
	]);

	// Return WebP URLs as primary, JPEG as fallback (client can choose based on browser support)
	return {
		url: webpPath,
		thumbnailUrl: thumbWebPPath,
		fallbackUrl: jpegPath,
		fallbackThumbnailUrl: thumbJPEGPath
	};
}

export async function processAndUploadVideo(
	file: File,
	findId: string,
	index: number
): Promise<{
	url: string;
	thumbnailUrl: string;
	fallbackUrl?: string;
	fallbackThumbnailUrl?: string;
}> {
	const timestamp = Date.now();
	const baseFilename = `finds/${findId}/video-${index}-${timestamp}`;

	// Convert to MP4 if needed for better compatibility
	let videoPath: string;

	if (file.type === 'video/mp4') {
		// Upload MP4 directly
		videoPath = await uploadToR2(file, `${baseFilename}.mp4`, 'video/mp4');
	} else {
		// For other formats, upload as-is for now (future: convert with ffmpeg)
		const extension = file.type === 'video/quicktime' ? '.mov' : '.mp4';
		videoPath = await uploadToR2(file, `${baseFilename}${extension}`, file.type);
	}

	// Create a simple thumbnail using a static placeholder for now
	// TODO: Implement proper video thumbnail extraction with ffmpeg or client-side canvas
	const thumbnailUrl = '/video-placeholder.svg';

	return {
		url: videoPath,
		thumbnailUrl,
		// For videos, we can return the same URL as fallback since MP4 has broad support
		fallbackUrl: videoPath,
		fallbackThumbnailUrl: thumbnailUrl
	};
}

export async function processAndUploadProfilePicture(
	file: File,
	userId: string
): Promise<{
	url: string;
	thumbnailUrl: string;
	fallbackUrl?: string;
	fallbackThumbnailUrl?: string;
}> {
	const buffer = Buffer.from(await file.arrayBuffer());

	// Generate unique filename
	const timestamp = Date.now();
	const randomId = Math.random().toString(36).substring(2, 15);
	const filename = `users/${userId}/profile-${timestamp}-${randomId}`;

	// Process full-size image in WebP format (with JPEG fallback)
	const processedWebP = await sharp(buffer)
		.resize(400, 400, {
			fit: 'cover',
			position: 'centre'
		})
		.webp({ quality: 85, effort: 4 })
		.toBuffer();

	// Generate JPEG fallback for older browsers
	const processedJPEG = await sharp(buffer)
		.resize(400, 400, {
			fit: 'cover',
			position: 'centre'
		})
		.jpeg({ quality: 85, progressive: true })
		.toBuffer();

	// Generate smaller thumbnail in WebP format
	const thumbnailWebP = await sharp(buffer)
		.resize(150, 150, {
			fit: 'cover',
			position: 'centre'
		})
		.webp({ quality: 80, effort: 4 })
		.toBuffer();

	// Generate JPEG thumbnail fallback
	const thumbnailJPEG = await sharp(buffer)
		.resize(150, 150, {
			fit: 'cover',
			position: 'centre'
		})
		.jpeg({ quality: 80 })
		.toBuffer();

	// Upload all variants to R2
	const webpFile = new File([new Uint8Array(processedWebP)], `${filename}.webp`, {
		type: 'image/webp'
	});
	const jpegFile = new File([new Uint8Array(processedJPEG)], `${filename}.jpg`, {
		type: 'image/jpeg'
	});
	const thumbWebPFile = new File([new Uint8Array(thumbnailWebP)], `${filename}-thumb.webp`, {
		type: 'image/webp'
	});
	const thumbJPEGFile = new File([new Uint8Array(thumbnailJPEG)], `${filename}-thumb.jpg`, {
		type: 'image/jpeg'
	});

	const [webpPath, jpegPath, thumbWebPPath, thumbJPEGPath] = await Promise.all([
		uploadToR2(webpFile, `${filename}.webp`, 'image/webp'),
		uploadToR2(jpegFile, `${filename}.jpg`, 'image/jpeg'),
		uploadToR2(thumbWebPFile, `${filename}-thumb.webp`, 'image/webp'),
		uploadToR2(thumbJPEGFile, `${filename}-thumb.jpg`, 'image/jpeg')
	]);

	// Return WebP URLs as primary, JPEG as fallback (client can choose based on browser support)
	return {
		url: webpPath,
		thumbnailUrl: thumbWebPPath,
		fallbackUrl: jpegPath,
		fallbackThumbnailUrl: thumbJPEGPath
	};
}
