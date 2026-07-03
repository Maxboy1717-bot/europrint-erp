/**
 * @module iot-camera.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_SHORT_TEXT, MAX_NAME_LENGTH, MAX_QUERY_LIMIT } from '@common/constants/app.constants';
export const UpdateCameraPromptDtoSchema = z.object({
  prompt: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  zone: z.string().default('production'),
  alertThreshold: z.number().min(0).max(1).default(0.8),
  isActive: z.boolean().default(true),
  triggerRules: z.array(z.unknown()).default([]),
}).refine((d) => d.prompt || d.instructions, {
  message: 'prompt yoki instructions majburiy',
  path: ['prompt'],
});
export type UpdateCameraPromptDto = z.infer<typeof UpdateCameraPromptDtoSchema>;

export const UpdateTriggerRulesDtoSchema = z.object({
  triggerRules: z.array(z.unknown()).min(0),
  zone: z.string().default('production'),
  alertThreshold: z.number().min(0).max(1).default(0.8),
  isActive: z.boolean().default(true),
});
export type UpdateTriggerRulesDto = z.infer<typeof UpdateTriggerRulesDtoSchema>;

export const ListQuerySchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_SHORT_TEXT).default(50),
  page: z.coerce.number().int().min(1).default(1),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

export const CameraAlertsQuerySchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type CameraAlertsQuery = z.infer<typeof CameraAlertsQuerySchema>;

export const ResolveAlertBodySchema = z.object({
  notes: z.string().optional(),
});
export type ResolveAlertBody = z.infer<typeof ResolveAlertBodySchema>;

export const UpdateCameraSettingsBodySchema = z.object({
  camera_id: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
}).passthrough();
export type UpdateCameraSettingsBody = z.infer<typeof UpdateCameraSettingsBodySchema>;

/** POST/PUT /api/camera-settings — global AI/alert/telegram/penalty settings (singleton, stored in `settings` key-value table). */
export const CameraGlobalSettingsBodySchema = z.object({
  safetyThreshold: z.coerce.number().min(0).max(100).default(80),
  qualityThreshold: z.coerce.number().min(0).max(100).default(75),
  productivityThreshold: z.coerce.number().min(0).max(100).default(70),
  enableSafetyAlerts: z.boolean().default(true),
  enableQualityAlerts: z.boolean().default(true),
  enableMachineAlerts: z.boolean().default(true),
  enableProductivityAlerts: z.boolean().default(false),
  telegramEnabled: z.boolean().default(true),
  dailyReportTime: z.string().default('18:00'),
  alertCooldown: z.coerce.number().int().min(0).max(1440).default(5),
  autoPenalty: z.boolean().default(true),
  penaltyAmount: z.coerce.number().min(0).default(50000),
});
export type CameraGlobalSettingsBody = z.infer<typeof CameraGlobalSettingsBodySchema>;

/** POST /api/cameras — Cameras Management page (cameras-management.tsx) create form. */
export const CreateCameraManagementBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  rtspUrl: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  port: z.coerce.number().int().positive().optional().nullable(),
  workCenterId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
}).passthrough();
export type CreateCameraManagementBody = z.infer<typeof CreateCameraManagementBodySchema>;

/** PATCH /api/cameras/:id — Cameras Management page edit form (also used for isActive toggle). */
export const UpdateCameraManagementBodySchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  nameRu: z.string().optional().nullable(),
  rtspUrl: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  port: z.coerce.number().int().positive().optional().nullable(),
  workCenterId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
}).passthrough();
export type UpdateCameraManagementBody = z.infer<typeof UpdateCameraManagementBodySchema>;

export const CameraListQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
});
export type CameraListQuery = z.infer<typeof CameraListQuerySchema>;

export const EmployeeRatingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
  employee_id: z.string().optional(),
});
export type EmployeeRatingsQuery = z.infer<typeof EmployeeRatingsQuerySchema>;

export const RecognitionLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
  camera_id: z.string().optional(),
  flagged: z.string().optional(),
});
export type RecognitionLogsQuery = z.infer<typeof RecognitionLogsQuerySchema>;

export const QualityDefectsCameraQuerySchema = z.object({
  status: z.string().optional(),
  camera_id: z.string().optional(),
  defect_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type QualityDefectsCameraQuery = z.infer<typeof QualityDefectsCameraQuerySchema>;

export const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_SHORT_TEXT).default(50),
});
export type LimitQuery = z.infer<typeof LimitQuerySchema>;

export const DashboardEventQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  type: z.string().optional(),
});
export type DashboardEventQuery = z.infer<typeof DashboardEventQuerySchema>;

export const TopEmployeesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  metric: z.string().optional(),
});
export type TopEmployeesQuery = z.infer<typeof TopEmployeesQuerySchema>;

export const HeatmapQuerySchema = z.object({
  zone_id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required').optional(),
});
export type HeatmapQuery = z.infer<typeof HeatmapQuerySchema>;

export const ReportGenerateBodySchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});
export type ReportGenerateBody = z.infer<typeof ReportGenerateBodySchema>;

export const OeeQuerySchema = z.object({
  device_id: z.string().optional(),
  period: z.string().default('7d'),
});
export type OeeQuery = z.infer<typeof OeeQuerySchema>;

