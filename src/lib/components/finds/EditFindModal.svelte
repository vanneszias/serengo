<script lang="ts">
	import { Input } from '$lib/components/input';
	import { Label } from '$lib/components/label';
	import { Button } from '$lib/components/button';
	import POISearch from '../map/POISearch.svelte';
	import type { PlaceResult } from '$lib/utils/places';
	import { apiSync } from '$lib/stores/api-sync';

	interface FindData {
		id: string;
		title: string;
		description?: string | null;
		latitude: string;
		longitude: string;
		locationName?: string | null;
		category?: string | null;
		isPublic: number;
		media?: Array<{
			id: string;
			type: string;
			url: string;
			thumbnailUrl: string | null;
			orderIndex: number | null;
		}>;
	}

	interface Props {
		isOpen: boolean;
		find: FindData;
		onClose: () => void;
		onFindUpdated: (event: CustomEvent) => void;
		onFindDeleted?: (event: CustomEvent) => void;
	}

	let { isOpen, find, onClose, onFindUpdated, onFindDeleted }: Props = $props();

	let title = $state(find.title);
	let description = $state(find.description || '');
	let latitude = $state(find.latitude);
	let longitude = $state(find.longitude);
	let locationName = $state(find.locationName || '');
	let category = $state(find.category || 'cafe');
	let isPublic = $state(find.isPublic === 1);
	let selectedFiles = $state<FileList | null>(null);
	let isSubmitting = $state(false);
	let uploadedMedia = $state<Array<{ type: string; url: string; thumbnailUrl: string }>>([]);
	let useManualLocation = $state(false);
	let existingMedia = $state<
		Array<{
			id: string;
			type: string;
			url: string;
			thumbnailUrl: string | null;
			orderIndex: number | null;
		}>
	>(find.media || []);
	let mediaToDelete = $state<string[]>([]);
	let showDeleteConfirm = $state(false);

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

	// Reset state when find changes
	$effect(() => {
		if (isOpen) {
			title = find.title;
			description = find.description || '';
			latitude = find.latitude;
			longitude = find.longitude;
			locationName = find.locationName || '';
			category = find.category || 'cafe';
			isPublic = find.isPublic === 1;
			existingMedia = find.media || [];
			mediaToDelete = [];
			uploadedMedia = [];
			selectedFiles = null;
			useManualLocation = false;
		}
	});

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

	function removeExistingMedia(mediaId: string) {
		mediaToDelete = [...mediaToDelete, mediaId];
		existingMedia = existingMedia.filter((m) => m.id !== mediaId);
	}

	async function handleSubmit() {
		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);

		if (!title.trim() || isNaN(lat) || isNaN(lng)) {
			return;
		}

		isSubmitting = true;

		try {
			// Upload new media files if any
			if (selectedFiles && selectedFiles.length > 0) {
				await uploadMedia();
			}

			// Combine existing media with new uploads
			const allMedia = [
				...existingMedia.map((m) => ({
					id: m.id,
					type: m.type,
					url: m.url,
					thumbnailUrl: m.thumbnailUrl || m.url
				})),
				...uploadedMedia
			];

			await apiSync.updateFind(find.id, {
				title: title.trim(),
				description: description.trim() || null,
				latitude: lat,
				longitude: lng,
				locationName: locationName.trim() || null,
				category,
				isPublic,
				media: allMedia,
				mediaToDelete
			});

			onFindUpdated(new CustomEvent('findUpdated', { detail: { reload: true } }));
			onClose();
		} catch (error) {
			console.error('Error updating find:', error);
			alert('Failed to update find. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}

		isSubmitting = true;

		try {
			await apiSync.deleteFind(find.id);

			if (onFindDeleted) {
				onFindDeleted(new CustomEvent('findDeleted', { detail: { findId: find.id } }));
			}
			onClose();
		} catch (error) {
			console.error('Error deleting find:', error);
			alert('Failed to delete find. Please try again.');
		} finally {
			isSubmitting = false;
			showDeleteConfirm = false;
		}
	}

	function handlePlaceSelected(place: PlaceResult) {
		locationName = place.name;
		latitude = place.latitude.toString();
		longitude = place.longitude.toString();
	}

	function toggleLocationMode() {
		useManualLocation = !useManualLocation;
	}

	function closeModal() {
		showDeleteConfirm = false;
		onClose();
	}
</script>

{#if isOpen}
	<div class="modal-container" class:mobile={isMobile}>
		<div class="modal-content">
			<div class="modal-header">
				<h2 class="modal-title">Edit Find</h2>
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
					<div class="field">
						<Label for="title">What did you find?</Label>
						<Input name="title" placeholder="Amazing coffee shop..." required bind:value={title} />
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

					<div class="location-section">
						<div class="location-header">
							<Label>Location</Label>
							<button type="button" onclick={toggleLocationMode} class="toggle-button">
								{useManualLocation ? 'Use Search' : 'Manual Entry'}
							</button>
						</div>

						{#if useManualLocation}
							<div class="field">
								<Label for="location-name">Location name</Label>
								<Input
									name="location-name"
									placeholder="Café Central, Brussels"
									bind:value={locationName}
								/>
							</div>
						{:else}
							<POISearch
								onPlaceSelected={handlePlaceSelected}
								placeholder="Search for cafés, restaurants, landmarks..."
								label=""
								showNearbyButton={true}
							/>
						{/if}
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

					{#if existingMedia.length > 0}
						<div class="field">
							<Label>Current Media</Label>
							<div class="existing-media-grid">
								{#each existingMedia as mediaItem (mediaItem.id)}
									<div class="media-item">
										{#if mediaItem.type === 'photo'}
											<img
												src={mediaItem.thumbnailUrl || mediaItem.url}
												alt="Media"
												class="media-thumbnail"
											/>
										{:else}
											<video src={mediaItem.url} class="media-thumbnail" muted>
												<track kind="captions" />
											</video>
										{/if}
										<button
											type="button"
											class="remove-media-button"
											onclick={() => removeExistingMedia(mediaItem.id)}
											aria-label="Remove media"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
								{/each}
							</div>
						</div>
					{/if}

					<div class="field">
						<Label for="media-files">Add new photo or video</Label>
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
					<Button
						variant="destructive"
						type="button"
						onclick={handleDelete}
						disabled={isSubmitting}
						class="delete-button"
					>
						{showDeleteConfirm ? 'Confirm Delete?' : 'Delete Find'}
					</Button>
					<div class="action-buttons">
						<Button variant="ghost" type="button" onclick={closeModal} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !title.trim()}>
							{isSubmitting ? 'Updating...' : 'Update Find'}
						</Button>
					</div>
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

	.existing-media-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.media-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		background: hsl(var(--muted));
	}

	.media-thumbnail {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-media-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.remove-media-button:hover {
		background: rgba(255, 0, 0, 0.8);
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
		justify-content: space-between;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.action-buttons :global(button) {
		flex: 1;
	}

	:global(.delete-button) {
		flex-shrink: 0;
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
			flex-direction: column;
		}

		.action-buttons {
			width: 100%;
		}

		:global(.delete-button) {
			width: 100%;
		}

		.file-content {
			padding: 1.5rem 1rem;
		}

		.field-group {
			grid-template-columns: 1fr;
		}
	}
</style>
