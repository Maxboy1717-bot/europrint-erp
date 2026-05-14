/**
 * @module lms-query.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const GetCoursesDtoSchema = z.object({
  isMandatory: z.boolean().optional(),
  category: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetCoursesDto = z.infer<typeof GetCoursesDtoSchema>;

export const GetEnrollmentsDtoSchema = z.object({
  status: z.enum(['enrolled', 'in_progress', 'completed', 'failed', 'expired']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetEnrollmentsDto = z.infer<typeof GetEnrollmentsDtoSchema>;
