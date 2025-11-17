import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '$lib/server/r2';
import { env } from '$env/dynamic/private';

const R2_BUCKET_NAME = env.R2_BUCKET_NAME;

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const path = params.path;

	if (!path) {
		throw error(400, 'Path is required');
	}

	if (!R2_BUCKET_NAME) {
		throw error(500, 'R2_BUCKET_NAME environment variable is required');
	}

	try {
		const command = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: path
		});

		const response = await r2Client.send(command);

		if (!response.Body) {
			throw error(404, 'File not found');
		}

		const chunks: Uint8Array[] = [];
		const body = response.Body as AsyncIterable<Uint8Array>;
		for await (const chunk of body) {
			chunks.push(chunk);
		}
		const buffer = Buffer.concat(chunks);

		setHeaders({
			'Content-Type': response.ContentType || 'application/octet-stream',
			'Cache-Control': response.CacheControl || 'public, max-age=31536000, immutable',
			'Content-Length': buffer.length.toString(),
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});

		return new Response(buffer);
	} catch (err) {
		console.error('Error fetching file from R2:', err);
		throw error(500, 'Failed to fetch file');
	}
};

export const OPTIONS: RequestHandler = async ({ setHeaders }) => {
	setHeaders({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	});

	return new Response(null, { status: 204 });
};
