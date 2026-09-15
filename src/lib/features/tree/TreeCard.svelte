<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { getAgeInfo } from '$lib/domain/age';
	import type { Member } from '$lib/schemas';

	interface Props {
		member: Member;
		width: number;
		height: number;
	}

	let { member, width, height }: Props = $props();

	// Hitung info umur (pasti atau estimasi ~)
	let ageInfo = $derived(
		getAgeInfo(member.birthDate, member.isDeceased, member.deathDate)
	);

	let ageText = $derived.by(() => {
		if (!ageInfo) return null;
		const prefix = ageInfo.isEstimated ? '~' : '';
		return `${prefix}${ageInfo.age} tahun`;
	});
</script>

<div
	class="w-full h-full p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-blue-soft)]/50 shadow-[var(--shadow-card)] flex items-center gap-3 select-none transition-transform duration-100 active:scale-[0.97] hover:border-[var(--color-blue-primary)]"
	style="width: {width}px; height: {height}px;"
>
	<Avatar
		name={member.fullName}
		gender={member.gender}
		photoUrl={member.photoUrl}
		isDeceased={member.isDeceased}
		size="sm"
	/>

	<div class="flex-1 min-w-0">
		<!-- 1. Nama Anggota: Tebal/Bold 700, kontras gelap pekat -->
		<h5
			class="text-[14px] font-bold text-[var(--color-text-primary)] line-clamp-1 leading-snug tracking-tight {member.isDeceased
				? 'opacity-85'
				: ''}"
		>
			{member.fullName}
		</h5>

		<!-- 2. Subteks: Tipis/Regular 400, abu-abu lembut -->
		<p class="text-[12px] font-normal text-[var(--color-text-secondary)] truncate mt-0.5 flex items-center gap-1.5">
			<span>{member.domicile}</span>
			{#if ageText}
				<span class="opacity-40">•</span>
				<span>{ageText}</span>
			{/if}
		</p>
	</div>
</div>
