<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { Member, Relationship } from '$lib/schemas';
	import { calculateAge } from '$lib/domain/age';
	import { canDeleteMember } from '$lib/domain/relations';
	import { MemberRepository } from '$lib/db/member-repository';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		open: boolean;
		memberId?: string;
		onclose: () => void;
		onedit: (member: Member) => void;
		onselectmember: (id: string) => void;
		ondeleted: () => void;
	}

	let { open, memberId, onclose, onedit, onselectmember, ondeleted }: Props = $props();

	let currentMember = $state<Member | null>(null);
	let relationships = $state<Relationship[]>([]);
	let allMembers = $state<Member[]>([]);

	let showDeleteConfirm = $state(false);
	let deleteErrorMessage = $state<string | null>(null);

	$effect(() => {
		if (open && memberId) {
			loadMemberData(memberId);
		}
	});

	async function loadMemberData(id: string) {
		try {
			const member = await MemberRepository.getMemberById(id);
			if (member) {
				currentMember = member;
				relationships = await MemberRepository.getMemberRelationships(id);
				allMembers = await MemberRepository.getAllMembers();
			} else {
				currentMember = null;
			}
			deleteErrorMessage = null;
		} catch (err) {
			console.error(err);
		}
	}

	// Hitung umur sesuai kriteria PRD §6
	let age = $derived(
		currentMember
			? calculateAge(
					currentMember.birthDate,
					currentMember.isDeceased,
					currentMember.deathDate
				)
			: null
	);

	// Cari objek anggota untuk relasi
	let father = $derived.by(() => {
		if (!currentMember) return undefined;
		const rel = relationships.find(
			(r) => r.type === 'parent-child' && r.toMemberId === currentMember?.id && r.role === 'father'
		);
		return rel ? allMembers.find((m) => m.id === rel.fromMemberId) : undefined;
	});

	let mother = $derived.by(() => {
		if (!currentMember) return undefined;
		const rel = relationships.find(
			(r) => r.type === 'parent-child' && r.toMemberId === currentMember?.id && r.role === 'mother'
		);
		return rel ? allMembers.find((m) => m.id === rel.fromMemberId) : undefined;
	});

	let spouses = $derived.by(() => {
		if (!currentMember) return [];
		const spouseRels = relationships.filter(
			(r) => r.type === 'spouse' && r.fromMemberId === currentMember?.id
		);
		return spouseRels
			.map((r) => allMembers.find((m) => m.id === r.toMemberId))
			.filter((m): m is Member => m !== undefined);
	});

	let children = $derived.by(() => {
		if (!currentMember) return [];
		const childRels = relationships.filter(
			(r) => r.type === 'parent-child' && r.fromMemberId === currentMember?.id
		);
		return childRels
			.map((r) => allMembers.find((m) => m.id === r.toMemberId))
			.filter((m): m is Member => m !== undefined);
	});

	function handleDeleteRequest() {
		if (!currentMember) return;
		const check = canDeleteMember(currentMember.id, relationships);
		if (!check.allowed) {
			deleteErrorMessage =
				'Anggota tidak dapat dihapus karena masih memiliki relasi aktif. Lepaskan semua relasi terlebih dahulu dari menu Edit.';
			return;
		}
		showDeleteConfirm = true;
	}

	async function confirmDelete() {
		if (!currentMember) return;
		try {
			await MemberRepository.deleteMember(currentMember.id);
			showDeleteConfirm = false;
			ondeleted();
			onclose();
		} catch (err: unknown) {
			deleteErrorMessage = err instanceof Error ? err.message : 'Gagal menghapus anggota.';
		}
	}
</script>

