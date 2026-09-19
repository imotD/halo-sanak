<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import {
		exportDatabaseToJSON,
		parseAndValidateBackupFile,
		replaceDatabaseWithSnapshot,
		clearAllLocalData
	} from './data-backup';
	import { SAMPLE_FAMILY_SNAPSHOT } from './sample-data';
	import { MemberRepository } from '$lib/db/member-repository';
	import { getUpcomingEvents, type UpcomingEvent } from '$lib/domain/reminders';
	import {
		isNotificationSupported,
		getNotificationPermissionStatus,
		isNotificationEnabled,
		setNotificationEnabled,
		requestNotificationPermission,
		notifyTodayEvents
	} from '$lib/services/notifications';
	import type { ExportFile, Member } from '$lib/schemas';
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
	let successMessage = $state<string | null>(null);

	// Upcoming events state (PRD v2 §2.3)
	let upcomingEvents = $state<UpcomingEvent[]>([]);
	let notifEnabled = $state(false);
	let notifSupported = $state(false);
	let notifPermission = $state<NotificationPermission | 'unsupported'>('default');

	let eventsVersion = 0;
	let eventsLoading = $state(false);
	let eventsError = $state(false);

	$effect(() => {
		const version = ++eventsVersion;
		if (open) {
			void loadUpcomingEvents(version);
			checkNotifStatus();
		}
		return () => { eventsVersion++; };
	});

	function resumeNotifications() {
		if (open && document.visibilityState === 'visible') {
			checkNotifStatus();
			void loadUpcomingEvents(++eventsVersion);
		}
	}

	function checkNotifStatus() {
		notifSupported = isNotificationSupported();
		notifPermission = getNotificationPermissionStatus();
		notifEnabled = isNotificationEnabled();
	}

	let notifBusy = $state(false);

	async function handleToggleNotif(e: Event) {
		const target = e.target as HTMLInputElement;
		if (notifBusy) return;
		const shouldEnable = target.checked;
		notifBusy = true;
		errorMessage = null;
		successMessage = null;
		try {
			if (shouldEnable && getNotificationPermissionStatus() !== 'granted') {
				notifPermission = await requestNotificationPermission();
			}
			if (shouldEnable && getNotificationPermissionStatus() !== 'granted') {
				errorMessage = UI_STRINGS.settings.permissionMissing;
			} else if (!setNotificationEnabled(shouldEnable)) {
				errorMessage = UI_STRINGS.errors.notificationStorage;
			} else {
				const msg = shouldEnable ? UI_STRINGS.settings.notificationsEnabled : UI_STRINGS.settings.notificationsDisabled;
				successMessage = msg;
				showToast(msg);
			}
			checkNotifStatus();
			target.checked = notifEnabled;
			if (notifEnabled) {
				const members = await MemberRepository.getAllMembers();
				const freshEvents = getUpcomingEvents(members, new Date(), 7);
				upcomingEvents = freshEvents;
				await notifyTodayEvents(freshEvents);
			}
		} finally {
			notifBusy = false;
		}
	}

	async function loadUpcomingEvents(version: number) {
		eventsLoading = true;
		eventsError = false;
		try {
			const members = await MemberRepository.getAllMembers();
			if (version !== eventsVersion) return;
			upcomingEvents = getUpcomingEvents(members, new Date(), 7);
		} catch {
			if (version === eventsVersion) eventsError = true;
		} finally {
			if (version === eventsVersion) eventsLoading = false;
		}
	}

	// State Import flow
	let pendingSnapshot = $state<ExportFile | null>(null);
	let pendingFilename = $state<string>('');
	let showImportConfirm = $state(false);

	// State Clear all flow
	let showClearConfirm = $state(false);

	async function handleExport() {
		errorMessage = null;
		successMessage = null;
		isProcessing = true;
		try {
			const { filename, memberCount } = await exportDatabaseToJSON();
			const msg = `Export berhasil (${memberCount} anggota): ${filename}`;
			successMessage = msg;
			showToast(msg);
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

	function handleLoadSample() {
		errorMessage = null;
		pendingSnapshot = SAMPLE_FAMILY_SNAPSHOT;
		pendingFilename = 'Data Contoh Silsilah 3 Generasi';
		showImportConfirm = true;
	}

	async function confirmImport() {
		if (!pendingSnapshot || isProcessing) return;
		errorMessage = null;
		isProcessing = true;
		try {
			const count = await replaceDatabaseWithSnapshot(pendingSnapshot);
			showImportConfirm = false;
			pendingSnapshot = null;
			ondataimported(count);
			onclose();
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Gagal memproses snapshot data.';
		} finally {
			isProcessing = false;
		}
	}

	async function confirmClearAll() {
		if (isProcessing) return;
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

<svelte:document onvisibilitychange={resumeNotifications} />
<Modal {open} title="Pengaturan & Data" maxWidth="max-w-md" onclose={() => { if (!isProcessing && !notifBusy) onclose(); }}>
	<div class="space-y-5">
		{#if errorMessage}
			<div class="p-3 bg-danger/10 text-danger text-xs rounded-md border border-danger/30">
				{errorMessage}
			</div>
		{/if}
		{#if successMessage}
			<div class="p-3 bg-success/10 text-success text-xs rounded-md border border-success/30 font-medium">
				{successMessage}
			</div>
		{/if}

		<!-- 0. Peringatan & Pengingat (PRD v2 §2.3) -->
		<div class="p-4 rounded-md bg-surface border border-border space-y-3 shadow-card">
			<div class="flex items-center justify-between">
				<div>
					<h4 class="text-sm font-bold text-text-primary">
						{UI_STRINGS.settings.remindersTitle}
					</h4>
					<p class="text-xs text-text-secondary mt-0.5">
						{UI_STRINGS.settings.remindersSubtitle}
					</p>
				</div>

				{#if notifSupported}
					<label class="flex items-center gap-2 cursor-pointer select-none">
						<span class="sr-only">{UI_STRINGS.settings.enableNotifications}</span>
						<input
							type="checkbox"
							disabled={notifBusy || isProcessing}
							checked={notifEnabled}
							onchange={handleToggleNotif}
							aria-label={UI_STRINGS.settings.enableNotifications}
							class="toggle toggle-sm toggle-primary"
						/>
					</label>
				{/if}
			</div>

			{#if notifSupported}
				<div class="p-2.5 bg-surface-muted rounded-md border border-border text-[11px] text-text-secondary leading-relaxed">
					{UI_STRINGS.settings.notificationsDisclaimer}
					{#if notifPermission === 'denied'}
						<span class="block text-danger font-semibold mt-1">
							Izin notifikasi diblokir di pengaturan peramban Anda.
						</span>
					{/if}
				</div>
			{:else}
				<div class="p-2.5 bg-surface-muted rounded-md border border-border text-[11px] text-text-secondary leading-relaxed">
					{UI_STRINGS.settings.notificationsUnsupported}
				</div>
			{/if}

			{#if eventsLoading}
				<p role="status">{UI_STRINGS.common.loading}</p>
			{:else if eventsError}
				<p role="alert">{UI_STRINGS.errors.loadFailed}</p>
			{:else if upcomingEvents.length === 0}
				<p class="text-xs text-text-secondary italic py-2">
					{UI_STRINGS.settings.noUpcomingEvents}
				</p>
			{:else}
				<div class="space-y-2 max-h-48 overflow-y-auto divide-y divide-border/40">
					{#each upcomingEvents as event}
						<div class="flex items-center justify-between pt-2 first:pt-0">
							<div class="flex items-center gap-2.5 min-w-0">
								<Avatar
									name={event.memberName}
									gender={event.gender}
									photoUrl={event.photoUrl}
									isDeceased={event.type !== 'birthday'}
									size="sm"
								/>
								<div class="min-w-0">
									<span class="text-xs font-bold text-text-primary truncate block">
										{event.memberName}
									</span>
									<span class="text-[11px] text-text-secondary block">
										{event.label} ({event.dateFormatted})
									</span>
								</div>
							</div>

							<div class="shrink-0 ml-2">
								<Badge variant={event.daysRemaining === 0 ? 'success' : 'neutral'}>
									{event.daysRemaining === 0 ? 'Hari Ini' : `${event.daysRemaining} hari`}
								</Badge>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- 1. Export JSON -->
		<div class="p-4 rounded-md bg-surface-muted border border-border space-y-2">
			<div>
				<h4 class="text-sm font-bold text-text-primary">
					{UI_STRINGS.settings.exportJSON}
				</h4>
				<p class="text-xs text-text-secondary mt-0.5">
					Unduh seluruh silsilah keluarga dan foto profil sebagai cadangan JSON.
				</p>
			</div>
			<button
				type="button"
				disabled={isProcessing}
				class="w-full mt-2 py-2 px-3 text-xs font-bold rounded-md bg-blue-primary text-white hover:bg-blue-primary-hover transition-colors disabled:opacity-50"
				onclick={handleExport}
			>
				{isProcessing ? 'Memproses...' : 'Unduh Cadangan JSON'}
			</button>
		</div>

		<!-- 2. Import JSON (Murni file input) -->
		<div class="p-4 rounded-md bg-surface-muted border border-border space-y-2">
			<div>
				<h4 class="text-sm font-bold text-text-primary">
					{UI_STRINGS.settings.importJSON}
				</h4>
				<p class="text-xs text-text-secondary mt-0.5">
					Pulihkan atau pindahkan pohon keluarga dari file JSON cadangan.
				</p>
			</div>
			<label
				class="block w-full mt-2 py-2 px-3 text-center text-xs font-bold rounded-md border border-blue-primary text-blue-primary hover:bg-blue-tint transition-colors cursor-pointer {isProcessing ? 'opacity-50 pointer-events-none' : ''}"
			>
				<span>Pilih File JSON Cadangan</span>
				<input
					type="file"
					accept=".json,application/json"
					class="hidden"
					onchange={handleFileSelect}
					disabled={isProcessing}
				/>
			</label>
		</div>

		<!-- 3. Data Contoh / Demo (Seksi terpisah) -->
		<div class="p-4 rounded-md bg-surface-muted border border-border space-y-2">
			<div>
				<h4 class="text-sm font-bold text-text-primary">
					Data Contoh Keluarga (Demo)
				</h4>
				<p class="text-xs text-text-secondary mt-0.5">
					Muat contoh silsilah keluarga 3 generasi (6 anggota) untuk melihat tampilan visualisasi pohon secara instan.
				</p>
			</div>
			<button
				type="button"
				disabled={isProcessing}
				class="w-full mt-2 py-2 px-3 text-xs font-semibold rounded-md border border-border hover:bg-surface text-text-primary transition-colors disabled:opacity-50"
				onclick={handleLoadSample}
			>
				Muat Contoh Keluarga
			</button>
		</div>

		<!-- 4. Hapus Semua Data (Destruktif) -->
		<div class="p-4 rounded-md border border-danger/30 bg-danger/5 space-y-2">
			<div>
				<h4 class="text-sm font-bold text-danger">
					{UI_STRINGS.settings.clearAll}
				</h4>
				<p class="text-xs text-text-secondary mt-0.5">
					Hapus seluruh anggota dan pohon keluarga di perangkat ini secara permanen.
				</p>
			</div>
			<button
				type="button"
				disabled={isProcessing}
				class="w-full mt-2 py-2 px-3 text-xs font-bold rounded-md bg-danger text-white hover:opacity-90 transition-opacity disabled:opacity-50"
				onclick={() => (showClearConfirm = true)}
			>
				Hapus Semua Data Lokal
			</button>
		</div>
	</div>

	{#snippet actions()}
		<button
			type="button"
			class="px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-surface-muted text-text-primary"
				disabled={isProcessing || notifBusy}
				onclick={onclose}
		>
			{UI_STRINGS.common.close}
		</button>
	{/snippet}
</Modal>

<!-- Konfirmasi Import JSON / Muat Contoh (PRD §8.5: Peringatan tegas hapus seluruh data lama) -->
<ConfirmDialog
	open={showImportConfirm}
	title="Konfirmasi Ganti Data"
	message={`"${pendingFilename}" siap dimuat dengan ${pendingSnapshot?.members.length || 0} anggota keluarga. PERINGATAN: Tindakan ini secara sengaja akan MENGHAPUS SEMUA DATA LOKAL LAMA dan menggantinya secara penuh.`}
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
