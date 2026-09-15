<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		isDanger?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open,
		title,
		message,
		confirmText = 'Konfirmasi',
		cancelText = 'Batal',
		isDanger = false,
		onconfirm,
		oncancel
	}: Props = $props();
</script>

<Modal {open} {title} maxWidth="max-w-md" onclose={oncancel}>
	<p class="text-sm text-text-secondary leading-relaxed">
		{message}
	</p>

	{#snippet actions()}
		<button
			type="button"
			class="px-4 py-2 text-sm font-semibold rounded-md border border-border hover:bg-surface-muted text-text-primary transition-colors"
			onclick={oncancel}
		>
			{cancelText}
		</button>
		<button
			type="button"
			class="px-4 py-2 text-sm font-semibold rounded-md transition-colors {isDanger
				? 'bg-danger text-white hover:opacity-90'
				: 'bg-blue-primary text-white hover:bg-blue-primary-hover'}"
			onclick={onconfirm}
		>
			{confirmText}
		</button>
	{/snippet}
</Modal>
