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

  /**
   * Norm-vaqt (daqiqa) — category='operation_type' yozuvining `attrs.duration_minutes` maydoni.
   * Konvensiya: egasi qiymatni taxonomy CRUD (PATCH /api/taxonomy/:id { attrs: { duration_minutes } })
   * orqali to'ldiradi; hali to'ldirilmagan bo'lsa `null` (bu normal holat — owner keyinroq to'ldiradi,
   * hech qanday raqam bu yerda o'ylab topilmaydi — Q-40). MES/PP kabi boshqa modullar shu metod orqali
   * o'qisin (to'g'ridan-to'g'ri taxonomy_entries jadvalini import qilmasdan — Modul shartnomasi).
   */
  async getOperationDurationMinutes(code: string): Promise<number | null> {
    const rows = await this.getActive('operation_type');
    const row = rows.find((r) => r.code === code);
    const attrs = row?.attrs as Record<string, unknown> | null | undefined;
    const v = attrs?.duration_minutes;
    return typeof v === 'number' ? v : null;
  }
}
