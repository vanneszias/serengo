<script lang="ts">
	import { Button } from '$lib/components/button';
	import { Heart } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

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

	// Track the source of truth - server state
	let serverIsLiked = $state(isLiked);
	let serverLikeCount = $state(likeCount);

	// Track optimistic state during loading
	let isLoading = $state(false);
	let optimisticIsLiked = $state(isLiked);
	let optimisticLikeCount = $state(likeCount);

	// Derived state for display
	let displayIsLiked = $derived(isLoading ? optimisticIsLiked : serverIsLiked);
	let displayLikeCount = $derived(isLoading ? optimisticLikeCount : serverLikeCount);

	async function toggleLike() {
		if (isLoading) return;

		// Set optimistic state
		optimisticIsLiked = !serverIsLiked;
		optimisticLikeCount = serverLikeCount + (optimisticIsLiked ? 1 : -1);
		isLoading = true;

		try {
			const method = optimisticIsLiked ? 'POST' : 'DELETE';
			const response = await fetch(`/api/finds/${findId}/like`, {
				method,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const result = await response.json();

			// Update server state with response
			serverIsLiked = result.isLiked;
			serverLikeCount = result.likeCount;
		} catch (error: unknown) {
			console.error('Error updating like:', error);
			toast.error('Failed to update like. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	// Update server state when props change (from parent component)
	$effect(() => {
		serverIsLiked = isLiked;
		serverLikeCount = likeCount;
	});
</script>

<Button
	variant="ghost"
	{size}
	class="group gap-1.5 {className}"
	onclick={toggleLike}
	disabled={isLoading}
>
	<Heart
		class="h-4 w-4 transition-all duration-200 {displayIsLiked
			? 'scale-110 fill-red-500 text-red-500'
			: 'text-gray-500 group-hover:scale-105 group-hover:text-red-400'} {isLoading
			? 'animate-pulse'
			: ''}"
	/>
	{#if displayLikeCount > 0}
		<span
			class="text-sm font-medium transition-colors {displayIsLiked
				? 'text-red-500'
				: 'text-gray-500 group-hover:text-red-400'}"
		>
			{displayLikeCount}
		</span>
	{/if}
</Button>
