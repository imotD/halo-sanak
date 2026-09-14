import type { ExportFile } from '$lib/schemas';

/**
 * Snapshot silsilah keluarga 3 generasi untuk uji coba interaktif / demo.
 * Semua ID member dan relationship menggunakan format UUID v4 valid.
 */
export const SAMPLE_FAMILY_SNAPSHOT: ExportFile = {
	app: 'halosanak',
	version: 1,
	exportedAt: new Date().toISOString(),
	members: [
		// Generasi 0: Kakek & Nenek
		{
			id: '10000000-0000-4000-8000-000000000001',
			fullName: 'Haji Abdullah',
			gender: 'Laki-laki',
			domicile: 'Bukittinggi',
			birthDate: { precision: 'full', value: '1945-08-17' },
			isDeceased: true,
			deathDate: { precision: 'full', value: '2018-05-20' },
			occupation: 'Pensiunan Guru',
			description: 'Kakek buyut keluarga besar garis ayah.',
			createdAt: 1000,
			updatedAt: 1000
		},
		{
			id: '10000000-0000-4000-8000-000000000002',
			fullName: 'Hajjah Siti Maryam',
			gender: 'Perempuan',
			domicile: 'Bukittinggi',
			birthDate: { precision: 'year', value: '1950' },
			isDeceased: false,
			occupation: 'Ibu Rumah Tangga',
			description: 'Nenek tercinta penghubung silaturahmi sanak saudara.',
			createdAt: 1000,
			updatedAt: 1000
		},
		// Generasi 1: Ayah & Ibu
		{
			id: '20000000-0000-4000-8000-000000000001',
			fullName: 'Rahmatullah Abdullah',
			gender: 'Laki-laki',
			domicile: 'Padang',
			birthDate: { precision: 'full', value: '1975-03-12' },
			isDeceased: false,
			occupation: 'Wiraswasta',
			description: 'Anak sulung Haji Abdullah.',
			createdAt: 2000,
			updatedAt: 2000
		},
		{
			id: '20000000-0000-4000-8000-000000000002',
			fullName: 'Nurlela',
			gender: 'Perempuan',
			domicile: 'Padang',
			birthDate: { precision: 'full', value: '1978-11-24' },
			isDeceased: false,
			occupation: 'Dosen',
			createdAt: 2000,
			updatedAt: 2000
		},
		// Generasi 2: Anak-anak
		{
			id: '30000000-0000-4000-8000-000000000001',
			fullName: 'Farhan Rahmatullah',
			gender: 'Laki-laki',
			domicile: 'Jakarta',
			birthDate: { precision: 'full', value: '2002-06-10' },
			isDeceased: false,
			occupation: 'Software Engineer',
			description: 'Anak sulung.',
			createdAt: 3000,
			updatedAt: 3000
		},
		{
			id: '30000000-0000-4000-8000-000000000002',
			fullName: 'Aisyah Rahmatullah',
			gender: 'Perempuan',
			domicile: 'Padang',
			birthDate: { precision: 'full', value: '2006-09-15' },
			isDeceased: false,
			occupation: 'Mahasiswa',
			createdAt: 3000,
			updatedAt: 3000
		}
	],
	relationships: [
		// Spouse: Kakek & Nenek
		{
			id: 'a0000000-0000-4000-8000-000000000001',
			type: 'spouse',
			fromMemberId: '10000000-0000-4000-8000-000000000001',
			toMemberId: '10000000-0000-4000-8000-000000000002',
			role: 'spouse',
			createdAt: 1000
		},
		{
			id: 'a0000000-0000-4000-8000-000000000002',
			type: 'spouse',
			fromMemberId: '10000000-0000-4000-8000-000000000002',
			toMemberId: '10000000-0000-4000-8000-000000000001',
			role: 'spouse',
			createdAt: 1000
		},
		// Parent-Child: Kakek/Nenek -> Ayah
		{
			id: 'a0000000-0000-4000-8000-000000000003',
			type: 'parent-child',
			fromMemberId: '10000000-0000-4000-8000-000000000001',
			toMemberId: '20000000-0000-4000-8000-000000000001',
			role: 'father',
			createdAt: 2000
		},
		{
			id: 'a0000000-0000-4000-8000-000000000004',
			type: 'parent-child',
			fromMemberId: '10000000-0000-4000-8000-000000000002',
			toMemberId: '20000000-0000-4000-8000-000000000001',
			role: 'mother',
			createdAt: 2000
		},
		// Spouse: Ayah & Ibu
		{
			id: 'a0000000-0000-4000-8000-000000000005',
			type: 'spouse',
			fromMemberId: '20000000-0000-4000-8000-000000000001',
			toMemberId: '20000000-0000-4000-8000-000000000002',
			role: 'spouse',
			createdAt: 2000
		},
		{
			id: 'a0000000-0000-4000-8000-000000000006',
			type: 'spouse',
			fromMemberId: '20000000-0000-4000-8000-000000000002',
			toMemberId: '20000000-0000-4000-8000-000000000001',
			role: 'spouse',
			createdAt: 2000
		},
		// Parent-Child: Ayah/Ibu -> Farhan
		{
			id: 'a0000000-0000-4000-8000-000000000007',
			type: 'parent-child',
			fromMemberId: '20000000-0000-4000-8000-000000000001',
			toMemberId: '30000000-0000-4000-8000-000000000001',
			role: 'father',
			createdAt: 3000
		},
		{
			id: 'a0000000-0000-4000-8000-000000000008',
			type: 'parent-child',
			fromMemberId: '20000000-0000-4000-8000-000000000002',
			toMemberId: '30000000-0000-4000-8000-000000000001',
			role: 'mother',
			createdAt: 3000
		},
		// Parent-Child: Ayah/Ibu -> Aisyah
		{
			id: 'a0000000-0000-4000-8000-000000000009',
			type: 'parent-child',
			fromMemberId: '20000000-0000-4000-8000-000000000001',
			toMemberId: '30000000-0000-4000-8000-000000000002',
			role: 'father',
			createdAt: 3000
		},
		{
			id: 'a0000000-0000-4000-8000-000000000010',
			type: 'parent-child',
			fromMemberId: '20000000-0000-4000-8000-000000000002',
			toMemberId: '30000000-0000-4000-8000-000000000002',
			role: 'mother',
			createdAt: 3000
		}
	]
};
