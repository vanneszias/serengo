<script lang="ts">
	import Skeleton from './skeleton.svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		variant: 'map' | 'profile' | 'card' | 'list-item' | 'avatar-card';
		class?: string;
	}

	let { variant, class: className }: Props = $props();
</script>

{#if variant === 'map'}
	<div class={cn('relative h-full w-full', className)}>
		<Skeleton class="h-full w-full rounded-xl" />
		<div class="absolute top-4 left-4">
			<Skeleton class="mb-2 h-4 w-16" />
			<Skeleton class="h-3 w-24" />
		</div>
		<div class="absolute top-4 right-4">
			<Skeleton class="h-10 w-10 rounded-lg" />
		</div>
	</div>
{:else if variant === 'profile'}
	<div class={cn('flex items-center space-x-3', className)}>
		<Skeleton class="h-10 w-10 rounded-full" />
		<div class="space-y-2">
			<Skeleton class="h-4 w-20" />
			<Skeleton class="h-3 w-16" />
		</div>
	</div>
{:else if variant === 'card'}
	<div class={cn('space-y-3 rounded-lg border p-4', className)}>
		<div class="flex items-center space-x-3">
			<Skeleton class="h-8 w-8 rounded-full" />
			<div class="space-y-1">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-3 w-16" />
			</div>
		</div>
		<Skeleton class="h-4 w-full" />
		<Skeleton class="h-4 w-3/4" />
		<Skeleton class="h-4 w-1/2" />
	</div>
{:else if variant === 'list-item'}
	<div class={cn('flex items-center space-x-3 py-2', className)}>
		<Skeleton class="h-6 w-6 rounded" />
		<div class="flex-1 space-y-1">
			<Skeleton class="h-4 w-3/4" />
			<Skeleton class="h-3 w-1/2" />
		</div>
		<Skeleton class="h-8 w-16 rounded" />
	</div>
{:else if variant === 'avatar-card'}
	<div class={cn('flex items-start space-x-4 rounded-lg border p-4', className)}>
		<Skeleton class="h-12 w-12 rounded-full" />
		<div class="flex-1 space-y-2">
			<Skeleton class="h-5 w-32" />
			<Skeleton class="h-4 w-24" />
			<div class="space-y-1">
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-5/6" />
				<Skeleton class="h-4 w-4/6" />
			</div>
		</div>
	</div>
{/if}
