<script lang="ts">
	import { Map } from '$lib';
	import {
		LocationsList,
		SelectLocationModal,
		LocationFindsModal
	} from '$lib/components/locations';
	import type { PageData } from './$types';
	import { coordinates } from '$lib/stores/location';
	import { Button } from '$lib/components/button';
	import { calculateDistance } from '$lib/utils/distance';

	interface Find {
		id: string;
		locationId: string;
		title: string;
		description?: string;
		category?: string;
		locationName?: string;
		isPublic: number;
		userId: string;
		username: string;
		profilePictureUrl?: string | null;
		likeCount?: number;
		isLikedByUser?: boolean;
		isFromFriend?: boolean;
		createdAt: string;
		media?: Array<{
			id: string;
			type: string;
			url: string;
			thumbnailUrl: string;
			orderIndex?: number | null;
		}>;
	}

	interface Location {
		id: string;
		latitude: string;
		longitude: string;
		createdAt: string;
		userId: string;
		username: string;
		profilePictureUrl?: string | null;
		findCount: number;
		finds?: Find[];
		distance?: number;
	}

	interface MapLocation {
		id: string;
		latitude: string;
		longitude: string;
		createdAt: Date;
		userId: string;
		user: {
			id: string;
			username: string;
		};
		finds: Array<{
			id: string;
			title: string;
			description?: string;
			isPublic: number;
			media?: Array<{
				type: string;
				url: string;
				thumbnailUrl: string;
			}>;
		}>;
		distance?: number;
	}

	let { data }: { data: PageData & { locations?: Location[] } } = $props();

	let showCreateFindModal = $state(false);
	let showLocationFindsModal = $state(false);
	let selectedLocation: Location | null = $state(null);
	let isSidebarVisible = $state(true);

	// Process locations with distance
	let locations = $derived.by(() => {
		if (!data.locations || !$coordinates) return data.locations || [];

		return data.locations
			.map((loc: Location) => ({
				...loc,
				distance: calculateDistance(
					$coordinates.latitude,
					$coordinates.longitude,
					parseFloat(loc.latitude),
					parseFloat(loc.longitude)
				)
			}))
			.sort(
				(a: Location & { distance?: number }, b: Location & { distance?: number }) =>
					(a.distance || 0) - (b.distance || 0)
			);
	});

	// Convert locations to map markers - keep the full location object
	let mapLocations: MapLocation[] = $derived(
		locations.map(
			(loc: Location): MapLocation => ({
				id: loc.id,
				latitude: loc.latitude,
				longitude: loc.longitude,
				createdAt: new Date(loc.createdAt),
				userId: loc.userId,
				user: {
					id: loc.userId,
					username: loc.username
				},
				finds: (loc.finds || []).map((find) => ({
					id: find.id,
					title: find.title,
					description: find.description,
					isPublic: find.isPublic,
					media: find.media || []
				})),
				distance: loc.distance
			})
		)
	);

	function handleLocationExplore(id: string) {
		const location = locations.find((l: Location) => l.id === id);
		if (location) {
			selectedLocation = location;
			showLocationFindsModal = true;
		}
	}

	function handleMapLocationClick(location: MapLocation) {
		handleLocationExplore(location.id);
	}

	function openCreateFindModal() {
		showCreateFindModal = true;
	}

	function closeCreateFindModal() {
		showCreateFindModal = false;
	}

	function closeLocationFindsModal() {
		showLocationFindsModal = false;
		selectedLocation = null;
	}

	function handleFindCreated() {
		closeCreateFindModal();
		// Reload page to show new find
		window.location.reload();
	}

	function handleCreateFindFromLocation() {
		// Close location modal and open create find modal
		showLocationFindsModal = false;
		showCreateFindModal = true;
	}

	function toggleSidebar() {
		isSidebarVisible = !isSidebarVisible;
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
			locations={mapLocations}
			onLocationClick={handleMapLocationClick}
			sidebarVisible={isSidebarVisible}
		/>
	</div>

	<!-- Sidebar container -->
	<div class="sidebar-container">
		<!-- Left sidebar with locations list -->
		<div class="finds-sidebar" class:hidden={!isSidebarVisible}>
			<div class="finds-header">
				{#if data.user}
					<h3 class="header-title">Locations</h3>
					<Button onclick={openCreateFindModal} class="create-find-button">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="mr-2">
							<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
							<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
						</svg>
						Create Find
					</Button>
				{:else}
					<div class="login-prompt">
						<h3>Welcome to Serengo</h3>
						<p>Login to create finds and view your friends' discoveries</p>
						<a href="/login" class="login-button">Login</a>
					</div>
				{/if}
			</div>
			<div class="finds-list-container">
				<LocationsList {locations} onLocationExplore={handleLocationExplore} hideTitle={true} />
			</div>
		</div>
		<!-- Toggle button -->
		<button
			class="sidebar-toggle"
			class:collapsed={!isSidebarVisible}
			onclick={toggleSidebar}
			aria-label="Toggle locations list"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				{#if isSidebarVisible}
					<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				{:else}
					<path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				{/if}
			</svg>
		</button>
	</div>
</div>

<!-- Modals -->
{#if showCreateFindModal}
	<SelectLocationModal
		isOpen={showCreateFindModal}
		onClose={closeCreateFindModal}
		onFindCreated={handleFindCreated}
	/>
{/if}

{#if showLocationFindsModal && selectedLocation}
	<LocationFindsModal
		isOpen={showLocationFindsModal}
		location={selectedLocation}
		currentUserId={data.user?.id}
		onClose={closeLocationFindsModal}
		onCreateFind={handleCreateFindFromLocation}
	/>
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

	.sidebar-container {
		display: flex;
		flex-direction: row;
		margin-left: 20px;
		gap: 12px;
	}

	.sidebar-toggle {
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border: none;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.sidebar-toggle:hover {
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
	}

	.sidebar-toggle svg {
		color: #333;
	}

	.finds-sidebar {
		width: 40%;
		max-width: 1000px;
		min-width: 500px;
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-sizing: border-box;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
	}

	.finds-sidebar.hidden {
		display: none;
		transform: translateX(-100%);
		opacity: 0;
		pointer-events: none;
	}

	.finds-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.header-title {
		font-family: 'Washington', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.login-prompt {
		width: 100%;
		text-align: center;
		padding: 1rem;
	}

	.login-prompt h3 {
		font-family: 'Washington', serif;
		font-size: 1.25rem;
		margin: 0 0 0.5rem 0;
		color: hsl(var(--foreground));
	}

	.login-prompt p {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0 0 1rem 0;
	}

	.login-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.login-button:hover {
		background: hsl(var(--primary) / 0.9);
	}

	.finds-list-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	:global(.create-find-button) {
		flex-shrink: 0;
	}

	:global(.mr-2) {
		margin-right: 0.5rem;
	}

	@media (max-width: 768px) {
		.sidebar-container {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			flex-direction: column-reverse;
			align-items: center;
			margin: 0;
		}

		.sidebar-toggle.collapsed {
			margin: 12px auto;
		}

		.sidebar-toggle svg {
			transform: rotate(-90deg);
		}

		.finds-sidebar {
			width: 100%;
			max-width: 100vw;
			min-width: 0;
			border-radius: 20px 20px 0 0;
			box-sizing: border-box;
		}

		.finds-sidebar.hidden {
			display: none;
			transform: translateX(-100%);
			opacity: 0;
			pointer-events: none;
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
