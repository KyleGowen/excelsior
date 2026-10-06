import { z } from 'zod';
const names = z.array(z.string().max(200)).max(1000);
const grouped = z.record(z.string().max(200),names);
export const ImportDeckRequestBody = z.object({name:z.string().trim().max(100),exportData:z.object({name:z.string().max(100).optional(),description:z.string().max(500).optional(),limited:z.boolean().optional(),reserve_character:z.string().max(200).nullable().optional(),cards:z.object({characters:names.optional(),special_cards:grouped.optional(),locations:names.optional(),battlegrounds:names.optional(),missions:grouped.optional(),events:grouped.optional(),aspects:names.optional(),advanced_universe:grouped.optional(),teamwork:names.optional(),allies:names.optional(),training:names.optional(),basic_universe:names.optional(),power_cards:names.optional()}).strict()}).passthrough()}).strict();
export type ImportDeckRequest = z.infer<typeof ImportDeckRequestBody>;
