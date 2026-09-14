import { browser } from '$app/environment';
import { HaloSanakDB } from './schema';

let dbInstance: HaloSanakDB | null = null;

export function getDB(): HaloSanakDB {
	if (!browser) {
		throw new Error('Database hanya boleh diakses di browser runtime (SSR guard).');
	}
	if (!dbInstance) {
		dbInstance = new HaloSanakDB();
	}
	return dbInstance;
}

export { HaloSanakDB };
