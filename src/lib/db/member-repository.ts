import { getDB } from './index';
import type { Member, Relationship } from '$lib/schemas';
import { createSymmetricSpousePairs, detectAncestorCycle, canDeleteMember } from '$lib/domain';

export class MemberRepository {
	static async getAllMembers(): Promise<Member[]> {
		const db = getDB();
		return await db.members.orderBy('fullName').toArray();
	}

	static async getMemberById(id: string): Promise<Member | undefined> {
		const db = getDB();
		return await db.members.get(id);
	}

	static async getAllRelationships(): Promise<Relationship[]> {
		const db = getDB();
		return await db.relationships.toArray();
	}

	static async getMemberRelationships(memberId: string): Promise<Relationship[]> {
		const db = getDB();
		return await db.relationships
			.filter((r) => r.fromMemberId === memberId || r.toMemberId === memberId)
			.toArray();
	}

	static async saveMemberWithRelations(
		memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
		relations: {
			fatherId?: string;
			motherId?: string;
			spouseIds?: string[];
			childrenIds?: string[];
		}
	): Promise<string> {
		const db = getDB();
		const allRels = await db.relationships.toArray();
		const memberId = memberData.id || crypto.randomUUID();
		const now = Date.now();

		// Cek cycle leluhur jika ada ayah/ibu
		if (relations.fatherId) {
			if (detectAncestorCycle(relations.fatherId, memberId, allRels)) {
				throw new Error('Relasi ditolak: siklus leluhur terdeteksi untuk Ayah.');
			}
		}
		if (relations.motherId) {
			if (detectAncestorCycle(relations.motherId, memberId, allRels)) {
				throw new Error('Relasi ditolak: siklus leluhur terdeteksi untuk Ibu.');
			}
		}

		await db.transaction('rw', db.members, db.relationships, async () => {
			const existingMember = await db.members.get(memberId);
			const fullMember: Member = {
				...memberData,
				id: memberId,
				createdAt: existingMember ? existingMember.createdAt : now,
				updatedAt: now
			};
			await db.members.put(fullMember);

			// Bersihkan relasi lama yang melibatkan member ini
			const oldRels = await db.relationships
				.filter((r) => r.fromMemberId === memberId || r.toMemberId === memberId)
				.toArray();
			
			// Jika pasangan dihapus, hapus juga simetrisnya
			for (const r of oldRels) {
				if (r.type === 'spouse') {
					// Hapus pasangan balik
					await db.relationships
						.where('fromMemberId')
						.equals(r.toMemberId)
						.filter((rev) => rev.toMemberId === memberId && rev.type === 'spouse')
						.delete();
				}
				await db.relationships.delete(r.id);
			}

			// Simpan Ayah
			if (relations.fatherId) {
				await db.relationships.add({
					id: crypto.randomUUID(),
					type: 'parent-child',
					fromMemberId: relations.fatherId,
					toMemberId: memberId,
					role: 'father',
					createdAt: now
				});
			}

			// Simpan Ibu
			if (relations.motherId) {
				await db.relationships.add({
					id: crypto.randomUUID(),
					type: 'parent-child',
					fromMemberId: relations.motherId,
					toMemberId: memberId,
					role: 'mother',
					createdAt: now
				});
			}

			// Simpan Pasangan (Simetris 2-arah)
			if (relations.spouseIds && relations.spouseIds.length > 0) {
				for (const spouseId of relations.spouseIds) {
					const [edgeA, edgeB] = createSymmetricSpousePairs(memberId, spouseId);
					await db.relationships.add(edgeA);
					await db.relationships.add(edgeB);
				}
			}

			// Simpan Anak
			if (relations.childrenIds && relations.childrenIds.length > 0) {
				const role = memberData.gender === 'Laki-laki' ? 'father' : 'mother';
				for (const childId of relations.childrenIds) {
					await db.relationships.add({
						id: crypto.randomUUID(),
						type: 'parent-child',
						fromMemberId: memberId,
						toMemberId: childId,
						role,
						createdAt: now
					});
				}
			}
		});

		return memberId;
	}

	static async deleteMember(memberId: string): Promise<void> {
		const db = getDB();
		const allRels = await db.relationships.toArray();
		const check = canDeleteMember(memberId, allRels);
		if (!check.allowed) {
			throw new Error('Anggota tidak dapat dihapus sebelum semua relasi dilepas.');
		}
		await db.members.delete(memberId);
	}
}
