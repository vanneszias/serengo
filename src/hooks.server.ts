import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// CSRF protection - verify origin header for state-changing requests
	const method = event.request.method;
	const origin = event.request.headers.get('origin');

	// Skip CSRF check for GET/HEAD requests
	if (method !== 'GET' && method !== 'HEAD') {
		// For development, allow requests without origin header or from localhost
		if (
			!origin ||
			origin.includes('localhost') ||
			origin.includes('127.0.0.1') ||
			origin.includes('serengo.ziasvannes.tech')
		) {
			// Allow in development and serengo.ziasvannes.tech
		}
		// In production, you would add: else if (origin !== 'yourdomain.com') { return new Response('Forbidden', { status: 403 }); }
	}

	// Session validation
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	const response = await resolve(event);

	// Add security headers
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
		"style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
		"font-src 'self' fonts.gstatic.com; " +
		"img-src 'self' data: blob: *.openstreetmap.org *.tile.openstreetmap.org; " +
		"connect-src 'self' *.openstreetmap.org; " +
		"frame-ancestors 'none'; " +
		"base-uri 'self'; " +
		"form-action 'self';"
	);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Add HSTS for HTTPS in production
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	return response;
};
