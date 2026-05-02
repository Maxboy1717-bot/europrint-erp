export interface ShiftReport {
  id: number;
  report_number: string;
  department: string;
  shift_number: number;
  shift_date: string;
  shift_start: string;
  shift_end?: string;
  machine_name?: string;
  planned_qty: number;
  produced_qty: number;
  defective_qty: number;
  rework_qty: number;
  quality_rate?: string | number;
  oee_percent?: string | number;
  net_working_min?: number;
  actual_stop_min?: number;
  status: 'draft' | 'in_progress' | 'approved' | 'rejected';
  supervisor_notes?: string;
  next_shift_plan?: string;
}

export interface DowntimeRecord {
  id: number;
  shift_report_id: number;
  started_at: string;
  duration_min: number;
  reason_type: string;
  reason_description?: string;
  is_planned: boolean;
}

export interface HourlyProduction {
  id: number;
  shift_report_id: number;
  hour_start: string;
  planned_qty: number;
  actual_qty: number;
  cumulative_qty: number;
}

export interface QualityCheck {
  id: number;
  shift_report_id: number;
  check_time: string;
  sample_size: number;
  defects_found: number;
  is_passed: boolean;
  notes?: string;
}

export interface ProductionOrder {
  id: number;
  orderNumber: string;
  status: string;
  productName: string;
  productionType: string;
  plannedQuantity: number;
  confirmedQuantity: number;
  plannedCost: number;
  responsibleName: string;
  plannedStartDate: string;
  priority: number;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
