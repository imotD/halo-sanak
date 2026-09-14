import Dexie, { type EntityTable } from 'dexie';
import type { Member, Relationship } from '$lib/schemas';

export class HaloSanakDB extends Dexie {
	members!: EntityTable<Member, 'id'>;
	relationships!: EntityTable<Relationship, 'id'>;

	constructor(dbName = 'HaloSanakDatabase') {
		super(dbName);
		this.version(1).stores({
			members: 'id, fullName, gender, domicile, isDeceased, createdAt',
			relationships: 'id, type, fromMemberId, toMemberId, [fromMemberId+toMemberId], [type+fromMemberId]'
		});
	}
}
