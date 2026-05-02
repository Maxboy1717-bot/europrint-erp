import { z } from 'zod';

export const CreateMroItemSchema = z.object({
  name:         z.string().min(1),
  category:     z.string().optional(),
  unit:         z.string().optional(),
  currentStock: z.number().nonnegative().optional(),
  minStock:     z.number().nonnegative().optional(),
  unitCost:     z.number().nonnegative().optional(),
  location:     z.string().optional(),
  supplier:     z.string().optional(),
});
export type CreateMroItemDto = z.infer<typeof CreateMroItemSchema>;

export const CreateMroRequestSchema = z.object({
  itemId:            z.union([z.string(), z.number()]).optional(),
  requestedQuantity: z.number().int().positive().optional(),
  reason:            z.string().optional(),
  requestedBy:       z.union([z.string(), z.number()]).optional(),
  priority:          z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});
export type CreateMroRequestDto = z.infer<typeof CreateMroRequestSchema>;

export const ApproveRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
});
export type ApproveRequestDto = z.infer<typeof ApproveRequestSchema>;

export const CreateEquipmentSchema = z.object({
  name:                 z.string().min(1),
  category:             z.string().optional(),
  status:               z.string().optional(),
  location:             z.string().optional(),
  purchaseDate:         z.string().optional(),
  nextMaintenanceDate:  z.string().optional(),
});
export type CreateEquipmentDto = z.infer<typeof CreateEquipmentSchema>;

export const CreateExpenseRequestSchema = z.object({
  title:       z.string().min(1),
  amount:      z.number().nonnegative(),
  category:    z.string().optional(),
  description: z.string().optional(),
  requestedBy: z.union([z.string(), z.number()]).optional(),
});
export type CreateExpenseRequestDto = z.infer<typeof CreateExpenseRequestSchema>;

export const ApproveActionSchema = z.object({
  action:   z.enum(['approve', 'reject']),
  comments: z.string().optional(),
});
export type ApproveActionDto = z.infer<typeof ApproveActionSchema>;

export const InvoiceMatchSchema = z.object({
  tolerancePercent: z.number().min(0).max(100).optional(),
});
export type InvoiceMatchDto = z.infer<typeof InvoiceMatchSchema>;
