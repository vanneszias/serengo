<script lang="ts">
	import { Map } from '$lib';
	import FindsList from '$lib/components/FindsList.svelte';
	import CreateFindModal from '$lib/components/CreateFindModal.svelte';
	import FindPreview from '$lib/components/FindPreview.svelte';
	import type { PageData } from './$types';
	import { coordinates } from '$lib/stores/location';
	import { Button } from '$lib/components/button';

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
		createdAt: string; // Will be converted to Date type, but is a string from api
		userId: string;
		username: string;
		likeCount?: number;
		isLikedByUser?: boolean;
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
		likeCount?: number;
		isLiked?: boolean;
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
		likeCount?: number;
		isLiked?: boolean;
		media?: Array<{
			type: string;
			url: string;
			thumbnailUrl: string;
		}>;
	}

	let { data }: { data: PageData & { finds?: ServerFind[] } } = $props();

	let showCreateModal = $state(false);
	let selectedFind: FindPreviewData | null = $state(null);

	// Reactive finds list - convert server format to component format
	let finds = $derived(
		(data.finds || ([] as ServerFind[])).map((serverFind: ServerFind) => ({
			...serverFind,
			createdAt: new Date(serverFind.createdAt), // Convert string to Date
			user: {
				id: serverFind.userId,
				username: serverFind.username
			},
			likeCount: serverFind.likeCount,
			isLiked: serverFind.isLikedByUser,
			media: serverFind.media?.map(
				(m: { type: string; url: string; thumbnailUrl: string | null }) => ({
					type: m.type,
					url: m.url,
					thumbnailUrl: m.thumbnailUrl || m.url
				})
			)
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
			likeCount: find.likeCount,
			isLiked: find.isLiked,
			media: find.media?.map((m) => ({
				type: m.type,
				url: m.url,
				thumbnailUrl: m.thumbnailUrl || m.url
			}))
		};
	}

	function handleFindExplore(id: string) {
		// Find the specific find and show preview
		const find = finds.find((f) => f.id === id);
		if (find) {
			handleFindClick(find);
		}
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
	<title>Serengo - Meet the Unexpected</title>
	<meta
		name="description"
		content="Discover unexpected places and experiences with Serengo's interactive map. Find hidden gems and explore your surroundings like never before."
	/>
	<meta property="og:title" content="Serengo - Meet the Unexpected" />
	<meta
		property="og:description"
		content="Discover unexpected places and experiences with Serengo's interactive map. Find hidden gems and explore your surroundings like never before."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Serengo - Meet the Unexpected" />
	<meta
		name="twitter:description"
		content="Discover unexpected places and experiences with Serengo's interactive map. Find hidden gems and explore your surroundings like never before."
	/>
</svelte:head>

<div class="home-container">
	<main class="main-content">
		<div class="map-section">
			<Map
				showLocationButton={true}
				autoCenter={true}
				center={[$coordinates?.longitude || 0, $coordinates?.latitude || 51.505]}
				{finds}
				onFindClick={handleFindClick}
			/>
		</div>

		<div class="finds-section">
			<div class="finds-header">
				<FindsList {finds} onFindExplore={handleFindExplore} />
				<Button onclick={openCreateModal} class="create-find-button">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="mr-2">
						<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
						<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
					</svg>
					Create Find
				</Button>
			</div>
		</div>
	</main>

	<!-- Floating action button for mobile -->
	<button class="fab" onclick={openCreateModal} aria-label="Create new find">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
	.home-container {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.main-content {
		padding: 24px 20px;
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.map-section {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.map-section :global(.map-container) {
		height: 500px;
		border-radius: 0;
	}

	.finds-section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.finds-header {
		position: relative;
	}

	:global(.create-find-button) {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 10;
	}

	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		border-radius: 50%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		display: none;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 100;
	}

	.fab:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	@media (max-width: 768px) {
		.main-content {
			padding: 16px;
			gap: 16px;
		}

		.finds-section {
			padding: 16px;
		}

		:global(.create-find-button) {
			display: none;
		}

		.fab {
			display: flex;
		}

		.map-section :global(.map-container) {
			height: 300px;
		}
	}

	@media (max-width: 480px) {
		.main-content {
			padding: 12px;
		}

		.finds-section {
			padding: 12px;
		}
	}
</style>
