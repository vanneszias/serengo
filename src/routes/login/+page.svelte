<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input, Button, ErrorMessage } from '$lib';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="login-container">
	<h1 class="login-title">Serengo</h1>

	<form class="login-form" method="post" action="?/login" use:enhance>
		<Input name="username" type="text" placeholder="Username or Email" required />

		<Input name="password" type="password" placeholder="Password" required />

		<div class="button-group">
			<Button type="submit" variant="primary">Login</Button>
			<Button type="submit" variant="primary" formaction="?/register">Register</Button>
		</div>

		<ErrorMessage message={form?.message} />
	</form>
</div>

<style>
	.login-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 4rem 2rem;
		background-color: #f8f8f8;
		align-items: center;
		justify-content: flex-start;
		max-width: 400px;
		margin: 0 auto;
	}

	.login-title {
		font-family: 'Washington', serif;
		font-size: 3.5rem;
		color: #000000;
		margin-bottom: 6rem;
		text-align: center;
		font-weight: normal;
		letter-spacing: -0.02em;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 1.5rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 480px) {
		.login-container {
			padding: 3rem 1.5rem;
		}

		.login-title {
			font-size: 3rem;
			margin-bottom: 4rem;
		}

		.button-group {
			margin-top: 2rem;
		}
	}
</style>
