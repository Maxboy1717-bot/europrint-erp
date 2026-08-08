/**
 * @module lms-core.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const CreateExamSchema = z.object({
  title: z.string().min(1),
  courseId: z.number().int().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});
export type CreateExamDto = z.infer<typeof CreateExamSchema>;

/** Each answer entry: which question + which option the user chose. */
export const AnswerItemSchema = z.object({
  questionId: z.number().int().positive(),
  selectedOption: z.number().int().min(0),
});

export const SubmitExamSchema = z.object({
  answers: z.array(AnswerItemSchema).default([]),
});
export type SubmitExamDto = z.infer<typeof SubmitExamSchema>;
