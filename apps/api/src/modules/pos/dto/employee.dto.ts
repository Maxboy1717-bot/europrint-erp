/**
 * @module employee.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';
export enum IncidentType {
  LOST    = 'LOST',
  DAMAGED = 'DAMAGED',
  STOLEN  = 'STOLEN',
  OTHER   = 'OTHER',
}

export enum LiabilityStatus {
  OPEN         = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPENSATED  = 'COMPENSATED',
  WRITTEN_OFF  = 'WRITTEN_OFF',
  CLOSED       = 'CLOSED',
}

// ─── Write-Off ────────────────────────────────────────────────────────────────

export const WriteOffLineSchema = z.object({
  ledgerEntryId:      z.number().int().positive(),
  materialCardId:     z.number().int().positive(),
  quantity:           z.number().positive(),
  serialNumberItemId: z.number().int().optional(),
  notes:              z.string().max(MAX_SHORT_TEXT).optional(),
});
export class WriteOffLineDto extends createZodDto(WriteOffLineSchema) {}

export const CreateWriteOffActSchema = z.object({
  userId:       z.number().int().positive(),
  warehouseId:  z.string().min(1),
  writeOffDate: z.string().optional(),
  reason:       z.string().max(MAX_NOTES_LENGTH).optional(),
  lines:        z.array(WriteOffLineSchema).min(1),
});
export class CreateWriteOffActDto extends createZodDto(CreateWriteOffActSchema) {}

// ─── Liability Case ───────────────────────────────────────────────────────────

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'ISO date string expected' });

export const OpenLiabilityCaseSchema = z.object({
  userId:             z.number().int().positive(),
  materialCardId:     z.number().int().positive(),
  serialNumberItemId: z.number().int().optional(),
  warehouseId:        z.string().optional(),
  incidentType:       z.enum(['LOST', 'DAMAGED', 'STOLEN', 'OTHER']),
  incidentDate:       isoDate,
  description:        z.string().min(1).max(MAX_NOTES_LENGTH),
  quantity:           z.number().positive(),
  assessedValue:      z.number().min(0),
});
export class OpenLiabilityCaseDto extends createZodDto(OpenLiabilityCaseSchema) {}

export const UpdateLiabilityCaseSchema = z.object({
  caseId:             z.number().int().positive(),
  status:             z.enum(['OPEN', 'UNDER_REVIEW', 'COMPENSATED', 'WRITTEN_OFF', 'CLOSED']).optional(),
  hrDecisionNotes:    z.string().max(MAX_NOTES_LENGTH).optional(),
  compensationAmount: z.number().min(0).optional(),
  compensationDate:   isoDate.optional(),
  closedAt:           isoDate.optional(),
});
export class UpdateLiabilityCaseDto extends createZodDto(UpdateLiabilityCaseSchema) {}

// ─── Employee Balance Filter ──────────────────────────────────────────────────

export const EmployeeBalanceFilterSchema = z.object({
  onlyActive:  z.boolean().optional(),
  warehouseId: z.string().optional(),
});
export class EmployeeBalanceFilterDto extends createZodDto(EmployeeBalanceFilterSchema) {}

export const EmployeeStatementSchema = z.object({
  userId:   z.number().int().positive(),
  dateFrom: isoDate,
  dateTo:   isoDate,
});
export class EmployeeStatementDto extends createZodDto(EmployeeStatementSchema) {}

// ─── Dismiss Checklist ────────────────────────────────────────────────────────

export const EmployeeDismissCheckSchema = z.object({
  userId: z.number().int().positive(),
});
export class EmployeeDismissCheckDto extends createZodDto(EmployeeDismissCheckSchema) {}

export type DismissCheckResultDto = {
  userId: number;
  employeeName: string;
  canDismiss: boolean;
  openLiabilityCases: number;
  unresolvedAssets: Array<{
    materialCardId: number;
    materialName: string;
    balance: number;
    totalValue: number;
  }>;
  totalOutstandingValue: number;
  message: string;
};
