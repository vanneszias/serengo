<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="login-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<LoginForm {form} />
	</div>

	<style>
		.login-background {
			background-image: url('/cafe-bg.jpeg');
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			position: relative;
		}

		.login-background::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.4);
			z-index: 1;
		}

		.login-background > div {
			position: relative;
			z-index: 2;
		}
	</style>
</div>
