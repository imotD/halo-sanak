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
	/** Path SVG siap pakai untuk garis parent-child (termasuk rute "jembatan" jika ortu tidak bersebelahan). */
	path?: string;
}

export interface TreeLayoutResult {
	nodes: TreeNode[];
	edges: TreeEdge[];
	bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
}

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 80;
export const HORIZONTAL_GAP = 32;
export const VERTICAL_GAP = 80;
// Jarak ekstra (di atas HORIZONTAL_GAP) antara 2 unit bersebelahan yang tidak
// berbagi orang tua sama sekali (dianggap "keluarga berbeda").
export const FAMILY_GROUP_GAP = 56;
export const ELBOW_CORNER_RADIUS = 10;

/**
 * Membuat path SVG garis siku (elbow) dengan sudut membulat halus, dipakai untuk
 * garis orang tua -> anak. Turun vertikal dari titik asal, belok ke tengah,
 * lalu turun vertikal lagi ke titik tujuan. Kalau asal & tujuan segaris (anak
 * persis di bawah ortu), hasilnya cukup garis lurus tanpa sudut.
 */
export function buildElbowPath(
	fromX: number,
	fromY: number,
	toX: number,
	toY: number,
	radius: number = ELBOW_CORNER_RADIUS
): string {
	const dx = toX - fromX;
	if (Math.abs(dx) < 0.5) {
		return `M ${fromX} ${fromY} L ${toX} ${toY}`;
	}

	const midY = (fromY + toY) / 2;
	const sign = dx > 0 ? 1 : -1;
	const r = Math.max(
		0,
		Math.min(radius, Math.abs(dx) / 2, Math.abs(midY - fromY), Math.abs(toY - midY))
	);

	if (r === 0) {
		return `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
	}

	return [
		`M ${fromX} ${fromY}`,
		`L ${fromX} ${midY - r}`,
		`Q ${fromX} ${midY} ${fromX + sign * r} ${midY}`,
		`L ${toX - sign * r} ${midY}`,
		`Q ${toX} ${midY} ${toX} ${midY + r}`,
		`L ${toX} ${toY}`
	].join(' ');
}

/**
 * Membuat path SVG "jembatan" untuk garis dua-orang-tua yang kartunya TIDAK
 * bersebelahan (kasus poligami: ada pasangan lain di antara kedua ortu kandung).
 * Menurunkan garis dari masing-masing kartu ortu ke satu garis penghubung
 * horizontal, baru satu batang turun ke anak. Ini membuat garis tetap jelas
 * menuju ortu kandung masing-masing, bukan seolah muncul dari kartu di antaranya.
 */
export function buildBracketPath(
	p1X: number,
	p2X: number,
	parentBottomY: number,
	childX: number,
	childY: number,
	radius: number = ELBOW_CORNER_RADIUS
): string {
	const busY = parentBottomY + (childY - parentBottomY) * 0.4;
	const midX = (p1X + p2X) / 2;
	const left = Math.min(p1X, p2X);
	const right = Math.max(p1X, p2X);

	const drop1 = `M ${p1X} ${parentBottomY} L ${p1X} ${busY}`;
	const drop2 = `M ${p2X} ${parentBottomY} L ${p2X} ${busY}`;
	const bridge = `M ${left} ${busY} L ${right} ${busY}`;
	const trunk = buildElbowPath(midX, busY, childX, childY, radius);

	return `${drop1} ${drop2} ${bridge} ${trunk}`;
}

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

	// Urutkan per generasi: kelompokkan pasangan jadi satu "unit" agar selalu bersebelahan,
	// lalu kurangi persilangan garis ortu-anak dengan heuristik barycenter (gaya Sugiyama).
	const sortedGenerations = Array.from(generationBuckets.keys()).sort((a, b) => a - b);

	// Susun anggota di sekitar "hub" (org dgn pasangan terbanyak) berselang-seling
	// kiri-kanan, spy hub tetap sedekat mungkin ke semua pasangannya (§diskusi poligami).
	// Cth 2 pasangan: [p2, hub, p1]. Cth 3 pasangan: [p2, hub, p1, p3].
	function arrangeAroundHub(hub: string, partners: string[]): string[] {
		const left: string[] = [];
		const right: string[] = [];
		partners.forEach((p, idx) => {
			if (idx % 2 === 0) right.push(p);
			else left.push(p);
		});
		left.reverse();
		return [...left, hub, ...right];
	}

	function buildUnits(rawMembers: string[]): string[][] {
		const rawSet = new Set(rawMembers);
		const placed = new Set<string>();
		const units: string[][] = [];

		for (const mId of rawMembers) {
			if (placed.has(mId)) continue;

			// Kumpulkan seluruh anggota grup pasangan (komponen terhubung) dlm generasi ini,
			// supaya urutan kemunculan data tidak memengaruhi pengelompokan (mis. istri ke-2
			// muncul lebih dulu di data drpd suaminya tetap tergabung 1 grup).
			const group: string[] = [];
			const seen = new Set<string>([mId]);
			const queue = [mId];
			while (queue.length > 0) {
				const cur = queue.shift()!;
				group.push(cur);
				for (const pId of spouseMap.get(cur) || []) {
					if (rawSet.has(pId) && !seen.has(pId)) {
						seen.add(pId);
						queue.push(pId);
					}
				}
			}
			group.forEach((id) => placed.add(id));

			if (group.length <= 1) {
				units.push(group);
				continue;
			}

			// Cari hub: anggota dengan jumlah pasangan terbanyak dlm grup ini
			let hub = group[0];
			let hubPartnerCount = -1;
			for (const id of group) {
				const count = (spouseMap.get(id) || []).filter((p) => seen.has(p)).length;
				if (count > hubPartnerCount) {
					hubPartnerCount = count;
					hub = id;
				}
			}
			const directPartners = (spouseMap.get(hub) || []).filter((p) => seen.has(p));
			const rest = group.filter((id) => id !== hub && !directPartners.includes(id));

			units.push(arrangeAroundHub(hub, [...directPartners, ...rest]));
		}
		return units;
	}

	const unitsByGen = new Map<number, string[][]>();
	for (const gen of sortedGenerations) {
		unitsByGen.set(gen, buildUnits(generationBuckets.get(gen) || []));
	}

	const xPositionMap = new Map<string, number>();

	// Kumpulan id ortu dari 1 unit (gabungan semua anggotanya). Dipakai utk deteksi
	// "beda keluarga" antar unit bersebelahan supaya bisa dikasih jarak ekstra.
	function unitParentSet(unit: string[]): Set<string> {
		const set = new Set<string>();
		for (const id of unit) {
			for (const p of childToParents.get(id) || []) set.add(p);
		}
		return set;
	}

	function isDifferentFamily(a: Set<string>, b: Set<string>): boolean {
		// Generasi akar (tanpa data ortu sama sekali) dianggap selalu keluarga berbeda,
		// krn tiap unit di generasi itu memang asal keturunan yang terpisah.
		if (a.size === 0 && b.size === 0) return true;
		for (const p of a) {
			if (b.has(p)) return false;
		}
		return true;
	}

	function gapBetweenUnits(a: Set<string>, b: Set<string>): number {
		return isDifferentFamily(a, b) ? HORIZONTAL_GAP + FAMILY_GROUP_GAP : HORIZONTAL_GAP;
	}

	function assignXForGeneration(units: string[][]) {
		const parentSets = units.map(unitParentSet);

		let totalWidth = 0;
		units.forEach((unit, i) => {
			totalWidth += unit.length * CARD_WIDTH + (unit.length - 1) * HORIZONTAL_GAP;
			if (i > 0) totalWidth += gapBetweenUnits(parentSets[i - 1], parentSets[i]);
		});

		let x = -totalWidth / 2;
		units.forEach((unit, i) => {
			if (i > 0) x += gapBetweenUnits(parentSets[i - 1], parentSets[i]);
			unit.forEach((id, j) => {
				if (j > 0) x += HORIZONTAL_GAP;
				xPositionMap.set(id, x);
				x += CARD_WIDTH;
			});
		});
	}

	function average(values: number[]): number | null {
		return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
	}

	// Posisi rata-rata unit saat ini, dipakai sbg fallback bila unit tidak
	// terhubung ke generasi tetangga (mis. pasangan "menikah masuk" tanpa data ortu).
	function unitCenter(unit: string[]): number {
		return average(unit.map((id) => xPositionMap.get(id) ?? 0)) ?? 0;
	}

	function barycenterFromParents(unit: string[]): number | null {
		const xs: number[] = [];
		for (const id of unit) {
			for (const parentId of childToParents.get(id) || []) {
				const px = xPositionMap.get(parentId);
				if (px !== undefined) xs.push(px);
			}
		}
		return average(xs);
	}

	function barycenterFromChildren(unit: string[]): number | null {
		const xs: number[] = [];
		for (const id of unit) {
			for (const childId of parentToChildren.get(id) || []) {
				const cx = xPositionMap.get(childId);
				if (cx !== undefined) xs.push(cx);
			}
		}
		return average(xs);
	}

	// Posisi awal (urutan asli per generasi) sbg baseline sebelum optimisasi
	for (const gen of sortedGenerations) {
		assignXForGeneration(unitsByGen.get(gen)!);
	}

	// Sweep bolak-balik (atas->bawah lalu bawah->atas) mengurutkan ulang unit tiap
	// generasi berdasar rata-rata posisi X tetangganya, supaya anak makin dekat ke
	// titik tengah ortu-nya. Generasi paling atas dijadikan acuan tetap (tidak diubah)
	// karena pasangan selalu diprioritaskan bersebelahan (lihat catatan diskusi §layout).
	const rootGen = sortedGenerations[0];
	const SWEEP_COUNT = 4;
	for (let sweep = 0; sweep < SWEEP_COUNT; sweep++) {
		const topDown = sweep % 2 === 0;
		const order = topDown ? sortedGenerations : [...sortedGenerations].reverse();

		for (const gen of order) {
			if (gen === rootGen) continue;

			const units = unitsByGen.get(gen)!;
			const keyed = units.map((unit) => {
				const key = topDown ? barycenterFromParents(unit) : barycenterFromChildren(unit);
				return { unit, key: key ?? unitCenter(unit) };
			});
			keyed.sort((a, b) => a.key - b.key);

			const newUnits = keyed.map((k) => k.unit);
			unitsByGen.set(gen, newUnits);
			assignXForGeneration(newUnits);
		}
	}

	// Susun posisi final (x hasil optimisasi, y berdasar generasi)
	const nodePositionMap = new Map<string, { x: number; y: number; gen: number }>();
	for (const gen of sortedGenerations) {
		const y = gen * (CARD_HEIGHT + VERTICAL_GAP);
		for (const unit of unitsByGen.get(gen)!) {
			for (const id of unit) {
				nodePositionMap.set(id, { x: xPositionMap.get(id)!, y, gen });
			}
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

	// Cek apakah 2 titik X di generasi yg sama bersebelahan langsung (tidak ada
	// kartu lain yg posisinya persis di antara keduanya). Dipakai utk mendeteksi
	// kasus poligami: anak dari 2 ortu yg kartunya terpisah oleh pasangan lain.
	function areCentersAdjacent(gen: number, xA: number, xB: number): boolean {
		const lo = Math.min(xA, xB);
		const hi = Math.max(xA, xB);
		for (const pos of nodePositionMap.values()) {
			if (pos.gen !== gen) continue;
			const centerX = pos.x + CARD_WIDTH / 2;
			if (centerX > lo + 1 && centerX < hi - 1) {
				return false;
			}
		}
		return true;
	}

	// B. Garis Orang Tua -> Anak (PRD §8.1: jika 2 ortu, hubungkan dari unit 2 ortu; jika 1 ortu, dari ortu tersebut)
	for (const [childId, parents] of childToParents.entries()) {
		const childPos = nodePositionMap.get(childId);
		if (!childPos) continue;

		const targetX = childPos.x + CARD_WIDTH / 2;
		const targetY = childPos.y;

		if (parents.length >= 2) {
			const p1Pos = nodePositionMap.get(parents[0]);
			const p2Pos = nodePositionMap.get(parents[1]);
			if (p1Pos && p2Pos) {
				const p1CenterX = p1Pos.x + CARD_WIDTH / 2;
				const p2CenterX = p2Pos.x + CARD_WIDTH / 2;
				const parentGen = p1Pos.gen;
				const parentBottomY = Math.max(p1Pos.y, p2Pos.y) + CARD_HEIGHT;

				const adjacent = areCentersAdjacent(parentGen, p1CenterX, p2CenterX);
				const sourceX = (p1CenterX + p2CenterX) / 2;

				let fromY: number;
				let path: string;
				if (adjacent) {
					fromY = parentBottomY - CARD_HEIGHT / 2;
					path = buildElbowPath(sourceX, fromY, targetX, targetY);
				} else {
					// Kartu ortu tidak bersebelahan (ada pasangan lain di tengah) — rute
					// "jembatan" dari masing2 kartu ortu, spy garis tetap jelas menuju
					// ortu kandung masing2, bukan seolah dari kartu yg ada di antaranya.
					fromY = parentBottomY;
					path = buildBracketPath(p1CenterX, p2CenterX, parentBottomY, targetX, targetY);
				}

				edges.push({
					id: `parent-child:${parents.join('+')}->${childId}`,
					type: 'parent-child',
					fromX: sourceX,
					fromY,
					toX: targetX,
					toY: targetY,
					path
				});
				continue;
			}
		}

		// Fallback single parent
		for (const parentId of parents) {
			const parentPos = nodePositionMap.get(parentId);
			if (parentPos) {
				const fromX = parentPos.x + CARD_WIDTH / 2;
				const fromY = parentPos.y + CARD_HEIGHT;
				edges.push({
					id: `parent-child:${parentId}->${childId}`,
					type: 'parent-child',
					fromX,
					fromY,
					toX: targetX,
					toY: targetY,
					path: buildElbowPath(fromX, fromY, targetX, targetY)
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
