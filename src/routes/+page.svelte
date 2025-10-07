<script lang="ts">
	import { Map } from '$lib';
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
			<Map showLocationButton={true} autoCenter={true} />
		</div>
	</main>
</div>

<style>
	.home-container {
		background-color: #f8f8f8;
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

	@media (max-width: 768px) {
		.main-content {
			padding: 16px;
			gap: 16px;
		}
	}

	@media (max-width: 480px) {
		.main-content {
			padding: 12px;
		}
	}
</style>
