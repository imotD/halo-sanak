<script lang="ts">
	interface Props {
		onzoomin: () => void;
		onzoomout: () => void;
		onfit: () => void;
	}

	let { onzoomin, onzoomout, onfit }: Props = $props();
</script>

<div class="flex flex-col bg-surface border border-border rounded-md shadow-modal overflow-hidden">
	<button
		type="button"
		class="p-2.5 text-text-primary hover:bg-surface-muted transition-colors active:scale-95"
		onclick={onzoomin}
		aria-label="Perbesar (Zoom In)"
		title="Perbesar"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
	</button>

	<div class="h-px bg-border"></div>

	<button
		type="button"
		class="p-2.5 text-text-primary hover:bg-surface-muted transition-colors active:scale-95"
		onclick={onzoomout}
		aria-label="Perkecil (Zoom Out)"
		title="Perkecil"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
		</svg>
	</button>

	<div class="h-px bg-border"></div>

	<!-- Pas ke Layar: Ikon tanpa teks dengan label aksesibilitas (PRD §10) -->
	<button
		type="button"
		class="p-2.5 text-text-primary hover:bg-surface-muted transition-colors active:scale-95"
		onclick={onfit}
		aria-label="Pas ke Layar"
		title="Pas ke Layar"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
			/>
		</svg>
	</button>
</div>
