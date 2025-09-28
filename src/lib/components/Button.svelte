<script lang="ts">
	interface Props {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary';
		disabled?: boolean;
		formaction?: string;
		children?: import('svelte').Snippet;
	}

	let {
		type = 'button',
		variant = 'primary',
		disabled = false,
		formaction,
		children
	}: Props = $props();
</script>

<button class="button {variant}" {type} {disabled} {formaction}>
	{@render children?.()}
</button>

<style>
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

	.primary {
		background-color: #3a4553;
		color: white;
	}

	.primary:hover:not(:disabled) {
		background-color: #2d3441;
		transform: translateY(-1px);
	}

	.secondary {
		background-color: #6c757d;
		color: white;
	}

	.secondary:hover:not(:disabled) {
		background-color: #5a6268;
		transform: translateY(-1px);
	}
</style>
