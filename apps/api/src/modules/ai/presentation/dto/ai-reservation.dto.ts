/**
 * @module ai-reservation.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_NOTES_LENGTH, MAX_NAME_LENGTH } from '@common/constants/app.constants';
export const CreateReservationRequestDtoSchema = z.object({
  materialType: z.string().min(1).max(MAX_NAME_LENGTH),
  quantity:     z.number().positive(),
  unit:         z.string().min(1).max(50).default('pcs'),
  neededBy:     z.string().datetime().optional(),
  priority:     z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  notes:        z.string().max(MAX_NOTES_LENGTH).optional(),
});

export const CreateBatchDtoSchema = z.object({
  materialType: z.string().min(1).max(MAX_NAME_LENGTH),
  items:        z.array(z.object({
    materialId: z.string().uuid(),
    quantity:   z.number().positive(),
  })).min(1),
  scheduledAt:  z.string().datetime().optional(),
});

export class CreateReservationRequestDto extends createZodDto(CreateReservationRequestDtoSchema) {}
export class CreateBatchDto              extends createZodDto(CreateBatchDtoSchema) {}
