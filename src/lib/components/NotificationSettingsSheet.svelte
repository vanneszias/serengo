<script lang="ts">
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './sheet/index.js';
	import NotificationSettings from './NotificationSettings.svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();
</script>

<Sheet open={true} {onClose}>
	<SheetContent class="notification-settings-sheet">
		<SheetHeader>
			<SheetTitle>Notifications</SheetTitle>
			<SheetDescription>Manage your notification preferences</SheetDescription>
		</SheetHeader>
		<div class="notification-settings-content">
			<NotificationSettings />
		</div>
	</SheetContent>
</Sheet>

<style>
	:global(.notification-settings-sheet) {
		max-width: 500px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.notification-settings-content {
		margin-top: 20px;
	}
</style>
