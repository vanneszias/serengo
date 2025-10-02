<script lang="ts">
	import { ProfileIcon, ProfilePanel } from '$lib';

	type User = {
		id: string;
		username: string;
	};

	let { user }: { user: User } = $props();

	let showProfilePanel = $state(false);

	function toggleProfilePanel() {
		showProfilePanel = !showProfilePanel;
	}

	function closeProfilePanel() {
		showProfilePanel = false;
	}
</script>

<header class="app-header">
	<div class="header-content">
		<h1 class="app-title">Serengo</h1>
		<div class="profile-container">
			<ProfileIcon username={user.username} onclick={toggleProfilePanel} />
			<ProfilePanel
				username={user.username}
				id={user.id}
				isOpen={showProfilePanel}
				onClose={closeProfilePanel}
			/>
		</div>
	</div>
</header>

<style>
	.app-header {
		width: 100%;
		position: relative;
		z-index: 10;
		background-color: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		margin: 0 auto;
		max-width: 1200px;
	}

	.profile-container {
		position: relative;
	}
</style>
