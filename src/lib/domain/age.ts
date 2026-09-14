import type { FuzzyDate } from '$lib/schemas';

/**
 * Menghitung umur berdasarkan PRD §6:
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
