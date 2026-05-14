/**
 * @module lms-tests.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const CreateTestSchema = z.object({
  title: z.string().min(1),
  courseId: z.number().int().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});
export type CreateTestDto = z.infer<typeof CreateTestSchema>;

export const UpdateTestSchema = CreateTestSchema.partial();
export type UpdateTestDto = z.infer<typeof UpdateTestSchema>;

export const CreateQuestionSchema = z.object({
  testId: z.number().int().optional(),
  questionText: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  options: z.array(z.unknown()).optional(),
  correctOption: z.number().int().optional(),
  score: z.number().int().min(1).optional(),
});
export type CreateQuestionDto = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = CreateQuestionSchema.partial();
export type UpdateQuestionDto = z.infer<typeof UpdateQuestionSchema>;

export const CreateAssignmentSchema = z.object({
  title: z.string().min(1),
  courseId: z.number().int().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});
export type CreateAssignmentDto = z.infer<typeof CreateAssignmentSchema>;
