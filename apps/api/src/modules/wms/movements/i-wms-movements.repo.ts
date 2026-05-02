import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IWmsMovementsRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findLinesByTransferId(transferId: number): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
}
export const WMS_MOVEMENTS_REPO = 'IWmsMovementsRepository';
