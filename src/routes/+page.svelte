<script lang="ts">
	import { Map } from '$lib';
	import FindsList from '$lib/components/FindsList.svelte';
	import CreateFindModal from '$lib/components/CreateFindModal.svelte';
	import FindPreview from '$lib/components/FindPreview.svelte';
	import FindsFilter from '$lib/components/FindsFilter.svelte';
	import type { PageData } from './$types';
	import { coordinates } from '$lib/stores/location';
	import { Button } from '$lib/components/button';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { apiSync, type FindState } from '$lib/stores/api-sync';

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
		profilePictureUrl?: string | null;
		likeCount?: number;
		isLikedByUser?: boolean;
		isFromFriend?: boolean;
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
			profilePictureUrl?: string | null;
		};
		likeCount?: number;
		isLiked?: boolean;
		isFromFriend?: boolean;
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
			profilePictureUrl?: string | null;
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
	let currentFilter = $state('all');

	// Initialize API sync with server data on mount
	onMount(async () => {
		if (browser && data.finds && data.finds.length > 0) {
			const findStates: FindState[] = data.finds.map((serverFind: ServerFind) => ({
				id: serverFind.id,
				title: serverFind.title,
				description: serverFind.description,
				latitude: serverFind.latitude,
				longitude: serverFind.longitude,
				locationName: serverFind.locationName,
				category: serverFind.category,
				isPublic: Boolean(serverFind.isPublic),
				createdAt: new Date(serverFind.createdAt),
				userId: serverFind.userId,
				username: serverFind.username,
				profilePictureUrl: serverFind.profilePictureUrl || undefined,
				media: serverFind.media,
				isLikedByUser: Boolean(serverFind.isLikedByUser),
				likeCount: serverFind.likeCount || 0,
				commentCount: 0,
				isFromFriend: Boolean(serverFind.isFromFriend)
			}));

			apiSync.initializeFindData(findStates);
		}
	});

	// All finds - convert server format to component format
	let allFinds = $derived(
		(data.finds || ([] as ServerFind[])).map((serverFind: ServerFind) => ({
			...serverFind,
			createdAt: new Date(serverFind.createdAt), // Convert string to Date
			user: {
				id: serverFind.userId,
				username: serverFind.username,
				profilePictureUrl: serverFind.profilePictureUrl
			},
			likeCount: serverFind.likeCount,
			isLiked: serverFind.isLikedByUser,
			isFromFriend: serverFind.isFromFriend,
			media: serverFind.media?.map(
				(m: { type: string; url: string; thumbnailUrl: string | null }) => ({
					type: m.type,
					url: m.url,
					thumbnailUrl: m.thumbnailUrl || m.url
				})
			)
		})) as MapFind[]
	);

	// Filtered finds based on current filter
	let finds = $derived.by(() => {
		if (!data.user) return allFinds;

		switch (currentFilter) {
			case 'public':
				return allFinds.filter((find) => find.isPublic === 1);
			case 'friends':
				return allFinds.filter((find) => find.isFromFriend === true);
			case 'mine':
				return allFinds.filter((find) => find.userId === data.user!.id);
			case 'all':
			default:
				return allFinds;
		}
	});

	function handleFilterChange(filter: string) {
		currentFilter = filter;
	}

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
	<!-- Fullscreen map -->
	<div class="map-section">
		<Map
			autoCenter={true}
			center={[$coordinates?.longitude || 0, $coordinates?.latitude || 51.505]}
			{finds}
			onFindClick={handleFindClick}
		/>
	</div>

	<!-- Left sidebar with finds list -->
	<div class="finds-sidebar">
		<div class="finds-header">
			<FindsFilter {currentFilter} onFilterChange={handleFilterChange} />
			<Button onclick={openCreateModal} class="create-find-button">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="mr-2">
					<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
					<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
				</svg>
				Create Find
			</Button>
		</div>
		<div class="finds-list-container">
			<FindsList {finds} onFindExplore={handleFindExplore} hideTitle={true} />
		</div>
	</div>
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
	<FindPreview find={selectedFind} onClose={closeFindPreview} currentUserId={data.user?.id} />
{/if}

<style>
	.home-container {
		position: relative;
	}

	.map-section {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		overflow: hidden;
	}

	.map-section :global(.map-container) {
		height: 100vh;
		border-radius: 0;
	}

	.map-section :global(.maplibregl-map) {
		border-radius: 0 !important;
		box-shadow: none !important;
	}

	.finds-sidebar {
		position: fixed;
		top: 80px;
		left: 20px;
		width: 40%;
		max-width: 1000px;
		min-width: 500px;
		height: calc(100vh - 100px);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.finds-header {
		display: flex;
		justify-content: space-between;
		padding: 20px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.finds-list-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	:global(.create-find-button) {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.finds-sidebar {
			top: auto;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			height: 50vh;
			border-radius: 20px 20px 0 0;
		}

		.finds-header {
			padding: 16px;
		}

		.map-section :global(.map-container) {
			height: 100vh;
		}
	}

	@media (max-width: 480px) {
		.finds-sidebar {
			height: 60vh;
		}

		.finds-header {
			padding: 12px;
		}
	}
</style>
