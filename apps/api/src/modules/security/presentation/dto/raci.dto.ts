import { z } from 'zod';

export const RaciCreateTaskSchema = z.object({
  title:          z.string().min(1).max(500),
  description:    z.string().optional(),
  responsible_id: z.coerce.number().int().positive().optional(),
  accountable_id: z.coerce.number().int().positive().optional(),
  deadline:       z.string().optional(),
}).passthrough();
export type RaciCreateTaskDto = z.infer<typeof RaciCreateTaskSchema>;

export const RaciCreateAssignmentSchema = z.object({
  task_id:     z.union([z.string().min(1), z.number().int().positive()]),
  employee_id: z.union([z.string().min(1), z.number().int().positive()]),
  role:        z.string().min(1),
});
export type RaciCreateAssignmentDto = z.infer<typeof RaciCreateAssignmentSchema>;

export const RaciCreateAssessmentSchema = z.object({
  title:       z.string().min(1).max(500),
  risk_level:  z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().optional(),
  likelihood:  z.coerce.number().int().min(1).max(5).optional(),
  impact:      z.coerce.number().int().min(1).max(5).optional(),
}).passthrough();
export type RaciCreateAssessmentDto = z.infer<typeof RaciCreateAssessmentSchema>;
