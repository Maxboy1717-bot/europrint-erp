/**
 * @module taxonomy.service
 * @description §2 Taksonomiya servisi — repo'ga delegat (Qoida 15). `getActive` — boshqa modullar
 *   nomli ro'yxatni kodga hardcode qilmasdan o'qishi uchun (xatoda bo'sh massiv — regressiyasiz).
 */
import { Injectable } from '@nestjs/common';
import { TaxonomyRepository, type TaxonomyCreate, type TaxonomyUpdate } from './taxonomy.repo';

@Injectable()
export class TaxonomyService {
  constructor(private readonly repo: TaxonomyRepository) {}

  listCategories() { return this.repo.listCategories(); }
  list(category: string, includeInactive: boolean) { return this.repo.list(category, includeInactive); }
  create(input: TaxonomyCreate) { return this.repo.create(input); }
  update(id: number, patch: TaxonomyUpdate) { return this.repo.update(id, patch); }
  remove(id: number) { return this.repo.remove(id); }

  /** Faol yozuvlar (boshqa modul/cron o'qishi uchun) — xatoda bo'sh massiv. */
  async getActive(category: string): Promise<Record<string, unknown>[]> {
    const r = await this.repo.list(category, false);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }
}
