import type { Member, Relationship } from '$lib/schemas';

export interface TreeNode {
	member: Member;
	x: number;
	y: number;
	width: number;
	height: number;
	generation: number;
}

export interface TreeEdge {
	id: string;
	fromX: number;
	fromY: number;
	toX: number;
	toY: number;
	type: 'parent-child' | 'spouse';
}

export interface TreeLayoutResult {
	nodes: TreeNode[];
	edges: TreeEdge[];
	bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
}

export const CARD_WIDTH = 200;
export const CARD_HEIGHT = 76;
export const HORIZONTAL_GAP = 32;
export const VERTICAL_GAP = 80;

/**
 * Menghitung tata letak posisi pohon keluarga (garis ayah & ibu).
 * Mengelompokkan per generasi (Y-axis) dan menata posisi horizontal (X-axis).
 */
export function calculateTreeLayout(
	members: Member[],
	relationships: Relationship[]
): TreeLayoutResult {
	if (members.length === 0) {
		return {
			nodes: [],
			edges: [],
			bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
		};
	}

	const memberMap = new Map<string, Member>();
	members.forEach((m) => memberMap.set(m.id, m));

	// Buat graph orang tua -> anak & anak -> orang tua
	const parentToChildren = new Map<string, string[]>();
	const childToParents = new Map<string, string[]>();
	const spouseMap = new Map<string, string[]>();

	for (const rel of relationships) {
		if (rel.type === 'parent-child') {
			const kids = parentToChildren.get(rel.fromMemberId) || [];
			kids.push(rel.toMemberId);
			parentToChildren.set(rel.fromMemberId, kids);

			const parents = childToParents.get(rel.toMemberId) || [];
			parents.push(rel.fromMemberId);
			childToParents.set(rel.toMemberId, parents);
		} else if (rel.type === 'spouse') {
			const partners = spouseMap.get(rel.fromMemberId) || [];
			if (!partners.includes(rel.toMemberId)) {
				partners.push(rel.toMemberId);
				spouseMap.set(rel.fromMemberId, partners);
			}
		}
	}

	// 1. Hitung kedalaman generasi (topological / ancestor traversal)
	// Anggota tanpa orang tua dianggap generasi 0
	const generationMap = new Map<string, number>();

	function getGeneration(memberId: string, visited = new Set<string>()): number {
		if (generationMap.has(memberId)) {
			return generationMap.get(memberId)!;
		}
		if (visited.has(memberId)) {
			return 0; // siklus guard
		}
		visited.add(memberId);

		const parents = childToParents.get(memberId) || [];
		if (parents.length === 0) {
			generationMap.set(memberId, 0);
			return 0;
		}

		let maxParentGen = 0;
		for (const p of parents) {
			const pGen = getGeneration(p, new Set(visited));
			if (pGen > maxParentGen) {
				maxParentGen = pGen;
			}
		}

		const myGen = maxParentGen + 1;
		generationMap.set(memberId, myGen);
		return myGen;
	}

	// Inisialisasi generasi semua anggota
	members.forEach((m) => getGeneration(m.id));

	// Sinkronisasi generasi pasangan (suami-istri harus berada di generasi yang sama)
	for (const [mId, partners] of spouseMap.entries()) {
		const mGen = generationMap.get(mId) || 0;
		for (const pId of partners) {
			const pGen = generationMap.get(pId) || 0;
			const maxGen = Math.max(mGen, pGen);
			generationMap.set(mId, maxGen);
			generationMap.set(pId, maxGen);
		}
	}

	// 2. Kelompokkan anggota per generasi
	const generationBuckets = new Map<number, string[]>();
	for (const m of members) {
		const gen = generationMap.get(m.id) || 0;
		const bucket = generationBuckets.get(gen) || [];
		bucket.push(m.id);
		generationBuckets.set(gen, bucket);
	}

	// Urutkan per generasi: kelompokkan pasangan agar bersebelahan
	const sortedGenerations = Array.from(generationBuckets.keys()).sort((a, b) => a - b);
	const nodePositionMap = new Map<string, { x: number; y: number; gen: number }>();

	for (const gen of sortedGenerations) {
		const rawMembers = generationBuckets.get(gen) || [];
		const orderedIds: string[] = [];
		const placed = new Set<string>();

		for (const mId of rawMembers) {
			if (placed.has(mId)) continue;
			orderedIds.push(mId);
			placed.add(mId);

			// Pasangkan dengan pasangannya jika ada di generasi ini
			const partners = spouseMap.get(mId) || [];
			for (const pId of partners) {
				if (!placed.has(pId) && rawMembers.includes(pId)) {
					orderedIds.push(pId);
					placed.add(pId);
				}
			}
		}

		// Hitung posisi koordinat X per node di generasi ini
		const totalWidth = orderedIds.length * CARD_WIDTH + (orderedIds.length - 1) * HORIZONTAL_GAP;
		let startX = -totalWidth / 2;
		const y = gen * (CARD_HEIGHT + VERTICAL_GAP);

		for (const mId of orderedIds) {
			nodePositionMap.set(mId, { x: startX, y, gen });
			startX += CARD_WIDTH + HORIZONTAL_GAP;
		}
	}

	// 3. Bangun objek TreeNode
	const nodes: TreeNode[] = [];
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	for (const [mId, pos] of nodePositionMap.entries()) {
		const member = memberMap.get(mId)!;
		nodes.push({
			member,
			x: pos.x,
			y: pos.y,
			width: CARD_WIDTH,
			height: CARD_HEIGHT,
			generation: pos.gen
		});

		minX = Math.min(minX, pos.x);
		maxX = Math.max(maxX, pos.x + CARD_WIDTH);
		minY = Math.min(minY, pos.y);
		maxY = Math.max(maxY, pos.y + CARD_HEIGHT);
	}

	// 4. Bangun Garis Penghubung (Edges)
	const edges: TreeEdge[] = [];

	// A. Garis Pasangan (horizontal antara 2 kartu pasangan)
	const processedSpouseEdges = new Set<string>();
	for (const [mId, partners] of spouseMap.entries()) {
		const posA = nodePositionMap.get(mId);
		if (!posA) continue;
		for (const pId of partners) {
			const posB = nodePositionMap.get(pId);
			if (!posB) continue;

			const pairKey = [mId, pId].sort().join(':');
			if (!processedSpouseEdges.has(pairKey)) {
				processedSpouseEdges.add(pairKey);
				const leftNode = posA.x < posB.x ? posA : posB;
				const rightNode = posA.x < posB.x ? posB : posA;

				edges.push({
					id: `spouse:${pairKey}`,
					type: 'spouse',
					fromX: leftNode.x + CARD_WIDTH,
					fromY: leftNode.y + CARD_HEIGHT / 2,
					toX: rightNode.x,
					toY: rightNode.y + CARD_HEIGHT / 2
				});
			}
		}
	}

	// B. Garis Orang Tua -> Anak (PRD §8.1: jika 2 ortu, hubungkan dari unit 2 ortu; jika 1 ortu, dari ortu tersebut)
	for (const [childId, parents] of childToParents.entries()) {
		const childPos = nodePositionMap.get(childId);
		if (!childPos) continue;

		const targetX = childPos.x + CARD_WIDTH / 2;
		const targetY = childPos.y;

		if (parents.length >= 2) {
			// Hubungkan dari titik tengah pasangan orang tua
			const p1Pos = nodePositionMap.get(parents[0]);
			const p2Pos = nodePositionMap.get(parents[1]);
			if (p1Pos && p2Pos) {
				const sourceX = (p1Pos.x + p2Pos.x + CARD_WIDTH) / 2;
				const sourceY = Math.max(p1Pos.y, p2Pos.y) + CARD_HEIGHT / 2;

				edges.push({
					id: `parent-child:${parents.join('+')}->${childId}`,
					type: 'parent-child',
					fromX: sourceX,
					fromY: sourceY,
					toX: targetX,
					toY: targetY
				});
				continue;
			}
		}

		// Fallback single parent
		for (const parentId of parents) {
			const parentPos = nodePositionMap.get(parentId);
			if (parentPos) {
				edges.push({
					id: `parent-child:${parentId}->${childId}`,
					type: 'parent-child',
					fromX: parentPos.x + CARD_WIDTH / 2,
					fromY: parentPos.y + CARD_HEIGHT,
					toX: targetX,
					toY: targetY
				});
			}
		}
	}

	if (!isFinite(minX)) {
		minX = 0;
		maxX = 0;
		minY = 0;
		maxY = 0;
	}

	return {
		nodes,
		edges,
		bounds: {
			minX,
			maxX,
			minY,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		}
	};
}
