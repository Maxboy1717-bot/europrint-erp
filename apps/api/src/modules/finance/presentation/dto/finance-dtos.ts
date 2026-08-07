/**
 * @module finance-dtos
 * @description Source module. See exports for details.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';
import { FISCAL_YEAR_MIN, FISCAL_YEAR_MAX } from '@common/constants/app.constants';

export const CreateIncomeCategorySchema = z.object({
  name: z.string().min(1, "Nom talab qilinadi"),
  type: z.enum(['income', 'expense']).default('income'),
  parentId: z.number().int().optional(),
  description: z.string().optional(),
});

export const UpdateIncomeCategorySchema = CreateIncomeCategorySchema.partial();

export const CreateIncomeExpenseSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  transactionType: z.enum(['income', 'expense']),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  categoryId: z.number().int().optional(),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
  paymentMethod: z.string().default('cash'),
});

export const UpdateIncomeExpenseSchema = CreateIncomeExpenseSchema.partial();

export const CreateCashflowTransactionSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  transactionType: z.enum(['inflow', 'outflow']),
  category: z.string().min(1, "Kategoriya talab qilinadi"),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  description: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export const CreateAccountingPeriodSchema = z.object({
  periodCode: z.string().regex(/^\d{4}-\d{2}$/, "Davr kodi YYYY-MM formatida"),
  fiscalYear: z.number().int().min(FISCAL_YEAR_MIN).max(FISCAL_YEAR_MAX),
  month: z.number().int().min(1).max(12),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const CreatePaymentSchema = z.object({
  invoiceId: IntegerIdSchema.optional(),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  currency: z.string().default('UZS'),
  paymentMethod: z.string().min(1, "To'lov usuli talab qilinadi"),
  referenceNumber: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const CreateOrderCostingSchema = z.object({
  salesOrderId: z.string().optional(),
  productionOrderId: z.string().optional(),
  materialCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  overheadCost: z.number().min(0).default(0),
  energyCost: z.number().min(0).default(0),
  wasteCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
});

export const CreateBudgetLineSchema = z.object({
  category: z.string().min(1, "Kategoriya talab qilinadi"),
  description: z.string().min(1, "Tavsif talab qilinadi"),
  plannedAmount: z.number().positive("Rejalashtirilgan summa musbat bo'lishi kerak"),
});

export const SeedGlAccountsSchema = z.object({
  accounts: z.array(z.object({
    accountCode: z.string().min(1),
    accountName: z.string().min(2),
    accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  })).optional(),
});

export const CalculateTaxSchema = z.object({
  grossSalary: z.number().min(0, "Yalpi ish haqi 0 dan katta bo'lishi kerak"),
  employeeId: z.number().int().optional(),
});

export const CreatePayrollPeriodSchema = z.object({
  periodCode: z.string().regex(/^\d{4}-\d{2}$/, "Davr kodi YYYY-MM formatida bo'lishi kerak"),
  year: z.number().int().min(FISCAL_YEAR_MIN).max(FISCAL_YEAR_MAX),
  month: z.number().int().min(1).max(12),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['draft', 'open', 'calculated', 'closed']).default('draft'),
});
