import { z } from 'zod';
import { DOWNTIME_REASON_CODES } from '../../domain/aggregates/downtime-event.aggregate';

import { MAX_NOTES_LENGTH } from '@common/constants/app.constants';
const reasonCodes = DOWNTIME_REASON_CODES.map((r) => r.code);

export const CreateDowntimeDtoSchema = z.object({
  sessionId: z.string().uuid(),
  workCenterId: z.string().uuid().nullable().optional(),
  eventType: z.enum(['planned', 'unplanned', 'breakdown']),
  reasonCode: z.enum(reasonCodes as [string, ...string[]]),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
});

export type CreateDowntimeDto = z.infer<typeof CreateDowntimeDtoSchema>;

export const EndDowntimeDtoSchema = z.object({
  endedAt: z.date().optional(),
});

export type EndDowntimeDto = z.infer<typeof EndDowntimeDtoSchema>;

export const GetDowntimeDtoSchema = z.object({
  sessionId: z.string().uuid().optional(),
  workCenterId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type GetDowntimeDto = z.infer<typeof GetDowntimeDtoSchema>;

export const GetDowntimeSummaryDtoSchema = z.object({
  from: z.date(),
  to: z.date(),
});

export type GetDowntimeSummaryDto = z.infer<typeof GetDowntimeSummaryDtoSchema>;
