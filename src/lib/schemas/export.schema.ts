import { z } from 'zod';
import { MemberSchema } from './member.schema';
import { RelationshipSchema } from './relationship.schema';

export const ExportFileSchema = z.object({
	app: z.literal('halosanak'),
	version: z.number().int().positive(),
	exportedAt: z.string(),
	members: z.array(MemberSchema),
	relationships: z.array(RelationshipSchema)
});
export type ExportFile = z.infer<typeof ExportFileSchema>;
