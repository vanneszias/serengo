<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import CreateFindModal from '$lib/components/CreateFindModal.svelte';
	import FindPreview from '$lib/components/FindPreview.svelte';
	import type { PageData } from './$types';
	import { coordinates } from '$lib/stores/location';

	// Server response type
	interface ServerFind {
		id: string;
		title: string;
		description?: string;
		latitude: string;
		longitude: string;
		locationName?: string;
		category?: string;
		isPublic: number;
		createdAt: Date;
		userId: string;
		username: string;
		media: Array<{
			id: string;
			findId: string;
			type: string;
			url: string;
			thumbnailUrl: string | null;
			orderIndex: number | null;
		}>;
	}

	// Map component type
	interface MapFind {
		id: string;
		title: string;
		description?: string;
		latitude: string;
		longitude: string;
		locationName?: string;
		category?: string;
		isPublic: number;
		createdAt: Date;
		userId: string;
		user: {
			id: string;
			username: string;
		};
		media?: Array<{
			type: string;
			url: string;
			thumbnailUrl: string;
		}>;
	}

	// Interface for FindPreview component
	interface FindPreviewData {
		id: string;
		title: string;
		description?: string;
		latitude: string;
		longitude: string;
		locationName?: string;
		category?: string;
		createdAt: string;
		user: {
			id: string;
			username: string;
		};
		media?: Array<{
			type: string;
			url: string;
			thumbnailUrl: string;
		}>;
	}

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let selectedFind: FindPreviewData | null = $state(null);
	let viewMode = $state<'map' | 'list'>('map');

	// Reactive finds list - convert server format to component format
	let finds = $derived(
		(data.finds as ServerFind[]).map((serverFind) => ({
			...serverFind,
			user: {
				id: serverFind.userId,
				username: serverFind.username
			},
			media: serverFind.media?.map((m) => ({
				type: m.type,
				url: m.url,
				thumbnailUrl: m.thumbnailUrl || m.url
			}))
		})) as MapFind[]
	);

	function handleFindCreated(event: CustomEvent) {
		// For now, just close modal and refresh page as in original implementation
		showCreateModal = false;
		if (event.detail?.reload) {
			window.location.reload();
		}
	}

	function handleFindClick(find: MapFind) {
		// Convert MapFind to FindPreviewData format
		selectedFind = {
			id: find.id,
			title: find.title,
			description: find.description,
			latitude: find.latitude,
			longitude: find.longitude,
			locationName: find.locationName,
			category: find.category,
			createdAt: find.createdAt.toISOString(),
			user: find.user,
			media: find.media?.map((m) => ({
				type: m.type,
				url: m.url,
				thumbnailUrl: m.thumbnailUrl || m.url
			}))
		};
	}

	function closeFindPreview() {
		selectedFind = null;
	}

	function openCreateModal() {
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}
</script>

<svelte:head>
	<title>Finds - Serengo</title>
	<meta
		name="description"
		content="Discover and share memorable places with the Serengo community"
	/>
</svelte:head>

