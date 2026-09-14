import type { Relationship } from '$lib/schemas';

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
