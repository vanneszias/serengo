<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { coordinates } from '$lib/stores/location';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onFindCreated: (event: CustomEvent) => void;
	}

	let { isOpen, onClose, onFindCreated }: Props = $props();

	// Form state
	let title = $state('');
	let description = $state('');
	let latitude = $state('');
	let longitude = $state('');
	let locationName = $state('');
	let category = $state('cafe');
	let isPublic = $state(true);
	let selectedFiles = $state<FileList | null>(null);
	let isSubmitting = $state(false);
	let uploadedMedia = $state<Array<{ type: string; url: string; thumbnailUrl: string }>>([]);

	// Categories
	const categories = [
		{ value: 'cafe', label: 'Café' },
		{ value: 'restaurant', label: 'Restaurant' },
		{ value: 'park', label: 'Park' },
		{ value: 'landmark', label: 'Landmark' },
		{ value: 'shop', label: 'Shop' },
		{ value: 'museum', label: 'Museum' },
		{ value: 'other', label: 'Other' }
	];

	// Auto-fill location when modal opens
	$effect(() => {
		if (isOpen && $coordinates) {
			latitude = $coordinates.latitude.toString();
			longitude = $coordinates.longitude.toString();
		}
	});

	// Handle file selection
	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFiles = target.files;
	}

	// Upload media files
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

	// Submit form
	async function handleSubmit() {
		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);

		if (!title.trim() || isNaN(lat) || isNaN(lng)) {
			return;
		}

		isSubmitting = true;

		try {
			// Upload media first if any
			if (selectedFiles && selectedFiles.length > 0) {
				await uploadMedia();
			}

			// Create the find
			const response = await fetch('/api/finds', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || null,
					latitude: lat,
					longitude: lng,
					locationName: locationName.trim() || null,
					category,
					isPublic,
					media: uploadedMedia
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create find');
			}

			// Reset form and close modal
			resetForm();
			onClose();

			// Notify parent about new find creation
			onFindCreated(new CustomEvent('findCreated', { detail: { reload: true } }));
		} catch (error) {
			console.error('Error creating find:', error);
			alert('Failed to create find. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		title = '';
		description = '';
		locationName = '';
		category = 'cafe';
		isPublic = true;
		selectedFiles = null;
		uploadedMedia = [];

		// Reset file input
		const fileInput = document.querySelector('#media-files') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function closeModal() {
		resetForm();
		onClose();
	}
</script>

{#if isOpen}
	<Modal bind:showModal={isOpen} positioning="center">
		{#snippet header()}
			<h2>Create Find</h2>
		{/snippet}

		<div class="form-container">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="form-group">
					<label for="title">Title *</label>
					<Input name="title" placeholder="What did you find?" required bind:value={title} />
					<span class="char-count">{title.length}/100</span>
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						name="description"
						placeholder="Tell us about this place..."
						maxlength="500"
						bind:value={description}
					></textarea>
					<span class="char-count">{description.length}/500</span>
				</div>

				<div class="form-group">
					<label for="location-name">Location Name</label>
					<Input
						name="location-name"
						placeholder="e.g., Café Belga, Brussels"
						bind:value={locationName}
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="latitude">Latitude *</label>
						<Input name="latitude" type="text" required bind:value={latitude} />
					</div>
					<div class="form-group">
						<label for="longitude">Longitude *</label>
						<Input name="longitude" type="text" required bind:value={longitude} />
					</div>
				</div>

				<div class="form-group">
					<label for="category">Category</label>
					<select name="category" bind:value={category}>
						{#each categories as cat (cat.value)}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="media-files">Photos/Videos (max 5)</label>
					<input
						id="media-files"
						type="file"
						accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
						multiple
						max="5"
						onchange={handleFileChange}
					/>
					{#if selectedFiles && selectedFiles.length > 0}
						<div class="file-preview">
							{#each Array.from(selectedFiles) as file (file.name)}
								<span class="file-name">{file.name}</span>
							{/each}
						</div>
					{/if}
				</div>

				<div class="form-group">
					<label class="privacy-toggle">
						<input type="checkbox" bind:checked={isPublic} />
						<span class="checkmark"></span>
						Make this find public
					</label>
					<p class="privacy-help">
						{isPublic ? 'Everyone can see this find' : 'Only your friends can see this find'}
					</p>
				</div>

				<div class="form-actions">
					<button
						type="button"
						class="button secondary"
						onclick={closeModal}
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<Button type="submit" disabled={isSubmitting || !title.trim()}>
						{isSubmitting ? 'Creating...' : 'Create Find'}
					</Button>
				</div>
			</form>
		</div>
	</Modal>
{/if}

<style>
	.form-container {
		padding: 24px;
		max-height: 70vh;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
		font-family: 'Washington', serif;
	}

	textarea {
		width: 100%;
		padding: 1.25rem 1.5rem;
		border: none;
		border-radius: 2rem;
		background-color: #e0e0e0;
		font-size: 1rem;
		color: #333;
		outline: none;
		transition: background-color 0.2s ease;
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	textarea:focus {
		background-color: #d5d5d5;
	}

	textarea::placeholder {
		color: #888;
	}

	select {
		width: 100%;
		padding: 1.25rem 1.5rem;
		border: none;
		border-radius: 2rem;
		background-color: #e0e0e0;
		font-size: 1rem;
		color: #333;
		outline: none;
		transition: background-color 0.2s ease;
		cursor: pointer;
	}

	select:focus {
		background-color: #d5d5d5;
	}

	input[type='file'] {
		width: 100%;
		padding: 12px;
		border: 2px dashed #ccc;
		border-radius: 8px;
		background-color: #f9f9f9;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	input[type='file']:hover {
		border-color: #999;
	}

	.char-count {
		font-size: 0.8rem;
		color: #666;
		text-align: right;
		display: block;
		margin-top: 4px;
	}

	.file-preview {
		margin-top: 8px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.file-name {
		background-color: #f0f0f0;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 0.8rem;
		color: #666;
	}

	.privacy-toggle {
		display: flex;
		align-items: center;
		cursor: pointer;
		font-weight: normal;
	}

	.privacy-toggle input[type='checkbox'] {
		margin-right: 8px;
		width: 18px;
		height: 18px;
	}

	.privacy-help {
		font-size: 0.8rem;
		color: #666;
		margin-top: 4px;
		margin-left: 26px;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		margin-top: 32px;
		padding-top: 20px;
		border-top: 1px solid #e5e5e5;
	}

	.button {
		flex: 1;
		padding: 1.25rem 2rem;
		border: none;
		border-radius: 2rem;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s ease;
		cursor: pointer;
		height: 3.5rem;
	}

	.button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.button:disabled:hover {
		transform: none;
	}

	.button.secondary {
		background-color: #6c757d;
		color: white;
	}

	.button.secondary:hover:not(:disabled) {
		background-color: #5a6268;
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		.form-container {
			padding: 16px;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
