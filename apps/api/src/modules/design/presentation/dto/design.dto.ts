/**
 * @module design.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';
export const RequestDesignDtoSchema = z.object({
  salesOrderId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
});

export type RequestDesignDto = z.infer<typeof RequestDesignDtoSchema>;

export const UpdateDesignStatusDtoSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'under_review', 'approved', 'rejected', 'completed']),
  files: z.array(z.string()).optional(),
});

export type UpdateDesignStatusDto = z.infer<typeof UpdateDesignStatusDtoSchema>;
