/**
 * @module pos-anomaly.service
 * @description POS Monitor — qoida-asosli anomaliya aniqlash (vizyon: shubhali
 *   harakatni boshliqqa signal qilish). Business-logic service; Result<T> qaytaradi.
 *
 *   Vizyon qoidalari (AI-kalit yo'q → qoida-asosli ishlaydi, graceful):
 *     1. NIGHT_LARGE_QTY      — tungi smena (22:00–06:00) + katta miqdor/qiymat
 *     2. SEND_RECEIVE_MISMATCH — e'lon qilingan miqdor ≠ stock-ledger yozuvi
 *     3. OVER_NORM_CONSUMPTION — haqiqiy sarf > norma × chegara (material_norms)
 *     4. CANCELLED_IDLE        — bekor/bo'sh-turish (prostoy) signali
 *
 *   Har qoida o'zicha mustaqil: bir qoida data yo'qligidan skip qilsa,
 *   boshqalari baribir ishlaydi. Hech qachon throw qilmaydi — eng yomon holatda
 *   bo'sh natija + log (movement-completed asosiy yo'liga ta'sir qilmaydi).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError, safeCall } from '@common/result';
import {
  POS_NIGHT_SHIFT_START_HOUR,
  POS_NIGHT_SHIFT_END_HOUR,
  POS_NIGHT_LARGE_QTY_THRESHOLD,
  POS_NIGHT_LARGE_VALUE_THRESHOLD,
  POS_SEND_RECEIVE_TOLERANCE,
  POS_OVER_NORM_FACTOR,
} from '@common/constants/business.constants';
import {
  PosAnomalyRepository,
  AnomalyMovementRow,
  AnomalyFlagInsert,
} from '../../infrastructure/repositories/pos-anomaly.repository';
import { PosNotificationsService } from './pos-notifications.service';
import { PosEventRepository } from '../../infrastructure/repositories/pos-event.repository';
import { broadcastPosEvent } from '../../presentation/pos.gateway';

type Severity = 'info' | 'warning' | 'critical';

/** Roli — anomaliya signalini oladigan boshliqlar. */
const ANOMALY_ALERT_ROLES = ['warehouse_manager', 'pos_manager'];

interface RuleHit {
  ruleCode: string;
  severity: Severity;
  title:    string;
  detail:   string;
  metrics:  Record<string, unknown>;
}

@Injectable()
export class PosAnomalyService {
  private readonly logger = new Logger(PosAnomalyService.name);

  constructor(
    private readonly repo:          PosAnomalyRepository,
    private readonly notifications: PosNotificationsService,
    private readonly eventRepo:     PosEventRepository,
  ) {}

  /**
   * Yakunlangan harakatni barcha qoidalardan o'tkazadi. Aniqlangan har anomaliya
   * → pos_anomaly_flags ga yoziladi + boshliqqa notification + socket signal.
   * Idempotent: (movement_id, rule_code) unique → takror chaqiruv yangi flag yaratmaydi.
   */
  async evaluateMovement(movementId: number): Promise<Result<{ flagged: number }, AppError>> {
    return safeCall(async () => {
      const snapR = await this.repo.getMovementSnapshot(movementId);
      if (!snapR.ok) {
        this.logger.warn(`[Anomaly] snapshot xato (movId=${movementId}): ${snapR.error.message}`);
        return { flagged: 0 };
      }
      const mv = snapR.data;
      if (!mv) {
        this.logger.debug(`[Anomaly] movement topilmadi (movId=${movementId}) — skip`);
        return { flagged: 0 };
      }

      const hits: RuleHit[] = [];

      const nightHit = this.checkNightShift(mv);
      if (nightHit) hits.push(nightHit);

      const mismatchHit = await this.checkSendReceiveMismatch(mv);
      if (mismatchHit) hits.push(mismatchHit);

      const normHits = await this.checkOverNorm(mv);
      for (const h of normHits) hits.push(h);

      const idleHit = this.checkCancelledIdle(mv);
      if (idleHit) hits.push(idleHit);

      let flagged = 0;
      for (const hit of hits) {
        const persisted = await this.persistAndNotify(mv, hit);
        if (persisted) flagged += 1;
      }

      if (flagged > 0) {
        this.logger.log(`[Anomaly] ${mv.movement_number ?? movementId}: ${flagged} ta anomaliya aniqlandi`);
      }
      return { flagged };
    });
  }

