<script>
	import Login from './Login.svelte';

	export default {
		title: 'Pages/Login',
		component: Login,
		argTypes: {
			onSubmit: { action: 'submit' },
			errorMessage: {
				control: 'text',
				description: 'Error message to display'
			}
		}
	};
</script>

<script context="module">
	export const Default = {
		args: {}
	};

	export const WithError = {
		args: {
			errorMessage: 'Invalid username or password'
		}
	};

	export const NetworkError = {
		args: {
			errorMessage: 'Unable to connect to server. Please try again.'
		}
	};
</script>

<Login {...$$props} />
