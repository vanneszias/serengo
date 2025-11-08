<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { toast } from 'svelte-sonner';

	interface NotificationPreferences {
		friendRequests: boolean;
		friendAccepted: boolean;
		findLiked: boolean;
		findCommented: boolean;
		pushEnabled: boolean;
	}

	let preferences = $state<NotificationPreferences>({
		friendRequests: true,
		friendAccepted: true,
		findLiked: true,
		findCommented: true,
		pushEnabled: true
	});

	let isLoading = $state<boolean>(true);
	let isSaving = $state<boolean>(false);
	let isSubscribing = $state<boolean>(false);
	let browserPermission = $state<NotificationPermission>('default');

	onMount(() => {
		if (!browser) return;
		loadPreferences();
		checkBrowserPermission();
	});

	function checkBrowserPermission() {
		if (!browser || !('Notification' in window)) {
			browserPermission = 'denied';
			return;
		}
		browserPermission = Notification.permission;
	}

	async function requestBrowserPermission() {
		if (!browser || !('Notification' in window)) {
			toast.error('Notifications are not supported in this browser');
			return;
		}

		try {
			isSubscribing = true;
			const permission = await Notification.requestPermission();
			browserPermission = permission;

			if (permission === 'granted') {
				// Subscribe to push notifications
				await subscribeToPush();
				toast.success('Notifications enabled successfully');
			} else if (permission === 'denied') {
				toast.error('Notification permission denied');
			}
		} catch (error) {
			console.error('Error requesting notification permission:', error);
			toast.error('Failed to enable notifications');
		} finally {
			isSubscribing = false;
		}
	}

	async function subscribeToPush() {
		try {
			const registration = await navigator.serviceWorker.ready;
			const vapidPublicKey = await fetch('/api/notifications/subscribe').then((r) => r.text());

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
			});

			await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscription)
			});
		} catch (error) {
			console.error('Error subscribing to push:', error);
			throw error;
		}
	}

	function urlBase64ToUint8Array(base64String: string) {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	async function loadPreferences() {
		try {
			isLoading = true;
			const response = await fetch('/api/notifications/preferences');

			if (!response.ok) {
				throw new Error('Failed to load notification preferences');
			}

			const data = await response.json();
			preferences = data;
		} catch (error) {
			console.error('Error loading notification preferences:', error);
			toast.error('Failed to load notification preferences');
		} finally {
			isLoading = false;
		}
	}

	async function savePreferences() {
		try {
			isSaving = true;
			const response = await fetch('/api/notifications/preferences', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(preferences)
			});

			if (!response.ok) {
				throw new Error('Failed to save notification preferences');
			}

			toast.success('Notification preferences updated');
		} catch (error) {
			console.error('Error saving notification preferences:', error);
			toast.error('Failed to save notification preferences');
		} finally {
			isSaving = false;
		}
	}

	function handleToggle(key: keyof NotificationPreferences) {
		preferences[key] = !preferences[key];
		savePreferences();
	}

	const canTogglePreferences = $derived(browserPermission === 'granted' && preferences.pushEnabled);
</script>

