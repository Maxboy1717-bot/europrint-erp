/**
 * @module ai-exam.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const AssignAiExamDtoSchema = z.object({
  userId:     z.string().uuid('userId UUID formatida bo`lishi kerak'),
  positionId: z.string().uuid('positionId UUID formatida bo`lishi kerak'),
});

export const SubmitAiExamDtoSchema = z.object({
  attemptId: z.string().uuid('attemptId UUID formatida bo`lishi kerak'),
  answers:   z.record(z.string(), z.string()),
});

export class AssignAiExamDto extends createZodDto(AssignAiExamDtoSchema) {}
export class SubmitAiExamDto  extends createZodDto(SubmitAiExamDtoSchema) {}

export interface AiExamAttempt {
  id:            string;
  userId:        string;
  employeeId:    string;
  fullName:      string;
  positionName:  string;
  positionNameRu: string;
  score:         number | null;
  status:        string;
  startedAt:     string;
  completedAt:   string | null;
  analyzedAt:    string | null;
}

export interface AiExamDetail {
  attempt: {
    id:          string;
    userId:      string;
    positionId:  string;
    questions:   { id: string; question: string; category: string }[];
    answers:     Record<string, string> | null;
    gptAnalysis: string | null;
    score:       number | null;
    evaluation:  Record<string, { comment: string; score: number; maxScore: number }> | null;
    status:      string;
    startedAt:   string;
    completedAt: string | null;
    analyzedAt:  string | null;
  };
  user: {
    id:         string;
    employeeId: string;
    fullName:   string;
    lang:       string;
  };
  position: {
    id:     string;
    name:   string;
    nameRu: string | null;
  };
}
