import { z } from 'zod';

export const GenderSchema = z.enum(['Laki-laki', 'Perempuan']);
export type Gender = z.infer<typeof GenderSchema>;

export const DatePrecisionSchema = z.enum(['full', 'year']);
export type DatePrecision = z.infer<typeof DatePrecisionSchema>;

export const FuzzyDateSchema = z
	.object({
		precision: DatePrecisionSchema,
		// Format 'YYYY-MM-DD' bila precision 'full', atau 'YYYY' bila precision 'year'
		value: z.string().trim()
	})
	.refine(
		(d) => {
			if (d.precision === 'year') {
				return /^\d{4}$/.test(d.value);
			}
			// precision === 'full' -> YYYY-MM-DD kalender valid
			if (!/^\d{4}-\d{2}-\d{2}$/.test(d.value)) {
				return false;
			}
			const [yStr, mStr, dStr] = d.value.split('-');
			const y = parseInt(yStr, 10);
			const m = parseInt(mStr, 10);
			const day = parseInt(dStr, 10);
			if (m < 1 || m > 12 || day < 1 || day > 31) return false;
			const date = new Date(y, m - 1, day);
			date.setFullYear(y);
			return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === day;
		},
		{ message: 'Format atau nilai tanggal tidak valid' }
	);
export type FuzzyDate = z.infer<typeof FuzzyDateSchema>;

export const MemberSchema = z.object({
	id: z.string().uuid(),
	fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
	gender: GenderSchema,
	domicile: z.string().trim().min(1, 'Domisili wajib diisi'),
	photoUrl: z.string().optional(), // WebP base64 / blob data url
	birthDate: FuzzyDateSchema.optional(),
	birthOrder: z.number().int().positive('Anak ke-berapa harus angka bulat positif').optional(),
	isDeceased: z.boolean().default(false),
	deathDate: FuzzyDateSchema.optional(),
	occupation: z.string().trim().optional(),
	description: z.string().trim().max(1000, 'Deskripsi maksimum 1000 karakter').optional(),
	createdAt: z.number(),
	updatedAt: z.number()
});
export type Member = z.infer<typeof MemberSchema>;
