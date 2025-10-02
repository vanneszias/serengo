<script lang="ts">
	import { Map } from '$lib';
</script>

<div class="home-container">
	<main class="main-content">
		<Map />
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
	}

	@media (max-width: 480px) {
		.main-content {
			padding: 20px 16px;
		}
	}
</style>
