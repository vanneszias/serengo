<script lang="ts">
	import { Input } from '$lib/components/input';
	import { Label } from '$lib/components/label';
	import { Button } from '$lib/components/button';
	import { coordinates } from '$lib/stores/location';
	import type { PlaceResult } from '$lib/utils/places';

	interface Props {
		onPlaceSelected: (place: PlaceResult) => void;
		placeholder?: string;
		label?: string;
		showNearbyButton?: boolean;
	}

	let {
		onPlaceSelected,
		placeholder = 'Search for a place or address...',
		label = 'Search location',
		showNearbyButton = true
	}: Props = $props();

	let searchQuery = $state('');
	let suggestions = $state<Array<{ placeId: string; description: string; types: string[] }>>([]);
	let nearbyPlaces = $state<PlaceResult[]>([]);
	let isLoading = $state(false);
	let showSuggestions = $state(false);
	let showNearby = $state(false);
	let debounceTimeout: ReturnType<typeof setTimeout>;

	async function searchPlaces(query: string) {
		if (!query.trim()) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		isLoading = true;
		try {
			const searchParams = new URL('/api/places', window.location.origin).searchParams;
			searchParams.set('action', 'autocomplete');
			searchParams.set('query', query.trim());

			if ($coordinates) {
				searchParams.set('lat', $coordinates.latitude.toString());
				searchParams.set('lng', $coordinates.longitude.toString());
			}

			const response = await fetch(`/api/places?${searchParams}`);
			if (response.ok) {
				suggestions = await response.json();
				showSuggestions = true;
			}
		} catch (error) {
			console.error('Error searching places:', error);
		} finally {
			isLoading = false;
		}
	}

	async function selectPlace(placeId: string, description: string) {
		isLoading = true;
		try {
			const params = new URLSearchParams({
				action: 'details',
				placeId
			});

			const response = await fetch(`/api/places?${params}`);
			if (response.ok) {
				const place: PlaceResult = await response.json();
				onPlaceSelected(place);
				searchQuery = description;
				showSuggestions = false;
			}
		} catch (error) {
			console.error('Error getting place details:', error);
		} finally {
			isLoading = false;
		}
	}

	async function findNearbyPlaces() {
		if (!$coordinates) {
			alert('Please enable location access first');
			return;
		}

		isLoading = true;
		showNearby = true;
		try {
			const params = new URLSearchParams({
				action: 'nearby',
				lat: $coordinates.latitude.toString(),
				lng: $coordinates.longitude.toString(),
				radius: '2000' // 2km radius
			});

			const response = await fetch(`/api/places?${params}`);
			if (response.ok) {
				nearbyPlaces = await response.json();
			}
		} catch (error) {
			console.error('Error finding nearby places:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;

		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchPlaces(searchQuery);
		}, 300);
	}

	function selectNearbyPlace(place: PlaceResult) {
		onPlaceSelected(place);
		searchQuery = place.name;
		showNearby = false;
		showSuggestions = false;
	}

	function handleClickOutside(event: Event) {
		const target = event.target as HTMLElement;
		if (!target.closest('.poi-search-container')) {
			showSuggestions = false;
			showNearby = false;
		}
	}

	// Close dropdowns when clicking outside
	if (typeof window !== 'undefined') {
		document.addEventListener('click', handleClickOutside);
	}
</script>

<div class="poi-search-container">
	<div class="field">
		<Label for="poi-search">{label}</Label>
		<div class="search-input-container">
			<Input id="poi-search" type="text" {placeholder} value={searchQuery} oninput={handleInput} />
			{#if showNearbyButton && $coordinates}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onclick={findNearbyPlaces}
					disabled={isLoading}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<path
							d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.58172 6.58172 2 12 2C17.4183 2 21 5.58172 21 10Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
					</svg>
					Nearby
				</Button>
			{/if}
		</div>
	</div>

	{#if showSuggestions && suggestions.length > 0}
		<div class="suggestions-dropdown">
			<div class="suggestions-header">Search Results</div>
			{#each suggestions as suggestion (suggestion.placeId)}
				<button
					class="suggestion-item"
					onclick={() => selectPlace(suggestion.placeId, suggestion.description)}
					disabled={isLoading}
				>
					<div class="suggestion-content">
						<span class="suggestion-name">{suggestion.description}</span>
						<div class="suggestion-types">
							{#each suggestion.types.slice(0, 2) as type, index (index)}
								<span class="suggestion-type">{type.replace(/_/g, ' ')}</span>
							{/each}
						</div>
					</div>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="suggestion-icon">
						<path
							d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.58172 6.58172 2 12 2C17.4183 2 21 5.58172 21 10Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
					</svg>
				</button>
			{/each}
		</div>
	{/if}

	{#if showNearby && nearbyPlaces.length > 0}
		<div class="suggestions-dropdown">
			<div class="suggestions-header">Nearby Places</div>
			{#each nearbyPlaces as place (place.placeId)}
				<button
					class="suggestion-item"
					onclick={() => selectNearbyPlace(place)}
					disabled={isLoading}
				>
					<div class="suggestion-content">
						<span class="suggestion-name">{place.name}</span>
						<span class="suggestion-address">{place.vicinity || place.formattedAddress}</span>
						{#if place.rating}
							<div class="suggestion-rating">
								<span class="rating-stars">★</span>
								<span>{place.rating.toFixed(1)}</span>
							</div>
						{/if}
					</div>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="suggestion-icon">
						<path
							d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.58172 6.58172 2 12 2C17.4183 2 21 5.58172 21 10Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
					</svg>
				</button>
			{/each}
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-indicator">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="loading-spinner">
				<circle
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
					stroke-linecap="round"
					stroke-dasharray="32"
					stroke-dashoffset="32"
				/>
			</svg>
			<span>Searching...</span>
		</div>
	{/if}
</div>

<style>
	.poi-search-container {
		position: relative;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-input-container {
		position: relative;
		display: flex;
		gap: 0.5rem;
	}

	.suggestions-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-height: 300px;
		overflow-y: auto;
		z-index: 1000;
		margin-top: 0.25rem;
		backdrop-filter: blur(8px);
	}

	.suggestions-header {
		padding: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted));
		backdrop-filter: blur(12px);
	}

	.suggestion-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border: none;
		background: hsl(var(--background));
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s ease;
		border-bottom: 1px solid hsl(var(--border));
		backdrop-filter: blur(12px);
	}

	.suggestion-item:last-child {
		border-bottom: none;
	}

	.suggestion-item:hover:not(:disabled) {
		background: hsl(var(--muted) / 0.5);
	}

	.suggestion-item:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.suggestion-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.suggestion-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.suggestion-address {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.suggestion-types {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.suggestion-type {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		border-radius: 4px;
		text-transform: capitalize;
	}

	.suggestion-rating {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.rating-stars {
		color: #fbbf24;
	}

	.suggestion-icon {
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.loading-spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.search-input-container {
			flex-direction: column;
		}
	}
</style>
