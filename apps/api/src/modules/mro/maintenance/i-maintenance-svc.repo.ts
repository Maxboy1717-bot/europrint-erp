import { Result } from '@common/result';

export interface IMaintenanceSvcRepository {
  findAll(): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
}

export const MAINTENANCE_SVC_REPO = 'IMaintenanceSvcRepository';
