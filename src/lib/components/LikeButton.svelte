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

	let isLoading = $state(false);
	let currentIsLiked = $state(isLiked);
	let currentLikeCount = $state(likeCount);

	async function toggleLike() {
		if (isLoading) return;

		const previousLiked = currentIsLiked;
		const previousCount = currentLikeCount;

		// Optimistic update
		currentIsLiked = !currentIsLiked;
		currentLikeCount += currentIsLiked ? 1 : -1;

		isLoading = true;

		try {
			const method = currentIsLiked ? 'POST' : 'DELETE';
			const response = await fetch(`/api/finds/${findId}/like`, {
				method,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const error = (await response.json()) as { message?: string };
				throw new Error(error.message || 'Failed to update like');
			}

			// Success - optimistic update was correct
		} catch (error: unknown) {
			// Revert optimistic update on error
			currentIsLiked = previousLiked;
			currentLikeCount = previousCount;

			console.error('Error updating like:', error);
			toast.error('Failed to update like. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	// Update internal state when props change
	$effect(() => {
		currentIsLiked = isLiked;
		currentLikeCount = likeCount;
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
		class="h-4 w-4 transition-all duration-200 {currentIsLiked
			? 'scale-110 fill-red-500 text-red-500'
			: 'text-gray-500 group-hover:scale-105 group-hover:text-red-400'} {isLoading
			? 'animate-pulse'
			: ''}"
	/>
	{#if currentLikeCount > 0}
		<span
			class="text-sm font-medium transition-colors {currentIsLiked
				? 'text-red-500'
				: 'text-gray-500 group-hover:text-red-400'}"
		>
			{currentLikeCount}
		</span>
	{/if}
</Button>
