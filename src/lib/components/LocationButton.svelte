<script lang="ts">
	import { toast } from 'svelte-sonner';
	import {
		locationActions,
		locationStatus,
		locationError,
		isLocationLoading,
		isWatching
	} from '$lib/stores/location';
	import { Skeleton } from './skeleton';

	interface Props {
		class?: string;
		variant?: 'primary' | 'secondary' | 'icon';
		size?: 'small' | 'medium' | 'large';
		showLabel?: boolean;
	}

	let {
		class: className = '',
		variant = 'primary',
		size = 'medium',
		showLabel = true
	}: Props = $props();

	// Track if location watching is active from the derived store

	async function handleLocationClick() {
		if ($isWatching) {
			// Stop watching if currently active
			locationActions.stopWatching();
			toast.success('Location watching stopped');
		} else {
			// Try to get current location first, then start watching
			const result = await locationActions.getCurrentLocation({
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 300000
			});

			if (result) {
				// Start watching for continuous updates
				locationActions.startWatching({
					enableHighAccuracy: true,
					timeout: 15000,
					maximumAge: 60000 // Update every minute
				});
				toast.success('Location watching started');
			} else if ($locationError) {
				toast.error($locationError.message);
			}
		}
	}

	const buttonText = $derived(() => {
		if ($isLocationLoading) return 'Finding location...';
		if ($isWatching) return 'Stop watching location';
		if ($locationStatus === 'success') return 'Watch location';
		return 'Find my location';
	});

	const iconClass = $derived(() => {
		if ($isLocationLoading) return 'loading';
		if ($isWatching) return 'watching';
		if ($locationStatus === 'success') return 'success';
		if ($locationStatus === 'error') return 'error';
		return 'default';
	});
</script>

<button
	class="location-button {variant} {size} {className}"
	onclick={handleLocationClick}
	disabled={$isLocationLoading}
	title={buttonText()}
>
	<span class="icon {iconClass()}">
		{#if $isLocationLoading}
			<div class="loading-skeleton">
				<Skeleton class="h-5 w-5 rounded-full" />
			</div>
		{:else if $isWatching}
			<svg viewBox="0 0 24 24" class="watching-icon">
				<path
					d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"
				/>
				<circle
					cx="12"
					cy="9"
					r="15"
					stroke="currentColor"
					stroke-width="1"
					fill="none"
					opacity="0.3"
					class="pulse-ring"
				/>
			</svg>
		{:else if $locationStatus === 'success'}
			<svg viewBox="0 0 24 24">
				<path
					d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"
				/>
			</svg>
		{:else if $locationStatus === 'error'}
			<svg viewBox="0 0 24 24">
				<path
					d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
				/>
			</svg>
		{:else}
			<svg viewBox="0 0 24 24">
				<path
					d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z"
				/>
			</svg>
		{/if}
	</span>

	{#if showLabel && variant !== 'icon'}
		<span class="label">{buttonText()}</span>
	{/if}
</button>

<style>
	.location-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-family: inherit;
		font-weight: 500;
		transition: all 0.2s ease;
		position: relative;
	}

	.location-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Variants */
	.primary {
		background: #2563eb;
		color: white;
		box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
	}

	.primary:hover:not(:disabled) {
		background: #1d4ed8;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
	}

	.secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.secondary:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
		transform: translateY(-1px);
	}

	.icon {
		background: transparent;
		color: #6b7280;
		padding: 8px;
		border-radius: 50%;
		border: 1px solid #d1d5db;
	}

	.icon:hover:not(:disabled) {
		background: #f3f4f6;
		color: #374151;
	}

	/* Sizes */
	.small {
		padding: 6px 12px;
		font-size: 14px;
	}

	.small.icon {
		padding: 6px;
	}

	.medium {
		padding: 8px 16px;
		font-size: 16px;
	}

	.medium.icon {
		padding: 8px;
	}

	.large {
		padding: 12px 20px;
		font-size: 18px;
	}

	.large.icon {
		padding: 12px;
	}

	/* Icon styles */
	.icon svg {
		width: 20px;
		height: 20px;
		fill: currentColor;
	}

	.small .icon svg {
		width: 16px;
		height: 16px;
	}

	.large .icon svg {
		width: 24px;
		height: 24px;
	}

	.loading-skeleton {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
	}

	.icon.success svg {
		color: #10b981;
		fill: #10b981;
	}

	.icon.watching svg {
		color: #f59e0b;
		fill: #f59e0b;
	}

	.icon.error svg {
		color: #ef4444;
		fill: #ef4444;
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.watching-icon .pulse-ring {
		animation: pulse-ring 2s infinite;
	}

	@keyframes pulse-ring {
		0% {
			transform: scale(0.5);
			opacity: 0.5;
		}
		50% {
			transform: scale(1);
			opacity: 0.3;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	.label {
		white-space: nowrap;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.location-button .label {
			display: none;
		}

		.location-button {
			padding: 8px;
			border-radius: 50%;
		}
	}
</style>
