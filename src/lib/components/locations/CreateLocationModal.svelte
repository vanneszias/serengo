<script lang="ts">
	import { Input } from '$lib/components/input';
	import { Label } from '$lib/components/label';
	import { Button } from '$lib/components/button';
	import { coordinates } from '$lib/stores/location';
	import POISearch from '../map/POISearch.svelte';
	import type { PlaceResult } from '$lib/utils/places';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onLocationCreated: (event: CustomEvent<{ locationId: string; reload?: boolean }>) => void;
	}

	let { isOpen, onClose, onLocationCreated }: Props = $props();

	let latitude = $state('');
	let longitude = $state('');
	let locationName = $state('');
	let isSubmitting = $state(false);
	let useManualLocation = $state(false);

	let isMobile = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const checkIsMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	});

	$effect(() => {
		if (isOpen && $coordinates) {
			latitude = $coordinates.latitude.toString();
			longitude = $coordinates.longitude.toString();
		}
	});

	async function handleSubmit() {
		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);

		if (isNaN(lat) || isNaN(lng)) {
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/locations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					latitude: lat,
					longitude: lng,
					locationName: locationName.trim() || null
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create location');
			}

			const result = await response.json();

			resetForm();
			onLocationCreated(
				new CustomEvent('locationCreated', {
					detail: { locationId: result.location.id, reload: true }
				})
			);
			onClose();
		} catch (error) {
			console.error('Error creating location:', error);
			alert('Failed to create location. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function handlePlaceSelected(place: PlaceResult) {
		locationName = place.name;
		latitude = place.latitude.toString();
		longitude = place.longitude.toString();
	}

	function toggleLocationMode() {
		useManualLocation = !useManualLocation;
		if (!useManualLocation && $coordinates) {
			latitude = $coordinates.latitude.toString();
			longitude = $coordinates.longitude.toString();
		}
	}

	function resetForm() {
		latitude = '';
		longitude = '';
		locationName = '';
		useManualLocation = false;
	}

	function closeModal() {
		resetForm();
		onClose();
	}
</script>

{#if isOpen}
	<div class="modal-container" class:mobile={isMobile}>
		<div class="modal-content">
			<div class="modal-header">
				<h2 class="modal-title">Create Location</h2>
				<button type="button" class="close-button" onclick={closeModal} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="form"
			>
				<div class="modal-body">
					<p class="description">
						Choose a location where you and others can create finds (posts). This will be a point on
						the map where discoveries can be shared.
					</p>

					<div class="location-section">
						<div class="location-header">
							<Label>Location</Label>
							<button type="button" onclick={toggleLocationMode} class="toggle-button">
								{useManualLocation ? 'Use Search' : 'Manual Entry'}
							</button>
						</div>

						{#if !useManualLocation}
							<POISearch
								onPlaceSelected={handlePlaceSelected}
								placeholder="Search for a place..."
								label=""
								showNearbyButton={true}
							/>
						{/if}
					</div>

					<div class="field">
						<Label for="location-name">Location Name (Optional)</Label>
						<Input
							name="location-name"
							type="text"
							placeholder="Café Central, Brussels"
							bind:value={locationName}
						/>
					</div>

					{#if useManualLocation || (!latitude && !longitude)}
						<div class="field-group">
							<div class="field">
								<Label for="latitude">Latitude</Label>
								<Input name="latitude" type="text" required bind:value={latitude} />
							</div>
							<div class="field">
								<Label for="longitude">Longitude</Label>
								<Input name="longitude" type="text" required bind:value={longitude} />
							</div>
						</div>
					{:else if latitude && longitude}
						<div class="coordinates-display">
							<Label>Selected coordinates</Label>
							<div class="coordinates-info">
								<span class="coordinate">Lat: {parseFloat(latitude).toFixed(6)}</span>
								<span class="coordinate">Lng: {parseFloat(longitude).toFixed(6)}</span>
								<button
									type="button"
									onclick={() => (useManualLocation = true)}
									class="edit-coords-button"
								>
									Edit
								</button>
							</div>
						</div>
					{/if}
				</div>

				<div class="modal-footer">
					<Button variant="ghost" type="button" onclick={closeModal} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting || !latitude || !longitude}>
						{isSubmitting ? 'Creating...' : 'Create Location'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-container {
		position: fixed;
		top: 80px;
		right: 20px;
		width: 40%;
		max-width: 600px;
		min-width: 500px;
		max-height: calc(100vh - 100px);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.modal-container.mobile {
		top: auto;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		min-width: 0;
		max-width: none;
		max-height: 90vh;
		border-radius: 16px 16px 0 0;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: rgba(255, 255, 255, 0.6);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.modal-title {
		font-family: 'Washington', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
	}

	.form {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.modal-body {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-height: 0;
	}

	.description {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		line-height: 1.5;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.modal-footer :global(button) {
		flex: 1;
	}

	.location-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.location-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.toggle-button {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		height: auto;
		background: hsl(var(--secondary));
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		color: hsl(var(--secondary-foreground));
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.toggle-button:hover {
		background: hsl(var(--secondary) / 0.8);
	}

	.coordinates-display {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.coordinates-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.5);
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.coordinate {
		color: hsl(var(--muted-foreground));
		font-family: monospace;
		font-size: 0.8125rem;
	}

	.edit-coords-button {
		margin-left: auto;
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		height: auto;
		background: hsl(var(--secondary));
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		color: hsl(var(--secondary-foreground));
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.edit-coords-button:hover {
		background: hsl(var(--secondary) / 0.8);
	}

	/* Mobile specific adjustments */
	@media (max-width: 767px) {
		.modal-header {
			padding: 1rem;
		}

		.modal-title {
			font-size: 1.25rem;
		}

		.modal-body {
			padding: 1rem;
			gap: 1.25rem;
		}

		.modal-footer {
			padding: 1rem;
			gap: 0.5rem;
		}

		.field-group {
			grid-template-columns: 1fr;
		}
	}
</style>
