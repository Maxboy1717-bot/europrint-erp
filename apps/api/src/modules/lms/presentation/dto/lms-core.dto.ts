import { z } from 'zod';

export const CreateExamSchema = z.object({
  title: z.string().min(1),
  courseId: z.number().int().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});
export type CreateExamDto = z.infer<typeof CreateExamSchema>;

export const SubmitExamSchema = z.object({
  answers: z.array(z.unknown()).default([]),
});
export type SubmitExamDto = z.infer<typeof SubmitExamSchema>;
