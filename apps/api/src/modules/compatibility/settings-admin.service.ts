/**
 * @module settings-admin.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { SettingsAdminRepo } from './repositories/settings-admin.repo';

type ResultData<R> = R extends Promise<infer T> ? (T extends { ok: true; data: infer D } ? D : never) : never;
type GuidelineRow = ResultData<ReturnType<SettingsAdminRepo['findAllGuidelines']>> extends ReadonlyArray<infer R> ? R : never;
// insertGuideline/updateGuideline .returning() the bare table row — no org_functions join, so no positionName.
type GuidelineWriteRow = ResultData<ReturnType<SettingsAdminRepo['insertGuideline']>> extends ReadonlyArray<infer R> ? R : never;
type FilterRow = ResultData<ReturnType<SettingsAdminRepo['findAllFilters']>> extends ReadonlyArray<infer R> ? R : never;

export interface ContactSettingData {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  telegram?: string | null;
  website?: string | null;
  workingHours?: string | null;
}

export interface SystemSettingData {
  companyName?: string | null;
  timezone?: string | null;
  language?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  config?: Record<string, unknown> | null;
}

@Injectable()
export class SettingsAdminService {
  private readonly logger = new Logger(SettingsAdminService.name);

  constructor(private readonly repo: SettingsAdminRepo) {}

  async getGuidelines(): Promise<Result<GuidelineRow[]>> {
    const result = await this.repo.findAllGuidelines();
    if (!result.ok) { this.logger.warn(`getGuidelines: ${result.error}`); return Ok([]); }
    return Ok(result.data);
  }

  async createGuideline(body: { title?: string; content?: string; category: string; isActive: boolean; createdBy?: string; orgFunctionId: number; filePath: string; version: string }): Promise<Result<GuidelineWriteRow | undefined>> {
    const result = await this.repo.insertGuideline(body);
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async updateGuideline(id: number, body: Partial<{ title: string; content: string; category: string; isActive: boolean; createdBy: string; orgFunctionId: number; filePath: string; version: string }>): Promise<Result<GuidelineWriteRow | undefined>> {
    const result = await this.repo.updateGuideline(id, { ...body, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Guideline ${id} not found` });
    return Ok(result.data[0]);
  }

  async deleteGuideline(id: number): Promise<Result<{ deleted: true; id: number }>> {
    const result = await this.repo.deleteGuideline(id);
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Guideline ${id} not found` });
    return Ok({ deleted: true, id });
  }

  async getContactSettings(): Promise<Result<ContactSettingData>> {
    const fallback: ContactSettingData = { phone: null, email: null, address: null, telegram: null, website: null, workingHours: null };
    const result = await this.repo.getContactSettings();
    if (!result.ok) { this.logger.warn(`getContactSettings: ${result.error}`); return Ok(fallback); }
    return Ok(result.data[0] ?? fallback);
  }

  async updateContactSettings(body: { phone?: string; email?: string; address?: string; telegram?: string; website?: string; workingHours?: string }): Promise<Result<ContactSettingData | undefined>> {
    const result = await this.repo.upsertContactSettings({ ...body, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async getSystemSettings(): Promise<Result<SystemSettingData>> {
    const fallback: SystemSettingData = { companyName: 'EuroPrint', timezone: 'Asia/Tashkent', language: 'uz', currency: 'UZS' };
    const result = await this.repo.getSystemSettings();
    if (!result.ok) { this.logger.warn(`getSystemSettings: ${result.error}`); return Ok(fallback); }
    const row = result.data[0];
    if (!row) return Ok(fallback);
    return Ok({
      companyName: row.companyName,
      timezone:    row.timezone,
      language:    row.language,
      currency:    row.currency,
      logoUrl:     row.logoUrl,
      config:      row.config as Record<string, unknown> | null,
    });
  }

  async updateSystemSettings(body: { companyName?: string; timezone?: string; language?: string; currency?: string; logoUrl?: string; config?: Record<string, unknown> }): Promise<Result<SystemSettingData | undefined>> {
    const result = await this.repo.upsertSystemSettings({ ...body, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    const row = result.data[0];
    if (!row) return Ok(undefined);
    return Ok({
      companyName: row.companyName,
      timezone:    row.timezone,
      language:    row.language,
      currency:    row.currency,
      logoUrl:     row.logoUrl,
      config:      row.config as Record<string, unknown> | null,
    });
  }

  async getFilters(): Promise<Result<FilterRow[]>> {
    const result = await this.repo.findAllFilters();
    if (!result.ok) { this.logger.warn(`getFilters: ${result.error}`); return Ok([]); }
    return Ok(result.data);
  }

  async createFilter(body: { name: string; filterType: string; config: Record<string, unknown>; isActive: boolean }): Promise<Result<FilterRow | undefined>> {
    const result = await this.repo.insertFilter({ name: body.name, filterType: body.filterType, config: body.config, isActive: body.isActive });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async updateFilter(id: string, body: Partial<{ name: string; filterType: string; config: Record<string, unknown>; isActive: boolean }>): Promise<Result<FilterRow | undefined>> {
    const result = await this.repo.updateFilter(id, { ...body, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Filter ${id} not found` });
    return Ok(result.data[0]);
  }

  async deleteFilter(id: string): Promise<Result<{ deleted: true; id: string }>> {
    const result = await this.repo.deleteFilter(id);
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Filter ${id} not found` });
    return Ok({ deleted: true, id });
  }
}
