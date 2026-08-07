/**
 * @module logistics.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const DispatchDeliverySchema = z.object({
  deliveryId: IntegerIdSchema.optional(),
  orderId:    z.number().int(),
  driverId:   z.number().int(),
});
export class DispatchDeliveryDto extends createZodDto(DispatchDeliverySchema) {}

export const AssignDriverSchema = z.object({
  driverId:      IntegerIdSchema,
  vehicleNumber: z.string().min(1),
});
export class AssignDriverDto extends createZodDto(AssignDriverSchema) {}

export const CompleteDeliverySchema = z.object({
  notes: z.string().optional(),
});
export class CompleteDeliveryDto extends createZodDto(CompleteDeliverySchema) {}
