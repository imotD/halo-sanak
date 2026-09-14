import type { Relationship } from '$lib/schemas';

/**
 * Memeriksa apakah menambahkan orang tua (parentCandidateId) kepada anak (childId)
 * akan menyebabkan siklus leluhur.
 * Penelusuran leluhur parentCandidateId ke atas: jika childId ada di jalur atau parentCandidateId === childId -> siklus terdeteksi.
 */
export function detectAncestorCycle(
	parentCandidateId: string,
	childId: string,
	relationships: Relationship[]
): boolean {
	if (parentCandidateId === childId) {
		return true;
	}

	// Buat map childId -> daftar parentId dari type === 'parent-child'
	// Relasi: fromMemberId = parent, toMemberId = child
	const parentMap = new Map<string, string[]>();
	for (const rel of relationships) {
		if (rel.type === 'parent-child') {
			const existing = parentMap.get(rel.toMemberId) || [];
			existing.push(rel.fromMemberId);
			parentMap.set(rel.toMemberId, existing);
		}
	}

	// BFS / DFS telusuri leluhur parentCandidateId ke atas
	const queue: string[] = [parentCandidateId];
	const visited = new Set<string>();

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current === childId) {
			return true;
		}

		if (!visited.has(current)) {
			visited.add(current);
			const parents = parentMap.get(current) || [];
			for (const p of parents) {
				if (!visited.has(p)) {
					queue.push(p);
				}
			}
		}
	}

	return false;
}
