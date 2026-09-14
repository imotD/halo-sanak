<script lang="ts">
	import type { Gender } from '$lib/schemas';

	interface Props {
		name: string;
		gender: Gender;
		photoUrl?: string;
		isDeceased?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, gender, photoUrl, isDeceased = false, size = 'md' }: Props = $props();

	let initial = $derived(name ? name.trim().charAt(0).toUpperCase() : '?');
	let isMale = $derived(gender === 'Laki-laki');

	let sizeClasses = $derived({
		sm: 'w-9 h-9 text-sm',
		md: 'w-12 h-12 text-base',
		lg: 'w-16 h-16 text-xl'
	}[size]);
</script>

<div
	class="relative rounded-full flex items-center justify-center font-bold select-none overflow-hidden shrink-0 transition-transform active:scale-95 {sizeClasses} {isDeceased
		? 'grayscale border-2 border-[var(--color-border)] opacity-85'
		: isMale
			? 'bg-[var(--color-blue-tint)] text-[var(--color-blue-primary)] border-2 border-[var(--color-blue-primary)]'
			: 'bg-[var(--color-pink-tint)] text-[var(--color-pink-primary)] border-2 border-[var(--color-pink-primary)]'}"
>
	{#if photoUrl}
		<img src={photoUrl} alt={name} class="w-full h-full object-cover" />
	{:else}
		<span>{initial}</span>
	{/if}
</div>
