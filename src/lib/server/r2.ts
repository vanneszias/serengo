import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

// Environment variables with validation
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;

// Validate required environment variables
function validateR2Config() {
	if (!R2_ACCOUNT_ID) throw new Error('R2_ACCOUNT_ID environment variable is required');
	if (!R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID environment variable is required');
	if (!R2_SECRET_ACCESS_KEY)
		throw new Error('R2_SECRET_ACCESS_KEY environment variable is required');
	if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME environment variable is required');
}

export const r2Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID!,
		secretAccessKey: R2_SECRET_ACCESS_KEY!
	}
});

export const R2_PUBLIC_URL = `https://pub-${R2_ACCOUNT_ID}.r2.dev`;

export async function uploadToR2(file: File, path: string, contentType: string): Promise<string> {
	validateR2Config();

	const buffer = Buffer.from(await file.arrayBuffer());

	await r2Client.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: path,
			Body: buffer,
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);

	return path;
}

export async function deleteFromR2(path: string): Promise<void> {
	validateR2Config();

	await r2Client.send(
		new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: path
		})
	);
}

export async function getSignedR2Url(path: string, expiresIn = 3600): Promise<string> {
	validateR2Config();

	const command = new GetObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: path
	});

	return await getSignedUrl(r2Client, command, { expiresIn });
}

export function getLocalR2Url(path: string): string {
	return `/api/media/${path}`;
}
