/**
 * @module @workspace/types/order
 * @description Canonical Order / OrderLine types. Sales (SD) va Production
 *   modullarida ishlatiluvchi yagona manba. Hamma maydon optional —
 *   har modul kerakli maydonlarni ishlatadi.
 */

export interface Order {
  id: number | string;
  order_number?: string | null;
  customer_id?: number | string | null;
  customer_name?: string | null;
  status?:
    | 'draft'
    | 'pending'
    | 'confirmed'
    | 'in_production'
    | 'ready'
    | 'shipped'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | string;
  total_amount?: number | string | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  tax_amount?: number | string | null;
  paid_amount?: number | string | null;
  currency?: string | null;
  payment_status?: 'unpaid' | 'partial' | 'paid' | string;
  delivery_method?: string | null;
  delivery_address?: string | null;
  expected_delivery_date?: string | Date | null;
  actual_delivery_date?: string | Date | null;
  due_date?: string | Date | null;
  notes?: string | null;
  source?: string | null;
  warehouse_id?: number | string | null;
  manager_id?: number | string | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  items?: OrderLine[];
  lines?: OrderLine[];
}

export interface OrderLine {
  id?: number | string;
  order_id?: number | string;
  product_id?: number | string | null;
  product_name?: string | null;
  product_code?: string | null;
  description?: string | null;
  quantity?: number | string;
  unit?: string | null;
  unit_price?: number | string | null;
  discount_percent?: number | null;
  discount_amount?: number | string | null;
  tax_percent?: number | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  total?: number | string | null;
  delivered_quantity?: number | string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface ProductionOrder {
  id: number | string;
  order_number?: string | null;
  sales_order_id?: number | string | null;
  product_id?: number | string | null;
  product_name?: string | null;
  quantity?: number | string;
  unit?: string | null;
  status?:
    | 'planned'
    | 'in_progress'
    | 'paused'
    | 'completed'
    | 'cancelled'
    | string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | string;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  due_date?: string | Date | null;
  machine_id?: number | string | null;
  operator_id?: number | string | null;
  completed_quantity?: number | string | null;
  defect_quantity?: number | string | null;
  notes?: string | null;
  created_by?: number | string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}
