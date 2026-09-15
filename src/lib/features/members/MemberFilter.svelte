<script lang="ts">
	import type { Gender } from '$lib/schemas';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		selectedGender?: Gender;
		selectedDomicile?: string;
		selectedDeceasedStatus?: 'alive' | 'deceased' | 'all';
		domiciles: string[];
		onchange: (filters: {
			gender?: Gender;
			domicile?: string;
			deceasedStatus: 'alive' | 'deceased' | 'all';
		}) => void;
		onreset: () => void;
	}

	let {
		selectedGender = $bindable(),
		selectedDomicile = $bindable(),
		selectedDeceasedStatus = $bindable('all'),
		domiciles,
		onchange,
		onreset
	}: Props = $props();

	function apply() {
		onchange({
			gender: selectedGender,
			domicile: selectedDomicile,
			deceasedStatus: selectedDeceasedStatus
		});
	}
</script>

<div class="space-y-4 p-4 bg-surface border border-border rounded-md text-xs">
	<!-- Filter Gender -->
	<div>
		<span class="block font-semibold text-text-secondary mb-1.5">
			{UI_STRINGS.member.gender}
		</span>
		<div class="flex gap-1.5">
			<button
				type="button"
				class="px-2.5 py-1 rounded-sm border {selectedGender === undefined
					? 'bg-blue-primary text-white border-blue-primary'
					: 'border-border text-text-secondary'}"
				onclick={() => { selectedGender = undefined; apply(); }}
			>
				Semua
			</button>
			<button
				type="button"
				class="px-2.5 py-1 rounded-sm border {selectedGender === 'Laki-laki'
					? 'bg-blue-primary text-white border-blue-primary'
					: 'border-border text-text-secondary'}"
				onclick={() => { selectedGender = 'Laki-laki'; apply(); }}
			>
				{UI_STRINGS.member.male}
			</button>
			<button
				type="button"
				class="px-2.5 py-1 rounded-sm border {selectedGender === 'Perempuan'
					? 'bg-blue-primary text-white border-blue-primary'
					: 'border-border text-text-secondary'}"
				onclick={() => { selectedGender = 'Perempuan'; apply(); }}
			>
				{UI_STRINGS.member.female}
			</button>
		</div>
	</div>

	<!-- Filter Status Hidup / Wafat -->
	<div>
		<span class="block font-semibold text-text-secondary mb-1.5">
			Status Keberadaan
		</span>
		<div class="flex gap-1.5">
			<button
				type="button"
				class="px-2.5 py-1 rounded-sm border {selectedDeceasedStatus === 'all'
					? 'bg-blue-primary text-white border-blue-primary'
					: 'border-border text-text-secondary'}"
				onclick={() => { selectedDeceasedStatus = 'all'; apply(); }}
			>
				Semua
			</button>
			<button
				type="button"
				class="px-2.5 py-1 rounded-sm border {selectedDeceasedStatus === 'alive'
					? 'bg-blue-primary text-white border-blue-primary'
					: 'border-border text-text-secondary'}"
				onclick={() => { selectedDeceasedStatus = 'alive'; apply(); }}
			>
				Masih Hidup
			</button>
			<button
				type="button"
				class="px-2.5 py-1 rounded-sm border {selectedDeceasedStatus === 'deceased'
					? 'bg-blue-primary text-white border-blue-primary'
					: 'border-border text-text-secondary'}"
				onclick={() => { selectedDeceasedStatus = 'deceased'; apply(); }}
			>
				Sudah Wafat
			</button>
		</div>
	</div>

	<!-- Filter Domisili -->
	{#if domiciles.length > 0}
		<div>
			<label for="filter-domicile-select" class="block font-semibold text-text-secondary mb-1.5">
				{UI_STRINGS.member.domicile}
			</label>
			<select
				id="filter-domicile-select"
				bind:value={selectedDomicile}
				onchange={apply}
				class="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-text-primary"
			>
				<option value="">Semua Domisili</option>
				{#each domiciles as dom}
					<option value={dom}>{dom}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div class="pt-2 border-t border-border flex justify-end">
		<button
			type="button"
			class="text-xs font-semibold text-blue-primary hover:underline"
			onclick={onreset}
		>
			Reset Filter
		</button>
	</div>
</div>
