/**
 * @module system-settings.entity
 * @description Domain entity. Aggregate root or child entity (Drizzle row + behavior).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { InternalServerErrorException } from '@nestjs/common';
export interface SystemSettingsData {
  id: number;
  advancePercent: number;
  freeStorageDays: number;
  storageDailyRate: number;
  maxUsers: number;
  maintenanceMode: boolean;
  updatedAt: Date;
  updatedBy: number;
}

export class SystemSettings {
  private id: number;
  private advancePercent: number;
  private freeStorageDays: number;
  private storageDailyRate: number;
  private maxUsers: number;
  private maintenanceMode: boolean;
  private updatedAt: Date;
  private updatedBy: number;

  constructor(data: SystemSettingsData) {
    this.id = data.id;
    this.advancePercent = data.advancePercent;
    this.freeStorageDays = data.freeStorageDays;
    this.storageDailyRate = data.storageDailyRate;
    this.maxUsers = data.maxUsers;
    this.maintenanceMode = data.maintenanceMode;
    this.updatedAt = data.updatedAt;
    this.updatedBy = data.updatedBy;
  }

  setAdvancePercent(percent: number): void {
    if (percent < 0 || percent > 100) {
      throw new InternalServerErrorException('Advance percent must be between 0 and 100');
    }
    this.advancePercent = percent;
    this.updatedAt = _time.now();
  }

  setFreeStorageDays(days: number): void {
    if (days < 0) {
      throw new InternalServerErrorException('Free storage days must be >= 0');
    }
    this.freeStorageDays = days;
    this.updatedAt = _time.now();
  }

  setStorageDailyRate(rate: number): void {
    if (rate < 0) {
      throw new InternalServerErrorException('Storage daily rate must be >= 0');
    }
    this.storageDailyRate = rate;
    this.updatedAt = _time.now();
  }

  getAdvancePercent(): number {
    return this.advancePercent;
  }

  getFreeStorageDays(): number {
    return this.freeStorageDays;
  }

  getStorageDailyRate(): number {
    return this.storageDailyRate;
  }

  toPersistence(): SystemSettingsData {
    return {
      id: this.id,
      advancePercent: this.advancePercent,
      freeStorageDays: this.freeStorageDays,
      storageDailyRate: this.storageDailyRate,
      maxUsers: this.maxUsers,
      maintenanceMode: this.maintenanceMode,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}
