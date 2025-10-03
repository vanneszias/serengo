<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { Skeleton } from '../skeleton';

	let {
		ref = $bindable(null),
		class: className,
		loading = false,
		...restProps
	}: AvatarPrimitive.FallbackProps & { loading?: boolean } = $props();
</script>

{#if loading}
	<Skeleton class={cn('size-full rounded-full', className)} />
{:else}
	<AvatarPrimitive.Fallback
		bind:ref
		data-slot="avatar-fallback"
		class={cn('flex size-full items-center justify-center rounded-full bg-muted', className)}
		{...restProps}
	/>
{/if}
