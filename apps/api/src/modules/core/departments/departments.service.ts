/**
 * @module departments.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { departments } from '@europrint/schemas';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { DepartmentsRepository } from './departments.repository';

type Department = typeof departments.$inferSelect;

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly repo: DepartmentsRepository) {}

  async findAll(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.findAll();
  }

  async findOne(id: number) {
    const r = await this.repo.findOne(id);
    if (!r.ok) return Err(r.error.message);
    const row = r.data as Department | null;
    if (!row) throw new NotFoundException(`Bo'lim #${id} topilmadi`);
    return Ok(row);
  }

  async create(dto: Partial<typeof departments.$inferInsert>, _createdBy?: number) {
    this.logger.log(`departments: yaratilmoqda`);
    const r = await this.repo.create(dto as typeof departments.$inferInsert);
    if (!r.ok) return Err(r.error.message);
    return Ok(r.data);
  }

  async update(id: number, dto: Partial<typeof departments.$inferInsert>) {
    this.logger.log(`departments: yangilanmoqda`);
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error.message);
    const row = r.data as Department | null;
    if (!row) throw new NotFoundException(`Bo'lim #${id} topilmadi`);
    return Ok(row);
  }

  async remove(id: number) {
    this.logger.log(`departments: o'chirilmoqda`);
    const cntR = await this.repo.countUsersForDepartment(id);
    if (!cntR.ok) return Err(cntR.error.message);
    const empCount = cntR.data;
    if (empCount > 0) throw new BadRequestException(`Bo'limda ${empCount} ta xodim bor, o'chirib bo'lmaydi`);
    const delR = await this.repo.remove(id);
    if (!delR.ok) return Err(delR.error.message);
    const deleted = delR.data as Department | null;
    if (!deleted) throw new NotFoundException(`Bo'lim #${id} topilmadi`);
    return Ok(deleted);
  }
}
