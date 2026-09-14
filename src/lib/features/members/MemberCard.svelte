<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { Member } from '$lib/schemas';

	interface Props {
		member: Member;
		onclick: () => void;
	}

	let { member, onclick }: Props = $props();
</script>

<!-- Member card: Avatar 48-56px, nama bold 2 baris max, domisili 1 baris (DESIGN.md §7) -->
<button
	type="button"
	class="w-full text-left p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:border-[var(--color-blue-soft)] transition-all active:scale-[0.97] flex items-center gap-3.5 group cursor-pointer"
	{onclick}
>
	<Avatar
		name={member.fullName}
		gender={member.gender}
		photoUrl={member.photoUrl}
		isDeceased={member.isDeceased}
		size="md"
	/>

	<div class="flex-1 min-w-0">
		<h4
			class="text-base font-bold text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--color-blue-primary)] transition-colors {member.isDeceased
				? 'opacity-85'
				: ''}"
		>
			{member.fullName}
		</h4>
		<p class="text-xs text-[var(--color-text-secondary)] truncate mt-1">
			{member.domicile}
		</p>
	</div>
</button>
