import { z } from 'zod';

export const AutofillDtoSchema = z.record(z.string(), z.unknown());
export type AutofillDto = z.infer<typeof AutofillDtoSchema>;
