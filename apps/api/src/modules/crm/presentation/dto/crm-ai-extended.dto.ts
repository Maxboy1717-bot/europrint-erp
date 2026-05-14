/**
 * @module crm-ai-extended.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const AutofillDtoSchema = z.record(z.string(), z.unknown());
export type AutofillDto = z.infer<typeof AutofillDtoSchema>;
