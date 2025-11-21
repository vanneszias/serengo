<script lang="ts">
	import LoginForm from '$lib/components/auth/login-form.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Login - Serengo</title>
	<meta
		name="description"
		content="Sign in to your Serengo account to access personalized maps and discover unexpected places around you."
	/>
	<meta property="og:title" content="Login - Serengo" />
	<meta
		property="og:description"
		content="Sign in to your Serengo account to access personalized maps and discover unexpected places around you."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Login - Serengo" />
	<meta
		name="twitter:description"
		content="Sign in to your Serengo account to access personalized maps and discover unexpected places around you."
	/>
</svelte:head>

<div class="login-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<LoginForm {form} />
	</div>

	<style>
		.login-background {
			background-image: url('/cafe-bg-compressed.jpg');
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

		/* Preload hint for faster loading */
		@media (prefers-reduced-data: no-preference) {
			.login-background::after {
				content: '';
				position: absolute;
				background-image: url('/cafe-bg-compressed.jpg');
				opacity: 0;
				z-index: -1;
			}
		}
	</style>
</div>
