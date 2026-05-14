/**
 * @module courses.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const CreateCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  isMandatory: z.boolean().optional(),
  durationHours: z.number().optional(),
});
export type CreateCourseDto = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = CreateCourseSchema.partial();
export type UpdateCourseDto = z.infer<typeof UpdateCourseSchema>;

export const CreateLessonSchema = z.object({
  title: z.string().min(1),
  courseId: z.number().int().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  durationMinutes: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateLessonDto = z.infer<typeof CreateLessonSchema>;

export const UpdateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  durationMinutes: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateLessonDto = z.infer<typeof UpdateLessonSchema>;

export const CreateModuleSchema = z.object({
  title: z.string().min(1),
  courseId: z.number().int().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateModuleDto = z.infer<typeof CreateModuleSchema>;

export const VideoProgressSchema = z.object({
  lessonId: z.number().int().positive(),
  progressSeconds: z.number().int().min(0),
  totalSeconds: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});
export type VideoProgressDto = z.infer<typeof VideoProgressSchema>;
