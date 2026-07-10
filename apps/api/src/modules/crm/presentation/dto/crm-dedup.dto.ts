/**
 * @module crm-dedup.dto
 * @description DTO + Zod schema for the lead-merge request body.
 */

import { z } from 'zod';

export const MergeLeadsDtoSchema = z.object({
  canonicalLeadId: z.number().int().positive(),
  duplicateLeadId: z.number().int().positive(),
});
export type MergeLeadsDto = z.infer<typeof MergeLeadsDtoSchema>;
