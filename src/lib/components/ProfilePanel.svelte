<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from './dropdown-menu';
	import { Avatar, AvatarFallback, AvatarImage } from './avatar';
	import { Skeleton } from './skeleton';
	import ProfilePictureSheet from './ProfilePictureSheet.svelte';

	interface Props {
		username: string;
		id: string;
		profilePictureUrl?: string | null;
		loading?: boolean;
	}

	let { username, id, profilePictureUrl, loading = false }: Props = $props();

	let showProfilePictureSheet = $state(false);

	// Get the first letter of username for avatar
	const initial = username.charAt(0).toUpperCase();

	function openProfilePictureSheet() {
		showProfilePictureSheet = true;
	}

	function closeProfilePictureSheet() {
		showProfilePictureSheet = false;
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger class="profile-trigger">
		{#if loading}
			<Skeleton class="h-10 w-10 rounded-full" />
		{:else}
			<Avatar class="profile-avatar">
				{#if profilePictureUrl}
					<AvatarImage src={profilePictureUrl} alt={username} />
				{/if}
				<AvatarFallback class="profile-avatar-fallback">
					{initial}
				</AvatarFallback>
			</Avatar>
		{/if}
	</DropdownMenuTrigger>

	<DropdownMenuContent align="end" class="profile-dropdown-content">
		{#if loading}
			<div class="profile-header">
				<Skeleton class="h-4 w-16" />
			</div>

			<DropdownMenuSeparator />

			<div class="user-info-item">
				<Skeleton class="mb-1 h-3 w-12" />
				<Skeleton class="h-3 w-20" />
			</div>

			<div class="user-info-item">
				<Skeleton class="mb-1 h-3 w-12" />
				<Skeleton class="h-3 w-24" />
			</div>

			<DropdownMenuSeparator />

			<div class="logout-item-skeleton">
				<Skeleton class="h-8 w-full rounded" />
			</div>
		{:else}
			<div class="profile-header">
				<span class="profile-title">Profile</span>
			</div>

			<DropdownMenuSeparator />

			<DropdownMenuItem class="profile-picture-item" onclick={openProfilePictureSheet}>
				Profile Picture
			</DropdownMenuItem>

			<DropdownMenuSeparator />

			<div class="user-info-item">
				<span class="info-label">Username</span>
				<span class="info-value">{username}</span>
			</div>

			<div class="user-info-item">
				<span class="info-label">User ID</span>
				<span class="info-value">{id}</span>
			</div>

			<DropdownMenuSeparator />

			<form method="post" action="/logout" use:enhance>
				<DropdownMenuItem variant="destructive" class="logout-item">
					<button type="submit" class="logout-button">Sign out</button>
				</DropdownMenuItem>
			</form>
		{/if}
	</DropdownMenuContent>
</DropdownMenu>

{#if showProfilePictureSheet}
	<ProfilePictureSheet
		userId={id}
		{username}
		{profilePictureUrl}
		onClose={closeProfilePictureSheet}
	/>
{/if}

<style>
	:global(.profile-trigger) {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
		transition: transform 0.2s ease;
		outline: none;
	}

	:global(.profile-trigger:hover) {
		transform: scale(1.05);
	}

	:global(.profile-trigger:active) {
		transform: scale(0.95);
	}

	:global(.profile-avatar) {
		width: 40px;
		height: 40px;
	}

	:global(.profile-avatar-fallback) {
		background: black;
		color: white;
		font-weight: 600;
		font-size: 16px;
		border: 2px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.profile-dropdown-content) {
		min-width: 200px;
		max-width: 240px;
		padding: 4px;
	}

	.profile-header {
		padding: 8px 12px;
	}

	.profile-title {
		font-size: 14px;
		font-weight: 600;
		color: #333;
	}

	.user-info-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 12px;
	}

	.info-label {
		font-size: 12px;
		color: #666;
		font-weight: 500;
	}

	.info-value {
		font-size: 13px;
		color: #333;
		font-family: monospace;
		font-weight: 500;
		word-break: break-all;
	}

	:global(.profile-picture-item) {
		cursor: pointer;
		font-weight: 500;
		color: #333;
	}

	:global(.profile-picture-item:hover) {
		background: #f5f5f5;
	}

	:global(.logout-item) {
		padding: 0;
		margin: 4px;
	}

	.logout-item-skeleton {
		padding: 0;
		margin: 4px;
	}

	.logout-button {
		background: none;
		border: none;
		width: 100%;
		padding: 6px 8px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		color: inherit;
		text-align: left;
		border-radius: 4px;
	}

	@media (max-width: 480px) {
		:global(.profile-avatar) {
			width: 36px;
			height: 36px;
		}

		:global(.profile-avatar-fallback) {
			font-size: 14px;
		}

		:global(.profile-dropdown-content) {
			min-width: 180px;
			max-width: 200px;
		}

		.profile-header {
			padding: 6px 10px;
		}

		.user-info-item {
			padding: 6px 10px;
		}
	}
</style>
