/**
 * @module payroll.service
 * @description Payroll history service. Records every salary change (raise,
 *   bonus, deduction, base-rate update) per employee with a typed reason
 *   code. Used by the salary-history report on the employee profile and by
 *   period close (current month's salary is the sum of base + entries).
 *
 *   Read endpoint: paginated, filterable by user/date/changeType.
 *   Write endpoint: validates org-structure assignment before insert.
 * @layer Service (HR / payroll)
 *
 * WHY ORG-STRUCTURE ASSIGNMENT IS A HARD PRECONDITION
 *   Payroll computation depends on the employee's position (base rate) and
 *   department (cost center). An employee with no `org_assignments` row
 *   cannot be paid because:
 *     - No base rate → can't compute gross
 *     - No cost center → GL posting has nowhere to land
 *     - No supervisor → no approver for the salary change
 *   We reject the create at the service layer so the failure surfaces at
 *   data-entry time, not at month-end close (where 400 missing-rate errors
 *   would block the entire payroll run).
 *
 *   The fix path is in HR's hands: assign the employee in org-structure
 *   first, then retry payroll entry. The error message points there.
 *
 * WHY PAYROLL HISTORY (NOT a "current salary" column)
 *   IFRS + UZ tax law require a full audit trail of compensation changes:
 *     - Who approved the raise + when (anti-fraud control)
 *     - Effective-from date (mid-month raises pro-rated correctly)
 *     - Reason code (raise / bonus / deduction / hardship / correction)
 *
 *   Storing only `employees.current_salary` would lose that history. Reading
 *   "current" means SELECT MAX(effective_from) WHERE userId = ?; we trade
 *   one extra query for a defensible audit trail.
 *
 * WHY THE controller uses `safeCall` instead of try/catch
 *   safeCall wraps thrown HttpExceptions and preserves their semantics
 *   (BadRequestException → 400, NotFoundException → 404). The thrown
 *   InternalServerErrorException on repo.findAll failure is converted to
 *   `{ code: 'INTERNAL', message: ... }` automatically — see common/result.ts.
 */

import { Injectable, InternalServerErrorException, BadRequestException, Inject, Logger} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IHrPayrollRepository, HR_PAYROLL_REPO } from './i-hr-payroll.repo';
import { safeCall, Result, AppError } from '@common/result';
import { hasAnyOrgAssignment } from '../../compatibility/employees-org-assignment.helper';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @Inject(HR_PAYROLL_REPO) private readonly hrPayrollRepo: IHrPayrollRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10, userId, changeType, fromDate, toDate } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await this.hrPayrollRepo.findAll({ limit: Number(limit), offset, userId: userId !== undefined ? Number(userId) : undefined, changeType: changeType !== undefined ? String(changeType) : undefined, fromDate: fromDate !== undefined ? String(fromDate) : undefined, toDate: toDate !== undefined ? String(toDate) : undefined });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
  
    });}

  async create(dto: Record<string, unknown>){
    const userIdRequiredMsg = await this.i18n.t('errors.userIdRequired');
    const userIdInvalidMsg = await this.i18n.t('errors.userIdInvalid');
    return safeCall(async () => {
      // Biznes qoida: oylik kiritishdan oldin xodim org-structure'da biriktirilgan bo'lishi shart.
      // Aks holda: lavozim/funksiya yo'q → oylik bazaga kirmaydi.
      const userId = dto['userId'] ?? dto['user_id'];
      if (userId === undefined || userId === null) {
        throw new BadRequestException(userIdRequiredMsg);
      }
      const userIdNum = Number(userId);
      if (!Number.isFinite(userIdNum) || userIdNum <= 0) {
        throw new BadRequestException(userIdInvalidMsg);
      }

      const isAssigned = await hasAnyOrgAssignment(userIdNum);
      if (!isAssigned) {
        throw new BadRequestException(
          `Xodim (userId=${userIdNum}) tashkiliy tuzilmaga biriktirilmagan — oylik kiritilmaydi. ` +
          `Avval xodim org-structure'da bitta bo'limga assign qilinishi kerak.`,
        );
      }

      const result = await this.hrPayrollRepo.create(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }
}
