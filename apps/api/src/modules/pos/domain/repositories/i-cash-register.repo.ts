/**
 * @module i-cash-register.repo
 * @description Domain repository interface for the retail cash-register
 *   (products + transactions). Decouples `CashRegisterService` from the
 *   concrete Drizzle implementation (DDD C.19).
 * @layer Domain (POS)
 */

import type { Result } from '@common/result';
import type {
  RetailProduct,
  RetailTransaction,
  CreateProductInput,
  CreateTransactionInput,
} from '../../infrastructure/repositories/cash-register.repository';

export const CASH_REGISTER_REPO = Symbol('CASH_REGISTER_REPO');

export interface CashRegisterDashboard {
  salesToday: number;
  transactionsToday: number;
  avgBasket: number;
  totalSalesAll: number;
  totalTransactionsAll: number;
  paymentBreakdown: { method: string; total: number; count: number }[];
  topProducts: { name: string; barcode: string; totalSold: number; totalRevenue: number }[];
  lowStockCount: number;
}

export interface ICashRegisterRepository {
  findProducts(search?: string): Promise<Result<RetailProduct[]>>;
  findProductById(id: string): Promise<Result<RetailProduct | null>>;
  findProductByBarcode(barcode: string): Promise<Result<RetailProduct | null>>;
  insertProduct(data: CreateProductInput): Promise<Result<RetailProduct>>;
  findTransactions(): Promise<Result<RetailTransaction[]>>;
  findTransactionById(id: string): Promise<Result<RetailTransaction | null>>;
  insertTransaction(data: CreateTransactionInput, cashierId?: string): Promise<Result<RetailTransaction>>;
  refundTransaction(id: string, refundedBy?: string): Promise<Result<RetailTransaction>>;
  getDashboard(): Promise<Result<CashRegisterDashboard>>;
  decrementStock(productId: string, quantity: number): Promise<Result<void>>;
  incrementStock(items: { productId: string; quantity: number }[]): Promise<Result<void>>;
}
