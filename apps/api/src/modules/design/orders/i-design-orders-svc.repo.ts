import { Result } from '@common/result';

export interface IDesignOrdersSvcRepository {
  findAll(): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
}

export const DESIGN_ORDERS_SVC_REPO = 'IDesignOrdersSvcRepository';
