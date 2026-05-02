import { ReactNode } from "react";

export interface PosProduct {
  id: string;
  barcode: string;
  name: string;
  nameRu: string | null;
  category: string | null;
  unitPrice: number;
  unit: string;
  stockQuantity: number | null;
  minStock: number | null;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  barcode: string;
  name: string;
  nameRu: string | null;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  stockQuantity: number | null;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentDetails {
  cashAmount?: number;
  cardAmount?: number;
  transferAmount?: number;
  changeAmount?: number;
}

export interface PosTransaction {
  id: string;
  transactionNumber: string;
  customerId: string | null;
  customerName: string | null;
  cashierId: string | null;
  items: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentDetails: PaymentDetails;
  status: string;
  receiptNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ReceiptData extends PosTransaction {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyInn: string;
  printedAt: string;
}

export interface DashboardData {
  salesToday: number;
  transactionsToday: number;
  avgBasket: number;
  totalSalesAll: number;
  totalTransactionsAll: number;
  paymentBreakdown: { method: string; total: number; count: number }[];
  topProducts: { name: string; barcode: string; totalSold: number; totalRevenue: number }[];
  lowStockCount: number;
}
