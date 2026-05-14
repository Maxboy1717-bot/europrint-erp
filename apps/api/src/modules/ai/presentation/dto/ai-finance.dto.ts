/**
 * @module ai-finance.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

const HistoricalMonthSchema = z.object({
  month: z.string().min(1).max(20),
  inflow: z.number().nonnegative(),
  outflow: z.number().nonnegative(),
});

export const AiFinanceCashflowDtoSchema = z.object({
  historicalData: z.array(HistoricalMonthSchema).min(1).max(120),
});
export type AiFinanceCashflowDto = z.infer<typeof AiFinanceCashflowDtoSchema>;

export const AiFinanceBudgetVarianceDtoSchema = z.object({
  category: z.string().min(1).max(200),
  budgeted: z.number(),
  actual: z.number(),
  context: z.string().min(1).max(2000),
});
export type AiFinanceBudgetVarianceDto = z.infer<typeof AiFinanceBudgetVarianceDtoSchema>;

export const AiFinanceClassifyInvoiceDtoSchema = z.object({
  description: z.string().min(1).max(1000),
  amount: z.number().positive(),
  vendor: z.string().min(1).max(200),
});
export type AiFinanceClassifyInvoiceDto = z.infer<typeof AiFinanceClassifyInvoiceDtoSchema>;

export const AiFinanceFraudRiskDtoSchema = z.object({
  transactionData: z.record(z.string(), z.unknown()),
});
export type AiFinanceFraudRiskDto = z.infer<typeof AiFinanceFraudRiskDtoSchema>;
