<script lang="ts">
	interface Props {
		username: string;
		onclick?: () => void;
	}

	let { username, onclick }: Props = $props();

	// Get the first letter of username for avatar
	const initial = username.charAt(0).toUpperCase();
</script>

<button class="profile-icon" {onclick} type="button">
	<div class="avatar">
		{initial}
	</div>
</button>

<style>
	.profile-icon {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.profile-icon:hover {
		transform: scale(1.05);
	}

	.profile-icon:active {
		transform: scale(0.95);
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: black;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 16px;
		border: 2px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 480px) {
		.avatar {
			width: 36px;
			height: 36px;
			font-size: 14px;
		}
	}
</style>
