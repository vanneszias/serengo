<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		username: string;
		id: string;
		isOpen: boolean;
		onClose: () => void;
	}

	let { username, id, isOpen, onClose }: Props = $props();

	// Close panel on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="backdrop" role="presentation">
		<div class="panel">
			<div class="panel-header">
				<h2>Profile</h2>
				<button class="close-button" onclick={onClose} type="button" aria-label="Close">
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

			<div class="panel-content">
				<div class="user-item">
					<span class="label">Username</span>
					<span class="value">{username}</span>
				</div>

				<div class="user-item">
					<span class="label">User ID</span>
					<span class="value">{id}</span>
				</div>

				<div class="panel-actions">
					<form method="post" action="/logout" use:enhance>
						<button type="submit" class="signout-button"> Sign out </button>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.panel {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		width: 320px;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
		z-index: 1000;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;
		border-bottom: 1px solid #e5e5e5;
	}

	.panel-header h2 {
		font-size: 18px;
		font-weight: 600;
		color: #333;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		color: #666;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.close-button:hover {
		background-color: #f5f5f5;
		color: #333;
	}

	.panel-content {
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.user-item {
		padding: 16px 20px;
		border-bottom: 1px solid #e5e5e5;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.user-item:last-of-type {
		border-bottom: none;
	}

	.label {
		font-size: 14px;
		color: #666;
		font-weight: 500;
	}

	.value {
		font-size: 14px;
		color: #333;
		font-family: monospace;
		font-weight: 500;
	}

	.panel-actions {
		padding: 20px;
		border-top: 1px solid #e5e5e5;
	}

	.signout-button {
		background-color: #dc3545;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 500;
		width: 100%;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.signout-button:hover {
		background-color: #c82333;
	}

	.signout-button:active {
		background-color: #bd2130;
	}

	@media (max-width: 480px) {
		.panel {
			width: 280px;
		}

		.user-item {
			padding: 14px 16px;
		}

		.panel-actions {
			padding: 16px;
		}
	}
</style>
