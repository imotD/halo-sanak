import type { Member } from '$lib/schemas';

export type ReminderType = 'birthday' | 'death40' | 'death100';

export interface UpcomingEvent {
	memberId: string;
	memberName: string;
	gender: 'Laki-laki' | 'Perempuan';
	photoUrl?: string;
	type: ReminderType;
	date: Date;
	dateFormatted: string;
	daysRemaining: number; // 0 = hari ini, > 0 = N hari lagi
	label: string;
}

/**
 * Format helper: YYYY-MM-DD ke Date object lokal (jam 00:00:00).
 * Menolak format tanggal non-kalender atau tidak valid.
 */
export function parseDateOnly(dateString: string): Date | null {
	const trimmed = dateString.trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

	const parts = trimmed.split('-');
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	const day = parseInt(parts[2], 10);
	if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

	const date = new Date(year, month, day, 0, 0, 0, 0);
	// Pastikan tidak ada normalisasi bergeser (misal 31 Feb -> 3 Mar)
	if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
		return null;
	}
	return date;
}

/**
 * Menghitung selisih hari bulat kalender antara targetDate dan referenceDate.
 * Nilai positif: targetDate berada di masa depan atau hari ini.
 */
export function getDaysDiff(targetDate: Date, referenceDate: Date): number {
	const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
	const r = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
	const msPerDay = 24 * 60 * 60 * 1000;
	return Math.round((t - r) / msPerDay);
}

/**
 * Mendapatkan tanggal ulang tahun berikutnya untuk tahun berjalan atau tahun berikutnya.
 */
export function getNextBirthday(birthDate: Date, referenceDate: Date): Date {
	const currentYear = referenceDate.getFullYear();
	let bday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate(), 0, 0, 0, 0);

	// Jika tanggal ulang tahun tahun ini sudah lewat (hari kemarin atau sebelumnya), ambil tahun depan
	const diff = getDaysDiff(bday, referenceDate);
	if (diff < 0) {
		bday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate(), 0, 0, 0, 0);
	}
	return bday;
}

/**
 * Mendapatkan tanggal peringatan milestone wafat (hari ke-40 atau ke-100).
 * Menggunakan aturan kalender: targetDate = deathDate + N hari.
 */
export function getDeathMilestoneDate(deathDate: Date, days: number): Date {
	const res = new Date(deathDate.getTime());
	res.setDate(res.getDate() + days);
	return new Date(res.getFullYear(), res.getMonth(), res.getDate(), 0, 0, 0, 0);
}

/**
 * Mencari seluruh acara (ulang tahun anggota hidup & peringatan hari ke-40 / ke-100 anggota wafat)
 * dalam rentang [0 .. withinDays] dari referenceDate.
 * PRD v2 §2.2:
 * - Hanya anggota hidup dengan tanggal lahir presisi lengkap ('full')
 * - Hanya anggota wafat dengan tanggal wafat presisi lengkap ('full')
 * - Tidak ada reminder susulan untuk momen yang sudah lewat (daysRemaining < 0 dilewati)
 */
export function getUpcomingEvents(
	members: Member[],
	referenceDate: Date = new Date(),
	withinDays: number = 7
): UpcomingEvent[] {
	const events: UpcomingEvent[] = [];

	for (const member of members) {
		// 1. Ulang Tahun (Anggota hidup + birthDate precision 'full')
		if (!member.isDeceased && member.birthDate?.precision === 'full') {
			const bdate = parseDateOnly(member.birthDate.value);
			if (bdate) {
				const nextBday = getNextBirthday(bdate, referenceDate);
				const diff = getDaysDiff(nextBday, referenceDate);
				if (diff >= 0 && diff <= withinDays) {
					const age = nextBday.getFullYear() - bdate.getFullYear();
					events.push({
						memberId: member.id,
						memberName: member.fullName,
						gender: member.gender,
						photoUrl: member.photoUrl,
						type: 'birthday',
						date: nextBday,
						dateFormatted: nextBday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }),
						daysRemaining: diff,
						label: diff === 0 ? `Ulang tahun ke-${age} hari ini` : `Ulang tahun ke-${age} dalam ${diff} hari`
					});
				}
			}
		}

		// 2. Peringatan Wafat 40 hari & 100 hari (Anggota wafat + deathDate precision 'full')
		if (member.isDeceased && member.deathDate?.precision === 'full') {
			const ddate = parseDateOnly(member.deathDate.value);
			if (ddate) {
				// Milestone 40 hari
				const date40 = getDeathMilestoneDate(ddate, 40);
				const diff40 = getDaysDiff(date40, referenceDate);
				if (diff40 >= 0 && diff40 <= withinDays) {
					events.push({
						memberId: member.id,
						memberName: member.fullName,
						gender: member.gender,
						photoUrl: member.photoUrl,
						type: 'death40',
						date: date40,
						dateFormatted: date40.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }),
						daysRemaining: diff40,
						label: diff40 === 0 ? 'Peringatan 40 hari wafat hari ini' : `Peringatan 40 hari wafat dalam ${diff40} hari`
					});
				}

				// Milestone 100 hari
				const date100 = getDeathMilestoneDate(ddate, 100);
				const diff100 = getDaysDiff(date100, referenceDate);
				if (diff100 >= 0 && diff100 <= withinDays) {
					events.push({
						memberId: member.id,
						memberName: member.fullName,
						gender: member.gender,
						photoUrl: member.photoUrl,
						type: 'death100',
						date: date100,
						dateFormatted: date100.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }),
						daysRemaining: diff100,
						label: diff100 === 0 ? 'Peringatan 100 hari wafat hari ini' : `Peringatan 100 hari wafat dalam ${diff100} hari`
					});
				}
			}
		}
	}

	// Urut berdasarkan hari terdekat (daysRemaining terkecil) lalu nama A-Z
	return events.sort((a, b) => {
		if (a.daysRemaining !== b.daysRemaining) {
			return a.daysRemaining - b.daysRemaining;
		}
		return a.memberName.localeCompare(b.memberName, 'id');
	});
}
