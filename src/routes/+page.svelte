<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import MemberList from '$lib/features/members/MemberList.svelte';
	import MemberFormModal from '$lib/features/member-form/MemberFormModal.svelte';
	import MemberDetailModal from '$lib/features/member-detail/MemberDetailModal.svelte';
	import { MemberRepository } from '$lib/db/member-repository';
	import type { Member } from '$lib/schemas';
	import { UI_STRINGS } from '$lib/strings';

	// Navigasi Tab: 'tree' | 'members' | 'settings'
	let currentTab = $state<'tree' | 'members' | 'settings'>('members');
	let members = $state<Member[]>([]);

	// State Modal Detail & Form
	let selectedMemberId = $state<string | undefined>(undefined);
	let showDetailModal = $state(false);

	let showFormModal = $state(false);
	let memberToEdit = $state<Member | undefined>(undefined);

	// Feedback toast
	let toastMessage = $state<string | null>(null);

	async function refreshData() {
		try {
			members = await MemberRepository.getAllMembers();
		} catch (err) {
			console.error(err);
		}
	}

	onMount(() => {
		refreshData();
	});

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			toastMessage = null;
		}, 2500);
	}

	function openAddModal() {
		memberToEdit = undefined;
		showFormModal = true;
	}

	function openEditModal(member: Member) {
		showDetailModal = false;
		memberToEdit = member;
		showFormModal = true;
	}

	function openDetail(id: string) {
		selectedMemberId = id;
		showDetailModal = true;
	}
</script>

<div class="min-h-screen flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
	<!-- Header Sticky -->
	<header class="sticky top-0 z-20 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
		<div class="flex items-center gap-6">
			<div>
				<h1 class="text-lg font-extrabold text-[var(--color-text-primary)] tracking-tight">
					{UI_STRINGS.appName}
				</h1>
			</div>

			<!-- Desktop Nav Tabs -->
			<nav class="hidden md:flex items-center gap-2 text-sm font-semibold">
				<button
					type="button"
					class="px-3 py-1.5 rounded-[var(--radius-md)] transition-colors {currentTab === 'members'
						? 'bg-[var(--color-blue-tint)] text-[var(--color-blue-primary)]'
						: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
					onclick={() => (currentTab = 'members')}
				>
					{UI_STRINGS.nav.members} ({members.length})
				</button>
				<button
					type="button"
					class="px-3 py-1.5 rounded-[var(--radius-md)] transition-colors {currentTab === 'tree'
						? 'bg-[var(--color-blue-tint)] text-[var(--color-blue-primary)]'
						: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
					onclick={() => (currentTab = 'tree')}
				>
					{UI_STRINGS.nav.tree}
				</button>
			</nav>
		</div>

		<div class="flex items-center gap-2">
			<ThemeToggle />
			<button
				type="button"
				class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-blue-primary)] text-white text-xs font-bold hover:bg-[var(--color-blue-primary-hover)] transition-colors shadow-sm"
				onclick={openAddModal}
			>
				+ {UI_STRINGS.nav.add}
			</button>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-24 md:pb-8">
		{#if currentTab === 'members'}
			<MemberList
				{members}
				onselectmember={openDetail}
				onaddclick={openAddModal}
			/>
		{:else if currentTab === 'tree'}
			<!-- Placeholder Sprint 3 Pohon -->
			<div class="py-20 text-center space-y-3">
				<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-blue-tint)] text-[var(--color-blue-primary)] mb-2">
					<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.75"
							d="M4 6h16M4 12h8m-8 6h16"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-bold text-[var(--color-text-primary)]">
					Visualisasi Pohon Keluarga SVG
				</h3>
				<p class="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
					Fitur tampilan pohon interaktif d3-zoom siap dibangun pada Sprint 3.
				</p>
			</div>
		{/if}
	</main>

	<!-- Toast Feedback -->
	{#if toastMessage}
		<div class="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-success)] text-white text-xs font-bold shadow-lg transition-transform duration-200">
			{toastMessage}
		</div>
	{/if}

	<!-- Mobile Floating Action Button (FAB) Tambah -->
	<button
		type="button"
		class="md:hidden fixed bottom-18 right-4 z-30 w-12 h-12 rounded-full bg-[var(--color-blue-primary)] text-white flex items-center justify-center shadow-lg active:scale-95"
		onclick={openAddModal}
		aria-label="Tambah Anggota"
	>
		<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
	</button>

	<!-- Mobile Bottom Navigation (PRD §10) -->
	<nav class="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around py-2 px-4 shadow-sm">
		<button
			type="button"
			class="flex flex-col items-center gap-0.5 text-xs font-semibold {currentTab === 'members'
				? 'text-[var(--color-blue-primary)]'
				: 'text-[var(--color-text-secondary)]'}"
			onclick={() => (currentTab = 'members')}
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<span>{UI_STRINGS.nav.members}</span>
		</button>

		<button
			type="button"
			class="flex flex-col items-center gap-0.5 text-xs font-semibold {currentTab === 'tree'
				? 'text-[var(--color-blue-primary)]'
				: 'text-[var(--color-text-secondary)]'}"
			onclick={() => (currentTab = 'tree')}
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h8m-8 6h16"
				/>
			</svg>
			<span>{UI_STRINGS.nav.tree}</span>
		</button>
	</nav>

	<!-- Modal Tambah / Edit Anggota -->
	<MemberFormModal
		open={showFormModal}
		{memberToEdit}
		onclose={() => (showFormModal = false)}
		onsaved={async () => {
			showFormModal = false;
			await refreshData();
			showToast(UI_STRINGS.success.saved);
		}}
	/>

	<!-- Modal Detail Anggota -->
	<MemberDetailModal
		open={showDetailModal}
		memberId={selectedMemberId}
		onclose={() => (showDetailModal = false)}
		onedit={openEditModal}
		onselectmember={(id) => {
			selectedMemberId = id;
		}}
		ondeleted={async () => {
			showDetailModal = false;
			await refreshData();
			showToast(UI_STRINGS.success.deleted);
		}}
	/>
</div>
