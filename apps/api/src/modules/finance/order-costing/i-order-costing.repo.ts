import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IOrderCostingRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<object | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  findTopProfitable(limit: number): Promise<Result<object[]>>;
  findTopLoss(limit: number): Promise<Result<object[]>>;
  calculate(id: number): Promise<Result<Record<string, unknown>>>;
}

export const ORDER_COSTING_REPO = 'IOrderCostingRepository';
