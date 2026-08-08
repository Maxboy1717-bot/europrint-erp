/**
 * @module hr.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_NOTES_LENGTH, MAX_NAME_LENGTH } from '@common/constants/app.constants';

export const HrCheckInSchema = z.object({
  employeeId:          z.number().int().positive(),
  attendanceDate:      z.string().optional(),
  checkInTime:         z.string().optional(),
  source:              z.string().max(50).optional(),
  scheduledStartTime:  z.string().regex(/^\d{2}:\d{2}$/).optional(),  // "HH:MM"
});
export type HrCheckInDto = z.infer<typeof HrCheckInSchema>;

export const HrCheckOutSchema = z.object({
  employeeId:      z.number().int().positive(),
  checkOutTime:    z.string().optional(),
  overtimeMinutes: z.number().int().min(0).optional(),
});
export type HrCheckOutDto = z.infer<typeof HrCheckOutSchema>;

export const HrUpdateEmployeeStatusSchema = z.object({
  status: z.enum(['active', 'on_leave', 'terminated', 'inactive']),
});
export type HrUpdateEmployeeStatusDto = z.infer<typeof HrUpdateEmployeeStatusSchema>;

export const HrReviewSalarySchema = z.object({
  proposedIncrease: z.number().positive(),
  reason:           z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HrReviewSalaryDto = z.infer<typeof HrReviewSalarySchema>;

export const HrUpdateProfileImageSchema = z.object({
  imageUrl: z.string().min(1).max(MAX_NAME_LENGTH),
});
export type HrUpdateProfileImageDto = z.infer<typeof HrUpdateProfileImageSchema>;

export const HrAssignOrgFunctionsSchema = z.object({
  nodeId:       z.string().optional(),
  departmentId: z.string().optional(),
  positionId:   z.string().optional(),
});
export type HrAssignOrgFunctionsDto = z.infer<typeof HrAssignOrgFunctionsSchema>;

// C9.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): uncapped array on a JSON @Body — a caller could
// submit an arbitrarily large batch (memory/DoS), bypassing the global multipart file-size cap
// since this isn't a file upload. Bound matches the sibling fix in compat-body.dto.ts.
export const HrImportEmployeesSchema = z.object({
  employees: z.array(z.record(z.string(), z.unknown())).max(1000).optional(),
});
export type HrImportEmployeesDto = z.infer<typeof HrImportEmployeesSchema>;

export const HrCalculatePayrollSchema = z.object({
  employeeId:      z.number().int().positive(),
  baseSalary:      z.number().positive(),
  period:          z.string().optional(),
  overtimeHours:   z.number().min(0).optional(),
  overtimeRate:    z.number().positive().optional(),
  bonus:           z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
});
export type HrCalculatePayrollDto = z.infer<typeof HrCalculatePayrollSchema>;

export const HrCreateScheduleSchema = z.object({
  user_id:     z.string().optional(),
  employee_id: z.union([z.string(), z.number()]).optional(),
  shift_date:  z.string().min(1),
  shift_type:  z.string().optional(),
  start_time:  z.string().optional(),
  end_time:    z.string().optional(),
  notes:       z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HrCreateScheduleDto = z.infer<typeof HrCreateScheduleSchema>;

export const HrCreateSwapRequestSchema = z.object({
  from_employee_id: z.union([z.string(), z.number()]).optional(),
  to_employee_id:   z.union([z.string(), z.number()]).optional(),
  shift_date:       z.string().optional(),
  from_shift_id:    z.number().int().positive().optional(),
  reason:           z.string().min(1).max(MAX_NOTES_LENGTH),
});
export type HrCreateSwapRequestDto = z.infer<typeof HrCreateSwapRequestSchema>;

export const Hr360ReviewSchema = z.object({
  employee_id:       z.number().int().positive(),
  assessment_period: z.string().min(1),
  assessment_year:   z.number().int().min(2000).max(2100),
  self_rating:       z.number().min(1).max(10),
  manager_rating:    z.number().min(1).max(10),
  peer_rating:       z.number().min(1).max(10),
});
export type Hr360ReviewDto = z.infer<typeof Hr360ReviewSchema>;

export const HrConflictReportSchema = z.object({
  party1:      z.number().int().positive(),
  party2:      z.number().int().positive(),
  description: z.string().min(1).max(MAX_NOTES_LENGTH),
  severity:    z.enum(['low', 'medium', 'high', 'critical']),
});
export type HrConflictReportDto = z.infer<typeof HrConflictReportSchema>;

export const HrEmployeeSkillSchema = z.object({
  employee_id:       z.number().int().positive(),
  skill_name:        z.string().min(1).max(MAX_NAME_LENGTH),
  // Audit 2026-08-08: `employee_skills.skill_category` jonlida NOT NULL, DEFAULT yo'q —
  // yubormasdan INSERT doim xato berardi. skill_catalog.category'dan real qiymat keladi.
  skill_category:    z.string().min(1).max(50),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  proficiency_score: z.number().min(0).max(100),
  certified_date:    z.string().optional(),
  notes:             z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HrEmployeeSkillDto = z.infer<typeof HrEmployeeSkillSchema>;

export const HrHealthCheckupSchema = z.object({
  department_id:      z.number().int().positive(),
  department_name:    z.string().min(1).max(MAX_NAME_LENGTH),
  total_employees:    z.number().int().min(0),
  examined_count:     z.number().int().min(0),
  last_checkup_date:  z.string().min(1),
  next_checkup_date:  z.string().optional(),
});
export type HrHealthCheckupDto = z.infer<typeof HrHealthCheckupSchema>;

export const HrDisciplineRecordSchema = z.object({
  employee_id:     z.number().int().positive(),
  violation_type:  z.string().min(1).max(100),
  discipline_type: z.string().min(1).max(100),
  severity:        z.enum(['low', 'medium', 'high', 'critical']),
  violation_date:  z.string().min(1),
  description:     z.string().min(1).max(MAX_NOTES_LENGTH),
  fine_amount:     z.number().min(0).optional(),
});
export type HrDisciplineRecordDto = z.infer<typeof HrDisciplineRecordSchema>;

export const HrBrandSettingsSchema = z.object({
  logoUrl:     z.string().url().optional(),
  primaryColor: z.string().optional(),
  companyName: z.string().max(MAX_NAME_LENGTH).optional(),
});
export type HrBrandSettingsDto = z.infer<typeof HrBrandSettingsSchema>;

// P1.23.2: accept both snake_case (canonical) and camelCase (FE) aliases; relax required fields
export const HrSafetyIncidentSchema = z.object({
  incident_type:        z.string().min(1).max(100).optional(),
  incidentType:         z.string().optional(),  // camelCase alias
  severity:             z.enum(['minor', 'moderate', 'low', 'medium', 'high', 'critical', 'severe']).optional().default('medium'),
  description:          z.string().min(1).max(MAX_NOTES_LENGTH),
  location_description: z.string().max(MAX_NOTES_LENGTH).optional(),
  location:             z.string().optional(),  // camelCase alias
  department_id:        z.number().int().positive().optional(),
  incident_date:        z.string().optional(),
  incidentDate:         z.string().optional(),  // camelCase alias
}).passthrough();
export type HrSafetyIncidentDto = z.infer<typeof HrSafetyIncidentSchema>;

// P1.23.3: accept trainingId (FE course-select value) + trainingName free-text fallback
export const HrSafetyTrainingSchema = z.object({
  training_id:    z.union([z.number().int().positive(), z.string()]).optional(),
  trainingId:     z.union([z.string(), z.number()]).optional(),  // FE course-select (numeric string)
  trainingName:   z.string().optional(),         // FE free-text fallback
  employee_id:    z.union([z.number().int().positive(), z.string()]).optional(),
  userId:         z.union([z.string(), z.number()]).optional(),  // FE alias
  completed_date: z.string().optional(),
  scheduledDate:  z.string().optional(),         // FE alias for completed_date
  expiry_date:    z.string().optional(),
  expiryDate:     z.string().optional(),         // camelCase alias
  score:          z.number().min(0).max(100).optional().default(0),
  is_passed:      z.boolean().optional().default(false),
}).passthrough();
export type HrSafetyTrainingDto = z.infer<typeof HrSafetyTrainingSchema>;

// P1.23.4: accept FE field aliases; make strict fields optional
//
// HR Nazorat fix (2026-07-13, verified live: POST /api/hr/safety/hazard-zones ALWAYS
// returned 400 "Validation failed"): zone_name was declared here WITHOUT .optional() —
// but HRSafetyDialogs.tsx ZoneDialog's real <Input {...form.register("zoneName")}/> only
// ever sends camelCase `zoneName`, never snake_case `zone_name`. The comment above
// ("make strict fields optional") was the intent but zone_name itself was never actually
// relaxed, so the Zod pipe rejected every real submission before the controller's
// zone_name ?? zoneName fallback ever ran. Fixed by making zone_name optional too and
// requiring at least one of the two via .refine() (same pattern as the FE's own
// TrainingSchema trainingId/trainingName refine in HRSafetyTypes.ts).
export const HrHazardZoneSchema = z.object({
  zone_name:     z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  zoneName:      z.string().min(1).max(MAX_NAME_LENGTH).optional(),  // camelCase alias (FE's real field)
  zone_code:     z.string().max(50).optional(),
  zoneCode:      z.string().optional(),           // camelCase alias
  department_id: z.number().int().positive().optional(),
  // HR Nazorat fix (2026-07-13, verified live): .default('low') here made Zod fill
  // hazard_level='low' whenever the FE only sent riskLevel (its real field) — so the
  // controller's `body.hazard_level ?? body.riskLevel` fallback never reached riskLevel
  // (hazard_level was never actually undefined post-parse). Every zone silently saved
  // as risk_level='low' no matter what the user picked. Default moved to the repository
  // layer (hr-compat-safety.repository.ts createHazardZone already does `?? 'low'`).
  hazard_level:  z.enum(['low', 'medium', 'high', 'extreme']).optional(),
  riskLevel:     z.enum(['low', 'medium', 'high', 'critical']).optional(),  // FE alias
  required_ppe:  z.string().max(MAX_NOTES_LENGTH).optional(),
  requiredPpe:   z.string().optional(),           // camelCase alias
  max_occupancy: z.number().int().positive().optional(),
  maxOccupancy:  z.number().int().positive().optional(),  // camelCase alias
  location:      z.string().optional(),           // FE uses this
  hazardType:    z.string().optional(),           // FE uses this
  description:   z.string().optional(),           // FE uses this (HR Nazorat fix 2026-07-13)
}).passthrough().refine(d => d.zone_name || d.zoneName, {
  message: 'zone_name yoki zoneName talab qilinadi', path: ['zoneName'],
});
export type HrHazardZoneDto = z.infer<typeof HrHazardZoneSchema>;

export const HrPpeComplianceSchema = z.object({
  employee_id:  z.number().int().positive(),
  ppe_type:     z.string().min(1).max(100),
  issue_date:   z.string().min(1),
  expiry_date:  z.string().min(1),
  is_compliant: z.boolean(),
});
export type HrPpeComplianceDto = z.infer<typeof HrPpeComplianceSchema>;

export const HrHealthLeaveSchema = z.object({
  employee_id: z.number().int().positive(),
  start_date:  z.string().min(1),
  end_date:    z.string().min(1),
  reason:      z.string().min(1).max(MAX_NOTES_LENGTH),
});
export type HrHealthLeaveDto = z.infer<typeof HrHealthLeaveSchema>;

export const HrCreateEmployeeSchema = z.object({
  firstName:        z.string().min(1, 'Ism majburiy').max(MAX_NAME_LENGTH),
  lastName:         z.string().min(1, 'Familiya majburiy').max(MAX_NAME_LENGTH),
  middleName:       z.string().max(MAX_NAME_LENGTH).optional(),
  departmentId:     z.string().optional(),
  positionId:       z.string().optional(),
  employeeCode:     z.string().optional(),
  // EmployeeDialog.tsx (FE Add-Employee form, "Tabel raqami" field) posts this key,
  // not `employeeCode` — accept it explicitly so the user-entered value isn't
  // silently discarded and replaced by the auto-generated EMP-<timestamp> fallback
  // in HrEmployeesController.createEmployee() (bug #3 fix, 2026-07-13).
  employeeId:       z.string().optional(),
  hireDate:         z.string().optional(),
  salary:           z.number().positive().optional(),
  employmentStatus: z.string().optional(),
}).passthrough();
export type HrCreateEmployeeDto = z.infer<typeof HrCreateEmployeeSchema>;

export const HrUpdateEmployeeSchema = z.object({
  firstName:        z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  lastName:         z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  middleName:       z.string().max(MAX_NAME_LENGTH).optional(),
  departmentId:     z.string().optional(),
  positionId:       z.string().optional(),
  employeeCode:     z.string().optional(),
  employeeId:       z.string().optional(),  // FE alias, see HrCreateEmployeeSchema note
  hireDate:         z.string().optional(),
  salary:           z.number().positive().optional(),
  employmentStatus: z.string().optional(),
}).passthrough();
export type HrUpdateEmployeeDto = z.infer<typeof HrUpdateEmployeeSchema>;

export const HrAssignAssetSchema = z.object({
  asset_type:    z.string().min(1).max(100),
  asset_name:    z.string().min(1).max(MAX_NAME_LENGTH),
  asset_code:    z.string().min(1).max(50),
  assigned_date: z.string().min(1),
  notes:         z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HrAssignAssetDto = z.infer<typeof HrAssignAssetSchema>;

export const HrCreateComplaintSchema = z.object({
  party2:      z.number().int().positive(),
  description: z.string().min(1).max(MAX_NOTES_LENGTH),
  severity:    z.enum(['low', 'medium', 'high', 'critical']),
});
export type HrCreateComplaintDto = z.infer<typeof HrCreateComplaintSchema>;

export const HrDailyReportSchema = z.object({
  date:    z.string().optional(),
  summary: z.string().max(MAX_NOTES_LENGTH).optional(),
  user_id: z.number().int().positive().optional(),
});
export type HrDailyReportDto = z.infer<typeof HrDailyReportSchema>;

export const HrBirthdaySettingsSchema = z.object({
  enabled:         z.boolean().optional(),
  notifyDaysBefore: z.number().int().min(0).max(30).optional(),
  message:         z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HrBirthdaySettingsDto = z.infer<typeof HrBirthdaySettingsSchema>;

export const CreatePipSchema = z.object({
  employee_id:      z.number().int().positive(),
  goals:            z.string().min(1).max(1000),
  success_criteria: z.string().min(1).max(1000),
  start_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  end_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
});
export type CreatePipDto = z.infer<typeof CreatePipSchema>;

export const UpdatePipSchema = z.object({
  status:  z.enum(['draft', 'active', 'completed', 'failed', 'cancelled']).optional(),
  outcome: z.string().max(2000).optional(),
});
export type UpdatePipDto = z.infer<typeof UpdatePipSchema>;

/** Razryad assignment: xodimni org_function kartasiga biriktirish */
export const HrAssignCardSchema = z.object({
  org_function_id: z.number().int().positive(),
});
export type HrAssignCardDto = z.infer<typeof HrAssignCardSchema>;

