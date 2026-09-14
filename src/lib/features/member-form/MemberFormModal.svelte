<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import RelationPicker from './RelationPicker.svelte';
	import type { Member, Gender, DatePrecision } from '$lib/schemas';
	import { compressProfilePhoto } from '$lib/domain/photo';
	import { MemberRepository } from '$lib/db/member-repository';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		open: boolean;
		memberToEdit?: Member;
		initialGender?: Gender;
		initialFatherId?: string;
		initialMotherId?: string;
		onclose: () => void;
		onsaved: (memberId: string) => void;
	}

	let {
		open,
		memberToEdit,
		initialGender,
		initialFatherId,
		initialMotherId,
		onclose,
		onsaved
	}: Props = $props();

	// State form sesuai urutan PRD §8.4
	let fullName = $state('');
	let gender = $state<Gender>('Laki-laki');
	let domicile = $state('');
	let photoUrl = $state<string | undefined>(undefined);

	// Tanggal Lahir
	let birthPrecision = $state<DatePrecision>('full');
	let birthDateValue = $state('');

	// Wafat
	let isDeceased = $state(false);
	let deathPrecision = $state<DatePrecision>('full');
	let deathDateValue = $state('');

	let occupation = $state('');
	let description = $state('');

	// Relasi
	let fatherId = $state<string | undefined>(undefined);
	let motherId = $state<string | undefined>(undefined);
	let spouseIds = $state<string[]>([]);
	let childrenIds = $state<string[]>([]);

	let showRelationSection = $state(false);
	let availableMembers = $state<Member[]>([]);
	let errorMessage = $state<string | null>(null);
	let isSaving = $state(false);
	let isDirty = $state(false);
	let showDiscardConfirm = $state(false);

	$effect(() => {
		if (open) {
			loadData();
		}
	});

	async function loadData() {
		try {
			availableMembers = await MemberRepository.getAllMembers();
			if (memberToEdit) {
				fullName = memberToEdit.fullName;
				gender = memberToEdit.gender;
				domicile = memberToEdit.domicile;
				photoUrl = memberToEdit.photoUrl;
				birthPrecision = memberToEdit.birthDate?.precision || 'full';
				birthDateValue = memberToEdit.birthDate?.value || '';
				isDeceased = memberToEdit.isDeceased;
				deathPrecision = memberToEdit.deathDate?.precision || 'full';
				deathDateValue = memberToEdit.deathDate?.value || '';
				occupation = memberToEdit.occupation || '';
				description = memberToEdit.description || '';

				// Muat relasi eksisting
				const rels = await MemberRepository.getMemberRelationships(memberToEdit.id);
				const father = rels.find(
					(r) => r.type === 'parent-child' && r.toMemberId === memberToEdit.id && r.role === 'father'
				);
				const mother = rels.find(
					(r) => r.type === 'parent-child' && r.toMemberId === memberToEdit.id && r.role === 'mother'
				);
				const spouses = rels
					.filter((r) => r.type === 'spouse' && r.fromMemberId === memberToEdit.id)
					.map((r) => r.toMemberId);
				const children = rels
					.filter((r) => r.type === 'parent-child' && r.fromMemberId === memberToEdit.id)
					.map((r) => r.toMemberId);

				fatherId = father?.fromMemberId;
				motherId = mother?.fromMemberId;
				spouseIds = spouses;
				childrenIds = children;
			} else {
				// Reset form baru
				fullName = '';
				gender = initialGender || 'Laki-laki';
				domicile = '';
				photoUrl = undefined;
				birthPrecision = 'full';
				birthDateValue = '';
				isDeceased = false;
				deathPrecision = 'full';
				deathDateValue = '';
				occupation = '';
				description = '';
				fatherId = initialFatherId;
				motherId = initialMotherId;
				spouseIds = [];
				childrenIds = [];
			}
			isDirty = false;
			errorMessage = null;
		} catch (err) {
			console.error(err);
		}
	}

	async function handlePhotoUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Kompresi WebP max 400x400 dan <=100KB (PRD §6)
		const compressed = await compressProfilePhoto(file);
		if (compressed) {
			photoUrl = compressed;
			isDirty = true;
		} else {
			// Fallback tanpa foto jika proses kompresi gagal
			errorMessage = 'Foto tidak dapat diproses. Anda tetap dapat menyimpan profil tanpa foto.';
		}
	}

	function handleCloseRequest() {
		if (isDirty) {
			showDiscardConfirm = true;
		} else {
			onclose();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMessage = null;

		if (!fullName.trim()) {
			errorMessage = 'Nama lengkap wajib diisi.';
			return;
		}
		if (!domicile.trim()) {
			errorMessage = 'Domisili wajib diisi.';
			return;
		}

		isSaving = true;
		try {
			const savedId = await MemberRepository.saveMemberWithRelations(
				{
					id: memberToEdit?.id,
					fullName: fullName.trim(),
					gender,
					domicile: domicile.trim(),
					photoUrl,
					birthDate: birthDateValue
						? { precision: birthPrecision, value: birthDateValue }
						: undefined,
					isDeceased,
					deathDate:
						isDeceased && deathDateValue
							? { precision: deathPrecision, value: deathDateValue }
							: undefined,
					occupation: occupation.trim() || undefined,
					description: description.trim() || undefined
				},
				{
					fatherId,
					motherId,
					spouseIds,
					childrenIds
				}
			);
			isDirty = false;
			onsaved(savedId);
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.';
		} finally {
			isSaving = false;
		}
	}
</script>

<Modal
	{open}
	title={memberToEdit ? `Edit: ${memberToEdit.fullName}` : 'Tambah Anggota'}
	maxWidth="max-w-2xl"
	onclose={handleCloseRequest}
>
	{#if errorMessage}
		<div class="mb-4 p-3 bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm rounded-[var(--radius-md)] border border-[var(--color-danger)]/30">
			{errorMessage}
		</div>
	{/if}

	<form id="member-form" onsubmit={handleSubmit} class="space-y-5">
		<!-- 1. Foto -->
		<div>
			<label for="profile-photo-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.photo} (WebP / JPG / PNG)
			</label>
			<div class="flex items-center gap-4">
				{#if photoUrl}
					<div class="w-14 h-14 rounded-full overflow-hidden border border-[var(--color-border)]">
						<img src={photoUrl} alt="Preview" class="w-full h-full object-cover" />
					</div>
					<button
						type="button"
						class="text-xs text-[var(--color-danger)] hover:underline"
						onclick={() => { photoUrl = undefined; isDirty = true; }}
					>
						Hapus Foto
					</button>
				{/if}
				<input
					id="profile-photo-input"
					type="file"
					accept="image/*"
					onchange={handlePhotoUpload}
					class="text-xs text-[var(--color-text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-sm)] file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-surface-muted)] file:text-[var(--color-text-primary)] hover:file:bg-[var(--color-blue-tint)]"
				/>
			</div>
		</div>

		<!-- 2. Nama Lengkap -->
		<div>
			<label for="member-fullname-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.fullName} *
			</label>
			<input
				id="member-fullname-input"
				type="text"
				bind:value={fullName}
				oninput={() => (isDirty = true)}
				required
				class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
				placeholder="Contoh: Ahmad Yani"
			/>
		</div>

		<!-- 3. Jenis Kelamin (Dua tombol eksplisit - PRD §8.4) -->
		<div>
			<span class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.gender} *
			</span>
			<div class="grid grid-cols-2 gap-2">
				<button
					type="button"
					class="py-2 px-3 text-sm font-semibold rounded-[var(--radius-md)] border transition-colors {gender === 'Laki-laki'
						? 'bg-[var(--color-blue-tint)] text-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
						: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]'}"
					onclick={() => { gender = 'Laki-laki'; isDirty = true; }}
				>
					{UI_STRINGS.member.male}
				</button>
				<button
					type="button"
					class="py-2 px-3 text-sm font-semibold rounded-[var(--radius-md)] border transition-colors {gender === 'Perempuan'
						? 'bg-[var(--color-pink-tint)] text-[var(--color-pink-primary)] border-[var(--color-pink-primary)]'
						: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]'}"
					onclick={() => { gender = 'Perempuan'; isDirty = true; }}
				>
					{UI_STRINGS.member.female}
				</button>
			</div>
		</div>

		<!-- 4. Domisili -->
		<div>
			<label for="member-domicile-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.domicile} *
			</label>
			<input
				id="member-domicile-input"
				type="text"
				bind:value={domicile}
				oninput={() => (isDirty = true)}
				required
				class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
				placeholder="Contoh: Padang, Sumatera Barat"
			/>
		</div>

		<!-- 5. Tanggal Lahir (Presisi: Tanggal Lengkap atau Tahun Saja) -->
		<div>
			<label for="birth-date-value-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.birthDate}
			</label>
			<div class="flex gap-2 mb-2">
				<button
					type="button"
					class="px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] border {birthPrecision === 'full' ? 'bg-[var(--color-blue-primary)] text-white border-[var(--color-blue-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}"
					onclick={() => { birthPrecision = 'full'; isDirty = true; }}
				>
					Tanggal Lengkap
				</button>
				<button
					type="button"
					class="px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] border {birthPrecision === 'year' ? 'bg-[var(--color-blue-primary)] text-white border-[var(--color-blue-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}"
					onclick={() => { birthPrecision = 'year'; isDirty = true; }}
				>
					Tahun Saja
				</button>
			</div>
			{#if birthPrecision === 'full'}
				<input
					id="birth-date-value-input"
					type="date"
					bind:value={birthDateValue}
					oninput={() => (isDirty = true)}
					class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
				/>
			{:else}
				<input
					id="birth-date-value-input"
					type="number"
					min="1800"
					max="2100"
					placeholder="Contoh: 1980"
					bind:value={birthDateValue}
					oninput={() => (isDirty = true)}
					class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
				/>
			{/if}
		</div>

		<!-- 6. Status Wafat & Tanggal Wafat -->
		<div class="p-3 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={isDeceased}
					onchange={() => (isDirty = true)}
					class="checkbox checkbox-sm"
				/>
				<span class="text-sm font-semibold text-[var(--color-text-primary)]">{UI_STRINGS.member.isDeceased}</span>
			</label>

			{#if isDeceased}
				<div class="mt-3 pt-3 border-t border-[var(--color-border)]">
					<label for="death-date-value-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
						{UI_STRINGS.member.deathDate}
					</label>
					<div class="flex gap-2 mb-2">
						<button
							type="button"
							class="px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] border {deathPrecision === 'full' ? 'bg-[var(--color-blue-primary)] text-white border-[var(--color-blue-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}"
							onclick={() => { deathPrecision = 'full'; isDirty = true; }}
						>
							Tanggal Lengkap
						</button>
						<button
							type="button"
							class="px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] border {deathPrecision === 'year' ? 'bg-[var(--color-blue-primary)] text-white border-[var(--color-blue-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}"
							onclick={() => { deathPrecision = 'year'; isDirty = true; }}
						>
							Tahun Saja
						</button>
					</div>
					{#if deathPrecision === 'full'}
						<input
							id="death-date-value-input"
							type="date"
							bind:value={deathDateValue}
							oninput={() => (isDirty = true)}
							class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
						/>
					{:else}
						<input
							id="death-date-value-input"
							type="number"
							min="1800"
							max="2100"
							placeholder="Contoh: 2020"
							bind:value={deathDateValue}
							oninput={() => (isDirty = true)}
							class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
						/>
					{/if}
				</div>
			{/if}
		</div>

		<!-- 7. Pekerjaan -->
		<div>
			<label for="member-occupation-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.occupation}
			</label>
			<input
				id="member-occupation-input"
				type="text"
				bind:value={occupation}
				oninput={() => (isDirty = true)}
				class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
				placeholder="Contoh: Guru, Wiraswasta"
			/>
		</div>

		<!-- 8. Deskripsi -->
		<div>
			<label for="member-description-input" class="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
				{UI_STRINGS.member.description} (Maks 1.000 karakter)
			</label>
			<textarea
				id="member-description-input"
				rows="3"
				maxlength="1000"
				bind:value={description}
				oninput={() => (isDirty = true)}
				class="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-blue-primary)]"
				placeholder="Catatan tambahan seputar anggota keluarga ini..."
			></textarea>
		</div>

		<!-- 9. Bagian Relasi (Bisa dibuka/tutup) -->
		<div class="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
			<button
				type="button"
				class="w-full px-4 py-3 bg-[var(--color-surface-muted)] text-left flex items-center justify-between font-bold text-sm text-[var(--color-text-primary)]"
				onclick={() => (showRelationSection = !showRelationSection)}
			>
				<span>Hubungkan Relasi Keluarga</span>
				<span class="text-xs text-[var(--color-text-secondary)]">{showRelationSection ? '▲ Tutup' : '▼ Buka'}</span>
			</button>

			{#if showRelationSection}
				<div class="p-4 bg-[var(--color-surface)]">
					<RelationPicker
						currentMemberId={memberToEdit?.id}
						currentGender={gender}
						{availableMembers}
						bind:fatherId
						bind:motherId
						bind:spouseIds
						bind:childrenIds
						onchange={() => (isDirty = true)}
					/>
				</div>
			{/if}
		</div>
	</form>

	{#snippet actions()}
		<button
			type="button"
			class="px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] transition-colors"
			onclick={handleCloseRequest}
		>
			{UI_STRINGS.common.cancel}
		</button>
		<button
			type="submit"
			form="member-form"
			disabled={isSaving}
			class="px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] bg-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary-hover)] text-white transition-colors disabled:opacity-50"
		>
			{isSaving ? UI_STRINGS.common.loading : UI_STRINGS.common.save}
		</button>
	{/snippet}
</Modal>

<!-- Konfirmasi Buang Perubahan (PRD §8.4) -->
<ConfirmDialog
	open={showDiscardConfirm}
	title="Perubahan Belum Disimpan"
	message="Perubahan belum disimpan. Buang perubahan?"
	confirmText="Buang Perubahan"
	cancelText="Tetap Edit"
	isDanger={true}
	onconfirm={() => {
		showDiscardConfirm = false;
		isDirty = false;
		onclose();
	}}
	oncancel={() => {
		showDiscardConfirm = false;
	}}
/>
