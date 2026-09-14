<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		maxWidth?: string;
		onclose?: () => void;
		children: Snippet;
		actions?: Snippet;
	}

	let { open, title, maxWidth = 'max-w-lg', onclose, children, actions }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open && onclose) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150"
		role="dialog"
		aria-modal="true"
	>
		<!-- Mobile: full-screen tanpa radius; Desktop: modal tengah dengan radius-lg (DESIGN.md §7) -->
		<div
			class="w-full h-full md:h-auto md:max-h-[90vh] {maxWidth} bg-[var(--color-surface)] flex flex-col md:rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border)] overflow-hidden transition-all duration-200"
		>
			{#if title || onclose}
				<div
					class="px-4 py-3 md:px-6 md:py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)] sticky top-0 z-10"
				>
					<h3 class="text-base md:text-lg font-bold text-[var(--color-text-primary)]">
						{title || ''}
					</h3>
					{#if onclose}
						<button
							type="button"
							class="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-muted)]"
							onclick={onclose}
							aria-label="Tutup"
						>
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<div class="flex-1 overflow-y-auto p-4 md:p-6">
				{@render children()}
			</div>

			{#if actions}
				<div
					class="px-4 py-3 md:px-6 md:py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-end gap-3 shrink-0"
				>
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
{/if}
