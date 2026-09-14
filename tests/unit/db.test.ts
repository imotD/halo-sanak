import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { HaloSanakDB } from '../../src/lib/db/schema';
import type { Member } from '../../src/lib/schemas';

describe('Dexie Database Unit Test', () => {
	it('dapat menyimpan dan mengambil data member', async () => {
		const db = new HaloSanakDB('test-db-' + Date.now());
		const newMember: Member = {
			id: '11111111-1111-4111-8111-111111111111',
			fullName: 'Siti Aminah',
			gender: 'Perempuan',
			domicile: 'Padang',
			isDeceased: false,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		await db.members.add(newMember);
		const retrieved = await db.members.get(newMember.id);

		expect(retrieved).toBeDefined();
		expect(retrieved?.fullName).toBe('Siti Aminah');
		expect(retrieved?.gender).toBe('Perempuan');
	});
});
