import { z } from 'zod';

export const CreateQQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['text', 'single_choice', 'multiple_choice', 'rating', 'boolean']).optional(),
  options: z.array(z.unknown()).optional(),
  isRequired: z.boolean().optional(),
});
export type CreateQQuestionDto = z.infer<typeof CreateQQuestionSchema>;

export const UpdateQQuestionSchema = CreateQQuestionSchema.partial();
export type UpdateQQuestionDto = z.infer<typeof UpdateQQuestionSchema>;

export const CreateQResponseSchema = z.object({
  questionId: z.number().int(),
  answer: z.unknown(),
});
export type CreateQResponseDto = z.infer<typeof CreateQResponseSchema>;

export const CreateQTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});
export type CreateQTemplateDto = z.infer<typeof CreateQTemplateSchema>;

export const UpdateQTemplateSchema = CreateQTemplateSchema.partial();
export type UpdateQTemplateDto = z.infer<typeof UpdateQTemplateSchema>;

export const CreateCertificateSchema = z.object({
  employeeId: z.number().int(),
  courseId: z.number().int(),
  expiryDate: z.string().optional(),
});
export type CreateCertificateDto = z.infer<typeof CreateCertificateSchema>;
