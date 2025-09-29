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
	<h1 class="app-title">Serengo</h1>
	<ProfileIcon username={user.username} onclick={toggleProfilePanel} />
</header>

<ProfilePanel
	username={user.username}
	id={user.id}
	isOpen={showProfilePanel}
	onClose={closeProfilePanel}
/>

<style>
	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
	}
</style>
