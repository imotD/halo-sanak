import { z } from 'zod';

export const RelationshipTypeSchema = z.enum(['parent-child', 'spouse']);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const RelationshipSchema = z.object({
	id: z.string().uuid(),
	type: RelationshipTypeSchema,
	fromMemberId: z.string().uuid(),
	toMemberId: z.string().uuid(),
	role: z.enum(['father', 'mother', 'spouse']).optional(),
	createdAt: z.number()
});
export type Relationship = z.infer<typeof RelationshipSchema>;
