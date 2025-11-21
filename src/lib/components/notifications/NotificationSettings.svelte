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

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

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
	let isMobile = $state(false);

	// Detect screen size
	$effect(() => {
		if (typeof window === 'undefined') return;

		const checkIsMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	});

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

<div class="modal-container" class:mobile={isMobile}>
	<div class="modal-content">
		<div class="modal-header">
			<div class="header-content">
				<h2 class="modal-title">Notification Settings</h2>
				<p class="modal-subtitle">Manage your notification preferences</p>
			</div>
			<button type="button" class="close-button" onclick={onClose} aria-label="Close">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path
						d="M18 6L6 18M6 6L18 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>

		<div class="modal-body">
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
							<button
								class="enable-button"
								onclick={requestBrowserPermission}
								disabled={isSubscribing}
							>
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
	</div>
</div>

<style>
	.modal-container {
		position: fixed;
		top: 80px;
		right: 20px;
		width: auto;
		max-width: 500px;
		min-width: 380px;
		max-height: calc(100vh - 100px);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.modal-container.mobile {
		top: auto;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		min-width: 0;
		max-width: none;
		height: 90vh;
		border-radius: 16px 16px 0 0;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		height: auto;
		max-height: 100%;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.header-content {
		flex: 1;
		min-width: 0;
	}

	.modal-title {
		font-family: 'Washington', serif;
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
		line-height: 1.3;
	}

	.modal-subtitle {
		margin: 0.25rem 0 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.close-button:hover {
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
	}

	.modal-body {
		flex: 0 1 auto;
		overflow-y: auto;
		padding: 1.25rem;
		background: transparent;
		min-height: 0;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: hsl(var(--muted-foreground));
	}

	.permission-banner {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 10px;
		padding: 0.875rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.permission-banner.denied {
		background: hsl(var(--destructive) / 0.1);
		border-color: hsl(var(--destructive));
	}

	.permission-info {
		flex: 1;
	}

	.permission-info strong {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.25rem;
	}

	.permission-info p {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	.enable-button {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.2s;
	}

	.enable-button:hover:not(:disabled) {
		background: hsl(var(--primary) / 0.9);
	}

	.enable-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.settings-list {
		background: hsl(var(--card));
		border-radius: 12px;
		border: 1px solid hsl(var(--border));
		overflow: hidden;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem;
		gap: 1rem;
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
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.setting-info p {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
	}

	.divider {
		height: 1px;
		background: hsl(var(--border));
		margin: 0 1.25rem;
	}

	/* Toggle Switch */
	.toggle {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
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
		background-color: rgba(255, 255, 255, 0.6);
		border: 1px solid hsl(var(--border));
		border-radius: 24px;
		transition: all 0.2s;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 22px;
		width: 22px;
		left: 3px;
		bottom: 2px;
		background-color: #ffffff;
		border-radius: 50%;
		transition: transform 0.25s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.toggle input:checked + .toggle-slider {
		background-color: rgba(0, 0, 0, 0.8);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.toggle input:checked + .toggle-slider:before {
		transform: translateX(22px);
	}

	.toggle input:disabled + .toggle-slider {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Mobile specificadjust ments */
	@media (max-width: 767px) {
		.modal-container {
			top: auto;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			min-width: 0;
			max-width: none;
			height: 90vh;
			border-radius: 16px 16px 0 0;
		}
	}
</style>
