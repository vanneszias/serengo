<script lang="ts">
	import FindCard from './FindCard.svelte';

	interface Find {
		id: string;
		title: string;
		description?: string;
		category?: string;
		locationName?: string;
		user: {
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

	interface FindsListProps {
		finds: Find[];
		onFindExplore?: (id: string) => void;
		title?: string;
		showEmpty?: boolean;
		emptyMessage?: string;
	}

	let {
		finds,
		onFindExplore,
		title = 'Finds',
		showEmpty = true,
		emptyMessage = 'No finds to display'
	}: FindsListProps = $props();

	function handleFindExplore(id: string) {
		onFindExplore?.(id);
	}
</script>

<section class="finds-feed">
	<div class="feed-header">
		<h2 class="feed-title">{title}</h2>
	</div>

	{#if finds.length > 0}
		<div class="feed-container">
			{#each finds as find (find.id)}
				<FindCard
					id={find.id}
					title={find.title}
					description={find.description}
					category={find.category}
					locationName={find.locationName}
					user={find.user}
					media={find.media}
					likeCount={find.likeCount}
					isLiked={find.isLiked}
					onExplore={handleFindExplore}
				/>
			{/each}
		</div>
	{:else if showEmpty}
		<div class="empty-state">
			<div class="empty-icon">
				<svg
					width="64"
					height="64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
					<circle cx="12" cy="10" r="3" />
				</svg>
			</div>
			<h3 class="empty-title">No finds discovered yet</h3>
			<p class="empty-message">{emptyMessage}</p>
			<div class="empty-action">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
					<path
						d="M12 5v14M5 12h14"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				<span>Start exploring to discover finds</span>
			</div>
		</div>
	{/if}
</section>

<style>
	.finds-feed {
		width: 100%;
	}

	.feed-header {
		margin-bottom: 1.5rem;
		padding: 0 0.5rem;
	}

	.feed-title {
		font-family: 'Washington', serif;
		font-size: 1.875rem;
		font-weight: 700;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.feed-container {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: hsl(var(--card));
		border-radius: 12px;
		border: 1px solid hsl(var(--border));
	}

	.empty-icon {
		margin-bottom: 1.5rem;
		color: hsl(var(--muted-foreground));
		opacity: 0.4;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: hsl(var(--foreground));
	}

	.empty-message {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.empty-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--primary));
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.feed-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			margin-bottom: 1rem;
			padding: 0;
		}

		.feed-title {
			font-size: 1.5rem;
		}

		.empty-state {
			padding: 3rem 1.5rem;
		}
	}

	/* Smooth scrolling for feed */
	.feed-container {
		scroll-behavior: smooth;
	}

	/* Add subtle animation for new posts */
	:global(.find-card) {
		animation: fadeInUp 0.4s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
