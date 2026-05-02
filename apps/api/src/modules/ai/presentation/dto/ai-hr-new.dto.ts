import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@common/constants/app.constants';
export const CreateAiInterviewDtoSchema = z.object({
  candidateId:    z.string().uuid(),
  positionTitle:  z.string().min(1).max(MAX_NAME_LENGTH),
  interviewType:  z.enum(['screening', 'technical', 'behavioral', 'final']).default('screening'),
  scheduledAt:    z.string().datetime().optional(),
  notes:          z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
});

export class CreateAiInterviewDto extends createZodDto(CreateAiInterviewDtoSchema) {}

export interface AiHrDashboardData {
  totalAiTasks:         number;
  completedInterviews:  number;
  totalCost:            number;
  recentTasks:          { id: string; taskType: string; status: string; createdAt: string }[];
}

export interface AiProviderConfig {
  providerName:      string;
  isActive:          boolean;
  monthlyBudget:     number;
  monthlySpent:      number;
  dailyRequestsUsed: number;
  dailyRequestLimit: number;
}

export interface AiBudgetItem {
  id:                string;
  provider:          string;
  monthlyBudget:     number;
  monthlySpent:      number;
  remaining:         number;
  isActive:          boolean;
  dailyRequestLimit: number | null;
  dailyRequestsUsed: number | null;
}
