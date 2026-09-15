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

	const SIZES = {
		sm: { px: 36, class: 'w-9 h-9 text-sm' },
		md: { px: 48, class: 'w-12 h-12 text-base' },
		lg: { px: 64, class: 'w-16 h-16 text-xl' }
	} as const;

	let sizeConfig = $derived(SIZES[size]);
</script>

<div
	class="rounded-full flex items-center justify-center font-bold select-none overflow-hidden shrink-0 {sizeConfig.class} {isDeceased
		? 'bg-surface-muted text-text-secondary border-2 border-border'
		: isMale
			? 'bg-blue-tint text-blue-primary border-2 border-blue-primary'
			: 'bg-pink-tint text-pink-primary border-2 border-pink-primary'}"
	style="width: {sizeConfig.px}px; height: {sizeConfig.px}px; min-width: {sizeConfig.px}px; min-height: {sizeConfig.px}px;"
>
	{#if photoUrl}
		<img
			src={photoUrl}
			alt={name}
			width={sizeConfig.px}
			height={sizeConfig.px}
			class="w-full h-full object-cover rounded-full block {isDeceased ? 'grayscale' : ''}"
			style="width: {sizeConfig.px}px; height: {sizeConfig.px}px; object-fit: cover; border-radius: 9999px; {isDeceased ? 'filter: grayscale(100%); -webkit-filter: grayscale(100%);' : ''}"
		/>
	{:else}
		<span>{initial}</span>
	{/if}
</div>
