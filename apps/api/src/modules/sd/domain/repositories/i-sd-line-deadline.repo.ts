/**
 * @module i-sd-line-deadline.repo
 * @description Repository port for SD per-line deadline scheduling (06-sd #29).
 *   per_line_scheduling toggles per-line deadlines on a sales order; line_deadline
 *   is the per-line deadline. effective_deadline = COALESCE(line_deadline, order delivery_date).
 */

import { Result } from '@common/result';

export interface LineDeadlineRow {
  id: number;
  item_number: string;
  description: string;
  line_deadline: string | null;
  effective_deadline: string | null;
}

export interface OrderLineDeadlines {
  sales_order_id: number;
  per_line_scheduling: boolean;
  order_deadline: string | null;
  lines: LineDeadlineRow[];
}

export interface PerLineSchedulingRow {
  sales_order_id: number;
  per_line_scheduling: boolean;
}

export interface SetLineDeadlineInput {
  itemId: number;
  deadline: string | null;
}

export const SD_LINE_DEADLINE_REPO = Symbol('SD_LINE_DEADLINE_REPO');

export interface ISdLineDeadlineRepo {
  getOrderLineDeadlines(orderId: number): Promise<Result<OrderLineDeadlines>>;
  setPerLineScheduling(orderId: number, enabled: boolean): Promise<Result<PerLineSchedulingRow>>;
  setLineDeadline(input: SetLineDeadlineInput): Promise<Result<LineDeadlineRow>>;
}
