/**
 * @module sensor-capex.service
 * @description Business-logic service for the sensor_devices CAPEX registry.
 *   Returns Result<T>; never throws raw Errors. Enforces the device_code uniqueness gate
 *   before delegating writes to the repository.
 */

import { Injectable } from '@nestjs/common';
import { Err } from '@common/result';
import {
  DrizzleSensorCapexRepo,
  SensorCapexCreate,
  SensorCapexUpdate,
} from '../infrastructure/repositories/drizzle-sensor-capex.repo';

@Injectable()
export class SensorCapexService {
  constructor(private readonly repo: DrizzleSensorCapexRepo) {}

  list(installStatus: string | undefined, limit: number, offset: number) {
    return this.repo.findAll(installStatus, limit, offset);
  }

  async create(input: SensorCapexCreate) {
    const existing = await this.repo.findByCode(input.deviceCode);
    if (existing.ok && existing.data) {
      return Err({ code: 'CONFLICT', message: `Qurilma kodi band: ${input.deviceCode}` });
    }
    return this.repo.create(input);
  }

  update(id: number, input: SensorCapexUpdate) {
    return this.repo.update(id, input);
  }
}
