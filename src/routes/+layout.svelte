<script lang="ts">
	import { browser } from '$app/environment';
	import '../app.css';

	let { children } = $props();

	if (browser && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js').catch(() => {});
	}
</script>

{@render children()}
