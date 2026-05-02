import { Injectable, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IAttendanceRepository, ATTENDANCE_REPO } from './i-attendance.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(@Inject(ATTENDANCE_REPO) private readonly attendanceRepo: IAttendanceRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10, userId, date, status, fromDate, toDate } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await this.attendanceRepo.findAll({ limit: Number(limit), offset: Number(offset), userId: userId ? Number(userId) : undefined, date: date as string | undefined, status: status as string | undefined, fromDate: fromDate as string | undefined, toDate: toDate as string | undefined });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
  
    });}

  async checkIn(userId: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.attendanceRepo.checkIn(userId, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async checkOut(userId: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.attendanceRepo.checkOut(userId, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
