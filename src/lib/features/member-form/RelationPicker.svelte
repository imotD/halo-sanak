<script lang="ts">
	import type { Member, Gender } from '$lib/schemas';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		currentMemberId?: string;
		currentGender: Gender;
		availableMembers: Member[];
		fatherId?: string;
		motherId?: string;
		spouseIds: string[];
		childrenIds: string[];
		onchange: (relations: {
			fatherId?: string;
			motherId?: string;
			spouseIds: string[];
			childrenIds: string[];
		}) => void;
	}

	let {
		currentMemberId,
		currentGender,
		availableMembers,
		fatherId = $bindable(),
		motherId = $bindable(),
		spouseIds = $bindable([]),
		childrenIds = $bindable([]),
		onchange
	}: Props = $props();

	// Kandidat Ayah: Laki-laki, bukan diri sendiri, bukan anak
	let fatherCandidates = $derived(
		availableMembers.filter(
			(m) =>
				m.gender === 'Laki-laki' &&
				m.id !== currentMemberId &&
				!childrenIds.includes(m.id)
		)
	);

	// Kandidat Ibu: Perempuan, bukan diri sendiri, bukan anak
	let motherCandidates = $derived(
		availableMembers.filter(
			(m) =>
				m.gender === 'Perempuan' &&
				m.id !== currentMemberId &&
				!childrenIds.includes(m.id)
		)
	);

	// Kandidat Pasangan: Lawan jenis (PRD §7), bukan diri sendiri, bukan ortu, bukan anak
	let spouseCandidates = $derived(
		availableMembers.filter(
			(m) =>
				m.gender !== currentGender &&
				m.id !== currentMemberId &&
				m.id !== fatherId &&
				m.id !== motherId &&
				!childrenIds.includes(m.id)
		)
	);

	// Kandidat Anak: bukan diri sendiri, bukan ortu, bukan pasangan
	let childrenCandidates = $derived(
		availableMembers.filter(
			(m) =>
				m.id !== currentMemberId &&
				m.id !== fatherId &&
				m.id !== motherId &&
				!spouseIds.includes(m.id)
		)
	);

	function notify() {
		onchange({
			fatherId: fatherId || undefined,
			motherId: motherId || undefined,
			spouseIds,
			childrenIds
		});
	}

	function toggleSpouse(id: string) {
		if (spouseIds.includes(id)) {
			spouseIds = spouseIds.filter((s) => s !== id);
		} else {
			spouseIds = [...spouseIds, id];
		}
		notify();
	}

	function toggleChild(id: string) {
		if (childrenIds.includes(id)) {
			childrenIds = childrenIds.filter((c) => c !== id);
		} else {
			childrenIds = [...childrenIds, id];
		}
		notify();
	}
</script>

<div class="space-y-4 text-left">
	<!-- Pilihan Ayah -->
	<div>
		<label for="rel-father-select" class="block text-xs font-semibold text-text-secondary mb-1">
			{UI_STRINGS.relations.father}
		</label>
		<select
			id="rel-father-select"
			bind:value={fatherId}
			onchange={notify}
			class="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-blue-primary"
		>
			<option value="">-- Pilih {UI_STRINGS.relations.father} --</option>
			{#each fatherCandidates as candidate}
				<option value={candidate.id}>{candidate.fullName} ({candidate.domicile})</option>
			{/each}
		</select>
	</div>

	<!-- Pilihan Ibu -->
	<div>
		<label for="rel-mother-select" class="block text-xs font-semibold text-text-secondary mb-1">
			{UI_STRINGS.relations.mother}
		</label>
		<select
			id="rel-mother-select"
			bind:value={motherId}
			onchange={notify}
			class="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-blue-primary"
		>
			<option value="">-- Pilih {UI_STRINGS.relations.mother} --</option>
			{#each motherCandidates as candidate}
				<option value={candidate.id}>{candidate.fullName} ({candidate.domicile})</option>
			{/each}
		</select>
	</div>

	<!-- Pilihan Pasangan (Multi-select) -->
	<div>
		<span class="block text-xs font-semibold text-text-secondary mb-1">
			{UI_STRINGS.relations.spouse}
		</span>
		<div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-border rounded-md bg-surface-muted">
			{#if spouseCandidates.length === 0}
				<span class="text-xs text-text-secondary italic">Tidak ada kandidat pasangan yang cocok</span>
			{:else}
				{#each spouseCandidates as candidate}
					{@const isSelected = spouseIds.includes(candidate.id)}
					<button
						type="button"
						class="px-2.5 py-1 text-xs font-semibold rounded-sm border transition-colors {isSelected
							? 'bg-blue-primary text-white border-blue-primary'
							: 'bg-surface text-text-primary border-border hover:bg-surface-muted'}"
						onclick={() => toggleSpouse(candidate.id)}
					>
						{isSelected ? '✓ ' : '+ '}{candidate.fullName}
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Pilihan Anak (Multi-select) -->
	<div>
		<span class="block text-xs font-semibold text-text-secondary mb-1">
			{UI_STRINGS.relations.children}
		</span>
		<div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-border rounded-md bg-surface-muted">
			{#if childrenCandidates.length === 0}
				<span class="text-xs text-text-secondary italic">Tidak ada kandidat anak</span>
			{:else}
				{#each childrenCandidates as candidate}
					{@const isSelected = childrenIds.includes(candidate.id)}
					<button
						type="button"
						class="px-2.5 py-1 text-xs font-semibold rounded-sm border transition-colors {isSelected
							? 'bg-blue-primary text-white border-blue-primary'
							: 'bg-surface text-text-primary border-border hover:bg-surface-muted'}"
						onclick={() => toggleChild(candidate.id)}
					>
						{isSelected ? '✓ ' : '+ '}{candidate.fullName}
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
