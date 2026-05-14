/**
 * @module employees.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEmployeesRepository, EMPLOYEES_REPO } from './i-employees.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @Inject(EMPLOYEES_REPO) private readonly employeesRepo: IEmployeesRepository,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: Record<string, unknown> = {}, currentUser?: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10, search, departmentId, status } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const role = currentUser?.role;

    if (role && role !== 'super_admin' && role !== 'admin' && role !== 'hr_manager') {
      const selfResult = await this.employeesRepo.findById(Number(currentUser.sub));
      if (!selfResult.ok) throw new InternalServerErrorException(selfResult.error);
      const selfDeptId = selfResult.data?.departmentId;

      if (role === 'manager') {
        const result = await this.employeesRepo.findByDepartment(Number(selfDeptId), Number(limit), Number(offset), search as string | undefined, status as string | undefined);
        if (!result.ok) throw new InternalServerErrorException(result.error);
        const { data, count: total } = result.data;
        return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
      }

      const selfListResult = await this.employeesRepo.findSelf(Number(currentUser.sub), Number(limit), Number(offset));
      if (!selfListResult.ok) throw new InternalServerErrorException(selfListResult.error);
      const { data, count: total } = selfListResult.data;
      return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
    }

    const result = await this.employeesRepo.findAll({ limit: Number(limit), offset: Number(offset), search: search as string | undefined, departmentId: departmentId as number | undefined, status: status as string | undefined });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
  
    });}

  async findOne(id: number) {
    const result = await this.employeesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Xodim #${id} topilmadi`);
    return result.data;
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.employeesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const employee = result.data;
    this.events.emit('employee.created', { employeeId: employee['id'], photoUrl: employee['photo_url'] ?? employee['avatar'] });
    return employee;

    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.employeesRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.employeesRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "Xodim o'chirildi" };
  
    });}
}
