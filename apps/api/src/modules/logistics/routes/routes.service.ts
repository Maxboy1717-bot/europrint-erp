import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { logisticsRoutes } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { RoutesRepository } from './routes.repository';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(private readonly repo: RoutesRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const { page = 1, limit = 10 } = query;
      const resultR = await this.repo.findAll(Number(page), Number(limit));
      const { data, total } = (resultR.ok ? resultR.data : { data: [], total: 0 }) as { data: unknown[]; total: number };
      return { data, pagination: { total, page, limit } };
    });
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, _createdBy?: number) {
    return safeCall(async () => {
      const row: Omit<typeof logisticsRoutes.$inferInsert, 'id'> = {
        name: (dto['name'] as string | undefined) ?? '',
        fromLocation: dto['fromLocation'] as string | undefined,
        toLocation: dto['toLocation'] as string | undefined,
        distanceKm: dto['distanceKm'] as string | undefined,
        estimatedHours: dto['estimatedHours'] as string | undefined,
        isActive: (dto['isActive'] as boolean | undefined) ?? true,
      };
      return this.repo.create(row as typeof logisticsRoutes.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof logisticsRoutes.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.remove(id);
      this.logger.log(`routes: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }
}
