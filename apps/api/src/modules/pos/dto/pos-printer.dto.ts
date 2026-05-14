/**
 * @module pos-printer.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const PosCreatePrinterConfigSchema = z.object({
  name:        z.string().min(1).max(255).optional(),
  printerIp:   z.string().min(1).max(255),
  printerPort: z.number().int().min(1).max(65535).optional(),
  printFormat: z.string().max(50).optional(),
  notes:       z.string().optional(),
});
export type PosCreatePrinterConfigDto = z.infer<typeof PosCreatePrinterConfigSchema>;

export const PosUpdatePrinterConfigSchema = z.object({
  name:       z.string().min(1).max(255).optional(),
  type:       z.enum(['thermal', 'laser', 'inkjet']).optional(),
  ip_address: z.string().optional(),
  port:       z.number().int().min(1).max(65535).optional(),
  is_default: z.boolean().optional(),
  is_active:  z.boolean().optional(),
  location:   z.string().max(100).optional(),
});
export type PosUpdatePrinterConfigDto = z.infer<typeof PosUpdatePrinterConfigSchema>;
