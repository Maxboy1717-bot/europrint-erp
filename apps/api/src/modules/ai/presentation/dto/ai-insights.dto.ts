import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';
export const GenerateInsightDtoSchema = z.object({
  module:  z.enum(['hr', 'finance', 'production', 'sales', 'wms', 'general']).default('general'),
  context: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
});

export class GenerateInsightDto extends createZodDto(GenerateInsightDtoSchema) {}

export interface InsightItem {
  id:          string;
  module:      string;
  title:       string;
  description: string;
  type:        string;
  priority:    'low' | 'medium' | 'high';
  isRead:      boolean;
  createdAt:   string;
  readAt:      string | null;
}