<div class="notification-settings">
	{#if isLoading}
		<div class="loading">Loading preferences...</div>
	{:else}
		<!-- Browser Permission Banner -->
		{#if browserPermission !== 'granted'}
			<div class="permission-banner {browserPermission === 'denied' ? 'denied' : 'default'}">
				<div class="permission-info">
					{#if browserPermission === 'denied'}
						<strong>Browser notifications blocked</strong>
						<p>
							Please enable notifications in your browser settings to receive push notifications
						</p>
					{:else}
						<strong>Browser permission required</strong>
						<p>Enable browser notifications to receive push notifications</p>
					{/if}
				</div>
				{#if browserPermission === 'default'}
					<button class="enable-button" onclick={requestBrowserPermission} disabled={isSubscribing}>
						{isSubscribing ? 'Enabling...' : 'Enable'}
					</button>
				{/if}
			</div>
		{/if}

		<div class="settings-list">
			<!-- Push Notifications Toggle -->
			<div class="setting-item">
				<div class="setting-info">
					<h3>Push Notifications</h3>
					<p>Enable or disable all push notifications</p>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={preferences.pushEnabled}
						onchange={() => handleToggle('pushEnabled')}
						disabled={isSaving || browserPermission !== 'granted'}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<div class="divider"></div>

			<!-- Friend Requests -->
			<div class="setting-item" class:disabled={!canTogglePreferences}>
				<div class="setting-info">
					<h3>Friend Requests</h3>
					<p>Get notified when someone sends you a friend request</p>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={preferences.friendRequests}
						onchange={() => handleToggle('friendRequests')}
						disabled={isSaving || !canTogglePreferences}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<!-- Friend Accepted -->
			<div class="setting-item" class:disabled={!canTogglePreferences}>
				<div class="setting-info">
					<h3>Friend Request Accepted</h3>
					<p>Get notified when someone accepts your friend request</p>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={preferences.friendAccepted}
						onchange={() => handleToggle('friendAccepted')}
						disabled={isSaving || !canTogglePreferences}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<!-- Find Liked -->
			<div class="setting-item" class:disabled={!canTogglePreferences}>
				<div class="setting-info">
					<h3>Find Likes</h3>
					<p>Get notified when someone likes your find</p>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={preferences.findLiked}
						onchange={() => handleToggle('findLiked')}
						disabled={isSaving || !canTogglePreferences}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<!-- Find Commented -->
			<div class="setting-item" class:disabled={!canTogglePreferences}>
				<div class="setting-info">
					<h3>Find Comments</h3>
					<p>Get notified when someone comments on your find</p>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={preferences.findCommented}
						onchange={() => handleToggle('findCommented')}
						disabled={isSaving || !canTogglePreferences}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>
	{/if}
</div>

<style>
	.notification-settings {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #6b7280;
	}

	.permission-banner {
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.permission-banner.denied {
		background: #fee2e2;
		border-color: #ef4444;
	}

	.permission-info {
		flex: 1;
	}

	.permission-info strong {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: #111827;
		margin-bottom: 4px;
	}

	.permission-info p {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
	}

	.enable-button {
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.2s;
	}

	.enable-button:hover:not(:disabled) {
		background: #2563eb;
	}

	.enable-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.settings-list {
		background: white;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;
		gap: 16px;
		transition: opacity 0.2s;
	}

	.setting-item.disabled {
		opacity: 0.5;
	}

	.setting-info {
		flex: 1;
		min-width: 0;
	}

	.setting-info h3 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-family: inherit;
		font-weight: 500;
		color: #111827;
	}

	.setting-info p {
		margin: 0;
		font-size: 14px;
		color: #6b7280;
		line-height: 1.4;
	}

	.divider {
		height: 1px;
		background: #e5e7eb;
		margin: 0 20px;
	}

	/* Toggle Switch */
	.toggle {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 28px;
		flex-shrink: 0;
		cursor: pointer;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #d1d5db;
		border-radius: 28px;
		transition: background-color 0.2s;
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s;
	}

	.toggle input:checked + .toggle-slider {
		background-color: #3b82f6;
	}

	.toggle input:checked + .toggle-slider:before {
		transform: translateX(20px);
	}

	.toggle input:disabled + .toggle-slider {
		cursor: not-allowed;
		opacity: 0.6;
	}

	@media (max-width: 768px) {
		.notification-settings {
			padding: 16px;
		}

		.settings-header h2 {
			font-size: 20px;
		}

		.setting-item {
			padding: 16px;
		}

		.setting-info h3 {
			font-size: 15px;
		}

		.setting-info p {
			font-size: 13px;
		}

		.permission-banner {
			flex-direction: column;
			align-items: flex-start;
		}

		.enable-button {
			width: 100%;
		}
	}
</style>
