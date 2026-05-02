import { z } from 'zod';
import { WorkCenterType } from '../../domain/aggregates/work-center.aggregate';

export const CreateWorkCenterDtoSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  name: z.string().min(2).max(255),
  type: z.nativeEnum(WorkCenterType),
  capacity: z.number().positive().default(8),
  costPerHour: z.number().min(0).default(0),
  certificationLmsCourseId: z.string().uuid().nullable().optional(),
  department: z.string().max(255).nullable().optional(),
});

export type CreateWorkCenterDto = z.infer<typeof CreateWorkCenterDtoSchema>;

export const UpdateWorkCenterDtoSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase().optional(),
  name: z.string().min(2).max(255).optional(),
  type: z.nativeEnum(WorkCenterType).optional(),
  capacity: z.number().positive().optional(),
  costPerHour: z.number().min(0).optional(),
  certificationLmsCourseId: z.string().uuid().nullable().optional(),
  department: z.string().max(255).nullable().optional(),
  reason: z.string().min(5), // §8.6 — PP o'zgartirishda sabab majburiy
});

export type UpdateWorkCenterDto = z.infer<typeof UpdateWorkCenterDtoSchema>;

export const GetWorkCentersDtoSchema = z.object({
  type: z.nativeEnum(WorkCenterType).optional(),
  isActive: z.boolean().optional(),
  department: z.string().optional(),
});

export type GetWorkCentersDto = z.infer<typeof GetWorkCentersDtoSchema>;