  // -------------------------------------------------------------------------
  // QOIDA 1 — Tungi smena + katta miqdor/qiymat
  // -------------------------------------------------------------------------
  private checkNightShift(mv: AnomalyMovementRow): RuleHit | null {
    if (!mv.created_at) return null;
    const ts = new Date(mv.created_at);
    if (Number.isNaN(ts.getTime())) return null;

    const hour = ts.getHours();
    const isNight = POS_NIGHT_SHIFT_START_HOUR > POS_NIGHT_SHIFT_END_HOUR
      // Oyna yarim tunni o'rab oladi (22..24 yoki 0..6)
      ? (hour >= POS_NIGHT_SHIFT_START_HOUR || hour < POS_NIGHT_SHIFT_END_HOUR)
      : (hour >= POS_NIGHT_SHIFT_START_HOUR && hour < POS_NIGHT_SHIFT_END_HOUR);
    if (!isNight) return null;

    const qty   = Number(mv.declared_qty ?? 0);
    const value = Number(mv.total_amount ?? 0);
    const bigQty   = qty   >= POS_NIGHT_LARGE_QTY_THRESHOLD;
    const bigValue = value >= POS_NIGHT_LARGE_VALUE_THRESHOLD;
    if (!bigQty && !bigValue) return null;

    return {
      ruleCode: 'NIGHT_LARGE_QTY',
      severity: 'critical',
      title:    'Tungi smenada katta harakat',
      detail:   `Soat ${hour}:00 da ${qty} birlik (${value.toLocaleString('ru-RU')}) harakat — tungi smena anomaliyasi`,
      metrics:  { hour, declaredQty: qty, totalValue: value, qtyThreshold: POS_NIGHT_LARGE_QTY_THRESHOLD, valueThreshold: POS_NIGHT_LARGE_VALUE_THRESHOLD, bigQty, bigValue },
    };
  }

  // -------------------------------------------------------------------------
  // QOIDA 2 — Topshir↔qabul nomuvofiqligi (e'lon ≠ ledger)
  // -------------------------------------------------------------------------
  private async checkSendReceiveMismatch(mv: AnomalyMovementRow): Promise<RuleHit | null> {
    const declared = Number(mv.declared_qty ?? 0);
    if (declared <= 0) return null;

    const ledgerR = await this.repo.getLedgerRecordedQty(mv.id);
    if (!ledgerR.ok) return null;
    const recorded = ledgerR.data;
    // Ledger yozuvi yo'q (null yoki 0) → solishtirish uchun ma'lumot yo'q → skip (Q-40)
    if (recorded == null || recorded <= 0) return null;

    const diff = Math.abs(declared - recorded);
    const relDiff = diff / declared;
    if (relDiff <= POS_SEND_RECEIVE_TOLERANCE) return null;

    return {
      ruleCode: 'SEND_RECEIVE_MISMATCH',
      severity: 'critical',
      title:    'Topshirish ↔ qabul nomuvofiqligi',
      detail:   `E'lon qilingan ${declared} birlik, ombor yozuvida ${recorded} birlik — farq ${diff.toFixed(3)} (${(relDiff * 100).toFixed(1)}%)`,
      metrics:  { declaredQty: declared, recordedQty: recorded, diff, relDiff, tolerance: POS_SEND_RECEIVE_TOLERANCE },
    };
  }

  // -------------------------------------------------------------------------
  // QOIDA 3 — Norma-fakt ortiqcha sarf (material_norms bo'sh → skip)
  // -------------------------------------------------------------------------
  private async checkOverNorm(mv: AnomalyMovementRow): Promise<RuleHit[]> {
    const normR = await this.repo.getNormComparison(mv.id);
    if (!normR.ok) return [];
    const rows = Array.isArray(normR.data) ? normR.data : [];
    if (rows.length === 0) return []; // norma yo'q → fabrikatsiya qilmaymiz (Q-40)

    const hits: RuleHit[] = [];
    for (const r of rows) {
      const declared = Number(r.declared_qty ?? 0);
      const norm     = Number(r.norm_per_1000 ?? 0);
      if (declared <= 0 || norm <= 0) continue;
      const limit = norm * POS_OVER_NORM_FACTOR;
      if (declared <= limit) continue;

      const overPct = ((declared - norm) / norm) * 100;
      const deptLabel = r.department_code ? ` [bo'lim: ${r.department_code}]` : '';
      hits.push({
        ruleCode: 'OVER_NORM_CONSUMPTION',
        severity: 'warning',
        title:    'Normadan ortiqcha sarf',
        detail:   `${r.material_name ?? `material #${r.material_id}`}${deptLabel}: fakt ${declared} ${r.unit ?? ''} > norma ${norm} (+${overPct.toFixed(1)}%)`,
        metrics:  { materialId: r.material_id, departmentCode: r.department_code, declaredQty: declared, norm, limit, overPct, factor: POS_OVER_NORM_FACTOR },
      });
    }
    return hits;
  }