// ---------------------------------------------------------------------------
// HR — Adaptatsiya (moslashuv) checklist (3.14)
// ---------------------------------------------------------------------------

export const HrAdaptationProgramCreateSchema = z.object({
  title:          z.string().min(1).max(MAX_NAME_LENGTH),
  title_ru:       z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  description:    z.string().max(MAX_NOTES_LENGTH).optional(),
  position_id:    z.number().int().positive().optional(),
  department_id:  z.number().int().positive().optional(),
  duration:       z.number().int().positive().max(365).optional(),
  duration_type:  z.enum(['days', 'weeks', 'months']).optional(),
  mentor_required: z.boolean().optional(),
}).passthrough();
export type HrAdaptationProgramCreateDto = z.infer<typeof HrAdaptationProgramCreateSchema>;

export const HrAdaptationRecordCreateSchema = z.object({
  employee_id:  z.number().int().positive(),
  program_id:   z.number().int().positive().optional(),
  mentor_id:    z.number().int().positive().optional(),
  start_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format').optional(),
}).passthrough();
export type HrAdaptationRecordCreateDto = z.infer<typeof HrAdaptationRecordCreateSchema>;

export const HrAdaptationMilestoneUpdateSchema = z.object({
  status:         z.enum(['pending', 'completed', 'skipped']).optional(),
  notes:          z.string().max(MAX_NOTES_LENGTH).optional(),
  verified_by:    z.number().int().positive().optional(),
});
export type HrAdaptationMilestoneUpdateDto = z.infer<typeof HrAdaptationMilestoneUpdateSchema>;

export const HrAdaptationRecordUpdateSchema = z.object({
  status:              z.enum(['active', 'completed', 'failed', 'paused']).optional(),
  mentor_id:           z.number().int().positive().optional(),
  professional_master_id: z.number().int().positive().optional(),
  current_phase:       z.string().max(50).optional(),
  notes:               z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HrAdaptationRecordUpdateDto = z.infer<typeof HrAdaptationRecordUpdateSchema>;
