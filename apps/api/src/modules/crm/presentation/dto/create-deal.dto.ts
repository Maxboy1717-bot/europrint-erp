import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';
export const CreateDealDtoSchema = z.object({
  companyId: z.number().int().positive('Company ID must be positive'),
  leadId: z.number().int().positive('Lead ID must be positive'),
  totalAmount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).toUpperCase().default('USD'),
  expectedClosureDate: z.coerce.date(),
  assignedTo: z.number().int().positive('Assigned user ID must be positive'),
  description: z.string().max(MAX_SHORT_TEXT).optional(),
});

export type CreateDealDto = z.infer<typeof CreateDealDtoSchema>;
