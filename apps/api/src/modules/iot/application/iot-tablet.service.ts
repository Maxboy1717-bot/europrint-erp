/**
 * @module iot-tablet.service
 * @description Application service backing the IoT tablet PWA endpoints
 *              (Wave 11 P1 — replaces 5 of the 240 NOT_IMPLEMENTED stubs).
 *              Wires the tablet controller to: DrizzleIotTabletRepo,
 *              IPasswordHasher (bcrypt), JwtService (short-lived tablet token),
 *              and the CQRS EventBus (SosAlertRaisedEvent → EventBridge).
 *
 *  A79 (To'lqin-4 IoT) — OPERATOR LOGIN = KARTA-ROL. The tablet operator login is
 *  now wired to the EP-ORG-003 card-gate foundation (the SAME mechanism as
 *  auth/login.service.ts), so the IoT planshet authenticates an operator through
 *  their primary card, not a position name:
 *    - the linked `users` row is resolved canonically (users.employee_id, with a
 *      fallback to employees.user_id) — card-centric operators link via
 *      users.employee_id (employees.user_id may be NULL);
 *    - `resolveCardGate(userId)` (IAuthRepo) yields the operator's primary
 *      cardId + rbacTier (card-role) + active-card count;
 *    - the card-gate is enforced identically to login.service.execute: exempt
 *      roles {super_admin, admin, director} always pass; otherwise, when
 *      CARD_LOGIN_GATE_ENABLED='true', an operator with 0 active cards is denied
 *      (login.service.isCardExemptRole + CARD_LOGIN_GATE_ENABLED — do NOT diverge);
 *    - the short-lived tablet JWT now carries the card-claim (cardId, rbacTier)
 *      and the card-derived role, so downstream tablet guards read role/RBAC from
 *      the card. The gate is ALWAYS computed (even when the flag is OFF) so the
 *      card-claim is always present in the token.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, AppErr } from '@common/result';
import { runQuery } from '@shared/db';
import {
  DrizzleIotTabletRepo,
  TabletEquipmentRow,
  TabletOrderRow,
  TabletScheduleRow,
} from '../infrastructure/repositories/drizzle-iot-tablet.repo';
import { SosAlertRaisedEvent } from '../domain/events/sos-alert-raised.event';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '@modules/auth/domain/ports/i-password-hasher.port';
import { IAuthRepo } from '@modules/auth/domain/repositories/i-auth.repo';
import { AUTH_REPO } from '@modules/auth/auth.tokens';

/**
 * Roles that bypass the card-gate (system-level accounts that may have no card).
 * MUST stay in sync with login.service.isCardExemptRole and
 * card-gate-precheck.service.CARD_EXEMPT_ROLES — do NOT diverge.
 */
const CARD_EXEMPT_ROLES: ReadonlyArray<string> = ['super_admin', 'admin', 'director'];

/**
 * C2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): a tablet token may be refreshed (even past its own
 * 12h expiry) for up to this long after it was originally issued — comfortably covers one 12h
 * shift plus a buffer for overtime/handover, while still forcing a real re-login (tabel-number +
 * password) at least once a day rather than letting a single credential extend itself forever.
 */
const TABLET_REFRESH_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * Canonical linked-user row for the tabel-number, resolved for the card-gate.
 * Direction: users.employee_id = employees.id (card-centric link), with a
 * fallback to employees.user_id when the inverse link is the one populated.
 */
interface TabletAuthUserRow {
  user_id: number;
  user_role: string | null;
  password_hash: string | null;
  is_active: boolean;
}

export interface TabletLoginResult {
  id: number;
  name: string;
  role: string | null;
  /** Operator's primary card id (org_departments.id) resolved via the card-gate. */
  cardId: number | null;
  /** Effective RBAC tier derived from the primary card (card-role). */
  rbacTier: string | null;
  equipment: { id: number; name: string } | null;
  tabletToken: string;
}

