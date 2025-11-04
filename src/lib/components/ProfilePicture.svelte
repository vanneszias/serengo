<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from './avatar';
	import { cn } from '$lib/utils';

	interface Props {
		username: string;
		profilePictureUrl?: string | null;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
		loading?: boolean;
	}

	let {
		username,
		profilePictureUrl,
		size = 'md',
		class: className,
		loading = false
	}: Props = $props();

	const initial = username.charAt(0).toUpperCase();

	const sizeClasses = {
		sm: 'h-8 w-8',
		md: 'h-10 w-10',
		lg: 'h-16 w-16',
		xl: 'h-24 w-24'
	};

	const fallbackSizeClasses = {
		sm: 'text-xs',
		md: 'text-base',
		lg: 'text-xl',
		xl: 'text-3xl'
	};
</script>

{#if loading}
	<div class={cn('animate-pulse rounded-full bg-gray-200', sizeClasses[size], className)}></div>
{:else}
	<Avatar class={cn(sizeClasses[size], className)}>
		{#if profilePictureUrl}
			<AvatarImage src={profilePictureUrl} alt={username} />
		{/if}
		<AvatarFallback class={cn('profile-picture-fallback', fallbackSizeClasses[size])}>
			{initial}
		</AvatarFallback>
	</Avatar>
{/if}

<style>
	:global(.profile-picture-fallback) {
		background: black;
		color: white;
		font-weight: 600;
		border: 2px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
</style>
