<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/card';
	import { Button } from '$lib/components/button';
	import { Input } from '$lib/components/input';
	import ProfilePicture from '$lib/components/profile/ProfilePicture.svelte';
	import { Badge } from '$lib/components/badge';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	type Friendship = {
		id: string;
		userId: string;
		friendId: string;
		status: string;
		createdAt: string;
		friendUsername: string;
		friendProfilePictureUrl: string | null;
	};

	type SearchUser = {
		id: string;
		username: string;
		profilePictureUrl: string | null;
		friendshipStatus: string;
	};

	let { data }: { data: PageData } = $props();
	let searchQuery = $state('');
	let searchResults = $state<SearchUser[]>([]);
	let isSearching = $state(false);
	let activeTab = $state('friends');

	let friends = $state<Friendship[]>(data.friends);
	let sentRequests = $state<Friendship[]>(data.sentRequests);
	let receivedRequests = $state<Friendship[]>(data.receivedRequests);

	async function searchUsers() {
		if (searchQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		isSearching = true;
		try {
			const response = await fetch(`/api/users?q=${encodeURIComponent(searchQuery.trim())}`);
			if (!response.ok) {
				throw new Error('Failed to search users');
			}
			searchResults = await response.json();
		} catch (error) {
			console.error('Error searching users:', error);
			toast.error('Failed to search users');
		} finally {
			isSearching = false;
		}
	}

	async function sendFriendRequest(friendId: string) {
		try {
			const response = await fetch('/api/friends', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ friendId })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send friend request');
			}

			toast.success('Friend request sent!');
			// Update the search results to reflect the new status
			searchResults = searchResults.map((user) =>
				user.id === friendId ? { ...user, friendshipStatus: 'pending' } : user
			);
		} catch (error) {
			console.error('Error sending friend request:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to send friend request');
		}
	}

	async function respondToFriendRequest(friendshipId: string, action: 'accept' | 'decline') {
		try {
			const response = await fetch(`/api/friends/${friendshipId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action })
			});

			if (!response.ok) {
				throw new Error(`Failed to ${action} friend request`);
			}

			toast.success(`Friend request ${action}ed!`);

			// Remove from received requests
			receivedRequests = receivedRequests.filter((req: Friendship) => req.id !== friendshipId);

			// If accepted, refetch friends list
			if (action === 'accept') {
				const friendsResponse = await fetch('/api/friends?type=friends&status=accepted');
				if (friendsResponse.ok) {
					friends = await friendsResponse.json();
				}
			}
		} catch (error) {
			console.error(`Error ${action}ing friend request:`, error);
			toast.error(`Failed to ${action} friend request`);
		}
	}

	async function removeFriend(friendshipId: string) {
		try {
			const response = await fetch(`/api/friends/${friendshipId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to remove friend');
			}

			toast.success('Friend removed');
			friends = friends.filter((friend: Friendship) => friend.id !== friendshipId);
		} catch (error) {
			console.error('Error removing friend:', error);
			toast.error('Failed to remove friend');
		}
	}

	// Search users when query changes with debounce
	let searchTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (searchQuery) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(searchUsers, 300);
		}
	});
</script>

<svelte:head>
	<title>Friends - Serengo</title>
</svelte:head>

