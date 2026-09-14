<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { Member } from '$lib/schemas';

	interface Props {
		member: Member;
		width: number;
		height: number;
	}

	let { member, width, height }: Props = $props();
</script>

<!-- Tree card sesuai DESIGN.md §7 & PRD §8.1:
  - Avatar 32-40px dengan border warna sesuai gender (blue-primary / pink-primary)
  - Nama bold 2 baris max, domisili 1 baris
  - Grayscale total jika wafat
  - Tidak ada umur, pekerjaan, atau tanggal
-->
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
			{member.domicile}
		</p>
	</div>
</div>
