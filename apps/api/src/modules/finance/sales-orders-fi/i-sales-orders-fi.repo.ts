import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface ISalesOrdersFiRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
}

export const SALES_ORDERS_FI_REPO = 'ISalesOrdersFiRepository';
