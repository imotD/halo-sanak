import { describe, it, expect } from 'vitest';
import { calculateAge, getAgeInfo } from '../../src/lib/domain/age';

describe('calculateAge', () => {
	const fixedNow = new Date('2026-06-15T00:00:00Z');

	it('mengembalikan null jika birthDate tidak ada atau presisi hanya year', () => {
		expect(calculateAge(undefined, false, undefined, fixedNow)).toBeNull();
		expect(calculateAge({ precision: 'year', value: '1990' }, false, undefined, fixedNow)).toBeNull();
	});

	it('mengembalikan null jika presisi full tapi value bukan string tanggal lengkap (hindari number terinterpretasi sebagai epoch)', () => {
		// value diberikan sebagai number - harus ditolak
		expect(calculateAge({ precision: 'full', value: 19900110 as any }, false, undefined, fixedNow)).toBeNull();
	});

	it('menghitung umur tepat jika masih hidup dan presisi full', () => {
		// Lahir 1990-01-10 -> umur 36 pada 2026-06-15
		const age = calculateAge({ precision: 'full', value: '1990-01-10' }, false, undefined, fixedNow);
		expect(age).toBe(36);

		// Belum ulang tahun di tahun berjalan: lahir 1990-08-20 -> umur 35
		const ageBeforeBirthday = calculateAge(
			{ precision: 'full', value: '1990-08-20' },
			false,
			undefined,
			fixedNow
		);
		expect(ageBeforeBirthday).toBe(35);
	});

	it('menghitung umur saat wafat jika status wafat dan tanggal wafat presisi full', () => {
		// Lahir 1950-05-10, wafat 2010-05-15 -> umur 60 saat wafat
		const age = calculateAge(
			{ precision: 'full', value: '1950-05-10' },
			true,
			{ precision: 'full', value: '2010-05-15' },
			fixedNow
		);
		expect(age).toBe(60);
	});

	it('mengembalikan null jika wafat tapi tanggal wafat hanya berpresisi year', () => {
		const age = calculateAge(
			{ precision: 'full', value: '1950-05-10' },
			true,
			{ precision: 'year', value: '2010' },
			fixedNow
		);
		expect(age).toBeNull();
	});
});

describe('getAgeInfo', () => {
	const fixedNow = new Date('2026-06-15T00:00:00Z');

	it('mengembalikan umur pasti dengan isEstimated: false jika tanggal lahir lengkap', () => {
		const info = getAgeInfo({ precision: 'full', value: '1975-03-12' }, false, undefined, fixedNow);
		expect(info).toEqual({ age: 51, isEstimated: false });
	});

	it('mengembalikan estimasi umur dengan isEstimated: true jika presisi tahun saja', () => {
		const info = getAgeInfo({ precision: 'year', value: '1950' }, false, undefined, fixedNow);
		// 2026 - 1950 = 76
		expect(info).toEqual({ age: 76, isEstimated: true });
	});

	it('mengembalikan estimasi umur jika value tahun diberikan sebagai number', () => {
		const info = getAgeInfo({ precision: 'year', value: 1950 as any }, false, undefined, fixedNow);
		// harus tetap menghasilkan estimasi 76
		expect(info).toEqual({ age: 76, isEstimated: true });
	});

	it('mengembalikan estimasi umur saat wafat jika data wafat berpresisi tahun', () => {
		const info = getAgeInfo(
			{ precision: 'year', value: '1950' },
			true,
			{ precision: 'year', value: '2018' },
			fixedNow
		);
		// 2018 - 1950 = 68
		expect(info).toEqual({ age: 68, isEstimated: true });
	});

	it('mengembalikan null jika wafat tanpa data tanggal wafat sama sekali', () => {
		const info = getAgeInfo({ precision: 'year', value: '1950' }, true, undefined, fixedNow);
		expect(info).toBeNull();
	});
});
