/**
 * @module i-sd-lost-orders-reclamations.repo
 * @description Repository port for SD lost-orders + reclamations (T26-4-QC-WMS-SD genuine-gap).
 */

import { Result } from '@common/result';

export interface LostOrderRow {
  id: number;
  sales_order_id: number | null;
  customer_id: number | null;
  reason_code: string;
  reason_text: string | null;
  lost_amount: string | null;
  competitor_name: string | null;
  lost_date: string;
  created_by: number | null;
  created_at: string;
}

export interface ReclamationRow {
  id: number;
  reclamation_number: string;
  sales_order_id: number | null;
  customer_id: number | null;
  category: string;
  description: string;
  status: string;
  resolution_text: string | null;
  sla_deadline: string | null;
  resolved_at: string | null;
  resolved_by: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLostOrderInput {
  salesOrderId?: number | null;
  customerId?: number | null;
  reasonCode: string;
  reasonText?: string | null;
  lostAmount?: number | null;
  competitorName?: string | null;
  lostDate?: string;
  createdBy: number;
}

export interface CreateReclamationInput {
  salesOrderId?: number | null;
  customerId?: number | null;
  category?: string;
  description: string;
  slaDeadline?: string | null;
  createdBy: number;
}

export interface ResolveReclamationInput {
  status: 'investigating' | 'resolved' | 'rejected';
  resolutionText?: string | null;
  resolvedBy: number;
}

export const SD_LOST_ORDERS_RECLAMATIONS_REPO = Symbol('SD_LOST_ORDERS_RECLAMATIONS_REPO');

export interface ISdLostOrdersReclamationsRepo {
  listLostOrders(filters: { reasonCode?: string; customerId?: number }): Promise<Result<LostOrderRow[]>>;
  createLostOrder(input: CreateLostOrderInput): Promise<Result<LostOrderRow>>;
  listReclamations(filters: { status?: string; customerId?: number }): Promise<Result<ReclamationRow[]>>;
  getReclamation(id: number): Promise<Result<ReclamationRow>>;
  createReclamation(input: CreateReclamationInput): Promise<Result<ReclamationRow>>;
  resolveReclamation(id: number, input: ResolveReclamationInput): Promise<Result<ReclamationRow>>;
}
