import { Result } from '@common/types/result.type';
import { Deal } from '../aggregates/deal.aggregate';

export interface IDealRepository {
  save(deal: Deal): Promise<Result<Deal>>;
  findById(id: number): Promise<Result<Deal | null>>;
  findByLeadId(leadId: number): Promise<Result<Deal | null>>;
  findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<Deal[]>>;
  findByStatus(status: string, limit: number, offset: number): Promise<Result<Deal[]>>;
  update(deal: Deal): Promise<Result<void>>;
  delete(id: number): Promise<Result<void>>;
  countByStatus(status: string): Promise<Result<number>>;
}
