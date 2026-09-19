import { describe, it, expect } from 'vitest';
import type { Member } from '../../src/lib/schemas';
import {
	parseDateOnly,
	getDaysDiff,
	getNextBirthday,
	getDeathMilestoneDate,
	getUpcomingEvents
} from '../../src/lib/domain/reminders';

function makeMember(overrides: Partial<Member> & { id: string; fullName: string; gender: 'Laki-laki' | 'Perempuan' }): Member {
	return {
		domicile: 'Padang',
		isDeceased: false,
		createdAt: 1000,
		updatedAt: 1000,
		...overrides
	};
}

describe('Reminders Domain Unit Tests (PRD v2 §2.2)', () => {
	const refDate = new Date(2026, 8, 17, 10, 0, 0, 0); // 17 September 2026

	describe('parseDateOnly & getDaysDiff', () => {
		it('mengurai string YYYY-MM-DD ke Date object', () => {
			const d = parseDateOnly('2026-09-17');
			expect(d).not.toBeNull();
			expect(d?.getFullYear()).toBe(2026);
			expect(d?.getMonth()).toBe(8); // September (0-indexed)
			expect(d?.getDate()).toBe(17);
		});

		it('menolak string tanggal yang tidak valid atau tanggal kalender mustahil', () => {
			expect(parseDateOnly('1980')).toBeNull();
			expect(parseDateOnly('')).toBeNull();
			expect(parseDateOnly('2026-02-31')).toBeNull(); // Februari tidak sampai 31
			expect(parseDateOnly('2026-13-01')).toBeNull(); // Bulan 13 mustahil
			expect(parseDateOnly('2026-04-31')).toBeNull(); // April hanya 30 hari
		});

		it('menghitung selisih hari dengan akurat', () => {
			const d1 = new Date(2026, 8, 20);
			const d2 = new Date(2026, 8, 17);
			expect(getDaysDiff(d1, d2)).toBe(3);
			expect(getDaysDiff(d2, d1)).toBe(-3);
		});
	});

	describe('getNextBirthday', () => {
		it('mengambil ulang tahun tahun ini jika belum lewat', () => {
			const birth = new Date(1990, 8, 20); // 20 September
			const nextBday = getNextBirthday(birth, refDate); // ref: 17 September 2026
			expect(nextBday.getFullYear()).toBe(2026);
			expect(nextBday.getMonth()).toBe(8);
			expect(nextBday.getDate()).toBe(20);
		});

		it('mengambil ulang tahun tahun berikutnya jika tahun ini sudah lewat', () => {
			const birth = new Date(1990, 8, 10); // 10 September
			const nextBday = getNextBirthday(birth, refDate); // ref: 17 September 2026
			expect(nextBday.getFullYear()).toBe(2027);
			expect(nextBday.getMonth()).toBe(8);
			expect(nextBday.getDate()).toBe(10);
		});
	});

	describe('getDeathMilestoneDate', () => {
		it('menghitung tepat 40 hari setelah tanggal wafat', () => {
			const death = new Date(2026, 7, 8); // 8 Agustus 2026
			const milestone40 = getDeathMilestoneDate(death, 40);
			// 8 Agustus + 40 hari = 17 September (Agustus 31 hari -> 8+23=31, sisa 17 hari di September)
			expect(milestone40.getFullYear()).toBe(2026);
			expect(milestone40.getMonth()).toBe(8); // September
			expect(milestone40.getDate()).toBe(17);
		});

		it('menghitung tepat 100 hari setelah tanggal wafat', () => {
			const death = new Date(2026, 5, 9); // 9 Juni 2026
			const milestone100 = getDeathMilestoneDate(death, 100);
			// Juni 30 hari (sisa 21), Juli 31 hari, Agustus 31 hari, September 17 hari (21+31+31+17 = 100)
			expect(milestone100.getFullYear()).toBe(2026);
			expect(milestone100.getMonth()).toBe(8);
			expect(milestone100.getDate()).toBe(17);
		});
	});

	describe('getUpcomingEvents', () => {
		it('menemukan ulang tahun dalam rentang 7 hari', () => {
			const m1 = makeMember({
				id: 'm1',
				fullName: 'Budi Ulang Tahun Hari Ini',
				gender: 'Laki-laki',
				birthDate: { precision: 'full', value: '1995-09-17' }
			});
			const m2 = makeMember({
				id: 'm2',
				fullName: 'Siti Ulang Tahun 3 Hari Lagi',
				gender: 'Perempuan',
				birthDate: { precision: 'full', value: '1998-09-20' }
			});
			const m3 = makeMember({
				id: 'm3',
				fullName: 'Joko Ulang Tahun Lewat',
				gender: 'Laki-laki',
				birthDate: { precision: 'full', value: '1992-09-10' }
			});
			const m4YearOnly = makeMember({
				id: 'm4',
				fullName: 'Tahun Saja',
				gender: 'Laki-laki',
				birthDate: { precision: 'year', value: '1995' }
			});

			const events = getUpcomingEvents([m1, m2, m3, m4YearOnly], refDate, 7);
			expect(events).toHaveLength(2);
			expect(events[0].memberName).toBe('Budi Ulang Tahun Hari Ini');
			expect(events[0].daysRemaining).toBe(0);
			expect(events[1].memberName).toBe('Siti Ulang Tahun 3 Hari Lagi');
			expect(events[1].daysRemaining).toBe(3);
		});

		it('menemukan peringatan wafat 40 hari dan 100 hari dalam rentang', () => {
			const deceased40 = makeMember({
				id: 'd1',
				fullName: 'Almarhum Kakek (40 Hari)',
				gender: 'Laki-laki',
				isDeceased: true,
				deathDate: { precision: 'full', value: '2026-08-08' }
			});
			const deceased100 = makeMember({
				id: 'd2',
				fullName: 'Almarhum Nenek (100 Hari)',
				gender: 'Perempuan',
				isDeceased: true,
				deathDate: { precision: 'full', value: '2026-06-09' }
			});
			const deceasedYearOnly = makeMember({
				id: 'd3',
				fullName: 'Wafat Tahun Saja',
				gender: 'Laki-laki',
				isDeceased: true,
				deathDate: { precision: 'year', value: '2026' }
			});

			const events = getUpcomingEvents([deceased40, deceased100, deceasedYearOnly], refDate, 7);
			expect(events).toHaveLength(2);
			expect(events[0].type).toBe('death40');
			expect(events[0].daysRemaining).toBe(0);
			expect(events[1].type).toBe('death100');
			expect(events[1].daysRemaining).toBe(0);
		});

		it('mengabaikan momen yang sudah lewat (tanpa reminder susulan)', () => {
			const deceasedPassed = makeMember({
				id: 'dp',
				fullName: 'Wafat Sudah Lewat 40 Hari',
				gender: 'Laki-laki',
				isDeceased: true,
				deathDate: { precision: 'full', value: '2026-01-01' }
			});

			const events = getUpcomingEvents([deceasedPassed], refDate, 7);
			expect(events).toHaveLength(0);
		});
	});
});
