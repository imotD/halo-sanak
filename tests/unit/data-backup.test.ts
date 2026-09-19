import { describe, it, expect } from 'vitest';
import { ExportFileSchema } from '../../src/lib/schemas';
import { SAMPLE_FAMILY_SNAPSHOT } from '../../src/lib/features/settings/sample-data';

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

	it('memverifikasi bahwa SAMPLE_FAMILY_SNAPSHOT lolos validasi skema 100%', () => {
		const result = ExportFileSchema.safeParse(SAMPLE_FAMILY_SNAPSHOT);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.members).toHaveLength(6);
			expect(result.data.relationships).toHaveLength(10);
		}
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

	it('menerima file snapshot v1 (tanpa field birthOrder) dengan kompatibilitas penuh', () => {
		const snapshotV1 = {
			app: 'halosanak',
			version: 1,
			exportedAt: '2026-09-14T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440001',
					fullName: 'Ayah Rudi',
					gender: 'Laki-laki',
					domicile: 'Padang',
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: []
		};

		const result = ExportFileSchema.safeParse(snapshotV1);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.version).toBe(1);
			expect(result.data.members[0].birthOrder).toBeUndefined();
		}
	});

	it('menerima file snapshot v2 dengan field birthOrder yang valid', () => {
		const snapshotV2 = {
			app: 'halosanak',
			version: 2,
			exportedAt: '2026-09-17T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440002',
					fullName: 'Anak Sulung',
					gender: 'Laki-laki',
					domicile: 'Padang',
					birthOrder: 1,
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: []
		};

		const result = ExportFileSchema.safeParse(snapshotV2);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.version).toBe(2);
			expect(result.data.members[0].birthOrder).toBe(1);
		}
	});

	it('menolak file jika birthOrder bukan angka bulat positif (0, negatif, pecahan)', () => {
		const invalidOrders = [0, -1, 1.5];
		for (const order of invalidOrders) {
			const invalid = {
				app: 'halosanak',
				version: 2,
				exportedAt: '2026-09-17T00:00:00.000Z',
				members: [
					{
						id: '550e8400-e29b-41d4-a716-446655440003',
						fullName: 'Test Member',
						gender: 'Laki-laki',
						domicile: 'Padang',
						birthOrder: order,
						isDeceased: false,
						createdAt: 1000,
						updatedAt: 1000
					}
				],
				relationships: []
			};
			const result = ExportFileSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		}
	});

	it('menolak file jika integritas graph rusak (relasi merujuk ke ID anggota yang tidak ada)', () => {
		const danglingRel = {
			app: 'halosanak',
			version: 2,
			exportedAt: '2026-09-17T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440001',
					fullName: 'Ahmad',
					gender: 'Laki-laki',
					domicile: 'Padang',
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: [
				{
					id: '550e8400-e29b-41d4-a716-446655440099',
					fromMemberId: '550e8400-e29b-41d4-a716-446655440001',
					toMemberId: '550e8400-e29b-41d4-a716-446655440999', // Tidak ada di members
					type: 'parent-child',
					role: 'father',
					createdAt: 1000
				}
			]
		};

		const result = ExportFileSchema.safeParse(danglingRel);
		expect(result.success).toBe(false);
	});

	it('menolak file jika tanggal tidak sesuai kalender yang valid (misal 2026-02-31)', () => {
		const invalidCalendarDate = {
			app: 'halosanak',
			version: 2,
			exportedAt: '2026-09-17T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440001',
					fullName: 'Ahmad',
					gender: 'Laki-laki',
					domicile: 'Padang',
					birthDate: { precision: 'full', value: '2026-02-31' },
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: []
		};

		const result = ExportFileSchema.safeParse(invalidCalendarDate);
		expect(result.success).toBe(false);
	});

	it('menerima backup v1 dengan relasi tanpa field role dan tanggal tahun 0001-0099', () => {
		const validV1WithRelationships = {
			app: 'halosanak',
			version: 1,
			exportedAt: '2026-09-17T00:00:00.000Z',
			members: [
				{
					id: '550e8400-e29b-41d4-a716-446655440001',
					fullName: 'Ayah Kuno',
					gender: 'Laki-laki',
					domicile: 'Padang',
					birthDate: { precision: 'full', value: '0050-05-15' },
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				},
				{
					id: '550e8400-e29b-41d4-a716-446655440002',
					fullName: 'Ibu Kuno',
					gender: 'Perempuan',
					domicile: 'Padang',
					birthDate: { precision: 'full', value: '0055-08-20' },
					isDeceased: false,
					createdAt: 1000,
					updatedAt: 1000
				}
			],
			relationships: [
				{
					id: '550e8400-e29b-41d4-a716-446655440003',
					fromMemberId: '550e8400-e29b-41d4-a716-446655440001',
					toMemberId: '550e8400-e29b-41d4-a716-446655440002',
					type: 'spouse',
					createdAt: 1000
				},
				{
					id: '550e8400-e29b-41d4-a716-446655440004',
					fromMemberId: '550e8400-e29b-41d4-a716-446655440002',
					toMemberId: '550e8400-e29b-41d4-a716-446655440001',
					type: 'spouse',
					createdAt: 1000
				}
			]
		};

		const result = ExportFileSchema.safeParse(validV1WithRelationships);
		expect(result.success).toBe(true);
	});
});
