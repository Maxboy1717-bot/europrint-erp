import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IFiRepository {
  findAccountingPeriods(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  createAccountingPeriod(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  closeAccountingPeriod(id: number): Promise<Result<Record<string, unknown>>>;
  postGlDocument(id: number): Promise<Result<Record<string, unknown>>>;
  findPayments(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  createPayment(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
}

export const FI_REPO = 'IFiRepository';
