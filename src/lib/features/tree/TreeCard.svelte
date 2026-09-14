<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { calculateAge } from '$lib/domain/age';
	import type { Member } from '$lib/schemas';

	interface Props {
		member: Member;
		width: number;
		height: number;
	}

	let { member, width, height }: Props = $props();

	// Hitung umur: umur saat ini jika hidup, umur saat wafat jika wafat (hanya bila data presisi full)
	let age = $derived(
		calculateAge(member.birthDate, member.isDeceased, member.deathDate)
	);

	// Label baris kedua: gabungkan domisili & data umur
	let subText = $derived.by(() => {
		const parts: string[] = [];
		if (member.domicile) {
			parts.push(member.domicile);
		}
		if (age !== null) {
			parts.push(`${age} th`);
		} else if (member.birthDate?.precision === 'year') {
			parts.push(`l. ${member.birthDate.value}`);
		}
		return parts.join(' • ');
	});
</script>

<div
	class="w-full h-full p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] flex items-center gap-2.5 select-none transition-transform duration-100 active:scale-[0.97] hover:border-[var(--color-blue-soft)]"
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
		<h5
			class="text-xs font-bold text-[var(--color-text-primary)] line-clamp-2 leading-tight {member.isDeceased
				? 'opacity-85'
				: ''}"
		>
			{member.fullName}
		</h5>
		<p class="text-[11px] text-[var(--color-text-secondary)] truncate mt-0.5">
			{subText}
		</p>
	</div>
</div>
