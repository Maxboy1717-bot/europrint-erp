/**
 * @module crm-activities.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const CreateActivityDtoSchema = z.object({
  type: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(500).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(MAX_SHORT_TEXT).optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
  status: z.string().max(50).optional(),
  lead_id: z.number().int().positive().optional(),
  deal_id: z.number().int().positive().optional(),
  contact_id: z.number().int().positive().optional(),
  assigned_to: z.number().int().positive().optional(),
  scheduled_at: z.string().optional(),
  communication_data: z.object({
    address: z.string().max(500).optional(),
    gps_lat: z.number().min(-90).max(90).optional(),
    gps_lng: z.number().min(-180).max(180).optional(),
  }).passthrough().optional(),
  due_date: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
}).passthrough();
export type CreateActivityDto = z.infer<typeof CreateActivityDtoSchema>;

export const CompleteActivityDtoSchema = z.object({
  outcome: z.string().max(MAX_SHORT_TEXT).optional(),
});
export type CompleteActivityDto = z.infer<typeof CompleteActivityDtoSchema>;

export const UpdateActivityDtoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  subject: z.string().min(1).max(500).optional(),
  description: z.string().max(MAX_SHORT_TEXT).optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
  status: z.string().max(50).optional(),
  assigned_to: z.number().int().positive().optional(),
  scheduled_at: z.string().optional(),
  due_date: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
}).passthrough();
export type UpdateActivityDto = z.infer<typeof UpdateActivityDtoSchema>;
