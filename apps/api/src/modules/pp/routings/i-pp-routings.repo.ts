import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IPpRoutingsRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findOperationsByRoutingId(routingId: string): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
}
export const PP_ROUTINGS_REPO = 'IPpRoutingsRepository';
