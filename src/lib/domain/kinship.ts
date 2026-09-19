import type { Member, Relationship } from '$lib/schemas';
import { UI_STRINGS } from '$lib/strings';

export interface KinshipPathStep {
	memberId: string;
	role?: 'father' | 'mother' | 'parent' | 'child';
}

export interface KinshipResult {
	term: string;
	sentence: string;
	depthA: number;
	depthB: number;
	lcaId?: string;
	pathA?: string[];
	pathB?: string[];
}

interface AncestorInfo {
	depth: number;
	path: string[]; // from subject up to ancestor [subjectId, ...ancestorId]
}

/**
 * Membangun peta parent-child dari relasi parent-child aktif.
 * parentId (fromMemberId) -> childId (toMemberId).
 */
function buildParentMaps(relationships: Relationship[]) {
	// childId -> Set<parentId>
	const parentsOf = new Map<string, Set<string>>();
	// childId -> Map<parentId, 'father' | 'mother'>
	const parentRoleOf = new Map<string, Map<string, 'father' | 'mother'>>();

	for (const rel of relationships) {
		if (rel.type === 'parent-child') {
			const parentId = rel.fromMemberId;
			const childId = rel.toMemberId;

			if (!parentsOf.has(childId)) {
				parentsOf.set(childId, new Set());
			}
			parentsOf.get(childId)!.add(parentId);

			if (rel.role === 'father' || rel.role === 'mother') {
				if (!parentRoleOf.has(childId)) {
					parentRoleOf.set(childId, new Map());
				}
				parentRoleOf.get(childId)!.set(parentId, rel.role);
			}
		}
	}

	return { parentsOf, parentRoleOf };
}

/**
 * Menelusuri seluruh leluhur ke atas dari subjectId dengan BFS (jarak terpendek).
 * Termasuk subjectId sendiri pada depth 0.
 */
function traceAncestors(subjectId: string, parentsOf: Map<string, Set<string>>): Map<string, AncestorInfo> {
	const ancestors = new Map<string, AncestorInfo>();
	ancestors.set(subjectId, { depth: 0, path: [subjectId] });

	const queue: Array<{ id: string; depth: number; path: string[] }> = [
		{ id: subjectId, depth: 0, path: [subjectId] }
	];

	while (queue.length > 0) {
		const current = queue.shift()!;
		const parents = parentsOf.get(current.id);
		if (!parents) continue;

		for (const parentId of parents) {
			if (!ancestors.has(parentId)) {
				const nextDepth = current.depth + 1;
				const nextPath = [...current.path, parentId];
				ancestors.set(parentId, { depth: nextDepth, path: nextPath });
				queue.push({ id: parentId, depth: nextDepth, path: nextPath });
			}
		}
	}

	return ancestors;
}

/**
 * Memutuskan istilah Kakak/Adik/Saudara Kandung/Saudara Tiri (PRD v2 §1.5).
 */
function determineSiblingTerm(
	a: Member,
	b: Member,
	parentsOf: Map<string, Set<string>>
): string {
	// Aturan 1: Field "Anak ke-berapa"
	if (
		typeof a.birthOrder === 'number' &&
		typeof b.birthOrder === 'number' &&
		a.birthOrder !== b.birthOrder
	) {
		return b.birthOrder < a.birthOrder ? UI_STRINGS.kinship.olderSibling : UI_STRINGS.kinship.youngerSibling;
	}

	// Aturan 2: Tanggal lahir presisi lengkap
	if (
		a.birthDate?.precision === 'full' &&
		b.birthDate?.precision === 'full' &&
		a.birthDate.value !== b.birthDate.value
	) {
		return b.birthDate.value < a.birthDate.value ? UI_STRINGS.kinship.olderSibling : UI_STRINGS.kinship.youngerSibling;
	}

	// Aturan 3: Fallback generik (Kandung jika berbagi 2 orang tua sama, Tiri jika hanya 1)
	const parentsA = parentsOf.get(a.id) ?? new Set<string>();
	const parentsB = parentsOf.get(b.id) ?? new Set<string>();

	let sharedParentsCount = 0;
	for (const p of parentsA) {
		if (parentsB.has(p)) {
			sharedParentsCount++;
		}
	}

	if (sharedParentsCount >= 2) {
		return UI_STRINGS.kinship.fullSibling;
	}

	return UI_STRINGS.kinship.halfSibling;
}

/**
 * Menghitung hubungan kekerabatan: "B adalah [istilah] bagi A" (PRD v2 §1.3 - §1.6).
 */
