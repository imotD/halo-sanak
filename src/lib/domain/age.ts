import type { FuzzyDate } from '$lib/schemas';

export interface AgeInfo {
	age: number;
	isEstimated: boolean;
}

/**
 * Menghitung umur pasti berdasarkan PRD §6:
 * - Hanya dihitung jika birthDate memiliki presisi 'full' (YYYY-MM-DD).
 * - Jika hidup: umur saat ini.
 * - Jika wafat: hanya jika deathDate presisi 'full', hitung umur saat wafat.
 * - Jika birthDate precision 'year' atau deathDate precision 'year' saat wafat -> return null.
 */
export function calculateAge(
	birthDate?: FuzzyDate,
	isDeceased = false,
	deathDate?: FuzzyDate,
	now: Date = new Date()
): number | null {
	if (!birthDate || birthDate.precision !== 'full') {
		return null;
	}

	const birth = new Date(birthDate.value);
	if (isNaN(birth.getTime())) {
		return null;
	}

	let targetDate: Date;
	if (isDeceased) {
		if (!deathDate || deathDate.precision !== 'full') {
			return null;
		}
		targetDate = new Date(deathDate.value);
		if (isNaN(targetDate.getTime())) {
			return null;
		}
	} else {
		targetDate = now;
	}

	let age = targetDate.getFullYear() - birth.getFullYear();
	const m = targetDate.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && targetDate.getDate() < birth.getDate())) {
		age--;
	}

	return age >= 0 ? age : 0;
}

/**
 * Menghitung informasi umur untuk tampilan UI:
 * - Mengembalikan umur pasti jika data tanggal lengkap.
 * - Mengembalikan estimasi umur (berdasarkan tahun, prefix ~) jika tanggal lahir hanya diketahui tahunnya.
 */
export function getAgeInfo(
	birthDate?: FuzzyDate,
	isDeceased = false,
	deathDate?: FuzzyDate,
	now: Date = new Date()
): AgeInfo | null {
	if (!birthDate || !birthDate.value) {
		return null;
	}

	// 1. Coba hitung umur pasti jika presisi full
	const exactAge = calculateAge(birthDate, isDeceased, deathDate, now);
	if (exactAge !== null) {
		return { age: exactAge, isEstimated: false };
	}

	// 2. Jika presisi tahun, hitung estimasi selisih tahun
	const birthYear = parseInt(birthDate.value.slice(0, 4), 10);
	if (isNaN(birthYear) || birthYear <= 0) {
		return null;
	}

	let targetYear: number;
	if (isDeceased) {
		if (!deathDate || !deathDate.value) {
			return null; // wafat tanpa tahun wafat tidak diestimasi
		}
		targetYear = parseInt(deathDate.value.slice(0, 4), 10);
		if (isNaN(targetYear) || targetYear <= 0) {
			return null;
		}
	} else {
		targetYear = now.getFullYear();
	}

	const estimatedAge = targetYear - birthYear;
	return estimatedAge >= 0 ? { age: estimatedAge, isEstimated: true } : null;
}
