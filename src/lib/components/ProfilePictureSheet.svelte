<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
	import { Button } from './button';
	import { Avatar, AvatarFallback, AvatarImage } from './avatar';

	interface Props {
		userId: string;
		username: string;
		profilePictureUrl?: string | null;
		onClose?: () => void;
	}

	let { userId, username, profilePictureUrl, onClose }: Props = $props();

	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	let isUploading = $state(false);
	let isDeleting = $state(false);
	let showModal = $state(true);

	const initial = username.charAt(0).toUpperCase();

	// Close modal when showModal changes to false
	$effect(() => {
		if (!showModal && onClose) {
			onClose();
		}
	});

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];

			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('Please select an image file');
				return;
			}

			// Validate file size (5MB max)
			if (file.size > 5 * 1024 * 1024) {
				alert('File size must be less than 5MB');
				return;
			}

			selectedFile = file;
		}
	}

	async function handleUpload() {
		if (!selectedFile) return;

		isUploading = true;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('userId', userId);

			const response = await fetch('/api/profile-picture/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			selectedFile = null;
			if (fileInput) fileInput.value = '';
			await invalidateAll();
			showModal = false;
		} catch (error) {
			console.error('Upload error:', error);
			alert('Failed to upload profile picture');
		} finally {
			isUploading = false;
		}
	}

	async function handleDelete() {
		if (!profilePictureUrl) return;

		isDeleting = true;

		try {
			const response = await fetch('/api/profile-picture/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId })
			});

			if (!response.ok) {
				throw new Error('Delete failed');
			}

			await invalidateAll();
			showModal = false;
		} catch (error) {
			console.error('Delete error:', error);
			alert('Failed to delete profile picture');
		} finally {
			isDeleting = false;
		}
	}
</script>

<Sheet open={showModal} onOpenChange={(open) => (showModal = open)}>
	<SheetContent side="bottom" class="profile-picture-sheet">
		<SheetHeader>
			<SheetTitle>Profile Picture</SheetTitle>
			<SheetDescription>Upload, edit, or delete your profile picture</SheetDescription>
		</SheetHeader>

		<div class="profile-picture-content">
			<div class="current-avatar">
				<Avatar class="large-avatar">
					{#if profilePictureUrl}
						<AvatarImage src={profilePictureUrl} alt={username} />
					{/if}
					<AvatarFallback class="large-avatar-fallback">
						{initial}
					</AvatarFallback>
				</Avatar>
			</div>

			<div class="upload-section">
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					onchange={handleFileSelect}
					class="file-input"
				/>

				{#if selectedFile}
					<div class="selected-file">
						<p class="file-name">{selectedFile.name}</p>
						<p class="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
					</div>
				{/if}

				<div class="action-buttons">
					{#if selectedFile}
						<Button onclick={handleUpload} disabled={isUploading} class="upload-button">
							{isUploading ? 'Uploading...' : 'Upload Picture'}
						</Button>
					{/if}

					{#if profilePictureUrl}
						<Button
							variant="destructive"
							onclick={handleDelete}
							disabled={isDeleting}
							class="delete-button"
						>
							{isDeleting ? 'Deleting...' : 'Delete Picture'}
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</SheetContent>
</Sheet>

<style>
	:global(.profile-picture-sheet) {
		max-height: 80vh;
	}

	.profile-picture-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 16px 0;
	}

	.current-avatar {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	:global(.large-avatar) {
		width: 120px;
		height: 120px;
	}

	:global(.large-avatar-fallback) {
		background: black;
		color: white;
		font-weight: 600;
		font-size: 48px;
		border: 4px solid #fff;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.upload-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.file-input {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		background: white;
	}

	.selected-file {
		padding: 12px;
		background: #f5f5f5;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.file-name {
		font-weight: 500;
		margin: 0 0 4px 0;
		word-break: break-word;
	}

	.file-size {
		font-size: 12px;
		color: #666;
		margin: 0;
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	:global(.upload-button) {
		background: black;
		color: white;
		padding: 12px 24px;
		font-weight: 500;
	}

	:global(.upload-button:hover) {
		background: #333;
	}

	:global(.delete-button) {
		padding: 12px 24px;
		font-weight: 500;
	}

	@media (min-width: 640px) {
		:global(.profile-picture-sheet) {
			max-width: 500px;
			margin: 0 auto;
		}

		.action-buttons {
			flex-direction: row;
			justify-content: center;
		}

		:global(.upload-button),
		:global(.delete-button) {
			min-width: 140px;
		}
	}
</style>
