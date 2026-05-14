/**
 * @module approval.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';
import { z } from 'zod';
import { HitlDocumentType } from '../../domain/enums/hitl-document-type.enum';
export const CreateApprovalRequestDtoSchema = z.object({
  documentType: z.enum(Object.values(HitlDocumentType) as [string, ...string[]]),
  documentId: z.string().uuid(),
  documentNumber: z.string().nullable().optional(),
  amount: z.number().positive('Summa musbat son bo\'lishi kerak'),
  currency: z.string().default('UZS'),
  notes: z.string().nullable().optional(),
});

export type CreateApprovalRequestDto = z.infer<typeof CreateApprovalRequestDtoSchema>;

export const ApproveDtoSchema = z.object({
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
});

export type ApproveDto = z.infer<typeof ApproveDtoSchema>;

export const RejectDtoSchema = z.object({
  reason: z
    .string()
    .min(5, 'Sababi kamida 5 ta belgi bo\'lishi kerak')
    .max(MAX_NOTES_LENGTH, `Sababi ${MAX_NOTES_LENGTH} ta belgidan ko'p bo'lishi mumkin emas`),
});

export type RejectDto = z.infer<typeof RejectDtoSchema>;

export const GetPendingDtoSchema = z.object({
  documentType: z
    .enum(Object.values(HitlDocumentType) as [string, ...string[]])
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetPendingDto = z.infer<typeof GetPendingDtoSchema>;

export const ApprovalResponseSchema = z.object({
  id: z.string(),
  documentType: z.string(),
  documentId: z.string(),
  documentNumber: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  requestedBy: z.string(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  rejectedBy: z.string().nullable(),
  rejectedAt: z.date().nullable(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApprovalResponse = z.infer<typeof ApprovalResponseSchema>;

export const PaginatedApprovalResponseSchema = z.object({
  items: z.array(ApprovalResponseSchema),
  total: z.number(),
});

export type PaginatedApprovalResponse = z.infer<
  typeof PaginatedApprovalResponseSchema
>;
