import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const CreateReferencesCheckSchema = z.object({
  funnelId:        z.number().int(),
  candidateId:     z.number().int(),
  previousCompany: z.string().min(1),
  contactPerson:   z.string().min(1),
  contactPhone:    z.string().optional(),
  contactPosition: z.string().optional(),
  result:          z.string().optional(),
  wouldRehire:     z.boolean().optional(),
  notes:           z.string().optional(),
  rating:          z.number().int().min(1).max(10).optional(),
});
export class CreateReferencesCheckDto extends createZodDto(CreateReferencesCheckSchema) {}

export const UpdateReferencesCheckSchema = z.object({
  result:      z.string().optional(),
  wouldRehire: z.boolean().optional(),
  notes:       z.string().optional(),
  rating:      z.number().int().min(1).max(10).optional(),
});
export class UpdateReferencesCheckDto extends createZodDto(UpdateReferencesCheckSchema) {}
