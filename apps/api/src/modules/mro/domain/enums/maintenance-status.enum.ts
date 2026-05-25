/**
 * @module maintenance-status.enum
 * @description Source module. See exports for details.
 */

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  PREDICTIVE = 'predictive',
}
