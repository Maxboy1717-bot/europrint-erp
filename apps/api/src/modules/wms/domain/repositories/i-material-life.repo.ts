/**
 * @module i-material-life.repo
 * @description Material hayot-tsikli repository porti (W4-MATERIAL-LIFE).
 *   Service ↔ DB chegarasi (CLAUDE.md Qoida 15 — service'da to'g'ridan db.* YO'Q).
 *   Hamma metod Result<T> qaytaradi (throw/null YO'Q).
 *
 *   Vizyon: EP-WMS-101 (substitute/analog), EP-WMS-123 (owner_type),
 *   EP-WMS-125 (vtorichka), EP-WMS-126 (yosh-signal), EP-WMS-128 (xavf-zona),
 *   EP-WMS-130 (namuna), EP-WMS-086 (poddon).
 *
 *   Q-46: faqat ADDITIVE — yangi atribut ustunlari + material_substitutes jadval.
 *   Mavjud WMS dvigateli (karantin/FIFO/atomik chiqim) o'qilmaydi, yozilmaydi.
 * @layer Domain (WMS)
 */

import { Result, AppError } from '@common/result';
import { MaterialOwnerType } from '../constants/material-life.constants';

export const MATERIAL_LIFE_REPO = Symbol('MATERIAL_LIFE_REPO');

/** material_cards hayot-tsikli atributlari (yangilanadigan maydonlar). */
export interface MaterialLifeAttrs {
  ownerType?: MaterialOwnerType;
  hazardClass?: string | null;
  storageCondition?: string | null;
  ageAlertDays?: number | null;
  isRecyclable?: boolean;
  palletUnitQty?: number | null;
  isSample?: boolean;
}

/** Bitta material-kartaning to'liq hayot-tsikli ko'rinishi (o'qish). */
export interface MaterialLifeView {
  materialId: number;
  name: string | null;
  ownerType: string;
  hazardClass: string | null;
  storageCondition: string | null;
  ageAlertDays: number | null;
  isRecyclable: boolean;
  palletUnitQty: number | null;
  isSample: boolean;
}

/** Bitta analog/substitute juftlik (asosiy → o'rnini bosuvchi). */
export interface SubstituteRow {
  id: number;
  materialId: number;
  substituteId: number;
  substituteName: string | null;
  priority: number;
  isApproved: boolean;
  notes: string | null;
}

/** Yosh/eskirish ogohlantirishidagi partiya (EP-WMS-126). */
export interface AgingAlertRow {
  stockId: number;
  materialId: number;
  materialName: string | null;
  warehouseId: number | null;
  quantity: number;
  ageDays: number;
  ageAlertDays: number;
}

export interface CreateSubstituteInput {
  materialId: number;
  substituteId: number;
  priority: number;
  isApproved: boolean;
  notes: string | null;
  createdBy: number | null;
}

export interface IMaterialLifeRepo {
  /** Material mavjudligini tekshiradi (material_cards.id). */
  materialExists(materialId: number): Promise<Result<boolean, AppError>>;

  /** Bitta material-kartaning hayot-tsikli atributlarini o'qiydi. */
  getLifeView(materialId: number): Promise<Result<MaterialLifeView | null, AppError>>;

  /** Hayot-tsikli atributlarini (faqat berilgan maydonlar) yangilaydi. */
  updateLifeAttrs(materialId: number, attrs: MaterialLifeAttrs): Promise<Result<MaterialLifeView, AppError>>;

  /** Material uchun ruxsat etilgan analoglar ro'yxati (prioritet bo'yicha). */
  listSubstitutes(materialId: number): Promise<Result<SubstituteRow[], AppError>>;

  /** Yangi analog/substitute juftlik qo'shadi (EP-WMS-101). */
  addSubstitute(input: CreateSubstituteInput): Promise<Result<SubstituteRow, AppError>>;

  /** Analog juftlikni soft-delete qiladi. */
  removeSubstitute(id: number, userId: number | null): Promise<Result<void, AppError>>;

  /**
   * Yosh/eskirish ogohlantirishidagi partiyalarni qaytaradi (EP-WMS-126):
   * age_alert_days o'rnatilgan materiallar bo'yicha, partiya yoshi shu kundan
   * oshgan warehouse_stock qatorlari. shelf_life'siz materialga ham ishlaydi.
   */
  listAgingAlerts(): Promise<Result<AgingAlertRow[], AppError>>;

  /**
   * Xavfli (hazard_class o'rnatilgan) materiallarning joriy qoldiqlari
   * (EP-WMS-128 — xavf-zona ko'rinishi).
   */
  listHazardStock(): Promise<Result<MaterialLifeView[], AppError>>;
}
