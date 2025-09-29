<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from './Modal.svelte';

	interface Props {
		username: string;
		id: string;
		isOpen: boolean;
		onClose: () => void;
	}

	let { username, id, isOpen, onClose }: Props = $props();

	// Create a bindable showModal that syncs with isOpen
	let showModal = $derived(false);

	// Sync showModal with isOpen prop
	$effect(() => {
		showModal = isOpen;
	});

	// Handle modal close and sync back to parent
	$effect(() => {
		if (!showModal && isOpen) {
			onClose();
		}
	});
</script>

<Modal bind:showModal positioning="dropdown">
	{#snippet header()}
		<h2>Profile</h2>
	{/snippet}

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
</Modal>

<style>
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

	:global(.modal h2) {
		font-size: 18px;
		font-weight: 600;
		color: #333;
		margin: 0;
	}

	@media (max-width: 480px) {
		.user-item {
			padding: 14px 16px;
		}

		.panel-actions {
			padding: 16px;
		}
	}
</style>
