/**
 * @module inspection-status.enum
 * @description Source module. See exports for details.
 */

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  REWORK = 'rework',
}

export enum DefectType {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
}
