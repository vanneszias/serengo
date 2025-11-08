<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import NotificationPrompt from './NotificationPrompt.svelte';

	/**
	 * NotificationManager - Handles push notification subscription
	 * Shows a prompt for users to enable notifications (requires user gesture for iOS)
	 */

	let permissionStatus = $state<NotificationPermission>('default');
	let showPrompt = $state<boolean>(false);
	let isSupported = $state<boolean>(false);

	const PROMPT_DISMISSED_KEY = 'notification-prompt-dismissed';

	onMount(() => {
		if (!browser) return;

		// Check if notifications and service workers are supported
		isSupported = 'Notification' in window && 'serviceWorker' in navigator;

		if (!isSupported) {
			console.log('Notifications or service workers not supported in this browser');
			return;
		}

		// Initialize without requesting permission
		initializeNotifications();
	});

	async function initializeNotifications() {
		try {
			console.log('[NotificationManager] Starting initialization...');

			// Get current permission status
			permissionStatus = Notification.permission;
			console.log('[NotificationManager] Permission status:', permissionStatus);

			// If already granted, subscribe automatically
			if (permissionStatus === 'granted') {
				console.log('[NotificationManager] Permission already granted');
				await subscribeToNotifications();
			}
			// If permission is default and not dismissed, show prompt
			else if (permissionStatus === 'default') {
				const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
				if (!dismissed) {
					showPrompt = true;
				}
			}
			// If denied, do nothing
			else {
				console.log('[NotificationManager] Permission denied by user');
			}
		} catch (error) {
			console.error('[NotificationManager] Error initializing notifications:', error);
		}
	}

	async function handleEnableNotifications() {
		try {
			console.log('[NotificationManager] User clicked enable notifications');
			showPrompt = false;

			// Request permission (this is triggered by user gesture, so iOS will allow it)
			permissionStatus = await Notification.requestPermission();
			console.log('[NotificationManager] Permission response:', permissionStatus);

			if (permissionStatus === 'granted') {
				await subscribeToNotifications();
			} else {
				console.log('[NotificationManager] Permission not granted');
			}
		} catch (error) {
			console.error('[NotificationManager] Error enabling notifications:', error);
		}
	}

	function handleDismissPrompt() {
		console.log('[NotificationManager] User dismissed notification prompt');
		showPrompt = false;
		localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
	}

	async function subscribeToNotifications() {
		try {
			console.log('[NotificationManager] subscribeToNotifications called');

			// Get or register service worker
			let registration = await navigator.serviceWorker.getRegistration();

			if (!registration) {
				console.log('[NotificationManager] No SW found, registering...');
				registration = await navigator.serviceWorker.register('/service-worker.js', {
					type: 'module'
				});
			}

			// Wait for service worker to be ready
			await navigator.serviceWorker.ready;
			console.log('[NotificationManager] Service worker ready');

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

			console.log('[NotificationManager] Successfully subscribed to push notifications!');
		} catch (error) {
			console.error('[NotificationManager] Error subscribing to push notifications:', error);
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

{#if showPrompt}
	<NotificationPrompt onEnable={handleEnableNotifications} onDismiss={handleDismissPrompt} />
{/if}
