import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err } from '@common/result';
import { ZnoRepository } from './zno.repository';

function parsePositiveAmount(value: unknown): number | null {
  const amt = safeNum(value);
  return isNaN(amt) || amt <= 0 ? null : amt;
}

@Injectable()
export class ZnoService {
  constructor(private readonly repo: ZnoRepository) {}

  async createZnoWithValidation(
    body: Record<string, unknown>,
    userId: number,
  ): Promise<Result<object, AppError>> {
    const { department_id, submitter_name, amount, purpose, payment_date } = body;
    if (!purpose || amount === undefined)
      return Err({ code: 'BAD_REQUEST', message: "purpose va amount majburiy" });
    const amt = parsePositiveAmount(amount);
    if (amt === null)
      return Err({ code: 'BAD_REQUEST', message: "amount musbat son bo'lishi kerak" });
    return safeCall(() =>
      this.repo.createZno(
        department_id ? Number(department_id) : null,
        userId,
        (submitter_name as string) ?? null,
        amt,
        purpose as string,
        (payment_date as string) ?? null,
      ),
    );
  }

  async listZno(status: string | null, departmentId: number | null, maxRows: number) {
    return this.repo.listZno(status, departmentId, maxRows);
  }

  async approveZnoWithAuth(
    id: number,
    userId: number,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'ZNO topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (String(record.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "O'z ZNO so'rovingizni tasdiqlay olmaysiz" });
    return this.repo.approveZno(id, userId, comment);
  }

  async rejectZnoWithAuth(
    id: number,
    userId: number,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'ZNO topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (String(record.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "O'z ZNO so'rovingizni rad eta olmaysiz" });
    return this.repo.rejectZno(id, userId, comment);
  }

  async updateZnoWithAuth(
    id: number,
    status: string | null,
    comment: string | null,
    userId: number,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'ZNO topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (status && ['approved', 'rejected'].includes(status) && String(record.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "O'z ZNO so'rovingizni tasdiqlay/rad eta olmaysiz" });
    return this.repo.updateZno(id, status, comment, userId);
  }
}
