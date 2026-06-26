/**
 * @module work-center.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { WorkCenterType } from '../../domain/aggregates/work-center.aggregate';

export const CreateWorkCenterDtoSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  name: z.string().min(2).max(255),
  type: z.nativeEnum(WorkCenterType),
  capacity: z.number().positive().default(8),
  costPerHour: z.number().min(0).default(0),
  certificationLmsCourseId: z.string().uuid().nullable().optional(),
  department: z.string().max(255).nullable().optional(),
});

export type CreateWorkCenterDto = z.infer<typeof CreateWorkCenterDtoSchema>;

export const UpdateWorkCenterDtoSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase().optional(),
  name: z.string().min(2).max(255).optional(),
  type: z.nativeEnum(WorkCenterType).optional(),
  capacity: z.number().positive().optional(),
  costPerHour: z.number().min(0).optional(),
  certificationLmsCourseId: z.string().uuid().nullable().optional(),
  department: z.string().max(255).nullable().optional(),
  reason: z.string().min(5), // §8.6 — PP o'zgartirishda sabab majburiy
});

export type UpdateWorkCenterDto = z.infer<typeof UpdateWorkCenterDtoSchema>;

// Wave 4 (500K build): per-sex norma/brak/crew config. Qiymatlar egasi-DATA — bu yozish-shakli (Q-40).
export const UpdateWorkCenterNormsDtoSchema = z
  .object({
    normaM2PerShift: z.number().nonnegative().optional(),
    normaKgPerShift: z.number().nonnegative().optional(),
    brakLimitPct:    z.number().min(0).max(100).optional(),
    minCrewSize:     z.number().int().nonnegative().optional(),
    maxCrewSize:     z.number().int().nonnegative().optional(),
    unitPreference:  z.enum(['m2', 'kg', 'list']).optional(),
    reason:          z.string().min(5), // §8.6 — PP o'zgartirishda sabab majburiy
  })
  .refine(
    (d) =>
      d.normaM2PerShift !== undefined ||
      d.normaKgPerShift !== undefined ||
      d.brakLimitPct !== undefined ||
      d.minCrewSize !== undefined ||
      d.maxCrewSize !== undefined ||
      d.unitPreference !== undefined,
    { message: 'Kamida bitta norma maydoni kerak' },
  );

export type UpdateWorkCenterNormsDto = z.infer<typeof UpdateWorkCenterNormsDtoSchema>;

// T12-04: KARTA (org-tuzilma) bog'lash DTO. orgDepartmentId = org_departments.id (qaysi KARTA);
// null = bog'lanishni bekor qilish. Qiymat egasi-DATA — bu yozish-shakli (Q-40).
export const LinkWorkCenterCardDtoSchema = z.object({
  orgDepartmentId: z.number().int().positive().nullable(),
  reason: z.string().min(5), // §8.6 — PP o'zgartirishda sabab majburiy
});

export type LinkWorkCenterCardDto = z.infer<typeof LinkWorkCenterCardDtoSchema>;

export const GetWorkCentersDtoSchema = z.object({
  type: z.nativeEnum(WorkCenterType).optional(),
  isActive: z.boolean().optional(),
  department: z.string().optional(),
  departmentKind: z.enum(['FLEKSO', 'OFSET']).optional(), // Wave 1: sex taxonomy bo'lim filtri
});

export type GetWorkCentersDto = z.infer<typeof GetWorkCentersDtoSchema>;
