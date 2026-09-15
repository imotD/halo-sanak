<script lang="ts">
	import MemberCard from './MemberCard.svelte';
	import MemberFilter from './MemberFilter.svelte';
	import type { Member, Gender } from '$lib/schemas';

	interface Props {
		members: Member[];
		onselectmember: (id: string) => void;
		onaddclick: () => void;
	}

	let { members, onselectmember, onaddclick }: Props = $props();

	let searchQuery = $state('');
	let selectedGender = $state<Gender | undefined>(undefined);
	let selectedDomicile = $state<string | undefined>(undefined);
	let selectedDeceasedStatus = $state<'all' | 'alive' | 'deceased'>('all');
	let showFilterPanel = $state(false);

	// Kumpulan list unik domisili
	let availableDomiciles = $derived(
		Array.from(new Set(members.map((m) => m.domicile))).filter(Boolean).sort()
	);

	// Indikator filter aktif
	let hasActiveFilter = $derived(
		selectedGender !== undefined ||
		Boolean(selectedDomicile) ||
		selectedDeceasedStatus !== 'all' ||
		searchQuery.trim().length > 0
	);

	function resetFilters() {
		searchQuery = '';
		selectedGender = undefined;
		selectedDomicile = undefined;
		selectedDeceasedStatus = 'all';
	}

	// Filter & Sort A-Z (PRD §8.2)
	let filteredMembers = $derived.by(() => {
		let result = [...members];

		// Search case-insensitive
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			result = result.filter((m) => m.fullName.toLowerCase().includes(q));
		}

		// Gender
		if (selectedGender) {
			result = result.filter((m) => m.gender === selectedGender);
		}

		// Domisili
		if (selectedDomicile) {
			result = result.filter((m) => m.domicile === selectedDomicile);
		}

		// Status wafat
		if (selectedDeceasedStatus === 'alive') {
			result = result.filter((m) => !m.isDeceased);
		} else if (selectedDeceasedStatus === 'deceased') {
			result = result.filter((m) => m.isDeceased);
		}

		// Urut A-Z
		return result.sort((a, b) => a.fullName.localeCompare(b.fullName, 'id'));
	});
</script>

<div class="space-y-4">
	<!-- Toolbar Search & Filter -->
	<div class="flex items-center gap-2">
		<div class="relative flex-1">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari nama anggota..."
				class="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-blue-primary"
			/>
			<svg
				class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
		</div>

		<button
			type="button"
			class="p-2 rounded-md border border-border bg-surface text-text-primary hover:bg-surface-muted transition-colors relative"
			onclick={() => (showFilterPanel = !showFilterPanel)}
			aria-label="Filter"
			title="Filter Anggota"
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
				/>
			</svg>
			{#if hasActiveFilter}
				<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-primary"></span>
			{/if}
		</button>
	</div>

	{#if showFilterPanel}
		<MemberFilter
			bind:selectedGender
			bind:selectedDomicile
			bind:selectedDeceasedStatus
			domiciles={availableDomiciles}
			onchange={() => {}}
			onreset={resetFilters}
		/>
	{/if}

	<!-- Grid Daftar Anggota (Responsif: 2 kolom mobile, hingga 4-5 di tablet/desktop) -->
	{#if filteredMembers.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
			{#each filteredMembers as member (member.id)}
				<MemberCard {member} onclick={() => onselectmember(member.id)} />
			{/each}
		</div>
	{:else}
		<!-- Empty state sesuai DESIGN.md §5 & PRD §8.2: line-art sederhana + 1 aksen warna -->
		<div class="py-16 text-center space-y-3">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-tint text-blue-soft mb-2">
				<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.75"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</div>
			<h4 class="text-base font-bold text-text-primary">
				{members.length === 0 ? 'Belum Ada Anggota Keluarga' : 'Tidak Ada Anggota Ditemukan'}
			</h4>
			<p class="text-xs text-text-secondary max-w-xs mx-auto">
				{members.length === 0
					? 'Mulai bangun pohon keluarga dengan menambahkan anggota keluarga pertama Anda.'
					: 'Coba sesuaikan kata kunci pencarian atau reset filter yang sedang aktif.'}
			</p>
			<div>
				{#if members.length === 0}
					<button
						type="button"
						class="mt-2 px-4 py-2 text-xs font-bold rounded-md bg-blue-primary text-white hover:bg-blue-primary-hover transition-colors"
						onclick={onaddclick}
					>
						+ Tambah Anggota Pertama
					</button>
				{:else if hasActiveFilter}
					<button
						type="button"
						class="mt-2 px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-surface-muted text-text-primary transition-colors"
						onclick={resetFilters}
					>
						Reset Pencarian & Filter
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
