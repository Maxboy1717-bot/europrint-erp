/**
 * @module positions.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { positions } from '@europrint/schemas';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { PositionsRepository } from './positions.repository';

type Position = typeof positions.$inferSelect;

@Injectable()
export class PositionsService {
  private readonly logger = new Logger(PositionsService.name);

  constructor(private readonly repo: PositionsRepository) {}

  async findAll(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.findAll();
  }

  async findOne(id: number) {
    const r = await this.repo.findOne(id);
    if (!r.ok) return Err(r.error.message);
    const row = r.data as Position | null;
    if (!row) throw new NotFoundException(`Lavozim #${id} topilmadi`);
    return Ok(row);
  }

  async create(dto: Partial<typeof positions.$inferInsert>) {
    this.logger.log(`positions: yaratilmoqda`);
    const r = await this.repo.create(dto as typeof positions.$inferInsert);
    if (!r.ok) return Err(r.error.message);
    return Ok(r.data);
  }

  async update(id: number, dto: Partial<typeof positions.$inferInsert>) {
    this.logger.log(`positions: yangilanmoqda`);
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error.message);
    const row = r.data as Position | null;
    if (!row) throw new NotFoundException(`Lavozim #${id} topilmadi`);
    return Ok(row);
  }

  async remove(id: number) {
    this.logger.log(`positions: o'chirilmoqda`);
    const cntR = await this.repo.countUsersForPosition(id);
    if (!cntR.ok) return Err(cntR.error.message);
    const empCount = cntR.data;
    if (empCount > 0) throw new BadRequestException(`Lavozimda ${empCount} ta xodim bor`);
    const delR = await this.repo.remove(id);
    if (!delR.ok) return Err(delR.error.message);
    const deleted = delR.data as Position | null;
    if (!deleted) throw new NotFoundException(`Lavozim #${id} topilmadi`);
    return Ok(deleted);
  }
}
