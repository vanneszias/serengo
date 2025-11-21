<script lang="ts">
	import CommentsList from './CommentsList.svelte';

	interface CommentsProps {
		findId: string;
		currentUserId?: string;
		collapsed?: boolean;
		maxComments?: number;
		showCommentForm?: boolean;
		isScrollable?: boolean;
	}

	let {
		findId,
		currentUserId,
		collapsed = true,
		maxComments,
		showCommentForm = true,
		isScrollable = false
	}: CommentsProps = $props();
</script>

<CommentsList {findId} {currentUserId} {collapsed} {maxComments} {showCommentForm} {isScrollable} />
