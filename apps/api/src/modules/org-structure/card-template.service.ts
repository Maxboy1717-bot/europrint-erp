/**
 * @module card-template.service
 * @description Business logic for KARTA shabloni (`card_templates`). CRUD + applyTemplate:
 *   shablon `field_defaults` + chaqiruvchi override → CardInput → CardService.create
 *   (kanonik org_departments kartasi). Karta-markaz vizyoni: shablon yangi kartani urug'laydi.
 *   ⭐ Shablon-qiymatlari egasi-data — bu yerda soxta standart yaratilmaydi. Returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CardTemplateRepository, CardTemplateInput } from './card-template.repository';
import { CardService } from './card.service';
import type { CardInput } from './card.repository';

type Row = Record<string, unknown>;

/**
 * Shablon `field_defaults` ichidan KARTA-yaratish uchun ruxsat etilgan kalitlar (CardCreateSchema bilan mos).
 * Whitelist — noma'lum kalitlar tashlanadi (Q-40: faqat haqiqiy karta-maydonlari urug'lanadi).
 */
const CARD_FIELD_KEYS: ReadonlyArray<keyof CardInput> = [
  'positionName', 'positionNameRu', 'departmentId', 'code', 'level', 'razryadLevelId',
  'salaryType', 'minSalary', 'maxSalary', 'rbacTier', 'status', 'tskp', 'tskpTarget',
  'tskpMeasurementUnit', 'statisticsType', 'aiExamEnabled', 'functionDescription', 'functionDescriptionRu',
];

@Injectable()
export class CardTemplateService {
  constructor(
    private readonly repo: CardTemplateRepository,
    private readonly cardService: CardService,
  ) {}

  list(includeArchived: boolean): Promise<Result<Row[]>> {
    return this.repo.list(includeArchived);
  }

  async findById(id: number): Promise<Result<Row>> {
    const r = await this.repo.findById(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Shablon #${id} topilmadi`));
    return Ok(r.data);
  }

  create(dto: CardTemplateInput, createdBy: number | null): Promise<Result<Row | null>> {
    return this.repo.create(dto, createdBy);
  }

  async update(id: number, dto: CardTemplateInput): Promise<Result<Row>> {
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Shablon #${id} topilmadi`));
    return Ok(r.data);
  }

  async softDelete(id: number): Promise<Result<Row>> {
    const r = await this.repo.softDelete(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Shablon #${id} topilmadi yoki allaqachon arxivlangan`));
    return Ok(r.data);
  }

  /**
   * Shablonni qo'llab yangi KARTA yaratish. field_defaults (shablon) + override (chaqiruvchi)
   * birlashtiriladi (override ustun), faqat ruxsat-kalitlar olinadi → CardService.create (org_departments).
   * Override'siz ham ishlaydi (sof shablon urug'lash). `positionName` bo'sh bo'lsa CardService 400 qaytaradi.
   */
  async applyTemplate(
    templateId: number,
    override: Record<string, unknown>,
  ): Promise<Result<Row | null>> {
    const tplRes = await this.repo.findById(templateId);
    if (!tplRes.ok) return Err(tplRes.error);
    if (!tplRes.data) return Err(AppErr('NOT_FOUND', `Shablon #${templateId} topilmadi`));

    const defaults = (tplRes.data.field_defaults && typeof tplRes.data.field_defaults === 'object'
      ? tplRes.data.field_defaults
      : {}) as Record<string, unknown>;
    const merged = { ...defaults, ...(override ?? {}) };

    const cardInput: CardInput = {};
    for (const key of CARD_FIELD_KEYS) {
      if (merged[key as string] !== undefined) {
        (cardInput as Record<string, unknown>)[key as string] = merged[key as string];
      }
    }

    return this.cardService.create(cardInput);
  }
}
