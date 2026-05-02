import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { iotSensors } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { SensorsRepository } from './sensors.repository';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(private readonly repo: SensorsRepository) {}

  private mapSensor(s: Record<string, unknown>) {
    const lastReading = Number(s['lastReading'] || 0);
    const min = Number(s['minThreshold'] || 0);
    const max = Number(s['maxThreshold'] || Infinity);
    let status: string;
    if (!s['isActive']) {
      status = 'inactive';
    } else if (lastReading >= min && lastReading <= max) {
      status = 'active';
    } else {
      status = 'warning';
    }
    return { ...s, lastReading, status, normalRange: `${s['minThreshold']}-${s['maxThreshold']}` };
  }

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const { page = 1, limit = 10 } = query;
      const rows = await this.repo.findAll();
      const mapped = (Array.isArray(rows) ? rows : []).map(s => this.mapSensor(s));
      const total = mapped.length;
      const offset = (Number(page) - 1) * Number(limit);
      return { data: mapped.slice(offset, offset + Number(limit)), total, page, limit };
    });
  }

  async getLive() {
    return safeCall(async () => {
      const rows = await this.repo.findLive();
      return (Array.isArray(rows) ? rows : []).map(s => this.mapSensor(s));
    });
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return this.mapSensor(row);
  }

  async create(dto: Record<string, unknown>) {
    return safeCall(async () => {
      const resultR = await this.repo.create(dto as typeof iotSensors.$inferInsert);
      const result = (resultR.ok ? resultR.data as Record<string, unknown> : {});
      this.logger.log(`sensors: yaratildi id=${result['id']}`);
      return result;
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof iotSensors.$inferInsert>);
    });
  }
}
