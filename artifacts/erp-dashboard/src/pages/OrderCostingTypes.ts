/** @module OrderCostingTypes @description TypeScript interfaces, Zod schema, types, and utility helpers for OrderCosting pages. No JSX. */

import { z } from "zod";

export interface OrderCosting {
  id: string;
  salesOrderId: string | null;
  productionOrderId: string | null;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  energyCost: number;
  wasteCost: number;
  totalCost: number;
  sellingPrice: number;
  grossProfit: number | null;
  profitMargin: number | null;
  status: string;
  calculatedBy: string | null;
  calculatedAt: string | null;
  createdAt: string;
}

export interface OrderCostingLine {
  id: string;
  orderCostingId: string;
  costType: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes: string | null;
}

export interface OrderCostingDetail extends OrderCosting {
  lines: OrderCostingLine[];
}

export interface SalesOrder {
  id: string;
  documentNumber: string;
  soldToParty: string | null;
  status: string;
}

export const costingFormSchema = z.object({
  salesOrderId: z.string().min(1, "Sotish buyurtmasini tanlang"),
  materialCost: z.coerce.number().nonnegative("Material xarajati 0 yoki katta bo'lishi kerak"),
  laborCost: z.coerce.number().nonnegative("Mehnat xarajati 0 yoki katta bo'lishi kerak"),
  overheadCost: z.coerce.number().nonnegative("Ustama xarajat 0 yoki katta bo'lishi kerak"),
  energyCost: z.coerce.number().nonnegative("Energiya xarajati 0 yoki katta bo'lishi kerak"),
  wasteCost: z.coerce.number().nonnegative("Isrof xarajati 0 yoki katta bo'lishi kerak"),
  sellingPrice: z.coerce.number().nonnegative("Sotish narxi 0 yoki katta bo'lishi kerak"),
  status: z.enum(["draft", "calculated", "approved"]).default("draft"),
});

export type CostingFormData = z.infer<typeof costingFormSchema>;

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1) + "%";
}
