import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const CostCenterSchema = z.object({
  name:        z.string().optional(),
  code:        z.string().optional(),
  description: z.string().optional(),
  budgetAmount: z.number().optional(),
}).passthrough();
export class CostCenterDto extends createZodDto(CostCenterSchema) {}

const ProfitCenterSchema = z.object({
  name:        z.string().optional(),
  code:        z.string().optional(),
  description: z.string().optional(),
}).passthrough();
export class ProfitCenterDto extends createZodDto(ProfitCenterSchema) {}

const GlDocumentSchema = z.object({
  date:        z.string().optional(),
  description: z.string().optional(),
  amount:      z.number().optional(),
  debitAccount:  z.string().optional(),
  creditAccount: z.string().optional(),
}).passthrough();
export class GlDocumentDto extends createZodDto(GlDocumentSchema) {}
