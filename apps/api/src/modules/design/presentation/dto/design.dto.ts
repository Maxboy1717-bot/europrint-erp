/**
 * @module design.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';

import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';
export const RequestDesignDtoSchema = z.object({
  salesOrderId: IntegerIdSchema.optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
});

export type RequestDesignDto = z.infer<typeof RequestDesignDtoSchema>;

export const UpdateDesignStatusDtoSchema = z.object({
  status: z.enum(['new', 'ai_generated', 'designer_review', 'waiting_customer_approval', 'approved', 'rejected', 'revision_requested']),
  files: z.array(z.string()).optional(),
});

export type UpdateDesignStatusDto = z.infer<typeof UpdateDesignStatusDtoSchema>;
