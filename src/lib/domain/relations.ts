import type { Member, Relationship } from '$lib/schemas';

export function isValidFamilyGraph(members: Member[], relationships: Relationship[]): boolean {
	const byId = new Map(members.map((member) => [member.id, member]));
	if (byId.size !== members.length) return false;
	const ids = new Set<string>();
	const edges = new Set<string>();
	const parents = new Set<string>();
	const children = new Map<string, string[]>();
	const indegrees = new Map(members.map((member) => [member.id, 0]));
	for (const rel of relationships) {
		const from = byId.get(rel.fromMemberId);
		const to = byId.get(rel.toMemberId);
		const key = JSON.stringify([rel.type, rel.fromMemberId, rel.toMemberId]);
		if (!from || !to || from.id === to.id || ids.has(rel.id) || edges.has(key)) return false;
		ids.add(rel.id);
		edges.add(key);
		if (rel.type === 'spouse') {
			if ((rel.role && rel.role !== 'spouse') || from.gender === to.gender) return false;
		} else {
			const expectedRole = from.gender === 'Laki-laki' ? 'father' : 'mother';
			if (rel.role && rel.role !== expectedRole) return false;
			const parentKey = JSON.stringify([to.id, expectedRole]);
			if (parents.has(parentKey)) return false;
			parents.add(parentKey);
			children.set(from.id, [...(children.get(from.id) ?? []), to.id]);
			indegrees.set(to.id, indegrees.get(to.id)! + 1);
		}
	}
	for (const rel of relationships) {
		if (rel.type === 'spouse' && !edges.has(JSON.stringify(['spouse', rel.toMemberId, rel.fromMemberId]))) return false;
	}
	const queue = members.filter((member) => indegrees.get(member.id) === 0).map((member) => member.id);
	for (let i = 0; i < queue.length; i++) {
		for (const child of children.get(queue[i]) ?? []) {
			const remaining = indegrees.get(child)! - 1;
			indegrees.set(child, remaining);
			if (remaining === 0) queue.push(child);
		}
	}
	return queue.length === members.length;
}

/**
 * Validasi apakah anggota dapat dihapus.
 * Sesuai PRD §7: Anggota dengan relasi apa pun (ayah/ibu/pasangan/anak)
 * tidak boleh dihapus sampai semua relasi dilepas.
 */
export function canDeleteMember(
	memberId: string,
	relationships: Relationship[]
): { allowed: boolean; blockingRelationships: Relationship[] } {
	const active = relationships.filter(
		(r) => r.fromMemberId === memberId || r.toMemberId === memberId
	);
	return {
		allowed: active.length === 0,
		blockingRelationships: active
	};
}

/**
 * Menghasilkan pasangan simetris untuk hubungan perkawinan (spouse).
 * Sesuai PRD §7: Tambah A sebagai pasangan B otomatis mencatat B sebagai pasangan A.
 */
export function createSymmetricSpousePairs(
	memberAId: string,
	memberBId: string,
	generateId: () => string = () => crypto.randomUUID()
): [Relationship, Relationship] {
	const now = Date.now();
	const edgeAB: Relationship = {
		id: generateId(),
		type: 'spouse',
		fromMemberId: memberAId,
		toMemberId: memberBId,
		role: 'spouse',
		createdAt: now
	};
	const edgeBA: Relationship = {
		id: generateId(),
		type: 'spouse',
		fromMemberId: memberBId,
		toMemberId: memberAId,
		role: 'spouse',
		createdAt: now
	};
	return [edgeAB, edgeBA];
}
