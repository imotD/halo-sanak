<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import {
		exportDatabaseToJSON,
		parseAndValidateBackupFile,
		replaceDatabaseWithSnapshot,
		clearAllLocalData
	} from './data-backup';
	import type { ExportFile } from '$lib/schemas';
	import { UI_STRINGS } from '$lib/strings';

	interface Props {
		open: boolean;
		onclose: () => void;
		ondataimported: (count: number) => void;
		ondatacleared: () => void;
		showToast: (msg: string) => void;
	}

	let { open, onclose, ondataimported, ondatacleared, showToast }: Props = $props();

	let isProcessing = $state(false);
	let errorMessage = $state<string | null>(null);

	// State Import flow
	let pendingSnapshot = $state<ExportFile | null>(null);
	let pendingFilename = $state<string>('');
	let showImportConfirm = $state(false);

	// State Clear all flow
	let showClearConfirm = $state(false);

	async function handleExport() {
		errorMessage = null;
		isProcessing = true;
		try {
			const { filename, memberCount } = await exportDatabaseToJSON();
			showToast(`Export berhasil (${memberCount} anggota): ${filename}`);
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Gagal mengekspor data.';
		} finally {
			isProcessing = false;
		}
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		errorMessage = null;
		isProcessing = true;
		try {
			// Validasi Zod file tanpa menyentuh data lokal (PRD §8.5)
			const snapshot = await parseAndValidateBackupFile(file);
			pendingSnapshot = snapshot;
			pendingFilename = file.name;
			showImportConfirm = true;
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : UI_STRINGS.errors.importFailed;
		} finally {
			isProcessing = false;
			target.value = ''; // Reset input
		}
	}

	async function confirmImport() {
		if (!pendingSnapshot) return;
		errorMessage = null;
		isProcessing = true;
		try {
			const count = await replaceDatabaseWithSnapshot(pendingSnapshot);
			showImportConfirm = false;
			pendingSnapshot = null;
			ondataimported(count);
			onclose();
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Gagal memproses import snapshot.';
		} finally {
			isProcessing = false;
		}
	}

	async function confirmClearAll() {
		errorMessage = null;
		isProcessing = true;
		try {
			await clearAllLocalData();
			showClearConfirm = false;
			ondatacleared();
			onclose();
			showToast('Seluruh data lokal berhasil dibersihkan.');
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Gagal membersihkan data.';
		} finally {
			isProcessing = false;
		}
	}
</script>

<Modal {open} title="Pengaturan & Data" maxWidth="max-w-md" onclose={onclose}>
	<div class="space-y-6">
		{#if errorMessage}
			<div class="p-3 bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-xs rounded-[var(--radius-md)] border border-[var(--color-danger)]/30">
				{errorMessage}
			</div>
		{/if}

		<!-- 1. Export JSON -->
		<div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-2">
			<div class="flex items-center justify-between">
				<div>
					<h4 class="text-sm font-bold text-[var(--color-text-primary)]">
						{UI_STRINGS.settings.exportJSON}
					</h4>
					<p class="text-xs text-[var(--color-text-secondary)] mt-0.5">
						Unduh seluruh silsilah keluarga dan foto profil sebagai cadangan JSON.
					</p>
				</div>
			</div>
			<button
				type="button"
				disabled={isProcessing}
				class="w-full mt-2 py-2 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--color-blue-primary)] text-white hover:bg-[var(--color-blue-primary-hover)] transition-colors disabled:opacity-50"
				onclick={handleExport}
			>
				{isProcessing ? 'Memproses...' : 'Unduh Cadangan JSON'}
			</button>
		</div>

		<!-- 2. Import JSON -->
		<div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-2">
			<div>
				<h4 class="text-sm font-bold text-[var(--color-text-primary)]">
					{UI_STRINGS.settings.importJSON}
				</h4>
				<p class="text-xs text-[var(--color-text-secondary)] mt-0.5">
					Pulihkan atau pindahkan pohon keluarga dari file JSON cadangan.
				</p>
			</div>
			<label
				class="block w-full mt-2 py-2 px-3 text-center text-xs font-bold rounded-[var(--radius-md)] border border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] hover:bg-[var(--color-blue-tint)] transition-colors cursor-pointer {isProcessing ? 'opacity-50 pointer-events-none' : ''}"
			>
				<span>Pilih File Cadangan JSON</span>
				<input
					type="file"
					accept=".json,application/json"
					class="hidden"
					onchange={handleFileSelect}
					disabled={isProcessing}
				/>
			</label>
		</div>

		<!-- 3. Hapus Semua Data (Destruktif) -->
		<div class="p-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 space-y-2">
			<div>
				<h4 class="text-sm font-bold text-[var(--color-danger)]">
					{UI_STRINGS.settings.clearAll}
				</h4>
				<p class="text-xs text-[var(--color-text-secondary)] mt-0.5">
					Hapus seluruh anggota dan pohon keluarga di perangkat ini secara permanen.
				</p>
			</div>
			<button
				type="button"
				disabled={isProcessing}
				class="w-full mt-2 py-2 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
				onclick={() => (showClearConfirm = true)}
			>
				Hapus Semua Data Lokal
			</button>
		</div>
	</div>

	{#snippet actions()}
		<button
			type="button"
			class="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]"
			onclick={onclose}
		>
			{UI_STRINGS.common.close}
		</button>
	{/snippet}
</Modal>

<!-- Konfirmasi Import JSON (PRD §8.5: Peringatan tegas hapus seluruh data lama) -->
<ConfirmDialog
	open={showImportConfirm}
	title="Konfirmasi Import Data"
	message={`File "${pendingFilename}" siap dimuat dengan ${pendingSnapshot?.members.length || 0} anggota keluarga. PERINGATAN: Tindakan ini secara sengaja akan MENGHAPUS SEMUA DATA LOKAL LAMA dan menggantinya secara penuh.`}
	confirmText="Hapus & Ganti Data"
	cancelText="Batal"
	isDanger={true}
	onconfirm={confirmImport}
	oncancel={() => {
		showImportConfirm = false;
		pendingSnapshot = null;
	}}
/>

<!-- Konfirmasi Clear All (PRD §8.5) -->
<ConfirmDialog
	open={showClearConfirm}
	title={UI_STRINGS.settings.confirmClearTitle}
	message={`${UI_STRINGS.settings.confirmClearWarning} Disarankan untuk mengunduh cadangan (Export JSON) terlebih dahulu sebelum melanjutkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	isDanger={true}
	onconfirm={confirmClearAll}
	oncancel={() => (showClearConfirm = false)}
/>
