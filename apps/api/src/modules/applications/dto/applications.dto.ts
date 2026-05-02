import { z } from 'zod';

export const ApplicationCreateSchema = z.object({
  applicant_name: z.string().min(1).max(255),
  position_id: z.coerce.number().int().positive(),
  status: z.string().optional(),
  source: z.string().optional(),
  resume_url: z.string().url().optional(),
  cover_letter: z.string().optional(),
  salary_expectation: z.coerce.number().positive().optional(),
}).passthrough();
export type ApplicationCreateDto = z.infer<typeof ApplicationCreateSchema>;

export const ApplicationUpdateSchema = z.object({
  status: z.string().optional(),
  rejection_reason: z.string().optional(),
  interview_date: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();
export type ApplicationUpdateDto = z.infer<typeof ApplicationUpdateSchema>;

export const ApplicationResponseCreateSchema = z.object({
  application_id: z.coerce.number().int().positive().optional(),
  response_type: z.string().optional(),
  notes: z.string().optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  recommendation: z.string().optional(),
}).passthrough();
export type ApplicationResponseCreateDto = z.infer<typeof ApplicationResponseCreateSchema>;
