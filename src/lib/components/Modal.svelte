<script lang="ts">
	let {
		showModal = $bindable(),
		header,
		children,
		positioning = 'center'
	} = $props<{
		showModal: boolean;
		header?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		positioning?: 'center' | 'dropdown';
	}>();

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (showModal && dialog && positioning === 'center') {
			dialog.showModal();
		}
	});

	function closeModal() {
		if (dialog && positioning === 'center') {
			dialog.close();
		} else {
			showModal = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		const target = e.target as Element;
		if (
			e.target === dialog ||
			(positioning === 'dropdown' && target && !target.closest('.modal-content'))
		) {
			closeModal();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeModal();
		}
	}

	// Handle backdrop clicks for dropdown mode
	function handleWindowClick(e: Event) {
		if (positioning === 'dropdown' && showModal) {
			const target = e.target as Element;
			if (target && !target.closest('.modal') && !target.closest('.profile-container')) {
				closeModal();
			}
		}
	}
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleKeydown} />

{#if positioning === 'center'}
	<dialog
		bind:this={dialog}
		onclose={() => (showModal = false)}
		onclick={handleBackdropClick}
		class="modal"
	>
		<div class="modal-content">
			{#if header}
				<div class="modal-header">
					{@render header()}
					<button type="button" class="close-button" onclick={closeModal} aria-label="Close modal">
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
			{:else}
				<button
					type="button"
					class="close-button-solo"
					onclick={closeModal}
					aria-label="Close modal"
				>
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
			{/if}

			{#if children}
				<div class="modal-body">
					{@render children()}
				</div>
			{/if}
		</div>
	</dialog>
{:else if positioning === 'dropdown' && showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal dropdown" onclick={handleBackdropClick} role="dialog" tabindex="-1">
		<div class="modal-content">
			{#if header}
				<div class="modal-header">
					{@render header()}
					<button type="button" class="close-button" onclick={closeModal} aria-label="Close modal">
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
			{:else}
				<button
					type="button"
					class="close-button-solo"
					onclick={closeModal}
					aria-label="Close modal"
				>
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
			{/if}

			{#if children}
				<div class="modal-body">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal {
		max-width: 32rem;
		max-height: 90vh;
		width: 100%;
		border-radius: 12px;
		border: none;
		padding: 0;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		background: white;
		overflow: hidden;
	}

	.modal.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		max-width: 320px;
		width: 320px;
		z-index: 1000;
	}

	.modal::backdrop {
		background: rgba(0, 0, 0, 0.1);
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;
		border-bottom: 1px solid #e5e5e5;
	}

	.modal-body {
		padding: 0;
		flex: 1;
		overflow-y: auto;
	}

	.close-button,
	.close-button-solo {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		color: #666;
		border-radius: 4px;
		transition: background-color 0.2s ease;
		flex-shrink: 0;
	}

	.close-button-solo {
		position: absolute;
		top: 16px;
		right: 16px;
	}

	.close-button:hover,
	.close-button-solo:hover {
		background-color: #f5f5f5;
		color: #333;
	}

	.close-button:focus,
	.close-button-solo:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.modal[open] {
		animation: slideIn 0.3s ease-out;
	}

	.modal.dropdown {
		animation: slideIn 0.3s ease-out;
	}

	.modal[open]::backdrop {
		animation: backdrop-fade 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes backdrop-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.modal {
			max-width: 95vw;
			margin: 1rem;
		}

		.modal-header {
			padding: 16px;
		}
	}

	@media (max-width: 480px) {
		.modal.dropdown {
			max-width: 280px;
			width: 280px;
		}
	}
</style>
