/**
 * @module rulon-card.service
 * @description Application service — RULON QOG'OZ KARTA (paper-roll card).
 *
 * Mas'uliyat:
 *   - create:           QR/noyob kod generatsiya + taxminiy uzunlikni
 *                       WmsRollCalcService orqali hisoblab DB ga yozadi.
 *   - list / get:       o'qish (filtr/paginatsiya).
 *   - updateCurrentWeight: joriy og'irlik o'zgarsa qoldiq uzunlikni QAYTA hisoblaydi.
 *   - changeStatus:     holat o'tish qoidalarini (full→opened→remnant) tekshiradi.
 *
 * Matematik miya TAKRORLANMAYDI — WmsRollCalcService inject qilinadi (Q-46 REUSE).
 *
 * VIZYON: docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 3.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import type { RulonCard } from '@workspace/db';
import { WmsRollCalcService } from '../domain/services/wms-roll-calc.service';
import {
  RULON_CARD_REPO,
  type IRulonCardRepo,
  type RulonCardListFilter,
} from '../domain/repositories/i-rulon-card.repo';
import {
  RULON_STATUS_FULL,
  RULON_STATUS_OPENED,
  RULON_STATUS_REMNANT,
  RULON_ALLOWED_STATUS_TRANSITIONS,
  RULON_LENGTH_DB_SCALE,
} from '../domain/constants/wms-rulon-card.constants';

/** create() kirish DTO si (Zod validatsiyadan o'tgan). */
export interface CreateRulonCardInput {
  rollCode?: string;
  widthMm: number;
  diameterMm?: number;
  grammageGsm: number;
  initialWeightKg: number;
  rollType: string;
  supplier?: string;
  certificate?: string;
  humidityPct?: number;
  storageZone?: string;
  warehouseId?: string;
}

@Injectable()
export class RulonCardService {
  constructor(
    @Inject(RULON_CARD_REPO) private readonly repo: IRulonCardRepo,
    private readonly calc: WmsRollCalcService,
  ) {}

  /**
   * Noyob rulon kod generatsiya: RULON-<yil>-<6-xona-tasodifiy>.
   * Biznes-kod (roll_code) UNIQUE; agar foydalanuvchi bermasa avto-generatsiya.
   */
  private generateRollCode(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `RULON-${year}-${rand}`;
  }

  /** Hisoblangan uzunlikni DB precision ga yaxlitlab string qaytaradi. */
  private lengthToDbString(lengthM: number): string {
    return lengthM.toFixed(RULON_LENGTH_DB_SCALE);
  }

  /**
   * Rulon karta yaratish.
   * Taxminiy uzunlik = WmsRollCalcService.estimatedLengthM(weight, gramaj, kenglik).
   * Yangi rulon = TO'LIQ (full) holatda; currentWeight = initialWeight.
   */
  async create(input: CreateRulonCardInput): Promise<Result<RulonCard>> {
    // 1) Taxminiy uzunlik — matematik miya (REUSE, takror yo'q).
    const lenRes = this.calc.estimatedLengthM(
      input.initialWeightKg,
      input.grammageGsm,
      input.widthMm,
    );
    if (!lenRes.ok) return Err(lenRes.error);

    const rollCode = input.rollCode?.trim() || this.generateRollCode();

    // 2) Biznes-kod takrorlanmasligini tekshirish (UNIQUE — fail-fast aniq xato bilan).
    const existing = await this.repo.findByRollCode(rollCode);
    if (existing.ok && existing.data) {
      return Err(AppErr('CONFLICT', `Rulon kodi allaqachon mavjud: ${rollCode}`));
    }

    const initialWeightStr = input.initialWeightKg.toString();

    return this.repo.create({
      rollCode,
      qrLabel: rollCode, // QR label payload = noyob kod (label generatori shuni bosadi)
      widthMm: input.widthMm,
      diameterMm: input.diameterMm ?? null,
      grammageGsm: input.grammageGsm,
      initialWeightKg: initialWeightStr,
      currentWeightKg: initialWeightStr,
      estimatedLengthM: this.lengthToDbString(lenRes.data),
      rollType: input.rollType,
      supplier: input.supplier ?? null,
      certificate: input.certificate ?? null,
      humidityPct: input.humidityPct != null ? input.humidityPct.toString() : null,
      storageZone: input.storageZone ?? null,
      warehouseId: input.warehouseId ?? null,
      status: RULON_STATUS_FULL,
    });
  }

  async list(filter: RulonCardListFilter): Promise<Result<{ items: RulonCard[]; total: number }>> {
    return this.repo.findAll(filter);
  }

  async getById(id: number): Promise<Result<RulonCard>> {
    const res = await this.repo.findById(id);
    if (!res.ok) return Err(res.error);
    if (!res.data) return Err(AppErr('NOT_FOUND', `Rulon karta #${id} topilmadi`));
    return Ok(res.data);
  }

  /**
   * Joriy og'irlikni yangilash + qoldiq uzunlikni QAYTA hisoblash.
   * Formula: estimatedLength = remainingWeightKg → estimatedLengthM(weight, gramaj, kenglik).
   * To'liq (full) rulon og'irligi kamaysa → avtomatik OCHILGAN (opened) ga o'tadi (FIFO).
   */
  async updateCurrentWeight(id: number, newWeightKg: number): Promise<Result<RulonCard>> {
    const cardRes = await this.getById(id);
    if (!cardRes.ok) return Err(cardRes.error);
    const card = cardRes.data;

    const initial = Number(card.initialWeightKg);
    if (!Number.isFinite(newWeightKg) || newWeightKg < 0) {
      return Err(AppErr('VALIDATION', 'Joriy og\'irlik manfiy yoki NaN bo\'lmasligi kerak'));
    }
    if (newWeightKg > initial) {
      return Err(
        AppErr(
          'VALIDATION',
          `Joriy og'irlik (${newWeightKg}) boshlang'ich og'irlikdan (${initial}) oshmasligi kerak`,
        ),
      );
    }

    // Qoldiq uzunlik — matematik miya (REUSE). 0 kg = 0 m (estimatedLengthM > 0 talab qiladi).
    let lengthStr = '0';
    let nextStatus: string | undefined;

    if (newWeightKg > 0) {
      const lenRes = this.calc.estimatedLengthM(newWeightKg, card.grammageGsm, card.widthMm);
      if (!lenRes.ok) return Err(lenRes.error);
      lengthStr = this.lengthToDbString(lenRes.data);
      // To'liq rulon ishlatila boshlasa → ochilgan.
      if (card.status === RULON_STATUS_FULL && newWeightKg < initial) {
        nextStatus = RULON_STATUS_OPENED;
      }
    } else {
      // Og'irlik 0 → qoldiq (deyarli tugagan).
      nextStatus = RULON_STATUS_REMNANT;
    }

    return this.repo.updateWeight(id, newWeightKg.toString(), lengthStr, nextStatus);
  }

  /**
   * Holat o'tishi — qoidalar:
   *   full    → opened, remnant
   *   opened  → remnant
   *   remnant → (yakuniy holat, o'tish yo'q)
   */
  async changeStatus(id: number, nextStatus: string): Promise<Result<RulonCard>> {
    const cardRes = await this.getById(id);
    if (!cardRes.ok) return Err(cardRes.error);
    const card = cardRes.data;

    const allowed = RULON_ALLOWED_STATUS_TRANSITIONS[card.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      return Err(
        AppErr(
          'INVALID_TRANSITION',
          `Holat o'tishi mumkin emas: ${card.status} → ${nextStatus}`,
        ),
      );
    }
    return this.repo.updateStatus(id, nextStatus);
  }
}
