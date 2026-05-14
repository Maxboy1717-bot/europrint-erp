/**
 * @module inspection.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const UploadReferencePhotoSchema = z.object({
  image_base64: z.string().min(10, 'image_base64 required'),
  room_name:    z.string().min(1).max(200).optional(),
  description:  z.string().max(1000).optional(),
});
export type UploadReferencePhotoDto = z.infer<typeof UploadReferencePhotoSchema>;

export const ManualInspectionSchema = z.object({
  room_code:        z.string().min(1).max(50),
  cleanliness:      z.number().int().min(1).max(5),
  order_score:      z.number().int().min(1).max(5),
  equipment_ok:     z.boolean(),
  emergency_issues: z.boolean(),
  notes:            z.string().max(2000).optional(),
  evidence_photo_url: z.string().url().optional(),
});
export type ManualInspectionDto = z.infer<typeof ManualInspectionSchema>;

export const ChecklistSchema = z.object({
  room_code:        z.string().min(1).max(50),
  cleanliness:      z.number().int().min(1).max(5),
  order_score:      z.number().int().min(1).max(5),
  equipment_ok:     z.boolean(),
  emergency_issues: z.boolean(),
  notes:            z.string().max(2000).optional(),
  evidence_photo_url: z.string().url().optional(),
  inspector_name:   z.string().min(1).max(200).optional(),
});
export type ChecklistDto = z.infer<typeof ChecklistSchema>;
