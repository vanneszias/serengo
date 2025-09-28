<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, UserInfo } from '$lib';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="home-container">
	<h1>Welcome to Serengo</h1>
	<UserInfo username={data.user.username} id={data.user.id} />

	<form method="post" action="/logout" use:enhance>
		<Button type="submit" variant="secondary">Sign out</Button>
	</form>
</div>

<style>
	.home-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
	}

	.home-container h1 {
		font-size: 2.5rem;
		color: #333;
		margin-bottom: 2rem;
	}
</style>
