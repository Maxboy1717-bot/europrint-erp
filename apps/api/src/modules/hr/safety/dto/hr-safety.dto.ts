import { z } from 'zod';

export const HrSafetyUpdateIncidentSchema = z.object({
  status:     z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  resolution: z.string().optional(),
  notes:      z.string().optional(),
});
export type HrSafetyUpdateIncidentDto = z.infer<typeof HrSafetyUpdateIncidentSchema>;

export const HrSafetyUpdateHazardZoneSchema = z.object({
  hazard_level:  z.enum(['low', 'medium', 'high', 'extreme']).optional(),
  required_ppe:  z.string().optional(),
  max_occupancy: z.number().int().positive().optional(),
  notes:         z.string().optional(),
});
export type HrSafetyUpdateHazardZoneDto = z.infer<typeof HrSafetyUpdateHazardZoneSchema>;

export const HrSafetyExportPdfSchema = z.object({
  from_date: z.string().optional(),
  to_date:   z.string().optional(),
  type:      z.enum(['incidents', 'trainings', 'inspections', 'all']).optional(),
});
export type HrSafetyExportPdfDto = z.infer<typeof HrSafetyExportPdfSchema>;
