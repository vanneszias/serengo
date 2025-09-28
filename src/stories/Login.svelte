<script lang="ts">
	import '../routes/login/login.css';

	let { onSubmit = () => {}, errorMessage = '' }: { onSubmit?: (action: string) => void; errorMessage?: string } = $props();

	function handleSubmit(event: Event & { currentTarget: EventTarget & HTMLFormElement }) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const action = (event.submitter as HTMLButtonElement)?.formAction?.includes('register') ? 'register' : 'login';
		onSubmit(action);
	}
</script>

<div class="login-container">
	<h1 class="login-title">Serengo</h1>

	<form class="login-form" on:submit={handleSubmit}>
		<div class="input-group">
			<input
				class="input-field"
				name="username"
				type="text"
				placeholder="Username or Email"
				required
			/>
		</div>

		<div class="input-group">
			<input
				class="input-field"
				name="password"
				type="password"
				placeholder="Password"
				required
			/>
		</div>

		<div class="button-group">
			<button class="login-button" type="submit">Login</button>
			<button class="register-button" type="submit" formaction="?/register">Register</button>
		</div>
	</form>

	{#if errorMessage}
		<p class="error-message">{errorMessage}</p>
	{/if}
</div>
