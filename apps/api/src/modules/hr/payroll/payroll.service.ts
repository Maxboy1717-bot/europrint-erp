import { Injectable, InternalServerErrorException, BadRequestException, Inject, Logger} from '@nestjs/common';
import { IHrPayrollRepository, HR_PAYROLL_REPO } from './i-hr-payroll.repo';
import { safeCall, Result, AppError } from '@common/result';
import { hasAnyOrgAssignment } from '../../compatibility/employees-org-assignment.helper';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(@Inject(HR_PAYROLL_REPO) private readonly hrPayrollRepo: IHrPayrollRepository) {}

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
    return safeCall(async () => {
      // Biznes qoida: oylik kiritishdan oldin xodim org-structure'da biriktirilgan bo'lishi shart.
      // Aks holda: lavozim/funksiya yo'q → oylik bazaga kirmaydi.
      const userId = dto['userId'] ?? dto['user_id'];
      if (userId === undefined || userId === null) {
        throw new BadRequestException('userId majburiy (oylik egasi)');
      }
      const userIdNum = Number(userId);
      if (!Number.isFinite(userIdNum) || userIdNum <= 0) {
        throw new BadRequestException('userId noto\'g\'ri formatda');
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