<div class="friends-page">
	<div class="friends-container">
		<!-- Tab Navigation -->
		<div class="tabs">
			<Button
				variant={activeTab === 'friends' ? 'default' : 'outline'}
				onclick={() => (activeTab = 'friends')}
			>
				Friends ({friends.length})
			</Button>
			<Button
				variant={activeTab === 'requests' ? 'default' : 'outline'}
				onclick={() => (activeTab = 'requests')}
			>
				Requests ({receivedRequests.length})
			</Button>
			<Button
				variant={activeTab === 'search' ? 'default' : 'outline'}
				onclick={() => (activeTab = 'search')}
			>
				Find Friends
			</Button>
		</div>

		<!-- Friends List -->
		{#if activeTab === 'friends'}
			<Card>
				<CardHeader>
					<CardTitle>Your Friends</CardTitle>
				</CardHeader>
				<CardContent>
					{#if friends.length === 0}
						<p class="empty-state">
							No friends yet. Use the "Find Friends" tab to search for people!
						</p>
					{:else}
						<div class="user-grid">
							{#each friends as friend (friend.id)}
								<div class="user-card">
									<ProfilePicture
										username={friend.friendUsername}
										profilePictureUrl={friend.friendProfilePictureUrl}
									/>
									<div class="user-info">
										<span class="username">{friend.friendUsername}</span>
										<Badge variant="secondary">Friend</Badge>
									</div>
									<Button variant="destructive" size="sm" onclick={() => removeFriend(friend.id)}>
										Remove
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- Friend Requests -->
		{#if activeTab === 'requests'}
			<div class="requests-section">
				<!-- Received Requests -->
				<Card>
					<CardHeader>
						<CardTitle>Friend Requests ({receivedRequests.length})</CardTitle>
					</CardHeader>
					<CardContent>
						{#if receivedRequests.length === 0}
							<p class="empty-state">No pending friend requests</p>
						{:else}
							<div class="user-grid">
								{#each receivedRequests as request (request.id)}
									<div class="user-card">
										<ProfilePicture
											username={request.friendUsername}
											profilePictureUrl={request.friendProfilePictureUrl}
										/>
										<div class="user-info">
											<span class="username">{request.friendUsername}</span>
											<Badge variant="outline">Pending</Badge>
										</div>
										<div class="request-actions">
											<Button
												variant="default"
												size="sm"
												onclick={() => respondToFriendRequest(request.id, 'accept')}
											>
												Accept
											</Button>
											<Button
												variant="outline"
												size="sm"
												onclick={() => respondToFriendRequest(request.id, 'decline')}
											>
												Decline
											</Button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Sent Requests -->
				{#if sentRequests.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Sent Requests ({sentRequests.length})</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="user-grid">
								{#each sentRequests as request (request.id)}
									<div class="user-card">
										<ProfilePicture
											username={request.friendUsername}
											profilePictureUrl={request.friendProfilePictureUrl}
										/>
										<div class="user-info">
											<span class="username">{request.friendUsername}</span>
											<Badge variant="secondary">Sent</Badge>
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		{/if}

		<!-- Search Users -->
		{#if activeTab === 'search'}
			<Card>
				<CardHeader>
					<CardTitle>Find Friends</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="search-section">
						<Input bind:value={searchQuery} placeholder="Search for users by username..." />

						{#if isSearching}
							<p class="loading">Searching...</p>
						{:else if searchQuery.trim().length >= 2}
							{#if searchResults.length === 0}
								<p class="empty-state">No users found matching "{searchQuery}"</p>
							{:else}
								<div class="user-grid">
									{#each searchResults as user (user.id)}
										<div class="user-card">
											<ProfilePicture
												username={user.username}
												profilePictureUrl={user.profilePictureUrl}
											/>
											<div class="user-info">
												<span class="username">{user.username}</span>
												{#if user.friendshipStatus === 'accepted'}
													<Badge variant="secondary">Friend</Badge>
												{:else if user.friendshipStatus === 'pending'}
													<Badge variant="outline">Request Sent</Badge>
												{:else if user.friendshipStatus === 'blocked'}
													<Badge variant="destructive">Blocked</Badge>
												{/if}
											</div>
											{#if user.friendshipStatus === 'none'}
												<Button onclick={() => sendFriendRequest(user.id)} size="sm">
													Add Friend
												</Button>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						{:else if searchQuery.trim().length > 0}
							<p class="hint">Please enter at least 2 characters to search</p>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<style>
	.friends-page {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.friends-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.tabs {
		display: flex;
		gap: 8px;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 16px;
	}

	.user-grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #fafafa;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.username {
		font-weight: 500;
		color: #1a1a1a;
	}

	.request-actions {
		display: flex;
		gap: 8px;
	}

	.requests-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.search-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.empty-state,
	.loading,
	.hint {
		padding: 40px 20px;
		text-align: center;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.friends-page {
			padding: 12px;
		}

		.user-grid {
			grid-template-columns: 1fr;
		}

		.tabs {
			flex-wrap: wrap;
		}

		.request-actions {
			flex-direction: column;
		}
	}
</style>
