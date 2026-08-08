/**
 * @module iot.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';

export const RegisterDeviceDtoSchema = z.object({
  deviceCode: z.string().min(3),
  name: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(['temperature', 'humidity', 'pressure', 'vibration', 'power', 'flow']),
  thresholds: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string(),
  }),
});

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceDtoSchema>;

export const RecordReadingDtoSchema = z.object({
  deviceId: IntegerIdSchema,
  value: z.number(),
  unit: z.string(),
});

export type RecordReadingDto = z.infer<typeof RecordReadingDtoSchema>;

export const UpdateThresholdsDtoSchema = z.object({
  thresholds: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string(),
  }),
});

export type UpdateThresholdsDto = z.infer<typeof UpdateThresholdsDtoSchema>;

export const GetDevicesDtoSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetDevicesDto = z.infer<typeof GetDevicesDtoSchema>;

export const GetReadingsDtoSchema = z.object({
  deviceId: IntegerIdSchema,
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type GetReadingsDto = z.infer<typeof GetReadingsDtoSchema>;
