/**
 * @module hr.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_NOTES_LENGTH, MAX_NAME_LENGTH } from '@common/constants/app.constants';

export const HrCheckInSchema = z.object({
  employeeId:     z.number().int().positive(),
  attendanceDate: z.string().optional(),
  checkInTime:    z.string().optional(),
  source:         z.string().max(50).optional(),
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

export const HrImportEmployeesSchema = z.object({
  employees: z.array(z.record(z.string(), z.unknown())).optional(),
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
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  proficiency_score: z.number().min(0).max(100),
  certified_date:    z.string().optional(),
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

// P1.23.3: accept trainingName as fallback when training_id not provided
export const HrSafetyTrainingSchema = z.object({
  training_id:    z.union([z.number().int().positive(), z.string()]).optional(),
  trainingName:   z.string().optional(),         // FE sends this instead of training_id
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
export const HrHazardZoneSchema = z.object({
  zone_name:     z.string().min(1).max(MAX_NAME_LENGTH),
  zoneName:      z.string().optional(),           // camelCase alias
  zone_code:     z.string().max(50).optional(),
  zoneCode:      z.string().optional(),           // camelCase alias
  department_id: z.number().int().positive().optional(),
  hazard_level:  z.enum(['low', 'medium', 'high', 'extreme']).optional().default('low'),
  riskLevel:     z.enum(['low', 'medium', 'high', 'critical']).optional(),  // FE alias
  required_ppe:  z.string().max(MAX_NOTES_LENGTH).optional(),
  requiredPpe:   z.string().optional(),           // camelCase alias
  max_occupancy: z.number().int().positive().optional(),
  maxOccupancy:  z.number().int().positive().optional(),  // camelCase alias
  location:      z.string().optional(),           // FE uses this
  hazardType:    z.string().optional(),           // FE uses this
}).passthrough();
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
  firstName:        z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  lastName:         z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  departmentId:     z.string().optional(),
  positionId:       z.string().optional(),
  employeeCode:     z.string().optional(),
  hireDate:         z.string().optional(),
  salary:           z.number().positive().optional(),
  employmentStatus: z.string().optional(),
}).passthrough();
export type HrCreateEmployeeDto = z.infer<typeof HrCreateEmployeeSchema>;

export const HrUpdateEmployeeSchema = z.object({
  firstName:        z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  lastName:         z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  departmentId:     z.string().optional(),
  positionId:       z.string().optional(),
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
