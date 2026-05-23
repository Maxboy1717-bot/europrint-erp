/**
 * @module @workspace/types/product
 * @description Canonical Product / Material / BOM / Warehouse types.
 */

export interface Product {
  id: number | string;
  code?: string | null;
  name: string;
  name_ru?: string | null;
  description?: string | null;
  category_id?: number | string | null;
  unit_id?: string | null;
  unit?: string | null;
  price?: number | null;
  currency?: string | null;
  is_active?: boolean;
}

export interface MaterialCard {
  id: number | string;
  code?: string | null;
  xom_ashyo?: string | null;
  xom_ashyo_ru?: string | null;
  category?: string | null;
  unit?: string | null;
  barcode?: string | null;
  is_active?: boolean;
}

export interface Warehouse {
  id: number | string;
  code?: string | null;
  name: string;
  name_ru?: string | null;
  location?: string | null;
  manager_id?: number | string | null;
  is_active?: boolean;
}

export interface Movement {
  id: number | string;
  movement_type_id?: number | string | null;
  movement_type?: string | null;
  from_warehouse_id?: string | number | null;
  to_warehouse_id?: string | number | null;
  status?: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled' | string;
  reference_doc?: string | null;
  notes?: string | null;
  created_by?: number | null;
  created_at?: string | Date | null;
}

export interface PapkaOrder {
  id: number | string;
  order_number?: string | null;
  customer_id?: number | string | null;
  customer_name?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  status?: string;
  due_date?: string | Date | null;
  created_at?: string | Date | null;
}
