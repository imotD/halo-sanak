import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { getDB } from '../../src/lib/db';
import { MemberRepository as Repo } from '../../src/lib/db/member-repository';
import { replaceDatabaseWithSnapshot } from '../../src/lib/features/settings/data-backup';
import { ExportFileSchema, type Member, type ExportFile } from '../../src/lib/schemas';

const person = (gender: Member['gender'] = 'Laki-laki') => ({ fullName: 'Anggota', gender, domicile: 'Padang', isDeceased: false });
const snapshot = async (): Promise<ExportFile> => ({ app: 'halosanak', version: 2, exportedAt: new Date().toISOString(), members: await Repo.getAllMembers(), relationships: await Repo.getAllRelationships() });

beforeEach(async () => { await getDB().open(); await getDB().members.clear(); await getDB().relationships.clear(); });
afterEach(async () => { await getDB().delete(); });

describe('real repository and replacement transactions', () => {
	it('saves parents, symmetric spouses, birth order and removes both spouse edges', async () => {
		const father = await Repo.saveMemberWithRelations(person(), {});
		const mother = await Repo.saveMemberWithRelations(person('Perempuan'), { spouseIds: [father] });
		const child = await Repo.saveMemberWithRelations({ ...person(), birthOrder: 2 }, { fatherId: father, motherId: mother });
		expect((await Repo.getMemberById(child))?.birthOrder).toBe(2);
		expect(await Repo.getAllRelationships()).toHaveLength(4);
		await Repo.saveMemberWithRelations({ ...person('Perempuan'), id: mother }, { childrenIds: [child] });
		expect((await Repo.getAllRelationships()).filter((rel) => rel.type === 'spouse')).toHaveLength(0);
	});

	it('rejects children cycles, second fathers, wrong gender, duplicates and dangling edges atomically', async () => {
		const father = await Repo.saveMemberWithRelations(person(), {});
		const child = await Repo.saveMemberWithRelations(person(), { fatherId: father });
		const other = await Repo.saveMemberWithRelations(person(), {});
		const before = await snapshot();
		for (const relations of [{ fatherId: father, childrenIds: [father] }, { fatherId: child }, { motherId: father }, { spouseIds: [father] }, { childrenIds: [other, other] }, { fatherId: crypto.randomUUID() }]) {
			await expect(Repo.saveMemberWithRelations({ ...person(), id: child }, relations)).rejects.toThrow();
			expect((await snapshot()).members).toEqual(before.members);
			expect((await snapshot()).relationships).toEqual(before.relationships);
		}
		await expect(Repo.saveMemberWithRelations({ ...person(), id: other }, { childrenIds: [child] })).rejects.toThrow();
		await expect(Repo.deleteMember(father)).rejects.toThrow();
	});

	it('revalidates mutated snapshots and preserves old data on invalid graph', async () => {
		const father = await Repo.saveMemberWithRelations(person(), {});
		await Repo.saveMemberWithRelations(person('Perempuan'), { spouseIds: [father] });
		const before = await snapshot();
		const invalids = [
			{ ...before, members: [...before.members, before.members[0]] },
			{ ...before, relationships: before.relationships.slice(1) },
			{ ...before, relationships: [...before.relationships, before.relationships[0]] },
			{ ...before, relationships: [...before.relationships, { ...before.relationships[0], id: crypto.randomUUID() }] }
		];
		for (const invalid of invalids) {
			expect(ExportFileSchema.safeParse(invalid).success).toBe(false);
			await expect(replaceDatabaseWithSnapshot(invalid)).rejects.toThrow();
			expect((await snapshot()).members).toEqual(before.members);
			expect((await snapshot()).relationships).toEqual(before.relationships);
		}
		await expect(replaceDatabaseWithSnapshot(before)).resolves.toBe(2);
		const failWrite = () => { throw new Error('write failed'); };
		getDB().relationships.hook('creating', failWrite);
		try {
			await expect(replaceDatabaseWithSnapshot(before)).rejects.toThrow('write failed');
		} finally {
			getDB().relationships.hook('creating').unsubscribe(failWrite);
		}
		expect((await snapshot()).members).toEqual(before.members);
		expect((await snapshot()).relationships).toEqual(before.relationships);
	});
});
