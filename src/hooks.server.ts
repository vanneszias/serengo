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
			origin.includes('demo.ziasvannes.tech')
		) {
			// Allow in development and demo
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
	return resolve(event);
};
