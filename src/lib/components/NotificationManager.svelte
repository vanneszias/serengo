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
			// Get current permission status
			permissionStatus = Notification.permission;

			// If already denied, don't do anything
			if (permissionStatus === 'denied') {
				console.log('Notification permission denied by user');
				return;
			}

			// Register service worker
			const registration = await navigator.serviceWorker.register('/service-worker.js', {
				type: 'module'
			});

			// Wait for service worker to be ready
			await navigator.serviceWorker.ready;

			// If permission is default, request it
			if (permissionStatus === 'default') {
				permissionStatus = await Notification.requestPermission();
			}

			// If permission granted, subscribe to push notifications
			if (permissionStatus === 'granted') {
				await subscribeToPushNotifications(registration);
			}
		} catch (error) {
			console.error('Error initializing notifications:', error);
			subscriptionStatus = 'error';
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		}
	}

	async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
		try {
			subscriptionStatus = 'subscribing';

			// Get VAPID public key from server
			const response = await fetch('/api/notifications/subscribe');
			if (!response.ok) {
				throw new Error('Failed to get VAPID public key');
			}

			const { publicKey } = await response.json();

			// Check if already subscribed
			let subscription = await registration.pushManager.getSubscription();

			// If not subscribed, create new subscription
			if (!subscription) {
				subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(publicKey)
				});
			}

			// Send subscription to server
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

			if (!saveResponse.ok) {
				throw new Error('Failed to save subscription to server');
			}

			subscriptionStatus = 'subscribed';
			console.log('Successfully subscribed to push notifications');
		} catch (error) {
			console.error('Error subscribing to push notifications:', error);
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
