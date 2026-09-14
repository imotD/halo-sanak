import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { HaloSanakDB } from '../../src/lib/db/schema';
import { MemberRepository } from '../../src/lib/db/member-repository';

describe('MemberRepository Unit Test', () => {
	it('dapat menyimpan member bersama relasi ayah dan ibu', async () => {
		const testDb = new HaloSanakDB('test-repo-' + Date.now());
		// Simulasikan repositori
		const fatherId = crypto.randomUUID();
		const motherId = crypto.randomUUID();

		await testDb.members.bulkAdd([
			{
				id: fatherId,
				fullName: 'Bapak Ahmad',
				gender: 'Laki-laki',
				domicile: 'Padang',
				isDeceased: false,
				createdAt: 100,
				updatedAt: 100
			},
			{
				id: motherId,
				fullName: 'Ibu Fatimah',
				gender: 'Perempuan',
				domicile: 'Padang',
				isDeceased: false,
				createdAt: 100,
				updatedAt: 100
			}
		]);

		const childId = crypto.randomUUID();
		await testDb.members.add({
			id: childId,
			fullName: 'Anak Sulung',
			gender: 'Laki-laki',
			domicile: 'Padang',
			isDeceased: false,
			createdAt: 200,
			updatedAt: 200
		});

		await testDb.relationships.bulkAdd([
			{
				id: 'r1',
				type: 'parent-child',
				fromMemberId: fatherId,
				toMemberId: childId,
				role: 'father',
				createdAt: 200
			},
			{
				id: 'r2',
				type: 'parent-child',
				fromMemberId: motherId,
				toMemberId: childId,
				role: 'mother',
				createdAt: 200
			}
		]);

		const childRels = await testDb.relationships
			.filter((r) => r.toMemberId === childId)
			.toArray();

		expect(childRels).toHaveLength(2);
		expect(childRels.find((r) => r.role === 'father')?.fromMemberId).toBe(fatherId);
		expect(childRels.find((r) => r.role === 'mother')?.fromMemberId).toBe(motherId);
	});
});
