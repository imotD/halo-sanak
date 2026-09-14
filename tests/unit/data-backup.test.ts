import { describe, it, expect } from 'vitest';
import { ExportFileSchema } from '../../src/lib/schemas';

describe('Data Backup & Schema Validation Unit Test', () => {
	it('memvalidasi skema ExportFile yang valid', () => {
		const validData = {
			app: 'halosanak',
			version: 1,
			exportedAt: '2026-09-14T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					fullName: 'Ahmad',
					gender: 'Laki-laki',
					domicile: 'Padang',
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: []
		};

		const result = ExportFileSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('menolak file jika penanda app bukan "halosanak"', () => {
		const invalidApp = {
			app: 'other-app',
			version: 1,
			exportedAt: '2026-09-14T00:00:00.000Z',
			members: [],
			relationships: []
		};

		const result = ExportFileSchema.safeParse(invalidApp);
		expect(result.success).toBe(false);
	});

	it('menolak file jika field wajib anggota (gender) hilang atau invalid', () => {
		const invalidMember = {
			app: 'halosanak',
			version: 1,
			exportedAt: '2026-09-14T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					fullName: 'Ahmad',
					gender: 'UnknownGender',
					domicile: 'Padang',
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: []
		};

		const result = ExportFileSchema.safeParse(invalidMember);
		expect(result.success).toBe(false);
	});
});
