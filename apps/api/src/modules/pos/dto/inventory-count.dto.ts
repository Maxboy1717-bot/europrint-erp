import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';
export enum CountStatus {
  DRAFT       = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW      = 'review',
  APPROVED    = 'approved',
  GL_POSTED   = 'gl_posted',
}

const COUNT_STATUSES = ['draft', 'in_progress', 'review', 'approved', 'gl_posted'] as const;

// ─── Create Count ─────────────────────────────────────────────────────────────

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'ISO date string expected' });

export const CreateInventoryCountSchema = z.object({
  warehouseId:       z.string().min(1),
  countDate:         isoDate.optional(),
  categoryFilter:    z.string().max(50).optional(),
  binLocationFilter: z.string().max(100).optional(),
  notes:             z.string().max(MAX_SHORT_TEXT).optional(),
});
export class CreateInventoryCountDto extends createZodDto(CreateInventoryCountSchema) {}

// ─── Record Actual Qty ────────────────────────────────────────────────────────

export const RecordActualQtySchema = z.object({
  lineId:         z.number().int().positive(),
  actualQty:      z.number().min(0),
  binLocation:    z.string().max(100).optional(),
  scannedBarcode: z.string().optional(),
  notes:          z.string().max(MAX_SHORT_TEXT).optional(),
});
export class RecordActualQtyDto extends createZodDto(RecordActualQtySchema) {}

export const BulkRecordActualQtySchema = z.object({
  countId: z.number().int().positive(),
  lines:   z.array(RecordActualQtySchema).min(1),
});
export class BulkRecordActualQtyDto extends createZodDto(BulkRecordActualQtySchema) {}

// ─── Approve Count ────────────────────────────────────────────────────────────

export const ApproveInventoryCountSchema = z.object({
  countId:          z.number().int().positive(),
  applyAdjustments: z.boolean(),
  notes:            z.string().max(MAX_SHORT_TEXT).optional(),
});
export class ApproveInventoryCountDto extends createZodDto(ApproveInventoryCountSchema) {}

// ─── Count Filter ─────────────────────────────────────────────────────────────

export const CountFilterSchema = z.object({
  status:      z.enum(COUNT_STATUSES).optional(),
  warehouseId: z.string().optional(),
  dateFrom:    z.string().optional(),
  dateTo:      z.string().optional(),
  page:        z.coerce.number().int().min(1).optional(),
  limit:       z.coerce.number().int().min(1).optional(),
});
export class CountFilterDto extends createZodDto(CountFilterSchema) {}

// ─── Count Variance Result ────────────────────────────────────────────────────

export class CountVarianceResultDto {
  countId: number;
  countNumber: string;
  warehouseId: string;
  totalLines: number;
  matchedLines: number;
  varianceLines: number;
  totalVarianceValue: number;
  lines: Array<{
    materialCardId: number;
    materialName: string;
    systemQty: number;
    actualQty: number;
    variance: number;
    varianceValue: number;
    binLocation: string;
  }>;
}
