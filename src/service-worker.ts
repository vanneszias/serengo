// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Ensures that the `$service-worker` import has proper type definitions
/// <reference types="@sveltejs/kit" />

// Only necessary if you have an import from `$env/static/public`
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { build, files, version } from '$service-worker';

// This gives `self` the correct types
const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

// Create cache names for this deployment
const CACHE = `cache-${version}`;
const RUNTIME_CACHE = `runtime-${version}`;
const IMAGE_CACHE = `images-${version}`;
const R2_CACHE = `r2-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

// Assets to precache for better performance
const CRITICAL_ASSETS = ['/cafe-bg-compressed.jpg', '/fonts/Washington.ttf', '/logo.svg'];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		const imageCache = await caches.open(IMAGE_CACHE);

		// Cache core assets
		await cache.addAll(ASSETS);

		// Precache critical assets with error handling
		await Promise.allSettled(
			CRITICAL_ASSETS.map(async (asset) => {
				try {
					const response = await fetch(asset);
					if (response.ok) {
						if (
							asset.includes('jpg') ||
							asset.includes('jpeg') ||
							asset.includes('png') ||
							asset.includes('webp')
						) {
							await imageCache.put(asset, response);
						} else {
							await cache.put(asset, response);
						}
					}
				} catch (error) {
					console.warn(`Failed to cache ${asset}:`, error);
				}
			})
		);
	}

	event.waitUntil(addFilesToCache());
	// Skip waiting to activate immediately
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		const currentCaches = [CACHE, RUNTIME_CACHE, IMAGE_CACHE, R2_CACHE];
		for (const key of await caches.keys()) {
			if (!currentCaches.includes(key)) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches());
	// Claim clients immediately
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);
		const runtimeCache = await caches.open(RUNTIME_CACHE);
		const imageCache = await caches.open(IMAGE_CACHE);
		const r2Cache = await caches.open(R2_CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// Handle images with cache-first strategy
		if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
			const cachedResponse = await imageCache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			try {
				const response = await fetch(event.request);
				if (response.ok) {
					imageCache.put(event.request, response.clone());
				}
				return response;
			} catch {
				// Return a fallback image or the cached version
				return cachedResponse || new Response('Image not available', { status: 404 });
			}
		}

		// Handle fonts with cache-first strategy
		if (url.pathname.match(/\.(woff|woff2|ttf|otf)$/i)) {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		// Handle R2 resources with cache-first strategy
		if (url.hostname.includes('.r2.dev') || url.hostname.includes('.r2.cloudflarestorage.com')) {
			const cachedResponse = await r2Cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			try {
				const response = await fetch(event.request);
				if (response.ok) {
					// Cache R2 resources for a long time as they're typically immutable
					r2Cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				// Return cached version if available, or fall through to other cache checks
				return cachedResponse || new Response('R2 resource not available', { status: 404 });
			}
		}

		// Handle OpenStreetMap tiles with cache-first strategy
		if (url.hostname === 'tile.openstreetmap.org') {
			const cachedResponse = await r2Cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			try {
				const response = await fetch(event.request);
				if (response.ok) {
					// Cache map tiles for a long time
					r2Cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				return cachedResponse || new Response('Map tile not available', { status: 404 });
			}
		}

		// Handle API and dynamic content with network-first strategy
		if (url.pathname.startsWith('/api/') || url.searchParams.has('_data')) {
			try {
				const response = await fetch(event.request);
				if (response.ok) {
					runtimeCache.put(event.request, response.clone());
				}
				return response;
			} catch (err) {
				const cachedResponse = await runtimeCache.match(event.request);
				if (cachedResponse) {
					return cachedResponse;
				}
				throw err;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				runtimeCache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			// Try all caches for fallback
			const cachedResponse =
				(await cache.match(event.request)) ||
				(await runtimeCache.match(event.request)) ||
				(await imageCache.match(event.request)) ||
				(await r2Cache.match(event.request));

			if (cachedResponse) {
				return cachedResponse;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});
