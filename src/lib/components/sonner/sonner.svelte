<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	{...restProps}
/>

<style>
	:global([data-sonner-toast][data-type='error']) {
		background-color: #fef2f2 !important;
		border-color: #ef4444 !important;
		color: #dc2626 !important;
	}

	:global([data-sonner-toast][data-type='error'] [data-icon]) {
		color: #ef4444 !important;
	}

	:global([data-sonner-toast][data-type='error'] [data-content]) {
		color: #dc2626 !important;
		font-weight: 500;
	}
</style>
