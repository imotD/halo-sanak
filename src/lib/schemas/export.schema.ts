import { z } from 'zod';
import { MemberSchema } from './member.schema';
import { RelationshipSchema } from './relationship.schema';
import { isValidFamilyGraph } from '$lib/domain/relations';
import { UI_STRINGS } from '$lib/strings';

export const SUPPORTED_BACKUP_VERSIONS = [1, 2] as const;
export const CURRENT_BACKUP_VERSION = 2;

export const ExportFileSchema = z.object({
	app: z.literal('halosanak'),
	version: z.union([z.literal(1), z.literal(2)]),
	exportedAt: z.string(),
	members: z.array(MemberSchema),
	relationships: z.array(RelationshipSchema)
}).refine((data) => isValidFamilyGraph(data.members, data.relationships), {
	message: UI_STRINGS.errors.invalidGraph
});
export type ExportFile = z.infer<typeof ExportFileSchema>;
