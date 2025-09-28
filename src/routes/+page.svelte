<script lang="ts">
	import { ProfileIcon, ProfilePanel } from '$lib';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	let showProfilePanel = $state(false);

	function toggleProfilePanel() {
		showProfilePanel = !showProfilePanel;
	}

	function closeProfilePanel() {
		showProfilePanel = false;
	}
</script>

<div class="home-container">
	<header class="app-header">
		<h1 class="app-title">Serengo</h1>
		<ProfileIcon username={data.user.username} onclick={toggleProfilePanel} />
	</header>

	<main class="main-content">
		<!-- Future content will go here -->
	</main>

	<ProfilePanel
		username={data.user.username}
		id={data.user.id}
		isOpen={showProfilePanel}
		onClose={closeProfilePanel}
	/>
</div>

<style>
	.home-container {
		min-height: 100vh;
		background-color: #f8f8f8;
	}

	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background-color: white;
		border-bottom: 1px solid #e5e5e5;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.app-title {
		font-family: 'Washington', serif;
		font-size: 24px;
		font-weight: normal;
		color: #333;
		margin: 0;
	}

	.main-content {
		padding: 24px 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	@media (max-width: 480px) {
		.app-header {
			padding: 12px 16px;
		}

		.app-title {
			font-size: 20px;
		}

		.main-content {
			padding: 20px 16px;
		}
	}
</style>