export interface SosAlertResult {
  ok: true;
  alertId: number;
  raisedAt: string;
}

@Injectable()
export class IotTabletService {
  private readonly logger = new Logger(IotTabletService.name);

  constructor(
    private readonly repo: DrizzleIotTabletRepo,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
    private readonly configService: ConfigService,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
  ) {}

  /** super_admin/admin/director — system-level roles, may tablet-login cardless. */
  private isCardExemptRole(role: string | null | undefined): boolean {
    return CARD_EXEMPT_ROLES.includes(String(role ?? '').toLowerCase());
  }

  /**
   * Resolve the canonical linked `users` row for a tabel-number (employee_code).
   * The card-centric operator links via users.employee_id (employees.user_id may
   * be NULL); legacy workers link via employees.user_id. We COALESCE both so the
   * card-gate keys off a real users.id and reads users.role (NOT positions.name).
   * Read-only, parameterised SQL (same pattern as card-gate-precheck.service).
   */
  private async resolveAuthUser(
    tabelNumber: string,
  ): Promise<Result<TabletAuthUserRow | null>> {
    try {
      const rows = await runQuery<TabletAuthUserRow>(sql`
        SELECT u.id            AS user_id,
               u.role          AS user_role,
               u.password_hash AS password_hash,
               u.is_active     AS is_active
        FROM employees e
        JOIN users u
          ON u.id = COALESCE(e.user_id, (
               SELECT u2.id FROM users u2
               WHERE u2.employee_id = e.id
               ORDER BY u2.id ASC
               LIMIT 1
             ))
        WHERE e.employee_code = ${tabelNumber}
          AND e.deleted_at IS NULL
          AND COALESCE(e.is_blocked, false) = false
        LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('INTERNAL', (e as Error).message));
    }
  }

  /**
   * Tabel-number + password OPERATOR login wired to the EP-ORG-003 card-gate
   * (A79). Steps:
   *  1. resolve employee display/equipment row (DrizzleIotTabletRepo);
   *  2. resolve the canonical linked users row + verify the bcrypt hash from it;
   *  3. resolveCardGate(userId) → primary cardId + rbacTier (card-role) + count;
   *  4. enforce the card-gate IDENTICALLY to login.service.execute — exempt roles
   *     bypass; otherwise CARD_LOGIN_GATE_ENABLED='true' + 0 active cards → 401;
   *  5. sign a short-lived tablet JWT carrying the card-claim (cardId, rbacTier).
   * TODO P3-31: replace tabel-number + password with QR-token + device
   * fingerprint once the `tablet_logins` table is provisioned. The payload shape
   * stays compatible with the existing PWA hook (useIoTTabletAuth.ts:51).
   */
  async login(
    tabelNumber: string,
    password: string,
  ): Promise<Result<TabletLoginResult>> {
    const unauthorized = AppErr('UNAUTHORIZED', 'Tabel raqami yoki parol noto‘g‘ri');

    const workerR = await this.repo.findWorkerByTabel(tabelNumber);
    if (!workerR.ok) return Err(workerR.error);
    const worker = workerR.data;
    if (!worker) return Err(unauthorized);

    // Card-centric auth: resolve the linked users row canonically (NOT the repo's
    // employees.user_id-only join, which is NULL for card-centric operators).
    const authUserR = await this.resolveAuthUser(tabelNumber);
    if (!authUserR.ok) return Err(authUserR.error);
    const authUser = authUserR.data;
    if (!authUser || !authUser.is_active || !authUser.password_hash) {
      // No active linked user account → cannot authenticate.
      return Err(unauthorized);
    }

    const matches = await this.passwordHasher.verify(password, authUser.password_hash);
    if (!matches) return Err(unauthorized);

    // EP-ORG-003 card-gate — the operator's role comes from their PRIMARY CARD.
    // Always computed (so the JWT card-claim is always present); only BLOCKS when
    // CARD_LOGIN_GATE_ENABLED='true' (mirrors login.service.execute exactly).
    const gate = await this.authRepo.resolveCardGate(authUser.user_id);
    const cardGateEnabled =
      this.configService.get<string>('CARD_LOGIN_GATE_ENABLED') === 'true';
    if (
      cardGateEnabled &&
      !this.isCardExemptRole(authUser.user_role) &&
      gate.activeCardCount === 0
    ) {
      this.logger.warn(
        `IoT tablet login blocked: operator user=${authUser.user_id} has no active card (EP-ORG-003)`,
      );
      return Err(
        AppErr('UNAUTHORIZED', 'Faol karta yo‘q — IoT planshetga kira olmaysiz'),
      );
    }

    // Card-role: the effective RBAC tier from the primary card drives the tablet
    // role; fall back to the position/operator label only when no card-role exists.
    const cardRole = gate.rbacTier ?? worker.role ?? 'operator';

    const payload = {
      sub: worker.id,
      userId: authUser.user_id,
      tabel: worker.employee_code,
      role: cardRole,
      cardId: gate.primaryCardId,
      rbacTier: gate.rbacTier,
      tablet: true,
    };
    // C2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): was '8h' while the PWA's own client-side
    // session-expiry (SESSION_12H_MS, useIoTTabletTypes.ts) assumes 12h — a worker mid-shift
    // between hour 8 and hour 12 got silent 401s on every write (scan, session update, SOS)
    // with the UI still showing them as "logged in". Extended to match the FE's own assumption
    // rather than shortening the FE (the FE's 12h reflects a real factory shift length).
    const tabletToken = this.jwtService.sign(payload, { expiresIn: '12h' });

    return Ok({
      id: worker.id,
      name: `${worker.first_name} ${worker.last_name}`.trim(),
      role: cardRole,
      cardId: gate.primaryCardId,
      rbacTier: gate.rbacTier,
      equipment:
        worker.equipment_id !== null && worker.equipment_name !== null
          ? { id: worker.equipment_id, name: worker.equipment_name }
          : null,
      tabletToken,
    });
  }

  /**
   * C2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): reissues a tablet token from an existing one —
   * including one that has ALREADY expired (that's the whole point: the PWA calls this after a
   * 401, by which time `verify()` without `ignoreExpiration` would already reject it). Re-checks
   * the worker's `is_active` flag and card-gate on every refresh (not just once at login) so a
   * revoked operator loses access at the next refresh, not just at the next full 8-shift login.
   *
   * Grace window: a token can only be refreshed within `TABLET_REFRESH_GRACE_MS` of its original
   * `iat` — bounds how long a single credential can keep extending itself before a real
   * tabel-number + password re-login is required (prevents an indefinitely-alive tablet session
   * off a token that leaked once).
   */
  async refresh(oldToken: string): Promise<Result<{ tabletToken: string }>> {
    const invalid = AppErr('UNAUTHORIZED', 'Tablet token yaroqsiz');
    let decoded: { sub?: number; tabel?: string; tablet?: boolean; iat?: number };
    try {
      decoded = this.jwtService.verify(oldToken, { ignoreExpiration: true });
    } catch {
      return Err(invalid);
    }
    if (decoded.tablet !== true || !decoded.tabel || typeof decoded.iat !== 'number') {
      return Err(invalid);
    }
    const issuedAtMs = decoded.iat * 1000;
    if (Date.now() - issuedAtMs > TABLET_REFRESH_GRACE_MS) {
      return Err(AppErr('UNAUTHORIZED', 'Tablet sessiyasi muddati tugagan — qayta kiring'));
    }

    // Re-run the same worker/card-gate resolution login() uses — a revoked operator or a
    // deactivated card is caught here, not just at the next full login.
    const workerR = await this.repo.findWorkerByTabel(decoded.tabel);
    if (!workerR.ok) return Err(workerR.error);
    const worker = workerR.data;
    if (!worker) return Err(invalid);

    const authUserR = await this.resolveAuthUser(decoded.tabel);
    if (!authUserR.ok) return Err(authUserR.error);
    const authUser = authUserR.data;
    if (!authUser || !authUser.is_active) return Err(invalid);

    const gate = await this.authRepo.resolveCardGate(authUser.user_id);
    const cardGateEnabled =
      this.configService.get<string>('CARD_LOGIN_GATE_ENABLED') === 'true';
    if (
      cardGateEnabled &&
      !this.isCardExemptRole(authUser.user_role) &&
      gate.activeCardCount === 0
    ) {
      this.logger.warn(
        `IoT tablet refresh blocked: operator user=${authUser.user_id} lost their active card (EP-ORG-003)`,
      );
      return Err(AppErr('UNAUTHORIZED', 'Faol karta yo‘q — IoT planshetga kira olmaysiz'));
    }

    const cardRole = gate.rbacTier ?? worker.role ?? 'operator';
    const tabletToken = this.jwtService.sign(
      {
        sub: worker.id,
        userId: authUser.user_id,
        tabel: worker.employee_code,
        role: cardRole,
        cardId: gate.primaryCardId,
        rbacTier: gate.rbacTier,
        tablet: true,
      },
      { expiresIn: '12h' },
    );
    return Ok({ tabletToken });
  }

  /**
   * Inserts a `sos_alerts` row, logs warn, publishes SosAlertRaisedEvent.
   * Frontend (useIoTTabletAlerts.ts:188) posts a body of the shape
   * `{ sessionId, equipmentId, alertType, message }`. We accept either
   * `workerId` (preferred) or look it up from `sessionId` later (deferred).
   */
  async raiseSosAlert(input: {
    workerId: number;
    workerName?: string;
    sessionId?: string | null;
    equipmentId?: number | string | null;
    alertType?: string;
    message?: string;
  }): Promise<Result<SosAlertResult>> {
    const equipmentIdStr =
      input.equipmentId === undefined || input.equipmentId === null
        ? null
        : String(input.equipmentId);
    const r = await this.repo.insertSosAlert({
      workerId: input.workerId,
      workerName: input.workerName ?? `worker#${input.workerId}`,
      sessionId: input.sessionId ?? null,
      equipmentId: equipmentIdStr,
      alertType: input.alertType ?? 'other',
      message: input.message ?? '',
    });
    if (!r.ok) return Err(r.error);

    const numericEquipmentId =
      typeof input.equipmentId === 'number'
        ? input.equipmentId
        : typeof input.equipmentId === 'string' && /^\d+$/.test(input.equipmentId)
          ? Number(input.equipmentId)
          : null;

    this.logger.warn(
      `SOS alert: worker=${input.workerId} equipment=${numericEquipmentId ?? 'n/a'} type=${input.alertType ?? 'other'} id=${r.data.id}`,
    );

    this.eventBus.publish(
      new SosAlertRaisedEvent(
        r.data.id,
        input.workerId,
        numericEquipmentId,
        input.alertType ?? 'other',
        input.message ?? '',
        new Date(r.data.created_at),
      ),
    );

    return Ok({ ok: true, alertId: r.data.id, raisedAt: r.data.created_at });
  }

  getTabletEquipment(
    workerId?: number,
    shopFloor?: string,
  ): Promise<Result<TabletEquipmentRow[]>> {
    return this.repo.findTabletEquipment(workerId, shopFloor);
  }

  getTabletOrders(
    workerId?: number,
    equipmentId?: number,
    status?: string,
  ): Promise<Result<TabletOrderRow[]>> {
    return this.repo.findTabletOrders(workerId, equipmentId, status);
  }

  getWorkerSchedule(
    workerId: number,
    from?: string,
    to?: string,
  ): Promise<Result<TabletScheduleRow[]>> {
    return this.repo.findWorkerSchedule(workerId, from, to);
  }
}
