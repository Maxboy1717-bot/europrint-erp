/**
 * @module finance.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_NOTES_LENGTH } from '@common/constants/app.constants';

export const FinanceRequestAdvanceSchema = z.object({
  employeeId:  z.number().int().positive(),
  amount:      z.number().positive(),
  reason:      z.string().min(1).max(MAX_NOTES_LENGTH),
  requestedBy: z.number().int().positive(),
});
export type FinanceRequestAdvanceDto = z.infer<typeof FinanceRequestAdvanceSchema>;

export const FinanceOverrideAdvanceSchema = z.object({
  employeeId:  z.number().int().positive(),
  amount:      z.number().positive(),
  reason:      z.string().min(1).max(MAX_NOTES_LENGTH),
  overriddenBy: z.number().int().positive(),
});
export type FinanceOverrideAdvanceDto = z.infer<typeof FinanceOverrideAdvanceSchema>;

export const FinancePostSalesInvoiceSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount:    z.number(),
  tax:       z.number(),
  postedBy:  z.number().int().positive(),
});
export type FinancePostSalesInvoiceDto = z.infer<typeof FinancePostSalesInvoiceSchema>;

// ERP gross-only: payroll GL posts gross only; tax (INPS/JSHD) legs are 1C's domain.
export const FinancePostPayrollSchema = z.object({
  payrollId: z.number().int().positive(),
  gross:     z.number(),
  postedBy:  z.number().int().positive(),
});
export type FinancePostPayrollDto = z.infer<typeof FinancePostPayrollSchema>;

export const FinanceCreateInvoiceSchema = z.object({
  customerId:  z.number().int().positive(),
  amount:      z.number().positive(),
  dueDate:     z.string().min(1),
  description: z.string().min(1).max(MAX_NOTES_LENGTH),
  createdBy:   z.number().int().positive(),
});
export type FinanceCreateInvoiceDto = z.infer<typeof FinanceCreateInvoiceSchema>;

export const FinancePostInvoiceSchema = z.object({
  postedBy:  z.number().int().positive(),
  amount:    z.number().min(0),
  taxAmount: z.number().min(0).optional().default(0),
});
export type FinancePostInvoiceDto = z.infer<typeof FinancePostInvoiceSchema>;

export const FinanceRecordPaymentSchema = z.object({
  paymentId:      z.number().int().positive(),
  invoiceId:      z.number().int().positive(),
  customerId:     z.number().int().positive(),
  amount:         z.number().positive(),
  paymentDate:    z.string().min(1),
  recordedBy:     z.number().int().positive(),
  /** C1: client-supplied idempotency key (e.g. crypto.randomUUID()) — a retry with the same key
   *  returns the already-recorded payment instead of inserting a duplicate. Optional for backward
   *  compatibility with existing callers that don't send one yet. */
  idempotencyKey: z.string().min(1).max(100).optional(),
});
export type FinanceRecordPaymentDto = z.infer<typeof FinanceRecordPaymentSchema>;

export const FinanceVerifyPaymentSchema = z.object({
  verifiedBy: z.number().int().positive(),
});
export type FinanceVerifyPaymentDto = z.infer<typeof FinanceVerifyPaymentSchema>;

export const FinanceGlDocumentBodySchema = z.record(z.string(), z.unknown());
export type FinanceGlDocumentBodyDto = z.infer<typeof FinanceGlDocumentBodySchema>;

export const FinanceClosePeriodSchema = z.object({
  closedBy: z.number().int().positive().optional(),
});
export type FinanceClosePeriodDto = z.infer<typeof FinanceClosePeriodSchema>;
