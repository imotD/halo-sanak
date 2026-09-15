<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'male' | 'female' | 'neutral' | 'danger' | 'success';
		children: Snippet;
	}

	let { variant = 'neutral', children }: Props = $props();

	let variantClasses = $derived({
		male: 'bg-[var(--color-blue-tint)] text-[var(--color-blue-primary)]',
		female: 'bg-[var(--color-pink-tint)] text-[var(--color-pink-primary)]',
		neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
		danger: 'bg-danger/15 text-danger',
		success: 'bg-success/15 text-success'
	}[variant]);
</script>

<span
	class="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-semibold select-none {variantClasses}"
>
	{@render children()}
</span>
