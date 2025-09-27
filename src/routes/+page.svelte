<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1>Welcome to Serengo</h1>
<p>Hi, {data.user.username}!</p>
<p>Your user ID is {data.user.id}.</p>

<form method="post" action="/logout" use:enhance>
	<button>Sign out</button>
</form>
