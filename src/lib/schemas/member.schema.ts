import { z } from 'zod';

export const GenderSchema = z.enum(['Laki-laki', 'Perempuan']);
export type Gender = z.infer<typeof GenderSchema>;

export const DatePrecisionSchema = z.enum(['full', 'year']);
export type DatePrecision = z.infer<typeof DatePrecisionSchema>;

export const FuzzyDateSchema = z.object({
	precision: DatePrecisionSchema,
	// Format 'YYYY-MM-DD' bila precision 'full', atau 'YYYY' bila precision 'year'
	value: z.string().min(4)
});
export type FuzzyDate = z.infer<typeof FuzzyDateSchema>;

export const MemberSchema = z.object({
	id: z.string().uuid(),
	fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
	gender: GenderSchema,
	domicile: z.string().trim().min(1, 'Domisili wajib diisi'),
	photoUrl: z.string().optional(), // WebP base64 / blob data url
	birthDate: FuzzyDateSchema.optional(),
	isDeceased: z.boolean().default(false),
	deathDate: FuzzyDateSchema.optional(),
	occupation: z.string().trim().optional(),
	description: z.string().trim().max(1000, 'Deskripsi maksimum 1000 karakter').optional(),
	createdAt: z.number(),
	updatedAt: z.number()
});
export type Member = z.infer<typeof MemberSchema>;
