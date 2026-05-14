/**
 * @module barcode.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_SHORT_TEXT, MAX_NAME_LENGTH } from '@common/constants/app.constants';
export enum BarcodeType {
  EAN13      = 'ean13',
  CODE128    = 'code128',
  QR         = 'qr',
  DATAMATRIX = 'datamatrix',
}

export enum PrintStatus {
  QUEUED   = 'QUEUED',
  PRINTING = 'PRINTING',
  PRINTED  = 'PRINTED',
  FAILED   = 'FAILED',
}

const BARCODE_TYPES = ['ean13', 'code128', 'qr', 'datamatrix'] as const;

// ─── Scan Barcode ─────────────────────────────────────────────────────────────

export const ScanBarcodeSchema = z.object({
  barcode:        z.string().min(1).max(MAX_NAME_LENGTH),
  barcodeType:    z.enum(BARCODE_TYPES).optional(),
  warehouseId:    z.string().optional(),
  telegramUserId: z.number().optional(),
});
export class ScanBarcodeDto extends createZodDto(ScanBarcodeSchema) {}

export class ScanBarcodeResultDto {
  found: boolean;
  materialCard?: {
    id: number;
    xomAshyo: string;
    xomAshyoRu: string;
    barcode: string;
    unitOfMeasure: string;
    isConsumable: boolean;
    isIndivisible: boolean;
    minIntervalDays: number;
    maxQtyPerIssue: number;
    currentStock?: number;
    availableStock?: number;
  };
  aiSuggestionId?: number;
  aiSuggestion?: {
    suggestedName: string;
    suggestedNameRu: string;
    suggestedUnit: string;
    confidence: number;
    reasoning: string;
  };
}

// ─── Assign Barcode ───────────────────────────────────────────────────────────

export const AssignBarcodeSchema = z.object({
  materialCardId: z.number().int().positive(),
  barcode: z.string().min(1).max(MAX_NAME_LENGTH).regex(
    /^\d{13}$|^[A-Z0-9\-]{6,50}$/,
    'EAN-13 (13 raqam) yoki Code128 (harflar va raqamlar) format',
  ),
  barcodeType: z.enum(BARCODE_TYPES).optional(),
  isPrimary:   z.boolean().optional(),
  notes:       z.string().max(MAX_NAME_LENGTH).optional(),
});
export class AssignBarcodeDto extends createZodDto(AssignBarcodeSchema) {}

// ─── Print Label ──────────────────────────────────────────────────────────────

export const PrintLabelSchema = z.object({
  materialCardId: z.number().int().positive(),
  copies:         z.number().int().positive(),
  printerId:      z.string().max(100).optional(),
  templateName:   z.string().max(100).optional(),
  showPrice:      z.boolean().optional(),
  price:          z.number().optional(),
  posMovementId:  z.number().int().optional(),
});
export class PrintLabelDto extends createZodDto(PrintLabelSchema) {}

// ─── AI Card Suggestion ───────────────────────────────────────────────────────

export const ReviewAiSuggestionSchema = z.object({
  suggestionId:    z.number().int().positive(),
  decision:        z.enum(['APPROVED', 'REJECTED', 'MODIFIED']),
  rejectionReason: z.string().max(MAX_SHORT_TEXT).optional(),
  modifiedData:    z.object({
    name:     z.string().optional(),
    nameRu:   z.string().optional(),
    unit:     z.string().optional(),
    category: z.string().optional(),
    barcode:  z.string().optional(),
  }).optional(),
});
export class ReviewAiSuggestionDto extends createZodDto(ReviewAiSuggestionSchema) {}

// ─── Barcode Generate ─────────────────────────────────────────────────────────

export const GenerateEan13Schema = z.object({
  companyPrefix: z.string().regex(/^\d{9}$/, '9 raqamli GS1 prefiksi kerak'),
  productCode:   z.string().regex(/^\d{3}$/, '3 raqamli mahsulot kodi kerak'),
});
export class GenerateEan13Dto extends createZodDto(GenerateEan13Schema) {}
