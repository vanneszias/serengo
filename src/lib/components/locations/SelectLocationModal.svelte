<script lang="ts">
	import { Input } from '$lib/components/input';
	import { Label } from '$lib/components/label';
	import { Button } from '$lib/components/button';
	import { coordinates } from '$lib/stores/location';
	import { calculateDistance, formatDistance } from '$lib/utils/distance';
	import POISearch from '../map/POISearch.svelte';
	import type { PlaceResult } from '$lib/utils/places';

	interface Location {
		id: string;
		latitude: string;
		longitude: string;
		createdAt: string;
		userId: string;
		username: string;
		findCount: number;
		distance?: number;
	}

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onFindCreated: (event: CustomEvent) => void;
	}

	let { isOpen, onClose, onFindCreated }: Props = $props();

	let step: 'select-location' | 'create-find' = $state('select-location');
	let selectedLocationId = $state<string | null>(null);
	let nearbyLocations = $state<Location[]>([]);
	let isLoadingLocations = $state(false);

	// Create new location fields
	let newLocationLat = $state('');
	let newLocationLng = $state('');
	let useManualLocation = $state(false);

	// Create find fields
	let title = $state('');
	let description = $state('');
	let locationName = $state('');
	let category = $state('cafe');
	let isPublic = $state(true);
	let selectedFiles = $state<FileList | null>(null);
	let isSubmitting = $state(false);
	let uploadedMedia = $state<Array<{ type: string; url: string; thumbnailUrl: string }>>([]);

	const categories = [
		{ value: 'cafe', label: 'Café' },
		{ value: 'restaurant', label: 'Restaurant' },
		{ value: 'park', label: 'Park' },
		{ value: 'landmark', label: 'Landmark' },
		{ value: 'shop', label: 'Shop' },
		{ value: 'museum', label: 'Museum' },
		{ value: 'other', label: 'Other' }
	];

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

	// Load nearby locations when modal opens
	$effect(() => {
		if (isOpen && $coordinates) {
			loadNearbyLocations();
			newLocationLat = $coordinates.latitude.toString();
			newLocationLng = $coordinates.longitude.toString();
		}
	});

	async function loadNearbyLocations() {
		if (!$coordinates) return;

		isLoadingLocations = true;
		try {
			const response = await fetch(
				`/api/locations?lat=${$coordinates.latitude}&lng=${$coordinates.longitude}&radius=5`
			);
			if (response.ok) {
				const locations = await response.json();

				// Calculate distances
				nearbyLocations = locations.map((loc: Location) => ({
					...loc,
					distance: calculateDistance(
						$coordinates!.latitude,
						$coordinates!.longitude,
						parseFloat(loc.latitude),
						parseFloat(loc.longitude)
					)
				}));

				// Sort by distance
				nearbyLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
			}
		} catch (error) {
			console.error('Error loading nearby locations:', error);
		} finally {
			isLoadingLocations = false;
		}
	}

	function selectLocation(locationId: string) {
		selectedLocationId = locationId;
		step = 'create-find';
	}

	async function createNewLocation() {
		const lat = parseFloat(newLocationLat);
		const lng = parseFloat(newLocationLng);

		if (isNaN(lat) || isNaN(lng)) {
			alert('Please provide valid coordinates');
			return;
		}

		try {
			const response = await fetch('/api/locations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					latitude: lat,
					longitude: lng
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create location');
			}

			const result = await response.json();
			selectedLocationId = result.location.id;
			step = 'create-find';
		} catch (error) {
			console.error('Error creating location:', error);
			alert('Failed to create location. Please try again.');
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFiles = target.files;
	}

	async function uploadMedia(): Promise<void> {
		if (!selectedFiles || selectedFiles.length === 0) return;

		const formData = new FormData();
		Array.from(selectedFiles).forEach((file) => {
			formData.append('files', file);
		});

		const response = await fetch('/api/finds/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error('Failed to upload media');
		}

		const result = await response.json();
		uploadedMedia = result.media;
	}

	async function handleSubmit() {
		if (!title.trim() || !selectedLocationId) {
			return;
		}

		isSubmitting = true;

		try {
			if (selectedFiles && selectedFiles.length > 0) {
				await uploadMedia();
			}

			const response = await fetch('/api/finds', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					locationId: selectedLocationId,
					title: title.trim(),
					description: description.trim() || null,
					locationName: locationName.trim() || null,
					category,
					isPublic,
					media: uploadedMedia
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create find');
			}

			resetForm();
			onFindCreated(new CustomEvent('findCreated', { detail: { reload: true } }));
			onClose();
		} catch (error) {
			console.error('Error creating find:', error);
			alert('Failed to create find. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function handlePlaceSelected(place: PlaceResult) {
		newLocationLat = place.latitude.toString();
		newLocationLng = place.longitude.toString();
	}

	function toggleLocationMode() {
		useManualLocation = !useManualLocation;
		if (!useManualLocation && $coordinates) {
			newLocationLat = $coordinates.latitude.toString();
			newLocationLng = $coordinates.longitude.toString();
		}
	}

	function resetForm() {
		step = 'select-location';
		selectedLocationId = null;
		title = '';
		description = '';
		locationName = '';
		newLocationLat = '';
		newLocationLng = '';
		category = 'cafe';
		isPublic = true;
		selectedFiles = null;
		uploadedMedia = [];
		useManualLocation = false;
		nearbyLocations = [];

		const fileInput = document.querySelector('#media-files') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function closeModal() {
		resetForm();
		onClose();
	}

	function goBack() {
		step = 'select-location';
		selectedLocationId = null;
	}
</script>

{#if isOpen}
	<div class="modal-container" class:mobile={isMobile}>
		<div class="modal-content">
			<div class="modal-header">
				<div class="header-left">
					{#if step === 'create-find'}
						<button type="button" class="back-button" onclick={goBack} aria-label="Go back">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<path
									d="M19 12H5M12 19l-7-7 7-7"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					{/if}
					<h2 class="modal-title">
						{step === 'select-location' ? 'Select Location' : 'Create Find'}
					</h2>
				</div>
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

			{#if step === 'select-location'}
				<div class="modal-body">
					<p class="description">
						Choose an existing location nearby or create a new one for your find.
					</p>

					{#if isLoadingLocations}
						<div class="loading-state">
							<div class="spinner"></div>
							<p>Loading nearby locations...</p>
						</div>
					{:else if nearbyLocations.length > 0}
						<div class="section">
							<h3 class="section-title">Nearby Locations</h3>
							<div class="locations-list">
								{#each nearbyLocations.slice(0, 5) as location (location.id)}
									<button
										type="button"
										class="location-item"
										onclick={() => selectLocation(location.id)}
									>
										<div class="location-item-info">
											<div class="location-item-header">
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
													<path
														d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
														stroke="currentColor"
														stroke-width="2"
													/>
													<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
												</svg>
												<span class="location-distance"
													>{location.distance !== undefined
														? formatDistance(location.distance)
														: 'Unknown distance'}</span
												>
											</div>
											<div class="location-item-details">
												<span class="location-coords"
													>{parseFloat(location.latitude).toFixed(4)}, {parseFloat(
														location.longitude
													).toFixed(4)}</span
												>
												<span class="location-finds"
													>{location.findCount} {location.findCount === 1 ? 'find' : 'finds'}</span
												>
											</div>
										</div>
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
											<path
												d="M9 18l6-6-6-6"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</button>
								{/each}
							</div>
						</div>
					{:else}
						<div class="empty-locations">
							<p>No locations found nearby</p>
						</div>
					{/if}

					<div class="divider">
						<span>or</span>
					</div>

					<div class="section">
						<h3 class="section-title">Create New Location</h3>
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

						{#if useManualLocation || (!newLocationLat && !newLocationLng)}
							<div class="field-group">
								<div class="field">
									<Label for="latitude">Latitude</Label>
									<Input name="latitude" type="text" required bind:value={newLocationLat} />
								</div>
								<div class="field">
									<Label for="longitude">Longitude</Label>
									<Input name="longitude" type="text" required bind:value={newLocationLng} />
								</div>
							</div>
						{:else if newLocationLat && newLocationLng}
							<div class="coordinates-display">
								<Label>Selected coordinates</Label>
								<div class="coordinates-info">
									<span class="coordinate">Lat: {parseFloat(newLocationLat).toFixed(6)}</span>
									<span class="coordinate">Lng: {parseFloat(newLocationLng).toFixed(6)}</span>
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

						<Button
							onclick={createNewLocation}
							disabled={!newLocationLat || !newLocationLng}
							class="w-full"
						>
							Create New Location & Continue
						</Button>
					</div>
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
					class="form"
				>
					<div class="modal-body">
						<div class="field">
							<Label for="title">What did you find?</Label>
							<Input
								name="title"
								placeholder="Amazing coffee shop..."
								required
								bind:value={title}
							/>
						</div>

						<div class="field">
							<Label for="description">Tell us about it</Label>
							<textarea
								name="description"
								placeholder="The best cappuccino in town..."
								maxlength="500"
								bind:value={description}
							></textarea>
						</div>

						<div class="field">
							<Label for="location-name">Location name (optional)</Label>
							<Input
								name="location-name"
								placeholder="Café Central, Brussels"
								bind:value={locationName}
							/>
						</div>

						<div class="field-group">
							<div class="field">
								<Label for="category">Category</Label>
								<select name="category" bind:value={category} class="select">
									{#each categories as cat (cat.value)}
										<option value={cat.value}>{cat.label}</option>
									{/each}
								</select>
							</div>
							<div class="field">
								<Label>Privacy</Label>
								<label class="privacy-toggle">
									<input type="checkbox" bind:checked={isPublic} />
									<span>{isPublic ? 'Public' : 'Private'}</span>
								</label>
							</div>
						</div>

						<div class="field">
							<Label for="media-files">Add photo or video</Label>
							<div class="file-upload">
								<input
									id="media-files"
									type="file"
									accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
									onchange={handleFileChange}
									class="file-input"
								/>
								<div class="file-content">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
										<path
											d="M14.5 4H6A2 2 0 0 0 4 6V18A2 2 0 0 0 6 20H18A2 2 0 0 0 20 18V9.5L14.5 4Z"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M14 4V10H20"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span>Click to upload</span>
								</div>
							</div>
							{#if selectedFiles && selectedFiles.length > 0}
								<div class="file-selected">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
										<path
											d="M14.5 4H6A2 2 0 0 0 4 6V18A2 2 0 0 0 6 20H18A2 2 0 0 0 20 18V9.5L14.5 4Z"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M14 4V10H20"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span>{selectedFiles[0].name}</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="modal-footer">
						<Button variant="ghost" type="button" onclick={goBack} disabled={isSubmitting}>
							Back
						</Button>
						<Button type="submit" disabled={isSubmitting || !title.trim()}>
							{isSubmitting ? 'Creating...' : 'Create Find'}
						</Button>
					</div>
				</form>
			{/if}
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
		height: calc(100vh - 100px);
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
		height: 90vh;
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

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-button {
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

	.back-button:hover {
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
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

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: hsl(var(--muted-foreground));
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid hsl(var(--muted));
		border-top-color: hsl(var(--primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.locations-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.location-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.location-item:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.location-item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.location-item-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--primary));
		font-size: 0.875rem;
		font-weight: 600;
	}

	.location-distance {
		color: hsl(var(--foreground));
	}

	.location-item-details {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.location-coords {
		font-family: monospace;
	}

	.empty-locations {
		padding: 2rem;
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.divider {
		position: relative;
		text-align: center;
		margin: 0.5rem 0;
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: hsl(var(--border));
	}

	.divider span {
		position: relative;
		padding: 0 1rem;
		background: rgba(255, 255, 255, 0.6);
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
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

	textarea {
		min-height: 100px;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
		outline: none;
		transition: border-color 0.2s ease;
		line-height: 1.5;
	}

	textarea:focus {
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 1px hsl(var(--primary));
	}

	textarea::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.select {
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.2s ease;
		cursor: pointer;
	}

	.select:focus {
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 1px hsl(var(--primary));
	}

	.privacy-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		transition: background-color 0.2s ease;
	}

	.privacy-toggle:hover {
		background: hsl(var(--muted) / 0.5);
	}

	.privacy-toggle input[type='checkbox'] {
		width: 18px;
		height: 18px;
		accent-color: hsl(var(--primary));
		cursor: pointer;
	}

	.file-upload {
		position: relative;
		border: 2px dashed hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--muted) / 0.3);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.file-upload:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--muted) / 0.5);
	}

	.file-input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.file-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		text-align: center;
		gap: 0.5rem;
		color: hsl(var(--muted-foreground));
	}

	.file-content span {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.file-selected {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.5);
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.file-selected svg {
		color: hsl(var(--primary));
		flex-shrink: 0;
	}

	.file-selected span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: hsl(var(--foreground));
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

	:global(.w-full) {
		width: 100%;
	}

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

		.file-content {
			padding: 1.5rem 1rem;
		}

		.field-group {
			grid-template-columns: 1fr;
		}
	}
</style>
