<script lang="ts">
	import { Button } from '$lib/components/button';
	import { Play, Pause, Volume2, VolumeX, Maximize } from '@lucide/svelte';

	interface Props {
		src: string;
		poster?: string;
		class?: string;
		autoplay?: boolean;
		muted?: boolean;
		controls?: boolean;
	}

	let {
		src,
		poster,
		class: className = '',
		autoplay = false,
		muted = false,
		controls = true
	}: Props = $props();

	let videoElement: HTMLVideoElement;
	let isPlaying = $state(false);
	let isMuted = $state(muted);
	let currentTime = $state(0);
	let duration = $state(0);
	let isLoading = $state(true);
	let showControls = $state(true);
	let controlsTimeout: ReturnType<typeof setTimeout>;

	function togglePlayPause() {
		if (isPlaying) {
			videoElement.pause();
		} else {
			videoElement.play();
		}
	}

	function toggleMute() {
		videoElement.muted = !videoElement.muted;
		isMuted = videoElement.muted;
	}

	function handleTimeUpdate() {
		currentTime = videoElement.currentTime;
	}

	function handleLoadedMetadata() {
		duration = videoElement.duration;
		isLoading = false;
	}

	function handlePlay() {
		isPlaying = true;
	}

	function handlePause() {
		isPlaying = false;
	}

	function handleSeek(event: Event) {
		const target = event.target as HTMLInputElement;
		const time = (parseFloat(target.value) / 100) * duration;
		videoElement.currentTime = time;
	}

	function handleMouseMove() {
		if (!controls) return;
		showControls = true;
		clearTimeout(controlsTimeout);
		controlsTimeout = setTimeout(() => {
			if (isPlaying) {
				showControls = false;
			}
		}, 3000);
	}

	function toggleFullscreen() {
		if (videoElement.requestFullscreen) {
			videoElement.requestFullscreen();
		}
	}

	function formatTime(time: number): string {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
</script>

<div
	class="group relative overflow-hidden rounded-lg bg-black {className}"
	role="application"
	onmousemove={handleMouseMove}
	onmouseleave={() => {
		if (isPlaying && controls) showControls = false;
	}}
>
	<video
		bind:this={videoElement}
		class="h-full w-full object-cover"
		{src}
		{poster}
		{autoplay}
		muted={isMuted}
		preload="metadata"
		onplay={handlePlay}
		onpause={handlePause}
		ontimeupdate={handleTimeUpdate}
		onloadedmetadata={handleLoadedMetadata}
		onclick={togglePlayPause}
	>
		<track kind="captions" />
	</video>

	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"
			></div>
		</div>
	{/if}

	{#if controls && showControls}
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
		>
			<!-- Center play/pause button -->
			<div class="absolute inset-0 flex items-center justify-center">
				<Button
					variant="ghost"
					size="lg"
					class="h-16 w-16 rounded-full bg-black/30 text-white hover:bg-black/50"
					onclick={togglePlayPause}
				>
					{#if isPlaying}
						<Pause class="h-8 w-8" />
					{:else}
						<Play class="ml-1 h-8 w-8" />
					{/if}
				</Button>
			</div>

			<!-- Bottom controls -->
			<div class="absolute right-0 bottom-0 left-0 p-4">
				<!-- Progress bar -->
				<div class="mb-2">
					<input
						type="range"
						min="0"
						max="100"
						value={duration > 0 ? (currentTime / duration) * 100 : 0}
						oninput={handleSeek}
						class="slider h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/30"
					/>
				</div>

				<!-- Control buttons -->
				<div class="flex items-center justify-between text-white">
					<div class="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							class="text-white hover:bg-white/20"
							onclick={togglePlayPause}
						>
							{#if isPlaying}
								<Pause class="h-4 w-4" />
							{:else}
								<Play class="h-4 w-4" />
							{/if}
						</Button>

						<Button
							variant="ghost"
							size="sm"
							class="text-white hover:bg-white/20"
							onclick={toggleMute}
						>
							{#if isMuted}
								<VolumeX class="h-4 w-4" />
							{:else}
								<Volume2 class="h-4 w-4" />
							{/if}
						</Button>

						<span class="text-sm">
							{formatTime(currentTime)} / {formatTime(duration)}
						</span>
					</div>

					<Button
						variant="ghost"
						size="sm"
						class="text-white hover:bg-white/20"
						onclick={toggleFullscreen}
					>
						<Maximize class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
	}

	.slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
	}
</style>
