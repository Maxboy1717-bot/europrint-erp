import { Injectable, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IHrPayrollRepository, HR_PAYROLL_REPO } from './i-hr-payroll.repo';
import { safeCall, Result, AppError } from '@common/result';

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
    const result = await this.hrPayrollRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
