<script lang="ts">
	import { Button } from '$lib/components/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/dropdown-menu';
	import { Badge } from '$lib/components/badge';

	interface Props {
		currentFilter: string;
		onFilterChange: (filter: string) => void;
	}

	let { currentFilter, onFilterChange }: Props = $props();

	const filterOptions = [
		{ value: 'all', label: 'All Finds', description: 'Public, friends, and your finds' },
		{ value: 'public', label: 'Public Only', description: 'Publicly visible finds' },
		{ value: 'friends', label: 'Friends Only', description: 'Finds from your friends' },
		{ value: 'mine', label: 'My Finds', description: 'Only your finds' }
	];

	const currentOption = $derived(
		filterOptions.find((option) => option.value === currentFilter) || filterOptions[0]
	);
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<Button variant="outline" class="filter-trigger">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="mr-2">
				<path
					d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			{currentOption.label}
		</Button>
	</DropdownMenuTrigger>

	<DropdownMenuContent align="end" class="filter-dropdown">
		{#each filterOptions as option (option.value)}
			<DropdownMenuItem
				class="filter-option"
				onclick={() => onFilterChange(option.value)}
				data-selected={currentFilter === option.value}
			>
				<div class="option-content">
					<div class="option-header">
						<span class="option-label">{option.label}</span>
						{#if currentFilter === option.value}
							<Badge variant="default" class="selected-badge">Selected</Badge>
						{/if}
					</div>
					<span class="option-description">{option.description}</span>
				</div>
			</DropdownMenuItem>
		{/each}
	</DropdownMenuContent>
</DropdownMenu>

<style>
	:global(.filter-trigger) {
		gap: 8px;
		min-width: 120px;
		justify-content: flex-start;
	}

	:global(.filter-dropdown) {
		min-width: 250px;
		padding: 4px;
	}

	:global(.filter-option) {
		padding: 8px 12px;
		cursor: pointer;
		border-radius: 6px;
		margin-bottom: 2px;
	}

	:global(.filter-option:hover) {
		background: #f5f5f5;
	}

	:global(.filter-option[data-selected='true']) {
		background: #f0f9ff;
		border: 1px solid #e0f2fe;
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
	}

	.option-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.option-label {
		font-weight: 500;
		color: #1a1a1a;
		font-size: 14px;
	}

	.option-description {
		font-size: 12px;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.selected-badge) {
		font-size: 10px;
		padding: 2px 6px;
		height: auto;
	}
</style>