export const SensorListQuerySchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type SensorListQuery = z.infer<typeof SensorListQuerySchema>;

export const SensorHistoryQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_SHORT_TEXT).default(MAX_QUERY_LIMIT),
});
export type SensorHistoryQuery = z.infer<typeof SensorHistoryQuerySchema>;

export const SensorTrendsQuerySchema = z.object({
  type: z.string().optional(),
  period: z.string().default('24h'),
});
export type SensorTrendsQuery = z.infer<typeof SensorTrendsQuerySchema>;

export const SensorLiveQuerySchema = z.object({
  type: z.string().optional(),
  location: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type SensorLiveQuery = z.infer<typeof SensorLiveQuerySchema>;

export const SensorSeverityQuerySchema = z.object({
  severity: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type SensorSeverityQuery = z.infer<typeof SensorSeverityQuerySchema>;

export const DeviceIdQuerySchema = z.object({
  device_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_SHORT_TEXT).default(100),
});
export type DeviceIdQuery = z.infer<typeof DeviceIdQuerySchema>;

export const LocationQuerySchema = z.object({
  location: z.string().optional(),
  device_id: z.string().optional(),
});
export type LocationQuery = z.infer<typeof LocationQuerySchema>;

export const ShiftReportQuerySchema = z.object({
  shift: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required').optional(),
});
export type ShiftReportQuery = z.infer<typeof ShiftReportQuerySchema>;

export const EmployeeHealthQuerySchema = z.object({
  employee_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type EmployeeHealthQuery = z.infer<typeof EmployeeHealthQuerySchema>;

export const DeptLimitQuerySchema = z.object({
  department_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type DeptLimitQuery = z.infer<typeof DeptLimitQuerySchema>;

export const ShiftQuerySchema = z.object({
  shift: z.string().optional(),
});
export type ShiftQuery = z.infer<typeof ShiftQuerySchema>;

export const EnvironmentQuerySchema = z.object({
  type: z.string().optional(),
  location: z.string().optional(),
  device_id: z.string().optional(),
});
export type EnvironmentQuery = z.infer<typeof EnvironmentQuerySchema>;

export const CameraAiSafetyTrendsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type CameraAiSafetyTrendsQuery = z.infer<typeof CameraAiSafetyTrendsQuerySchema>;

export const PendingAlertsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PendingAlertsQuery = z.infer<typeof PendingAlertsQuerySchema>;

export const StatusLimitQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type StatusLimitQuery = z.infer<typeof StatusLimitQuerySchema>;

export const MachineLogsQuerySchema = z.object({
  device_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_SHORT_TEXT).default(50),
});
export type MachineLogsQuery = z.infer<typeof MachineLogsQuerySchema>;

export const CameraEventsQuerySchema = z.object({
  camera_id: z.string().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type CameraEventsQuery = z.infer<typeof CameraEventsQuerySchema>;

export const ViolationsQuerySchema = z.object({
  camera_id: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_NAME_LENGTH).default(50),
});
export type ViolationsQuery = z.infer<typeof ViolationsQuerySchema>;

export const CreateCameraEventBodySchema = z.object({
  camera_id: z.coerce.number().int().positive(),
  event_type: z.string().min(1),
  description: z.string().optional().nullable(),
  severity: z.string().default('low'),
  zone_id: z.coerce.number().int().positive().optional().nullable(),
});
export type CreateCameraEventBody = z.infer<typeof CreateCameraEventBodySchema>;

export const CreateSafetyViolationBodySchema = z.object({
  camera_id: z.coerce.number().int().positive(),
  violation_type: z.string().min(1),
  severity: z.string().default('medium'),
  description: z.string().optional().nullable(),
  employee_id: z.coerce.number().int().positive().optional().nullable(),
});
export type CreateSafetyViolationBody = z.infer<typeof CreateSafetyViolationBodySchema>;

export const CreateQualityDefectBodySchema = z.object({
  camera_id: z.coerce.number().int().positive(),
  defect_type: z.string().min(1),
  severity: z.string().default('medium'),
  description: z.string().optional().nullable(),
});
export type CreateQualityDefectBody = z.infer<typeof CreateQualityDefectBodySchema>;

export const UpdateEventStatusBodySchema = z.object({
  status: z.string().optional().nullable(),
  resolution_note: z.string().optional().nullable(),
});
export type UpdateEventStatusBody = z.infer<typeof UpdateEventStatusBodySchema>;

export const CreateCameraBodySchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  rtsp_url: z.string().optional().nullable(),
  zone_id: z.coerce.number().int().positive().optional().nullable(),
  type: z.string().default('general'),
});
export type CreateCameraBody = z.infer<typeof CreateCameraBodySchema>;

export const UpdateCameraBodySchema = z.object({
  name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  rtsp_url: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  zone_id: z.coerce.number().int().positive().optional().nullable(),
}).passthrough();
export type UpdateCameraBody = z.infer<typeof UpdateCameraBodySchema>;

export const CreateCameraZoneBodySchema = z.object({
  name: z.string().min(1),
  camera_id: z.coerce.number().int().positive(),
  coordinates: z.array(z.unknown()).default([]),
  zone_type: z.string().default('monitoring'),
});
export type CreateCameraZoneBody = z.infer<typeof CreateCameraZoneBodySchema>;
