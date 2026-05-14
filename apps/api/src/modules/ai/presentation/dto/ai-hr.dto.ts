/**
 * @module ai-hr.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const AiHrClassifyProductivityDtoSchema = z.object({
  candidateId: z.number().int().positive(),
  interviewNotes: z.string().min(1).max(10_000),
});
export type AiHrClassifyProductivityDto = z.infer<typeof AiHrClassifyProductivityDtoSchema>;

export const AiHrInterviewQuestionsDtoSchema = z.object({
  positionTitle: z.string().min(1).max(200),
  candidateBackground: z.string().min(1).max(5000),
});
export type AiHrInterviewQuestionsDto = z.infer<typeof AiHrInterviewQuestionsDtoSchema>;

export const AiHrAnalyzeToolTestDtoSchema = z.object({
  positionTitle: z.string().min(1).max(200),
});
export type AiHrAnalyzeToolTestDto = z.infer<typeof AiHrAnalyzeToolTestDtoSchema>;

export const AiHrOnboardingPlanDtoSchema = z.object({
  positionTitle: z.string().min(1).max(200),
  department: z.string().min(1).max(200),
  employeeName: z.string().min(1).max(200),
});
export type AiHrOnboardingPlanDto = z.infer<typeof AiHrOnboardingPlanDtoSchema>;

export const AiHrPerformanceReviewDtoSchema = z.object({
  period: z.string().min(1).max(50),
  kpiData: z.record(z.string(), z.unknown()),
});
export type AiHrPerformanceReviewDto = z.infer<typeof AiHrPerformanceReviewDtoSchema>;