  // -------------------------------------------------------------------------
  // QOIDA 4 — Bekor/bo'sh-turish (prostoy) signali
  // -------------------------------------------------------------------------
  private checkCancelledIdle(mv: AnomalyMovementRow): RuleHit | null {
    const status = String(mv.status ?? '').toLowerCase();
    const emptyLines = Number(mv.line_count ?? 0) === 0;
    const zeroQty    = Number(mv.declared_qty ?? 0) <= 0;

    if (status === 'cancelled') {
      return {
        ruleCode: 'CANCELLED_IDLE',
        severity: 'info',
        title:    'Harakat bekor qilindi',
        detail:   `Harakat ${mv.movement_number ?? mv.id} bekor holatda yakunlandi — prostoy/bekor signali`,
        metrics:  { status, lineCount: mv.line_count, declaredQty: Number(mv.declared_qty ?? 0) },
      };
    }
    if (emptyLines || zeroQty) {
      return {
        ruleCode: 'CANCELLED_IDLE',
        severity: 'info',
        title:    'Bo\'sh harakat (prostoy)',
        detail:   `Harakat ${mv.movement_number ?? mv.id} yakunlandi, lekin qator/miqdor yo'q — bo'sh-turish signali`,
        metrics:  { status, lineCount: mv.line_count, declaredQty: Number(mv.declared_qty ?? 0) },
      };
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Persist + boshliqqa signal
  // -------------------------------------------------------------------------
  private async persistAndNotify(mv: AnomalyMovementRow, hit: RuleHit): Promise<boolean> {
    const flag: AnomalyFlagInsert = {
      movementId:     mv.id,
      movementNumber: mv.movement_number,
      ruleCode:       hit.ruleCode,
      severity:       hit.severity,
      title:          hit.title,
      detail:         hit.detail,
      metrics:        hit.metrics,
      createdBy:      mv.created_by,
    };
    const insR = await this.repo.insertFlag(flag);
    if (!insR.ok) {
      this.logger.warn(`[Anomaly] flag yozishda xato (movId=${mv.id}, rule=${hit.ruleCode}): ${insR.error.message}`);
      return false;
    }
    // null = ON CONFLICT (allaqachon flagged) → takror notification yubormaymiz
    if (insR.data == null) return false;

    // Boshliqlarga notification — har biri mustaqil (Promise.all bilan parallel)
    try {
      const managers = await this.eventRepo.findByRoles(ANOMALY_ALERT_ROLES);
      await Promise.all(managers.map((mgr) =>
        this.notifications.sendNotification(
          mgr.id,
          'POS_ANOMALY',
          `Anomaliya: ${hit.title}`,
          hit.detail,
          'pos_anomaly_flags',
          insR.data ?? undefined,
          { ruleCode: hit.ruleCode, severity: hit.severity, movementId: mv.id },
        ),
      ));
    } catch (e) {
      this.logger.warn(`[Anomaly] notification xato (movId=${mv.id}): ${String(e)}`);
    }

    // Real-time socket signal (POS Monitor dashboard)
    try {
      broadcastPosEvent('anomaly.detected', {
        flagId:         insR.data,
        movementId:     mv.id,
        movementNumber: mv.movement_number,
        ruleCode:       hit.ruleCode,
        severity:       hit.severity,
        title:          hit.title,
        ts:             new Date().toISOString(),
      });
    } catch { /* socket best-effort */ }

    return true;
  }

  /** Boshliq paneli uchun ochiq anomaliyalar ro'yxati. */
  async listOpen(limit = 50, offset = 0): Promise<Result<Record<string, unknown>[], AppError>> {
    const r = await this.repo.listOpen(Math.min(Math.max(limit, 1), 100), Math.max(offset, 0));
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }

  /**
   * POS Monitor dashboard — anomaliyalar ro'yxati (status/severity filtri ixtiyoriy).
   * ADDITIVE READ; data yo'q → bo'sh ro'yxat (Q-40).
   */
  async listAnomalies(
    status: string | null = null,
    severity: string | null = null,
    limit = 50,
    offset = 0,
  ): Promise<Result<Record<string, unknown>[], AppError>> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 50, 1), 100);
    const safeOffset = Math.max(Math.trunc(offset) || 0, 0);
    const r = await this.repo.listAnomalies(status, severity, safeLimit, safeOffset);
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }

  /** Bitta anomaliya (detal). Topilmasa NOT_FOUND. ADDITIVE READ. */
  async getById(id: number): Promise<Result<Record<string, unknown>, AppError>> {
    if (!Number.isInteger(id) || id <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri anomaliya id: ${id}` });
    }
    const r = await this.repo.getById(id);
    if (!r.ok) return Err(r.error);
    if (r.data == null) {
      return Err({ code: 'NOT_FOUND', message: `Anomaliya topilmadi: ${id}` });
    }
    return Ok(r.data);
  }
}
