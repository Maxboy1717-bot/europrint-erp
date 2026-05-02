import { Result } from '@common/types/result.type';
import { Lead } from '../aggregates/lead.aggregate';

export interface ILeadRepository {
  save(lead: Lead): Promise<Result<Lead>>;
  findById(id: number): Promise<Result<Lead | null>>;
  findByEmail(email: string): Promise<Result<Lead | null>>;
  findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<Lead[]>>;
  findByStatus(status: string, limit: number, offset: number): Promise<Result<Lead[]>>;
  update(lead: Lead): Promise<Result<void>>;
  delete(id: number): Promise<Result<void>>;
  count(): Promise<Result<number>>;
}
