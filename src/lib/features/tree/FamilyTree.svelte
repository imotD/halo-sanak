<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3Zoom from 'd3-zoom';
	import * as d3Selection from 'd3-selection';
	import type { Member, Relationship } from '$lib/schemas';
	import { calculateTreeLayout, type TreeLayoutResult } from './tree-layout';
	import TreeCard from './TreeCard.svelte';
	import TreeControls from './TreeControls.svelte';

	interface Props {
		members: Member[];
		relationships: Relationship[];
		onselectmember: (id: string) => void;
	}

	let { members, relationships, onselectmember }: Props = $props();

	let svgElement = $state<SVGSVGElement | null>(null);
	let gElement = $state<SVGGElement | null>(null);
	let zoomBehavior: d3Zoom.ZoomBehavior<SVGSVGElement, unknown> | null = null;

	// Layout hasil kalkulasi
	let layout = $derived<TreeLayoutResult>(calculateTreeLayout(members, relationships));

	// Guard drag pan vs click singkat (PRD §8.1: drag pan tidak boleh buka modal detail)
	let pointerDownPos = { x: 0, y: 0, time: 0 };
	const DRAG_THRESHOLD_PX = 6;
	const CLICK_MAX_DURATION_MS = 250;

	function initZoom() {
		if (!svgElement || !gElement) return;

		const svg = d3Selection.select(svgElement);
		const g = d3Selection.select(gElement);

		if (!zoomBehavior) {
			zoomBehavior = d3Zoom
				.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.2, 2.5])
				.on('zoom', (event) => {
					g.attr('transform', event.transform.toString());
				});

			svg.call(zoomBehavior);
		}
	}

	onMount(() => {
		initZoom();
		requestAnimationFrame(() => {
			fitToScreen();
		});
	});

	// Re-center otomatis bila jumlah anggota/nodes berubah
	let prevNodeCount = $state(0);
	$effect(() => {
		const currentNodeCount = layout.nodes.length;
		if (currentNodeCount !== prevNodeCount) {
			prevNodeCount = currentNodeCount;
			if (currentNodeCount > 0) {
				initZoom();
				requestAnimationFrame(() => {
					fitToScreen();
				});
			}
		}
	});

	export function zoomIn() {
		initZoom();
		if (!svgElement || !zoomBehavior) return;
		d3Selection.select(svgElement).call(zoomBehavior.scaleBy, 1.3);
	}

	export function zoomOut() {
		initZoom();
		if (!svgElement || !zoomBehavior) return;
		d3Selection.select(svgElement).call(zoomBehavior.scaleBy, 1 / 1.3);
	}

	export function fitToScreen() {
		initZoom();
		if (!svgElement || !zoomBehavior || !gElement || layout.nodes.length === 0) return;

		const { width: containerWidth, height: containerHeight } = svgElement.getBoundingClientRect();
		if (containerWidth === 0 || containerHeight === 0) return;

		const { minX, maxX, minY, maxY, width: contentW, height: contentH } = layout.bounds;
		const padding = 80;

		const scaleX = (containerWidth - padding * 2) / Math.max(contentW, 100);
		const scaleY = (containerHeight - padding * 2) / Math.max(contentH, 100);
		let scale = Math.min(scaleX, scaleY, 1.1);
		scale = Math.max(scale, 0.25);

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;

		const tx = containerWidth / 2 - centerX * scale;
		const ty = containerHeight / 2 - centerY * scale;

		const transform = d3Zoom.zoomIdentity.translate(tx, ty).scale(scale);
		d3Selection.select(svgElement).call(zoomBehavior.transform, transform);
	}

	function handlePointerDown(e: PointerEvent) {
		pointerDownPos = {
			x: e.clientX,
			y: e.clientY,
			time: Date.now()
		};
	}

	function handleNodeClick(memberId: string, e: MouseEvent) {
		const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
		const duration = Date.now() - pointerDownPos.time;

		// Hanya trigger jika bukan drag pan
		if (dist < DRAG_THRESHOLD_PX && duration < CLICK_MAX_DURATION_MS) {
			onselectmember(memberId);
		}
	}
</script>

<div class="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[var(--radius-md)] select-none">
	<!-- Kanvas SVG D3-Zoom selalu berada di DOM agar zoom behavior & listener selalu siap -->
	<svg
		bind:this={svgElement}
		role="application"
		aria-label="Pohon Keluarga Interaktif"
		class="w-full h-full cursor-grab active:cursor-grabbing touch-none"
		onpointerdown={handlePointerDown}
	>
		<g bind:this={gElement}>
			<!-- Garis Penghubung (Edges) -->
			{#each layout.edges as edge (edge.id)}
				{#if edge.type === 'spouse'}
					<!-- Garis Pasangan (Horizontal putus-putus) -->
					<line
						x1={edge.fromX}
						y1={edge.fromY}
						x2={edge.toX}
						y2={edge.toY}
						stroke="var(--color-border)"
						stroke-width="2"
						stroke-dasharray="4 3"
					/>
				{:else}
					<!-- Garis Orang Tua -> Anak (Path melengkung halus) -->
					{@const midY = (edge.fromY + edge.toY) / 2}
					<path
						d="M {edge.fromX} {edge.fromY} C {edge.fromX} {midY}, {edge.toX} {midY}, {edge.toX} {edge.toY}"
						fill="none"
						stroke="var(--color-border)"
						stroke-width="1.75"
					/>
				{/if}
			{/each}

			<!-- Kartu Pohon (ForeignObject) -->
			{#each layout.nodes as node (node.member.id)}
				<foreignObject
					x={node.x}
					y={node.y}
					width={node.width}
					height={node.height}
					class="overflow-visible"
				>
					<div
						role="button"
						tabindex="0"
						class="w-full h-full cursor-pointer focus:outline-none"
						title="Detail: {node.member.fullName}"
						aria-label="Detail: {node.member.fullName}"
						onclick={(e) => handleNodeClick(node.member.id, e)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								onselectmember(node.member.id);
							}
						}}
					>
						<TreeCard member={node.member} width={node.width} height={node.height} />
					</div>
				</foreignObject>
			{/each}
		</g>
	</svg>

	<!-- Overlay State Kosong bila belum ada anggota -->
	{#if members.length === 0}
		<div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 space-y-2 bg-bg-base/80 backdrop-blur-[1px]">
			<p class="text-sm font-bold text-[var(--color-text-primary)]">Belum ada data keluarga</p>
			<p class="text-xs text-[var(--color-text-secondary)]">Tambah anggota pertama untuk melihat visualisasi pohon keluarga.</p>
		</div>
	{:else}
		<!-- Kontrol Zoom Pojok Kanan Atas (Mobile & Desktop) -->
		<div class="absolute top-4 right-4 z-10">
			<TreeControls onzoomin={zoomIn} onzoomout={zoomOut} onfit={fitToScreen} />
		</div>

		<!-- Jumlah Anggota di Kiri Bawah (PRD §10) -->
		<div class="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-surface/90 backdrop-blur-[2px] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs font-semibold text-[var(--color-text-secondary)] shadow-sm">
			{members.length} Anggota Keluarga
		</div>
	{/if}
</div>