<div class="finds-page">
	<div class="finds-header">
		<h1 class="finds-title">Finds</h1>
		<div class="finds-actions">
			<div class="view-toggle">
				<button
					class="view-button"
					class:active={viewMode === 'map'}
					onclick={() => (viewMode = 'map')}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<path
							d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 12 1A9 9 0 0 1 21 10Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
					</svg>
					Map
				</button>
				<button
					class="view-button"
					class:active={viewMode === 'list'}
					onclick={() => (viewMode = 'list')}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" />
						<line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" />
						<line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" />
						<line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" stroke-width="2" />
						<line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" stroke-width="2" />
						<line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" stroke-width="2" />
					</svg>
					List
				</button>
			</div>
			<button class="create-find-button" onclick={openCreateModal}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
					<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
					<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
				</svg>
				Create Find
			</button>
		</div>
	</div>

	<div class="finds-content">
		{#if viewMode === 'map'}
			<div class="map-container">
				<Map
					center={[$coordinates?.longitude || 0, $coordinates?.latitude || 51.505]}
					{finds}
					onFindClick={handleFindClick}
				/>
			</div>
		{:else}
			<div class="finds-list">
				{#each finds as find (find.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div class="find-card" role="button" tabindex="0" onclick={() => handleFindClick(find)}>
						<div class="find-card-media">
							{#if find.media && find.media.length > 0}
								{#if find.media[0].type === 'photo'}
									<img
										src={find.media[0].thumbnailUrl || find.media[0].url}
										alt={find.title}
										loading="lazy"
									/>
								{:else}
									<video src={find.media[0].url} poster={find.media[0].thumbnailUrl} muted>
										<track kind="captions" />
									</video>
								{/if}
							{:else}
								<div class="no-media">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
										<path
											d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 12 1A9 9 0 0 1 21 10Z"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
									</svg>
								</div>
							{/if}
						</div>
						<div class="find-card-content">
							<h3 class="find-card-title">{find.title}</h3>
							<p class="find-card-location">{find.locationName || 'Unknown location'}</p>
							<p class="find-card-author">by @{find.user.username}</p>
						</div>
					</div>
				{/each}

				{#if finds.length === 0}
					<div class="empty-state">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
							<path
								d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 12 1A9 9 0 0 1 21 10Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
						</svg>
						<h3>No finds nearby</h3>
						<p>Be the first to create a find in this area!</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Floating action button for mobile -->
	<button class="fab" onclick={openCreateModal} aria-label="Create new find">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
			<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
			<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
		</svg>
	</button>
</div>

<!-- Modals -->
{#if showCreateModal}
	<CreateFindModal
		isOpen={showCreateModal}
		onClose={closeCreateModal}
		onFindCreated={handleFindCreated}
	/>
{/if}

{#if selectedFind}
	<FindPreview find={selectedFind} onClose={closeFindPreview} />
{/if}

<style>
	.finds-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.finds-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: white;
		border-bottom: 1px solid #eee;
		flex-shrink: 0;
	}

	.finds-title {
		font-family: 'Washington', serif;
		font-size: 2rem;
		font-weight: bold;
		margin: 0;
		color: #333;
	}

	.finds-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.view-toggle {
		display: flex;
		background: #f5f5f5;
		border-radius: 8px;
		padding: 2px;
	}

	.view-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #666;
		transition: all 0.2s;
	}

	.view-button.active {
		background: white;
		color: #333;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.create-find-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.create-find-button:hover {
		background: #0056b3;
	}

	.finds-content {
		flex: 1;
		overflow: hidden;
	}

	.map-container {
		height: 100%;
		width: 100%;
	}

	.finds-list {
		height: 100%;
		overflow-y: auto;
		padding: 1rem 2rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.find-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.find-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.find-card-media {
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #f8f9fa;
	}

	.find-card-media img,
	.find-card-media video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-media {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
	}

	.find-card-content {
		padding: 1rem;
	}

	.find-card-title {
		font-family: 'Washington', serif;
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.find-card-location {
		color: #666;
		font-size: 0.875rem;
		margin: 0 0 0.25rem 0;
	}

	.find-card-author {
		color: #999;
		font-size: 0.75rem;
		margin: 0;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.empty-state svg {
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
	}

	.empty-state p {
		margin: 0;
		opacity: 0.7;
	}

	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 50%;
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
		cursor: pointer;
		display: none;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 100;
	}

	.fab:hover {
		background: #0056b3;
		transform: scale(1.1);
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.finds-header {
			padding: 1rem;
			flex-wrap: wrap;
			gap: 1rem;
		}

		.finds-actions {
			width: 100%;
			justify-content: space-between;
		}

		.create-find-button {
			display: none;
		}

		.fab {
			display: flex;
		}

		.finds-list {
			padding: 1rem;
			grid-template-columns: 1fr;
		}

		.finds-title {
			font-size: 1.5rem;
		}
	}
</style>
