/**
 * @module security.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const ReportIncidentSchema = z.object({
  title:       z.string().min(5),
  description: z.string().min(20),
  severity:    z.enum(['low', 'medium', 'high', 'critical']),
});
export class ReportIncidentDto extends createZodDto(ReportIncidentSchema) {}

export const UpdateIncidentSchema = z.object({
  assignedTo:      z.string().optional(),
  status:          z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  resolutionNotes: z.string().optional(),
});
export class UpdateIncidentDto extends createZodDto(UpdateIncidentSchema) {}

export const ResolveIncidentSchema = z.object({
  resolutionNotes: z.string().min(20),
});
export class ResolveIncidentDto extends createZodDto(ResolveIncidentSchema) {}
