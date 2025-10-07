import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	preview: { allowedHosts: ['ziasvannes.tech'] },
	build: {
		target: 'es2020',
		cssCodeSplit: true,
		rollupOptions: {
			output: {
				manualChunks: {
					maplibre: ['maplibre-gl', 'svelte-maplibre']
				}
			}
		}
	},
	optimizeDeps: {
		include: ['maplibre-gl', 'svelte-maplibre']
	}
});
