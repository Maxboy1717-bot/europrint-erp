/**
 * @module pos.events.types
 * @description Event payload type definitions extracted from pos.events.ts
 *   to keep main file <300 lines (Rule 16).
 */

export interface MovementCreatedEvent {
  movementId: number;
  movementNumber: string;
  typeCode: string;
  createdById: number;
}

export interface MovementStatusChangedEvent {
  movementId: number;
  movementNumber: string;
  oldStatus: string;
  newStatus: string;
  updatedById: number;
}

export interface QcDecisionEvent {
  movementId: number;
  decision: string;
  qcInspectorId: number;
}

export interface RequestEvent {
  requestId: number;
  requestNumber: string;
  departmentCode?: string;
  createdById?: number;
  approvedById?: number;
  rejectedById?: number;
  rejectionReason?: string;
}

export interface HrEmployeeExitEvent {
  userId: number;
  employeeCode?: string;
  departmentCode?: string;
  exitDate?: string;
}
