<script lang="ts">
	import { ProfilePanel } from '$lib';

	type User = {
		id: string;
		username: string;
	};

	let { user }: { user: User } = $props();
</script>

<header class="app-header">
	<div class="header-content">
		<h1 class="app-title">Serengo</h1>
		<div class="profile-container">
			<ProfilePanel username={user.username} id={user.id} />
		</div>
	</div>
</header>

<style>
	.app-header {
		width: 100%;
		position: relative;
		z-index: 10;
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
