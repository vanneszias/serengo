<script lang="ts">
	import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/sheet';
	import { Input } from '$lib/components/input';
	import { Label } from '$lib/components/label';
	import { Button } from '$lib/components/button';
	import { coordinates } from '$lib/stores/location';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onFindCreated: (event: CustomEvent) => void;
	}

	let { isOpen, onClose, onFindCreated }: Props = $props();

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

	const categories = [
		{ value: 'cafe', label: 'Café' },
		{ value: 'restaurant', label: 'Restaurant' },
		{ value: 'park', label: 'Park' },
		{ value: 'landmark', label: 'Landmark' },
		{ value: 'shop', label: 'Shop' },
		{ value: 'museum', label: 'Museum' },
		{ value: 'other', label: 'Other' }
	];

	let showModal = $state(true);
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
		if (!showModal) {
			onClose();
		}
	});

	$effect(() => {
		if (showModal && $coordinates) {
			latitude = $coordinates.latitude.toString();
			longitude = $coordinates.longitude.toString();
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

	async function handleSubmit() {
		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);

		if (!title.trim() || isNaN(lat) || isNaN(lng)) {
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

			resetForm();
			showModal = false;
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

		const fileInput = document.querySelector('#media-files') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function closeModal() {
		resetForm();
		showModal = false;
	}
</script>

{#if isOpen}
	<Sheet open={showModal} onOpenChange={(open) => (showModal = open)}>
		<SheetContent side={isMobile ? 'bottom' : 'right'} class="create-find-sheet">
			<SheetHeader>
				<SheetTitle>Create Find</SheetTitle>
			</SheetHeader>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="form"
			>
				<div class="form-content">
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

					<div class="field">
						<Label for="location-name">Location name</Label>
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
				</div>

				<div class="actions">
					<Button variant="ghost" type="button" onclick={closeModal} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting || !title.trim()}>
						{isSubmitting ? 'Creating...' : 'Create Find'}
					</Button>
				</div>
			</form>
		</SheetContent>
	</Sheet>
{/if}

<style>
	:global(.create-find-sheet) {
		padding: 0 !important;
		width: 100%;
		max-width: 500px;
		height: 100vh;
		border-radius: 0;
	}

	@media (max-width: 767px) {
		:global(.create-find-sheet) {
			height: 90vh;
			border-radius: 12px 12px 0 0;
		}
	}

	.form {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.form-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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

	@media (max-width: 640px) {
		.field-group {
			grid-template-columns: 1fr;
		}
	}

	textarea {
		min-height: 80px;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
		outline: none;
		transition: border-color 0.2s ease;
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
		background: hsl(var(--muted));
	}

	.privacy-toggle input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: hsl(var(--primary));
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
		padding: 2rem;
		text-align: center;
		gap: 0.5rem;
		color: hsl(var(--muted-foreground));
	}

	.file-content span {
		font-size: 0.875rem;
	}

	.file-selected {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: hsl(var(--muted));
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
	}

	.actions {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid hsl(var(--border));
		background: hsl(var(--background));
	}

	.actions :global(button) {
		flex: 1;
	}

	@media (max-width: 640px) {
		.form-content {
			padding: 1rem;
			gap: 1rem;
		}

		.actions {
			padding: 1rem;
			flex-direction: column;
		}

		.actions :global(button) {
			flex: none;
		}
	}
</style>
