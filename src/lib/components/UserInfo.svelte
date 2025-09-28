<script lang="ts">
	interface Props {
		username: string;
		id: string;
		showId?: boolean;
	}

	let { username, id, showId = true }: Props = $props();
</script>

<div class="user-info">
	<p class="greeting">Hi, {username}!</p>
	{#if showId}
		<p class="user-id">Your user ID is {id}.</p>
	{/if}
</div>

<style>
	.user-info {
		margin-bottom: 2rem;
		text-align: center;
	}

	.greeting {
		font-size: 1.25rem;
		color: #333;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.user-id {
		font-size: 0.95rem;
		color: #666;
		margin-bottom: 0;
		font-family: monospace;
	}

	@media (max-width: 480px) {
		.greeting {
			font-size: 1.1rem;
		}

		.user-id {
			font-size: 0.85rem;
		}
	}
</style>
