import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';
export const CreateLeadDtoSchema = z.object({
  companyId: z.number().int().positive('Company ID must be positive'),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(7).max(20),
  source: z.string().min(2).max(50),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
});

export type CreateLeadDto = z.infer<typeof CreateLeadDtoSchema>;
