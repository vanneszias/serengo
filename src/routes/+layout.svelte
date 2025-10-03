<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Header } from '$lib';
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/sonner/index.js';
	import { Skeleton } from '$lib/components/skeleton';

	let { children, data } = $props();
	let isLoginRoute = $derived(page.url.pathname.startsWith('/login'));
	let showHeader = $derived(!isLoginRoute && data?.user);
	let isLoading = $derived(!isLoginRoute && !data?.user && data !== null);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

{#if showHeader && data.user}
	<Header user={data.user} />
{:else if isLoading}
	<header class="header-skeleton">
		<div class="header-content">
			<Skeleton class="h-8 w-32" />
			<Skeleton class="h-10 w-10 rounded-full" />
		</div>
	</header>
{/if}

{@render children?.()}

<style>
	.header-skeleton {
		border-bottom: 1px solid #e5e7eb;
		background: white;
		padding: 0 20px;
		height: 64px;
		display: flex;
		align-items: center;
	}

	.header-content {
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	@media (max-width: 768px) {
		.header-skeleton {
			padding: 0 16px;
			height: 56px;
		}
	}
</style>
