<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/button/index.js';
	import * as Card from '$lib/components/card/index.js';
	import { Label } from '$lib/components/label/index.js';
	import { Input } from '$lib/components/input/index.js';
	import { cn } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ActionData } from '../../routes/login/$types.js';

	let {
		class: className,
		form,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { form?: ActionData } = $props();

	const id = Math.random().toString(36).substring(2, 15);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
	});
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl"><h1>Serengo</h1></Card.Title>
			<Card.Description>Enter your credentials to continue</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action="?/login" use:enhance>
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="username-{id}">Username</Label>
						<Input
							id="username-{id}"
							name="username"
							type="text"
							placeholder="Enter your username"
							required
						/>
					</div>
					<div class="grid gap-2">
						<Label for="password-{id}">Password</Label>
						<Input
							id="password-{id}"
							name="password"
							type="password"
							placeholder="Enter your password"
							required
						/>
					</div>

					<div class="flex gap-2">
						<Button type="submit" class="flex-1">Login</Button>
						<Button type="submit" variant="outline" formaction="?/register" class="flex-1">
							Register
						</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