<Modal {open} title={UI_STRINGS.common.detail} maxWidth="max-w-xl" onclose={onclose}>
	{#if currentMember}
		<div class="space-y-6">
			<!-- Pesan Error jika hapus ditolak -->
			{#if deleteErrorMessage}
				<div class="p-3 bg-danger/10 text-danger text-sm rounded-md border border-danger/30">
					{deleteErrorMessage}
				</div>
			{/if}

			<!-- Urutan PRD §8.3: 1. Foto/inisial dan nama -->
			<div class="flex items-center gap-4">
				<Avatar
					name={currentMember.fullName}
					gender={currentMember.gender}
					photoUrl={currentMember.photoUrl}
					isDeceased={currentMember.isDeceased}
					size="lg"
				/>
				<div class="flex-1 min-w-0">
					<h2 class="text-xl md:text-2xl font-extrabold text-text-primary truncate">
						{currentMember.fullName}
					</h2>
					<p class="text-xs text-text-secondary mt-0.5">
						{currentMember.domicile}
					</p>

					<!-- 2. Status wafat & Gender badges -->
					<div class="flex items-center gap-2 mt-2">
						<Badge variant={currentMember.gender === 'Laki-laki' ? 'male' : 'female'}>
							{currentMember.gender}
						</Badge>

						{#if currentMember.isDeceased}
							<Badge variant="neutral">
								{UI_STRINGS.member.deceasedBadge}
							</Badge>
						{/if}
					</div>
				</div>
			</div>

			<!-- 3. Data Dasar (Tanggal Lahir, Usia, Pekerjaan) -->
			<div class="grid grid-cols-2 gap-3 p-4 bg-surface-muted rounded-md border border-border text-xs">
				<div>
					<span class="block text-text-secondary font-medium">
						{UI_STRINGS.member.birthDate}
					</span>
					<span class="font-bold text-text-primary">
						{currentMember.birthDate ? currentMember.birthDate.value : '—'}
					</span>
				</div>

				{#if currentMember.isDeceased}
					<div>
						<span class="block text-text-secondary font-medium">
							{UI_STRINGS.member.deathDate}
						</span>
						<span class="font-bold text-text-primary">
							{currentMember.deathDate ? currentMember.deathDate.value : '—'}
						</span>
					</div>
				{/if}

				{#if age !== null}
					<div>
						<span class="block text-text-secondary font-medium">
							{currentMember.isDeceased ? 'Usia saat wafat' : UI_STRINGS.member.age}
						</span>
						<span class="font-bold text-text-primary">
							{age} {UI_STRINGS.member.yearsOld}
						</span>
					</div>
				{/if}

				{#if currentMember.occupation}
					<div>
						<span class="block text-text-secondary font-medium">
							{UI_STRINGS.member.occupation}
						</span>
						<span class="font-bold text-text-primary">
							{currentMember.occupation}
						</span>
					</div>
				{/if}
			</div>

			<!-- 4. Deskripsi -->
			{#if currentMember.description}
				<div>
					<h4 class="text-xs font-semibold text-text-secondary mb-1">
						{UI_STRINGS.member.description}
					</h4>
					<p class="text-sm text-text-primary leading-relaxed bg-surface p-3 rounded-md border border-border">
						{currentMember.description}
					</p>
				</div>
			{/if}

			<!-- 5. Relasi (Klik nama membuka detail mereka - PRD §8.3) -->
			<div class="space-y-4 pt-2 border-t border-border">
				<h4 class="text-sm font-bold text-text-primary">
					Relasi Keluarga
				</h4>

				<!-- Orang Tua -->
				<div class="grid grid-cols-2 gap-3">
					<div class="p-3 border border-border rounded-md">
						<span class="block text-xs font-semibold text-text-secondary mb-1">
							{UI_STRINGS.relations.father}
						</span>
						{#if father}
							<button
								type="button"
								class="text-sm font-bold text-blue-primary hover:underline text-left block truncate"
								onclick={() => onselectmember(father!.id)}
							>
								{father.fullName}
							</button>
						{:else}
							<span class="text-xs text-text-secondary italic">—</span>
						{/if}
					</div>

					<div class="p-3 border border-border rounded-md">
						<span class="block text-xs font-semibold text-text-secondary mb-1">
							{UI_STRINGS.relations.mother}
						</span>
						{#if mother}
							<button
								type="button"
								class="text-sm font-bold text-pink-primary hover:underline text-left block truncate"
								onclick={() => onselectmember(mother!.id)}
							>
								{mother.fullName}
							</button>
						{:else}
							<span class="text-xs text-text-secondary italic">—</span>
						{/if}
					</div>
				</div>

				<!-- Pasangan -->
				<div class="p-3 border border-border rounded-md">
					<span class="block text-xs font-semibold text-text-secondary mb-2">
						{UI_STRINGS.relations.spouse}
					</span>
					{#if spouses.length === 0}
						<span class="text-xs text-text-secondary italic">—</span>
					{:else}
						<div class="flex flex-wrap gap-2">
							{#each spouses as spouse}
								<button
									type="button"
									class="px-2.5 py-1 text-xs font-bold rounded-sm border border-border hover:bg-surface-muted text-text-primary transition-colors"
									onclick={() => onselectmember(spouse.id)}
								>
									{spouse.fullName}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Anak -->
				<div class="p-3 border border-border rounded-md">
					<span class="block text-xs font-semibold text-text-secondary mb-2">
						{UI_STRINGS.relations.children}
					</span>
					{#if children.length === 0}
						<span class="text-xs text-text-secondary italic">—</span>
					{:else}
						<div class="flex flex-wrap gap-2">
							{#each children as child}
								<button
									type="button"
									class="px-2.5 py-1 text-xs font-bold rounded-sm border border-border hover:bg-surface-muted text-text-primary transition-colors"
									onclick={() => onselectmember(child.id)}
								>
									{child.fullName}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#snippet actions()}
		<div class="flex items-center justify-between w-full">
			<button
				type="button"
				class="px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 rounded-md transition-colors"
				onclick={handleDeleteRequest}
			>
				{UI_STRINGS.common.delete}
			</button>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-surface-muted text-text-primary transition-colors"
					onclick={onclose}
				>
					{UI_STRINGS.common.close}
				</button>
				{#if currentMember}
					<button
						type="button"
						class="px-4 py-2 text-xs font-semibold rounded-md bg-blue-primary text-white hover:bg-blue-primary-hover transition-colors"
						onclick={() => onedit(currentMember!)}
					>
						{UI_STRINGS.common.edit}
					</button>
				{/if}
			</div>
		</div>
	{/snippet}
</Modal>

<!-- Konfirmasi Hapus Anggota Bebas Relasi -->
<ConfirmDialog
	open={showDeleteConfirm}
	title={`Hapus Anggota: ${currentMember?.fullName || ''}`}
	message="Tindakan ini akan menghapus anggota ini secara permanen dari basis data lokal."
	confirmText="Hapus Permanen"
	cancelText="Batal"
	isDanger={true}
	onconfirm={confirmDelete}
	oncancel={() => (showDeleteConfirm = false)}
/>
