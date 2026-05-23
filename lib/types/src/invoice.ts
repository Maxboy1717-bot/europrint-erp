/**
 * @module @workspace/types/invoice
 * @description Canonical Invoice / Payment / Receipt types. Finance modul
 *   AR/AP, SD invoicing va POS kassa hammasi shu yagona manbadan import qiladi.
 */

export interface Invoice {
  id: number | string;
  invoice_number?: string | null;
  invoice_type?: 'sales' | 'purchase' | 'proforma' | 'credit_note' | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  vendor_id?: number | string | null;
  vendor_name?: string | null;
  order_id?: number | string | null;
  status?:
    | 'draft'
    | 'issued'
    | 'sent'
    | 'paid'
    | 'partial'
    | 'overdue'
    | 'cancelled'
    | 'void'
    | string;
  issue_date?: string | Date | null;
  due_date?: string | Date | null;
  paid_date?: string | Date | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  paid_amount?: number | string | null;
  balance_due?: number | string | null;
  payment_terms?: string | null;
  payment_method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  account_id?: number | string | null;
  organization_id?: number | string | null;
  created_by?: number | string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  items?: InvoiceLine[];
  lines?: InvoiceLine[];
}

export interface InvoiceLine {
  id?: number | string;
  invoice_id?: number | string;
  product_id?: number | string | null;
  product_name?: string | null;
  description?: string | null;
  quantity?: number | string;
  unit?: string | null;
  unit_price?: number | string | null;
  discount_percent?: number | null;
  discount_amount?: number | string | null;
  tax_percent?: number | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  account_id?: number | string | null;
  notes?: string | null;
}

export interface Payment {
  id: number | string;
  payment_number?: string | null;
  payment_type?: 'incoming' | 'outgoing' | string;
  invoice_id?: number | string | null;
  customer_id?: number | string | null;
  vendor_id?: number | string | null;
  amount?: number | string;
  currency?: string | null;
  exchange_rate?: number | string | null;
  payment_date?: string | Date | null;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'click' | 'payme' | string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | string;
  reference_number?: string | null;
  bank_account_id?: number | string | null;
  cash_register_id?: number | string | null;
  notes?: string | null;
  created_by?: number | string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface Receipt {
  id: number | string;
  receipt_number?: string | null;
  customer_id?: number | string | null;
  customer_name?: string | null;
  cashier_id?: number | string | null;
  cash_register_id?: number | string | null;
  total_amount?: number | string;
  paid_amount?: number | string | null;
  change_amount?: number | string | null;
  currency?: string | null;
  payment_method?: string | null;
  status?: 'draft' | 'completed' | 'voided' | 'refunded' | string;
  fiscal_number?: string | null;
  fiscal_qr?: string | null;
  notes?: string | null;
  issued_at?: string | Date | null;
  created_at?: string | Date | null;
  items?: ReceiptLine[];
}

export interface ReceiptLine {
  id?: number | string;
  receipt_id?: number | string;
  product_id?: number | string | null;
  product_name?: string | null;
  barcode?: string | null;
  quantity?: number | string;
  unit?: string | null;
  unit_price?: number | string | null;
  discount_amount?: number | string | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
}
