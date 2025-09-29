<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Header } from '$lib';
	import { page } from '$app/state';

	let { children, data } = $props();

	let isLoginRoute = $derived(page.url.pathname.startsWith('/login'));
	let showHeader = $derived(!isLoginRoute && data?.user);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if showHeader && data.user}
	<Header user={data.user} />
{/if}

{@render children?.()}
