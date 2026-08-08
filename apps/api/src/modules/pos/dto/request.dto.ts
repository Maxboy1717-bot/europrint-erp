/**
 * @module request.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';
// Discovery sweep 2026-08-03 fix ("So'rovlar ro'yxatini status bo'yicha filtrlash doim DB xatosi
// beradi"): this used to be a lowercase vocabulary ('draft'/'pending'/...) that matched NOTHING
// else in the system — pos_material_requests.status is UPPERCASE everywhere it's actually
// written (pos-request.service.ts create/approve/reject) and read (PosRequests.tsx FE tab logic,
// posMaterialRequests' Drizzle requestStatusEnum in pos-schema-v2.ts). A status filter request
// using the real values (e.g. ?status=SUBMITTED) was rejected by this Zod enum before it ever
// reached the DB. Aligned to the actual 7-value vocabulary (DRAFT/SUBMITTED/APPROVED/
// PARTIALLY_ISSUED/FULLY_ISSUED/REJECTED/CANCELLED) — no PENDING/ISSUED (never written), added
// SUBMITTED/PARTIALLY_ISSUED/FULLY_ISSUED (real statuses this schema was missing entirely).
export enum RequestStatus {
  DRAFT             = 'DRAFT',
  SUBMITTED         = 'SUBMITTED',
  APPROVED          = 'APPROVED',
  PARTIALLY_ISSUED  = 'PARTIALLY_ISSUED',
  FULLY_ISSUED      = 'FULLY_ISSUED',
  REJECTED          = 'REJECTED',
  CANCELLED         = 'CANCELLED',
}

export enum RequestPriority {
  LOW    = 'low',
  NORMAL = 'normal',
  HIGH   = 'high',
  URGENT = 'urgent',
}

const REQUEST_STATUSES   = ['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'REJECTED', 'CANCELLED'] as const;
const REQUEST_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

// ─── Request Line ─────────────────────────────────────────────────────────────

export const CreateRequestLineSchema = z.object({
  materialCardId: z.number().int().positive(),
  requestedQty:   z.number().positive(),
  purpose:        z.string().max(MAX_SHORT_TEXT).optional(),
});

// ─── Create Request ───────────────────────────────────────────────────────────

export class CreateRequestLineDto extends createZodDto(CreateRequestLineSchema) {}

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'ISO date string expected' });

export const CreateMaterialRequestSchema = z.object({
  departmentCode:    z.string().min(1).max(50),
  targetWarehouseId: z.string().min(1).max(50).optional(),
  priority:          z.enum(REQUEST_PRIORITIES).optional(),
  requiredByDate:    isoDate.optional(),
  notes:             z.string().max(MAX_NOTES_LENGTH).optional(),
  lines:             z.array(CreateRequestLineSchema).min(1),
});
export class CreateMaterialRequestDto extends createZodDto(CreateMaterialRequestSchema) {}

// ─── Approve / Reject Request ─────────────────────────────────────────────────

export const ApproveRequestSchema = z.object({
  requestId: z.number().int().positive(),
  notes:     z.string().max(MAX_SHORT_TEXT).optional(),
  approvedLines: z.array(z.object({
    lineId:      z.number().int(),
    approvedQty: z.number(),
  })).optional(),
});
export class ApproveRequestDto extends createZodDto(ApproveRequestSchema) {}

export const RejectRequestSchema = z.object({
  requestId:       z.number().int().positive(),
  rejectionReason: z.string().min(1).max(MAX_SHORT_TEXT),
});
export class RejectRequestDto extends createZodDto(RejectRequestSchema) {}

// ─── Issue from Request ───────────────────────────────────────────────────────

export const IssueFromRequestSchema = z.object({
  requestId:            z.number().int().positive(),
  fromWarehouseId:      z.string().min(1),
  receivedByEmployeeId: z.number().int().optional(),
  lineDetails: z.array(z.object({
    lineId:      z.number().int(),
    issuedQty:   z.number(),
    binLocation: z.string().optional(),
    batchId:     z.number().int().optional(),
  })).optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
});
export class IssueFromRequestDto extends createZodDto(IssueFromRequestSchema) {}

// ─── Request Filter ───────────────────────────────────────────────────────────

export const RequestFilterSchema = z.object({
  status:         z.enum(REQUEST_STATUSES).optional(),
  departmentCode: z.string().optional(),
  priority:       z.enum(REQUEST_PRIORITIES).optional(),
  dateFrom:       z.string().optional(),
  dateTo:         z.string().optional(),
  page:           z.coerce.number().int().min(1).optional(),
  limit:          z.coerce.number().int().min(1).optional(),
});
export class RequestFilterDto extends createZodDto(RequestFilterSchema) {}

// ─── Transfer ─────────────────────────────────────────────────────────────────

export const CreateTransferSchema = z.object({
  fromWarehouseId: z.string().min(1),
  toWarehouseId:   z.string().min(1),
  materialCardId:  z.number().int().positive(),
  quantity:        z.number().positive(),
  batchId:         z.number().int().optional(),
  reason:          z.string().max(MAX_SHORT_TEXT).optional(),
});
export class CreateTransferDto extends createZodDto(CreateTransferSchema) {}
