<script lang="ts">
	interface Props {
		name: string;
		type?: 'text' | 'email' | 'password';
		placeholder?: string;
		required?: boolean;
		value?: string;
	}

	let { name, type = 'text', placeholder, required = false, value = $bindable() }: Props = $props();
</script>

<div class="input-group">
	<input class="input-field" {name} {type} {placeholder} {required} bind:value />
</div>

<style>
	.input-group {
		display: flex;
		flex-direction: column;
	}

	.input-field {
		padding: 1.25rem 1.5rem;
		border: none;
		border-radius: 2rem;
		background-color: #e0e0e0;
		font-size: 1rem;
		color: #333;
		outline: none;
		transition: background-color 0.2s ease;
		height: 3.5rem;
	}

	.input-field:focus {
		background-color: #d5d5d5;
	}

	.input-field::placeholder {
		color: #888;
	}
</style>
