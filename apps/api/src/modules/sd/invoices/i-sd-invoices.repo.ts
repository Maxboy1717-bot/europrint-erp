import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface ISdInvoicesRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
}
export const SD_INVOICES_REPO = 'ISdInvoicesRepository';
