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
	// Hanya terima tanggal lengkap berformat 'YYYY-MM-DD'
	if (!birthDate || birthDate.precision !== 'full') {
		return null;
	}

	// Validasi format string agar tidak menginterpretasikan number sebagai epoch ms
	const birthVal = String(birthDate.value ?? '').trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(birthVal)) return null;

	const birth = new Date(birthVal);
	if (isNaN(birth.getTime())) {
		return null;
	}

	let targetDate: Date;
	if (isDeceased) {
		if (!deathDate || deathDate.precision !== 'full') {
			return null;
		}
		const deathVal = String(deathDate.value ?? '').trim();
		if (!/^\d{4}-\d{2}-\d{2}$/.test(deathVal)) return null;
		targetDate = new Date(deathVal);
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
	// Terima `value` sebagai string atau number — normalisasi ke string lalu ambil 4 digit pertama
	const birthValStr = String(birthDate.value ?? '').trim();
	const birthMatch = birthValStr.match(/^(\d{4})/);
	if (!birthMatch) return null;
	const birthYear = parseInt(birthMatch[1], 10);
	if (isNaN(birthYear) || birthYear <= 0) {
		return null;
	}

	let targetYear: number;
	if (isDeceased) {
		if (!deathDate || !deathDate.value) {
			return null; // wafat tanpa tahun wafat tidak diestimasi
		}
		const deathValStr = String(deathDate.value ?? '').trim();
		const deathMatch = deathValStr.match(/^(\d{4})/);
		if (!deathMatch) return null;
		targetYear = parseInt(deathMatch[1], 10);
		if (isNaN(targetYear) || targetYear <= 0) {
			return null;
		}
	} else {
		targetYear = now.getFullYear();
	}

	const estimatedAge = targetYear - birthYear;
	return estimatedAge >= 0 ? { age: estimatedAge, isEstimated: true } : null;
}
