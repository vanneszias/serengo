<script lang="ts">
	import { X, Bell } from 'lucide-svelte';

	interface Props {
		onEnable: () => void;
		onDismiss: () => void;
	}

	let { onEnable, onDismiss }: Props = $props();
</script>

<div class="notification-prompt">
	<div class="notification-prompt-content">
		<div class="notification-prompt-icon">
			<Bell size={20} />
		</div>
		<div class="notification-prompt-text">
			<h3>Enable Notifications</h3>
			<p>Stay updated when friends like or comment on your finds</p>
		</div>
		<div class="notification-prompt-actions">
			<button class="enable-button" onclick={onEnable}>Enable</button>
			<button class="dismiss-button" onclick={onDismiss} aria-label="Dismiss notification prompt">
				<X size={20} />
			</button>
		</div>
	</div>
</div>

<style>
	.notification-prompt {
		position: fixed;
		top: 80px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 50;
		width: 90%;
		max-width: 600px;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.notification-prompt-content {
		background: white;
		border-radius: 12px;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 1px solid #e5e7eb;
		padding: 16px 20px;
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.notification-prompt-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		background: #3b82f6;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.notification-prompt-text {
		flex: 1;
		min-width: 0;
	}

	.notification-prompt-text h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		line-height: 1.3;
	}

	.notification-prompt-text p {
		margin: 4px 0 0 0;
		font-size: 14px;
		color: #6b7280;
		line-height: 1.4;
	}

	.notification-prompt-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
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
		transition: background 0.2s;
		white-space: nowrap;
	}

	.enable-button:hover {
		background: #2563eb;
	}

	.enable-button:active {
		background: #1d4ed8;
	}

	.dismiss-button {
		background: transparent;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.dismiss-button:hover {
		background: #f3f4f6;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.notification-prompt {
			top: 70px;
			width: 95%;
		}

		.notification-prompt-content {
			padding: 12px 16px;
			gap: 12px;
		}

		.notification-prompt-icon {
			width: 36px;
			height: 36px;
		}

		.notification-prompt-text h3 {
			font-size: 15px;
		}

		.notification-prompt-text p {
			font-size: 13px;
		}

		.enable-button {
			padding: 6px 12px;
			font-size: 13px;
		}
	}
</style>
