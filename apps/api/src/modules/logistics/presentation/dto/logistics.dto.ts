import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const DispatchDeliverySchema = z.object({
  deliveryId: z.string().uuid().optional(),
  orderId:    z.number().int(),
  driverId:   z.number().int(),
});
export class DispatchDeliveryDto extends createZodDto(DispatchDeliverySchema) {}

export const AssignDriverSchema = z.object({
  driverId:      z.string().uuid(),
  vehicleNumber: z.string().min(1),
});
export class AssignDriverDto extends createZodDto(AssignDriverSchema) {}

export const CompleteDeliverySchema = z.object({
  notes: z.string().optional(),
});
export class CompleteDeliveryDto extends createZodDto(CompleteDeliverySchema) {}
