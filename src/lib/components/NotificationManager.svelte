<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	/**
	 * NotificationManager - Handles push notification subscription
	 * Automatically requests permission and subscribes authenticated users
	 */

	let permissionStatus = $state<NotificationPermission>('default');
	let subscriptionStatus = $state<'idle' | 'subscribing' | 'subscribed' | 'error'>('idle');
	let errorMessage = $state<string>('');

	onMount(() => {
		if (!browser) return;

		// Check if notifications are supported
		if (!('Notification' in window)) {
			console.log('This browser does not support notifications');
			return;
		}

		// Check if service workers are supported
		if (!('serviceWorker' in navigator)) {
			console.log('This browser does not support service workers');
			return;
		}

		// Initialize notification subscription
		initializeNotifications();
	});

	async function initializeNotifications() {
		try {
			console.log('[NotificationManager] Starting initialization...');

			// Get current permission status
			permissionStatus = Notification.permission;
			console.log('[NotificationManager] Permission status:', permissionStatus);
			// If already denied, don't do anything
			if (permissionStatus === 'denied') {
				console.log('Notification permission denied by user');
				return;
			}
			// Get existing service worker registration (SvelteKit registers it automatically)
			let registration = await navigator.serviceWorker.getRegistration();

			// If no registration exists, register it
			if (!registration) {
				console.log('[NotificationManager] No SW found, registering...');
				registration = await navigator.serviceWorker.register('/service-worker.js', {
					type: 'module'
				});
			}
			// Wait for service worker to be ready
			await navigator.serviceWorker.ready;
			console.log('[NotificationManager] Service worker ready');
			// If permission is default, request it
			if (permissionStatus === 'default') {
				console.log('[NotificationManager] Requesting permission...');
				permissionStatus = await Notification.requestPermission();
				console.log('[NotificationManager] Permission response:', permissionStatus);
			}
			// If permission granted, subscribe to push notifications
			if (permissionStatus === 'granted') {
				console.log('[NotificationManager] Permission granted, subscribing...');
				await subscribeToPushNotifications(registration);
			} else {
				console.log('[NotificationManager] Permission not granted, status:', permissionStatus);
			}
		} catch (error) {
			console.error('Error initializing notifications:', error);
			subscriptionStatus = 'error';
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		}
	}

	async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
		try {
			console.log('[NotificationManager] subscribeToPushNotifications called');
			subscriptionStatus = 'subscribing';
			// Get VAPID public key from server
			console.log('[NotificationManager] Fetching VAPID key...');
			const response = await fetch('/api/notifications/subscribe');
			if (!response.ok) {
				throw new Error('Failed to get VAPID public key');
			}
			const { publicKey } = await response.json();
			console.log('[NotificationManager] Got VAPID key:', publicKey);
			// Check if already subscribed
			console.log('[NotificationManager] Checking existing subscription...');
			let subscription = await registration.pushManager.getSubscription();
			console.log('[NotificationManager] Existing subscription:', subscription);
			// If not subscribed, create new subscription
			if (!subscription) {
				console.log('[NotificationManager] Creating new subscription...');
				subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(publicKey)
				});
				console.log('[NotificationManager] Subscription created:', subscription);
			}
			// Send subscription to server
			console.log('[NotificationManager] Sending subscription to server...');
			const saveResponse = await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					subscription: {
						endpoint: subscription.endpoint,
						keys: {
							p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
							auth: arrayBufferToBase64(subscription.getKey('auth'))
						}
					}
				})
			});
			console.log('[NotificationManager] Save response status:', saveResponse.status);
			if (!saveResponse.ok) {
				const errorText = await saveResponse.text();
				console.error('[NotificationManager] Save failed:', errorText);
				throw new Error('Failed to save subscription to server');
			}
			subscriptionStatus = 'subscribed';
			console.log('[NotificationManager] Successfully subscribed to push notifications!');
		} catch (error) {
			console.error('[NotificationManager] Error subscribing to push notifications:', error);
			subscriptionStatus = 'error';
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		}
	}

	/**
	 * Convert VAPID public key from base64 to Uint8Array
	 */
	function urlBase64ToUint8Array(base64String: string): Uint8Array {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	/**
	 * Convert ArrayBuffer to base64 string
	 */
	function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
		if (!buffer) return '';

		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}
</script>
