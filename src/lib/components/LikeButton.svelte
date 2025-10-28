<script lang="ts">
	import { Button } from '$lib/components/button';
	import { Heart } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';

	interface Props {
		findId: string;
		isLiked?: boolean;
		likeCount?: number;
		size?: 'sm' | 'default' | 'lg';
		class?: string;
	}

	let {
		findId,
		isLiked = false,
		likeCount = 0,
		size = 'default',
		class: className = ''
	}: Props = $props();

	// Local state stores for this like button
	const likeState = writable({
		isLiked: isLiked,
		likeCount: likeCount,
		isLoading: false
	});

	let apiSync: any = null;

	// Initialize API sync and subscribe to global state
	onMount(async () => {
		if (browser) {
			try {
				// Dynamically import the API sync
				const module = await import('$lib/stores/api-sync');
				apiSync = module.apiSync;

				// Initialize the find's like state with props data
				apiSync.setEntityState('find', findId, {
					id: findId,
					isLikedByUser: isLiked,
					likeCount: likeCount,
					// Minimal data needed for like functionality
					title: '',
					latitude: '',
					longitude: '',
					isPublic: true,
					createdAt: new Date(),
					userId: '',
					username: '',
					isFromFriend: false
				});

				// Subscribe to global state for this find
				const globalLikeState = apiSync.subscribeFindLikes(findId);
				globalLikeState.subscribe((state: any) => {
					likeState.set({
						isLiked: state.isLiked,
						likeCount: state.likeCount,
						isLoading: state.isLoading
					});
				});
			} catch (error) {
				console.error('Failed to initialize API sync:', error);
			}
		}
	});

	async function toggleLike() {
		if (!apiSync || !browser) return;

		const currentState = likeState;
		if (currentState && (currentState as any).isLoading) return;

		try {
			await apiSync.toggleLike(findId);
		} catch (error) {
			console.error('Failed to toggle like:', error);
		}
	}
</script>

<Button
	variant="ghost"
	{size}
	class="group gap-1.5 {className}"
	onclick={toggleLike}
	disabled={$likeState.isLoading}
>
	<Heart
		class="h-4 w-4 transition-all duration-200 {$likeState.isLiked
			? 'scale-110 fill-red-500 text-red-500'
			: 'text-gray-500 group-hover:scale-105 group-hover:text-red-400'} {$likeState.isLoading
			? 'animate-pulse'
			: ''}"
	/>
	{#if $likeState.likeCount > 0}
		<span
			class="text-sm font-medium transition-colors {$likeState.isLiked
				? 'text-red-500'
				: 'text-gray-500 group-hover:text-red-400'}"
		>
			{$likeState.likeCount}
		</span>
	{/if}
</Button>
