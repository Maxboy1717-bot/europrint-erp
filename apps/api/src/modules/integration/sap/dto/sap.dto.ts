/**
 * @module sap.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const SapUpdateSalesOrderSchema = z.object({
  status:       z.string().max(50).optional(),
  delivery_date: z.string().optional(),
  notes:        z.string().optional(),
});
export type SapUpdateSalesOrderDto = z.infer<typeof SapUpdateSalesOrderSchema>;
