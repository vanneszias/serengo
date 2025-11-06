<script lang="ts">
	import { Button } from '$lib/components/button';
	import { Input } from '$lib/components/input';
	import { Send } from '@lucide/svelte';

	interface CommentFormProps {
		onSubmit: (content: string) => void;
		placeholder?: string;
		disabled?: boolean;
	}

	let { onSubmit, placeholder = 'Add a comment...', disabled = false }: CommentFormProps = $props();

	let content = $state('');
	let isSubmitting = $state(false);

	function handleSubmit(event: Event) {
		event.preventDefault();

		const trimmedContent = content.trim();
		if (!trimmedContent || isSubmitting || disabled) {
			return;
		}

		if (trimmedContent.length > 500) {
			return;
		}

		isSubmitting = true;

		try {
			onSubmit(trimmedContent);
			content = '';
		} catch (error) {
			console.error('Error submitting comment:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(event);
		}
	}

	const canSubmit = $derived(
		content.trim().length > 0 && content.length <= 500 && !isSubmitting && !disabled
	);
</script>

<form class="comment-form" onsubmit={handleSubmit}>
	<div class="input-container">
		<Input
			bind:value={content}
			{placeholder}
			disabled={disabled || isSubmitting}
			class="comment-input"
			onkeydown={handleKeyDown}
		/>

		<Button type="submit" variant="ghost" size="sm" disabled={!canSubmit} class="submit-button">
			<Send size={16} />
		</Button>
	</div>

	{#if content.length > 450}
		<div class="character-count" class:warning={content.length > 500}>
			{content.length}/500
		</div>
	{/if}
</form>

<style>
	.comment-form {
		padding: 0.75rem 0;
		border-top: 1px solid hsl(var(--border));
	}

	.input-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	:global(.comment-input) {
		flex: 1;
		min-height: 40px;
		resize: none;
	}

	:global(.submit-button) {
		flex-shrink: 0;
		color: hsl(var(--muted-foreground));
		padding: 0.5rem;
	}

	:global(.submit-button:not(:disabled)) {
		color: hsl(var(--primary));
	}

	:global(.submit-button:not(:disabled):hover) {
		background: hsl(var(--primary) / 0.1);
	}

	.character-count {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		text-align: right;
		margin-top: 0.25rem;
	}

	.character-count.warning {
		color: hsl(var(--destructive));
	}
</style>
