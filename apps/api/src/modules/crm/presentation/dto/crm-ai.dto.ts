import { z } from 'zod';

export const CrmAiContextDtoSchema = z.record(z.string(), z.unknown());
export type CrmAiContextDto = z.infer<typeof CrmAiContextDtoSchema>;

export const CrmAiSuggestActionDtoSchema = z.object({
  lead_id: z.number().int().positive().optional(),
  deal_id: z.number().int().positive().optional(),
}).refine((d) => d.lead_id !== undefined || d.deal_id !== undefined, {
  message: 'lead_id yoki deal_id kamida bittasi majburiy',
});
export type CrmAiSuggestActionDto = z.infer<typeof CrmAiSuggestActionDtoSchema>;
