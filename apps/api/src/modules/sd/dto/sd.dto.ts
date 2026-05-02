import { z } from 'zod';

export const SdCreateCustomerSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  full_name:    z.string().min(1).max(255).optional(),
  phone:        z.string().max(50).optional(),
  email:        z.string().email().optional(),
  inn:          z.string().optional(),
  address:      z.string().optional(),
  type:         z.enum(['individual', 'company']).optional(),
}).passthrough();
export type SdCreateCustomerDto = z.infer<typeof SdCreateCustomerSchema>;

export const SdUpdateCustomerSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  full_name:    z.string().min(1).max(255).optional(),
  phone:        z.string().max(50).optional(),
  email:        z.string().email().optional(),
  address:      z.string().optional(),
  status:       z.enum(['active', 'inactive', 'blacklisted']).optional(),
}).passthrough();
export type SdUpdateCustomerDto = z.infer<typeof SdUpdateCustomerSchema>;

export const SdAddContactSchema = z.object({
  full_name: z.string().min(1).max(255),
  phone:     z.string().max(50).optional(),
  email:     z.string().email().optional(),
  position:  z.string().max(100).optional(),
  is_primary: z.boolean().optional(),
});
export type SdAddContactDto = z.infer<typeof SdAddContactSchema>;

export const SdCreateLeadSchema = z.object({
  title:       z.string().min(1).max(255),
  customer_id: z.number().int().positive().optional(),
  source:      z.string().max(100).optional(),
  amount:      z.number().positive().optional(),
  notes:       z.string().optional(),
  assigned_to: z.number().int().positive().optional(),
});
export type SdCreateLeadDto = z.infer<typeof SdCreateLeadSchema>;

export const SdUpdateLeadSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  customer_id: z.number().int().positive().optional(),
  source:      z.string().max(100).optional(),
  amount:      z.number().positive().optional(),
  notes:       z.string().optional(),
  assigned_to: z.number().int().positive().optional(),
});
export type SdUpdateLeadDto = z.infer<typeof SdUpdateLeadSchema>;

export const SdUpdateLeadStatusSchema = z.object({
  status: z.string().min(1).max(50),
});
export type SdUpdateLeadStatusDto = z.infer<typeof SdUpdateLeadStatusSchema>;

export const SdUpdateDeliveryStatusSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'returned', 'cancelled']),
  notes:  z.string().optional(),
});
export type SdUpdateDeliveryStatusDto = z.infer<typeof SdUpdateDeliveryStatusSchema>;

export const SdCreatePaymentSchema = z.object({
  order_id:       z.number().int().positive().optional(),
  amount:         z.number().positive().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online']).optional(),
  currency:       z.string().max(10).optional(),
  notes:          z.string().optional(),
}).passthrough();
export type SdCreatePaymentDto = z.infer<typeof SdCreatePaymentSchema>;

export const SdUpdateContactSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone:     z.string().max(50).optional(),
  email:     z.string().email().optional(),
  position:  z.string().max(100).optional(),
});
export type SdUpdateContactDto = z.infer<typeof SdUpdateContactSchema>;

export const SdAddInteractionSchema = z.object({
  type:        z.string().min(1).max(50),
  notes:       z.string().optional(),
  employee_id: z.number().int().positive().optional(),
});
export type SdAddInteractionDto = z.infer<typeof SdAddInteractionSchema>;

export const SdAddDocumentSchema = z.object({
  type:  z.string().min(1).max(50),
  name:  z.string().min(1).max(255),
  url:   z.string().optional(),
  notes: z.string().optional(),
});
export type SdAddDocumentDto = z.infer<typeof SdAddDocumentSchema>;

export const SdConvertLeadSchema = z.object({
  notes: z.string().optional(),
});
export type SdConvertLeadDto = z.infer<typeof SdConvertLeadSchema>;

export const SdAddLeadActivitySchema = z.object({
  type:        z.string().min(1).max(50),
  subject:     z.string().min(1).max(255),
  notes:       z.string().optional(),
  employee_id: z.number().int().positive().optional(),
});
export type SdAddLeadActivityDto = z.infer<typeof SdAddLeadActivitySchema>;
