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
	class="w-full h-full p-3 rounded-2xl bg-[var(--color-surface)] border border-blue-soft/50 shadow-[var(--shadow-card)] select-none overflow-hidden hover:border-[var(--color-blue-primary)]"
	style="width: {width}px; height: {height}px; box-sizing: border-box;"
	title="Detail: {member.fullName} (Klik untuk melihat detail)"
>
	<div style="display: table; width: 100%; height: 100%; table-layout: fixed;">
		<div style="display: table-cell; vertical-align: middle; width: 36px;">
			<Avatar
				name={member.fullName}
				gender={member.gender}
				photoUrl={member.photoUrl}
				isDeceased={member.isDeceased}
				size="sm"
			/>
		</div>

		<div style="display: table-cell; vertical-align: middle; padding-left: 10px; overflow: hidden;">
			<!-- 1. Nama Anggota: Tebal/Bold 700, kontras gelap pekat -->
			<h5
				class="text-sm font-bold leading-snug tracking-tight truncate {member.isDeceased
					? 'text-[var(--color-text-secondary)]'
					: 'text-[var(--color-text-primary)]'}"
			>
				{member.fullName}
			</h5>

			<!-- 2. Subteks: Tipis/Regular 400, abu-abu lembut -->
			<p class="text-xs font-normal text-[var(--color-text-secondary)] truncate mt-0.5">
				<span>{member.domicile}</span>{#if ageText}<span class="mx-1 text-[var(--color-border)]">•</span><span>{ageText}</span>{/if}
			</p>
		</div>
	</div>
</div>
