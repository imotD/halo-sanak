<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import type { Member, Relationship } from '$lib/schemas';
	import { calculateKinship, formatKinshipPath, type KinshipResult } from '$lib/domain/kinship';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		open: boolean;
		memberA: Member;
		allMembers: Member[];
		relationships: Relationship[];
		onclose: () => void;
	}

	let { open, memberA, allMembers, relationships, onclose }: Props = $props();

	let searchQuery = $state('');
	let selectedTarget = $state<Member | null>(null);
	let kinshipResult = $state<KinshipResult | null>(null);
	let showPathDetails = $state(false);

	// Peta anggota untuk pencarian instan dan format nama silsilah
	let membersMap = $derived(new Map(allMembers.map((m) => [m.id, m])));

	// Daftar kandidat B (semua anggota kecuali A, urut A-Z)
	let availableTargets = $derived.by(() => {
		let list = allMembers.filter((m) => m.id !== memberA.id);
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter((m) => m.fullName.toLowerCase().includes(q));
		}
		return list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'id'));
	});

	function handleSelectTarget(target: Member) {
		selectedTarget = target;
		kinshipResult = calculateKinship(memberA, target, allMembers, relationships);
		showPathDetails = false;
	}

	function handleResetTarget() {
		selectedTarget = null;
		kinshipResult = null;
		showPathDetails = false;
	}

	let formattedPath = $derived(
		kinshipResult ? formatKinshipPath(kinshipResult, membersMap, relationships) : ''
	);
</script>

<Modal
	{open}
	title={selectedTarget ? UI_STRINGS.kinship.modalTitle : UI_STRINGS.kinship.selectTargetTitle}
	maxWidth="max-w-xl"
	onclose={onclose}
>
	{#if selectedTarget && kinshipResult}
		<!-- Tampilan Hasil Kalkulasi Kekerabatan (PRD v2 §1.7) -->
		<div class="space-y-6">
			<!-- Header Profil A & B -->
			<div class="flex items-center justify-between p-4 bg-surface-muted rounded-md border border-border">
				<div class="flex items-center gap-3">
					<Avatar
						name={memberA.fullName}
						gender={memberA.gender}
						photoUrl={memberA.photoUrl}
						isDeceased={memberA.isDeceased}
						size="sm"
					/>
					<div>
						<span class="text-[11px] font-semibold text-text-secondary block">Dari (A)</span>
						<span class="text-sm font-bold text-text-primary">{memberA.fullName}</span>
					</div>
				</div>

				<span class="text-text-secondary font-bold text-sm">→</span>

				<div class="flex items-center gap-3 text-right">
					<div>
						<span class="text-[11px] font-semibold text-text-secondary block">Ke (B)</span>
						<span class="text-sm font-bold text-text-primary">{selectedTarget.fullName}</span>
					</div>
					<Avatar
						name={selectedTarget.fullName}
						gender={selectedTarget.gender}
						photoUrl={selectedTarget.photoUrl}
						isDeceased={selectedTarget.isDeceased}
						size="sm"
					/>
				</div>
			</div>

			<!-- Hasil Kekerabatan -->
			<div class="p-5 bg-surface border border-border rounded-lg text-center space-y-3 shadow-card">
				<div class="inline-flex">
					<Badge variant={selectedTarget.gender === 'Laki-laki' ? 'male' : 'female'}>
						{kinshipResult.term}
					</Badge>
				</div>

				<h3 class="text-base md:text-lg font-bold text-text-primary">
					{kinshipResult.sentence}
				</h3>

				{#if kinshipResult.lcaId && formattedPath}
					<div class="pt-2">
						<button
							type="button"
							class="text-xs font-semibold text-blue-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
							aria-expanded={showPathDetails}
							onclick={() => (showPathDetails = !showPathDetails)}
						>
							{showPathDetails ? UI_STRINGS.kinship.hidePath : UI_STRINGS.kinship.viewPath}
						</button>

						{#if showPathDetails}
							<div class="mt-3 p-3 bg-surface-muted rounded-md border border-border text-xs text-text-secondary text-left font-mono break-words leading-relaxed">
								{formattedPath}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="flex justify-center">
				<button
					type="button"
					class="px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-surface-muted text-text-primary transition-colors"
					onclick={handleResetTarget}
				>
					Pilih Anggota Lain
				</button>
			</div>
		</div>
	{:else}
		<!-- Pemilihan Target B (Reuse gaya search PRD v1 §8.2) -->
		<div class="space-y-4">
			<p class="text-xs text-text-secondary">
				Pilih anggota keluarga lain untuk menghitung sebutan hubungan terhadap <span class="font-bold text-text-primary">{memberA.fullName}</span>.
			</p>

			<!-- Input Pencarian -->
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={UI_STRINGS.kinship.searchPlaceholder}
					aria-label={UI_STRINGS.kinship.searchPlaceholder}
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

			<!-- List Anggota B -->
			<div class="max-h-72 overflow-y-auto space-y-2 divide-y divide-border/40">
				{#if availableTargets.length === 0}
					<p class="text-xs text-center py-6 text-text-secondary italic">
						Tidak ada anggota ditemukan.
					</p>
				{:else}
					{#each availableTargets as target (target.id)}
						<button
							type="button"
							class="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-surface-muted text-left transition-colors group cursor-pointer"
							onclick={() => handleSelectTarget(target)}
						>
							<div class="flex items-center gap-3 min-w-0">
								<Avatar
									name={target.fullName}
									gender={target.gender}
									photoUrl={target.photoUrl}
									isDeceased={target.isDeceased}
									size="sm"
								/>
								<div class="min-w-0">
									<div class="text-sm font-bold text-text-primary truncate group-hover:text-blue-primary">
										{target.fullName}
									</div>
									<div class="text-xs text-text-secondary truncate">
										{target.domicile}
									</div>
								</div>
							</div>

							<span class="text-xs font-semibold text-blue-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
								Pilih
							</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}

	{#snippet actions()}
		<button
			type="button"
			class="px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-surface-muted text-text-primary transition-colors"
			onclick={onclose}
		>
			{UI_STRINGS.common.close}
		</button>
	{/snippet}
</Modal>