export function calculateKinship(
	memberA: Member,
	memberB: Member,
	members: Member[],
	relationships: Relationship[]
): KinshipResult {
	if (memberA.id === memberB.id) {
		return {
			term: UI_STRINGS.kinship.self,
			sentence: `${memberB.fullName} adalah diri sendiri bagi ${memberA.fullName}`,
			depthA: 0,
			depthB: 0,
			lcaId: memberA.id
		};
	}

	const { parentsOf } = buildParentMaps(relationships);
	const ancestorsA = traceAncestors(memberA.id, parentsOf);
	const ancestorsB = traceAncestors(memberB.id, parentsOf);

	// Cari LCA dengan total depthA + depthB minimum
	let bestLcaId: string | null = null;
	let minTotalDepth = Infinity;
	let bestDepthA = Infinity;
	let bestDepthB = Infinity;

	for (const [ancestorId, infoA] of ancestorsA.entries()) {
		const infoB = ancestorsB.get(ancestorId);
		if (infoB) {
			const total = infoA.depth + infoB.depth;
			// Prioritaskan direct line bila total sama (mis. min(depthA, depthB) terkecil)
			if (
				total < minTotalDepth ||
				(total === minTotalDepth && Math.min(infoA.depth, infoB.depth) < Math.min(bestDepthA, bestDepthB))
			) {
				minTotalDepth = total;
				bestLcaId = ancestorId;
				bestDepthA = infoA.depth;
				bestDepthB = infoB.depth;
			}
		}
	}

	if (!bestLcaId) {
		return {
			term: UI_STRINGS.kinship.notFound,
			sentence: UI_STRINGS.kinship.notFound,
			depthA: -1,
			depthB: -1
		};
	}

	const pathA = ancestorsA.get(bestLcaId)!.path;
	const pathB = ancestorsB.get(bestLcaId)!.path;

	let term = '';

	// Direct Line (salah satu adalah leluhur langsung yang lain)
	if (bestDepthA === 0 && bestDepthB > 0) {
		// A adalah leluhur B -> B adalah keturunan A
		if (bestDepthB === 1) term = UI_STRINGS.kinship.child;
		else if (bestDepthB === 2) term = UI_STRINGS.kinship.grandchild;
		else if (bestDepthB === 3) term = UI_STRINGS.kinship.greatGrandchild;
		else term = UI_STRINGS.kinship.descendantGenN(bestDepthB);
	} else if (bestDepthB === 0 && bestDepthA > 0) {
		// B adalah leluhur A -> B adalah orang tua/kakek-nenek A
		if (bestDepthA === 1) term = UI_STRINGS.kinship.parent;
		else if (bestDepthA === 2) {
			term = memberB.gender === 'Laki-laki' ? UI_STRINGS.kinship.grandfather : UI_STRINGS.kinship.grandmother;
		} else if (bestDepthA === 3) {
			term = UI_STRINGS.kinship.greatGrandparent;
		} else {
			term = UI_STRINGS.kinship.ancestorGenN(bestDepthA);
		}
	} else if (bestDepthA === 1 && bestDepthB === 1) {
		// depthA = 1, depthB = 1 -> Kakak/Adik/Saudara
		term = determineSiblingTerm(memberA, memberB, parentsOf);
	} else if (bestDepthA === 1 && bestDepthB === 2) {
		// B adalah anak dari saudara A
		term = UI_STRINGS.kinship.nephewNiece;
	} else if (bestDepthA === 2 && bestDepthB === 1) {
		// B adalah saudara dari orang tua A
		term = memberB.gender === 'Laki-laki' ? UI_STRINGS.kinship.uncle : UI_STRINGS.kinship.aunt;
	} else if (bestDepthA === 2 && bestDepthB === 2) {
		// Generasi sama level cucu dari LCA
		term = UI_STRINGS.kinship.cousin;
	} else if (bestDepthA >= 3 && bestDepthA === bestDepthB) {
		// n = m, n >= 3
		term = UI_STRINGS.kinship.cousin;
	} else {
		// n != m collateral lainnya
		term = UI_STRINGS.kinship.distantCousin;
	}

	return {
		term,
		sentence: `${memberB.fullName} adalah ${term} bagi ${memberA.fullName}`,
		depthA: bestDepthA,
		depthB: bestDepthB,
		lcaId: bestLcaId,
		pathA,
		pathB
	};
}

/**
 * Format rantai silsilah teks (PRD v2 §1.7):
 * Contoh: "A → ayah: X → ayah: Y ← ibu: Z ← ibu: B"
 */
export function formatKinshipPath(
	result: KinshipResult,
	membersMap: Map<string, Member>,
	relationships: Relationship[]
): string {
	if (!result.lcaId || !result.pathA || !result.pathB) {
		return '';
	}

	const { parentRoleOf } = buildParentMaps(relationships);

	const segments: string[] = [];

	// pathA dari A ke LCA: [A, P1, P2, ... LCA]
	for (let i = 0; i < result.pathA.length; i++) {
		const currentId = result.pathA[i];
		const currentMember = membersMap.get(currentId);
		const currentName = currentMember ? currentMember.fullName : currentId;

		if (i === 0) {
			segments.push(currentName);
		} else {
			const prevId = result.pathA[i - 1];
			// Role orang tua prevId
			const role = parentRoleOf.get(prevId)?.get(currentId);
			const label = role === 'father' ? 'ayah' : role === 'mother' ? 'ibu' : 'orang tua';
			segments.push(`→ ${label}: ${currentName}`);
		}
	}

	// pathB dari LCA ke B (pathB adalah [B, P1, ... LCA], kita balik dari setelah LCA turun ke B)
	const reversedB = [...result.pathB].reverse(); // [LCA, ... P1, B]
	for (let i = 1; i < reversedB.length; i++) {
		const childId = reversedB[i];
		const parentId = reversedB[i - 1];
		const childMember = membersMap.get(childId);
		const childName = childMember ? childMember.fullName : childId;

		const role = parentRoleOf.get(childId)?.get(parentId);
		const label = role === 'father' ? 'ayah' : role === 'mother' ? 'ibu' : 'orang tua';
		segments.push(`← ${label}: ${childName}`);
	}

	return segments.join(' ');
}

