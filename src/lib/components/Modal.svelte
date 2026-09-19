<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		open: boolean;
		title?: string;
		maxWidth?: string;
		onclose?: () => void;
		children: Snippet;
		actions?: Snippet;
	}

	let { open, title, maxWidth = 'max-w-lg', onclose, children, actions }: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!open || !dialogEl) return;
		const dialog = dialogEl;
		const previous = document.activeElement;
		dialog.showModal();
		return () => {
			dialog.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab' && dialogEl) {
			const focusables = Array.from(
				dialogEl.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				)
			).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

			if (focusables.length === 0) return;

			const first = focusables[0];
			const last = focusables[focusables.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					last.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === last) {
					first.focus();
					e.preventDefault();
				}
			}
		}
	}
</script>

{#if open}
	<dialog
		bind:this={dialogEl}
		class="fixed inset-0 m-0 max-w-none max-h-none w-full h-full bg-transparent p-0 md:p-4 open:flex items-center justify-center backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
		aria-label={title || UI_STRINGS.common.detail}
		oncancel={(event) => { event.preventDefault(); onclose?.(); }}
		onkeydown={handleKeydown}
	>
		<!-- Mobile: full-screen tanpa radius; Desktop: modal tengah dengan radius-lg (DESIGN.md §7) -->
		<div
			class="w-full h-full md:h-auto md:max-h-[90vh] {maxWidth} bg-surface flex flex-col md:rounded-lg shadow-modal border border-border overflow-hidden transition-all duration-200"
		>
			{#if title || onclose}
				<div
					class="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface sticky top-0 z-10"
				>
					<h3 class="text-base md:text-lg font-bold text-text-primary">
						{title || ''}
					</h3>
					{#if onclose}
						<button
							type="button"
							class="p-1.5 text-text-secondary hover:text-text-primary rounded-sm hover:bg-surface-muted"
							onclick={onclose}
							aria-label={UI_STRINGS.common.close}
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
					class="px-4 py-3 md:px-6 md:py-4 border-t border-border bg-surface flex items-center justify-end gap-3 shrink-0"
				>
					{@render actions()}
				</div>
			{/if}
		</div>
	</dialog>
{/if}
