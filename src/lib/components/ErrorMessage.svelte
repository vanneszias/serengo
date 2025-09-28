<script lang="ts">
	interface Props {
		message?: string;
		show?: boolean;
	}

	let { message, show = true }: Props = $props();
</script>

{#if message && show}
	<p class="error-message">{message}</p>
{/if}

<style>
	.error-message {
		color: #e53e3e;
		font-size: 0.875rem;
		text-align: center;
		margin-top: 1rem;
		padding: 0.5rem;
	}
</style>
