<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'male' | 'female' | 'neutral' | 'danger' | 'success';
		children: Snippet;
	}

	let { variant = 'neutral', children }: Props = $props();

	let variantClasses = $derived({
		male: 'bg-blue-tint text-blue-primary',
		female: 'bg-pink-tint text-pink-primary',
		neutral: 'bg-surface-muted text-text-secondary',
		danger: 'bg-danger/15 text-danger',
		success: 'bg-success/15 text-success'
	}[variant]);
</script>

<span
	class="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold select-none {variantClasses}"
>
	{@render children()}
</span>
