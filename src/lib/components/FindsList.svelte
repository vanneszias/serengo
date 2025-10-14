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

<section class="finds-list-section">
	<div class="finds-header">
		<h2 class="finds-title">{title}</h2>
		<div class="finds-count">
			{finds.length}
			{finds.length === 1 ? 'find' : 'finds'}
		</div>
	</div>

	{#if finds.length > 0}
		<div class="finds-grid">
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
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
					<circle cx="12" cy="10" r="3" />
				</svg>
			</div>
			<h3 class="empty-title">No finds yet</h3>
			<p class="empty-message">{emptyMessage}</p>
		</div>
	{/if}
</section>

<style>
	.finds-list-section {
		width: 100%;
	}

	.finds-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.finds-title {
		font-family: 'Washington', serif;
		font-size: 1.875rem;
		font-weight: 700;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.finds-count {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		font-weight: 500;
	}

	.finds-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		margin-bottom: 1rem;
		color: hsl(var(--muted-foreground));
		opacity: 0.5;
	}

	.empty-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: hsl(var(--foreground));
	}

	.empty-message {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.finds-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
			margin-bottom: 1rem;
		}

		.finds-title {
			font-size: 1.5rem;
		}

		.empty-state {
			padding: 2rem 1rem;
		}
	}
</style>
