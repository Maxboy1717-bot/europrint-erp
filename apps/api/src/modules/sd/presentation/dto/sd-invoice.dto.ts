import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  taxRate: z.number().min(0).max(100).default(12),
});

export const CreateInvoiceDtoSchema = z.object({
  salesOrderId: z.string().uuid('Sales order ID must be valid UUID'),
  customerName: z.string().min(1, 'Customer name is required'),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  dueDate: z.string().datetime('Due date must be valid datetime'),
  notes: z.string().optional().nullable(),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceDtoSchema>;

export const GetInvoicesDtoSchema = z.object({
  salesOrderId: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending', 'paid', 'cancelled']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetInvoicesDto = z.infer<typeof GetInvoicesDtoSchema>;
