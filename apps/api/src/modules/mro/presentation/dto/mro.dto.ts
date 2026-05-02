import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const StopMachineSchema = z.object({
  equipmentId:             z.string().uuid(),
  equipmentName:           z.string().min(1),
  issueDescription:        z.string().min(10),
  priority:                z.enum(['low', 'medium', 'high', 'critical']),
  productionOrderAffected: z.string().uuid().optional(),
});
export class StopMachineDto extends createZodDto(StopMachineSchema) {}

export const AssignMaintenanceSchema = z.object({
  assignedTo: z.string().uuid(),
});
export class AssignMaintenanceDto extends createZodDto(AssignMaintenanceSchema) {}

export const CompleteMaintenanceSchema = z.object({
  notes: z.string().optional(),
});
export class CompleteMaintenanceDto extends createZodDto(CompleteMaintenanceSchema) {}
