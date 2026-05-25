/**
 * @module cash-register.types
 * @description Shared types for cash-register repository + interface.
 *   Extracted to break the cyclic dependency between concrete repo and domain port.
 * @layer Types (POS)
 */

import { retail_pos_products, retail_pos_transactions } from '@shared/db/schema-pos-retail';

export type RetailProduct = typeof retail_pos_products.$inferSelect;
export type RetailTransaction = typeof retail_pos_transactions.$inferSelect;

export interface CreateProductInput {
  barcode: string;
  name: string;
  nameRu?: string;
  category?: string;
  unitPrice: number;
  unit?: string;
  stockQuantity?: number;
  minStock?: number;
  imageUrl?: string;
  createdBy?: string;
}

export interface CreateTransactionInput {
  cashierId?: string;
  customerName?: string;
  customerId?: string;
  items: { productId: string; name: string; quantity: number; unitPrice?: number; total?: number }[];
  subtotal: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentDetails?: Record<string, unknown>;
  notes?: string;
}
