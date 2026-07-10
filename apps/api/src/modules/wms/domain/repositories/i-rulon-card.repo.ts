/**
 * @module i-rulon-card.repo
 * @description Domain repository interface — RULON QOG'OZ KARTA (paper-roll card).
 *   Concrete implementation:
 *   `infrastructure/repositories/drizzle-rulon-card.repo.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';
import type { RulonCard } from '@workspace/db';

/** List filtri — holat / tur bo'yicha. */
export interface RulonCardListFilter {
  status?: string;
  rollType?: string;
  limit: number;
  offset: number;
}

/** Yangi rulon karta yaratish uchun maydonlar (taxminiy uzunlik service'da hisoblanadi). */
export interface RulonCardCreateData {
  rollCode: string;
  qrLabel?: string | null;
  widthMm: number;
  diameterMm?: number | null;
  grammageGsm: number;
  initialWeightKg: string;
  currentWeightKg: string;
  estimatedLengthM: string | null;
  rollType: string;
  supplier?: string | null;
  certificate?: string | null;
  humidityPct?: string | null;
  storageZone?: string | null;
  warehouseId?: string | null;
  status: string;
}

export interface IRulonCardRepo {
  findAll(filter: RulonCardListFilter): Promise<Result<{ items: RulonCard[]; total: number }>>;
  findById(id: number): Promise<Result<RulonCard | null>>;
  findByRollCode(rollCode: string): Promise<Result<RulonCard | null>>;
  create(data: RulonCardCreateData): Promise<Result<RulonCard>>;
  /** Joriy og'irlik + qayta hisoblangan taxminiy uzunlik + (ixtiyoriy) holatni yangilaydi. */
  updateWeight(
    id: number,
    currentWeightKg: string,
    estimatedLengthM: string,
    status?: string,
  ): Promise<Result<RulonCard>>;
  /** Holat o'tishi (full → opened → remnant). */
  updateStatus(id: number, status: string): Promise<Result<RulonCard>>;
  /**
   * Qoldiq (remnant) rulonlar taklif ro'yxati — PP rejalashtiruvchiga.
   * Tartib: eng kam qoldiq (currentWeightKg ASC), keyin eng eski kelgan
   * (receivedDate ASC). AVTO-tayinlamaydi — faqat taklif.
   */
  findRemnantSuggestions(limit: number): Promise<Result<RulonCard[]>>;
}

export const RULON_CARD_REPO = Symbol('RULON_CARD_REPO');
