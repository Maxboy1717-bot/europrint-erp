/**
 * @module iot-tablet.service
 * @description Application service backing the IoT tablet PWA endpoints
 *              (Wave 11 P1 — replaces 5 of the 240 NOT_IMPLEMENTED stubs).
 *              Wires the tablet controller to: DrizzleIotTabletRepo,
 *              IPasswordHasher (bcrypt), JwtService (short-lived tablet token),
 *              and the CQRS EventBus (SosAlertRaisedEvent → EventBridge).
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Ok, Err, Result, AppErr } from '@common/result';
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

export interface TabletLoginResult {
  id: number;
  name: string;
  role: string | null;
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
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  /**
   * Tabel-number + password login. Resolves the employee row, verifies the
   * bcrypt hash from the linked users row, then signs a short-lived JWT
   * scoped to the tablet role.
   * TODO P3-31: replace tabel-number + password with QR-token + device
   * fingerprint once the `tablet_logins` table is provisioned. The current
   * payload shape matches the existing PWA hook (useIoTTabletAuth.ts:51).
   */
  async login(
    tabelNumber: string,
    password: string,
  ): Promise<Result<TabletLoginResult>> {
    const workerR = await this.repo.findWorkerByTabel(tabelNumber);
    if (!workerR.ok) return Err(workerR.error);
    const worker = workerR.data;
    if (!worker) {
      return Err(AppErr('UNAUTHORIZED', 'Tabel raqami yoki parol noto‘g‘ri'));
    }
    if (!worker.password_hash) {
      // Employee has no linked user account → cannot authenticate.
      return Err(AppErr('UNAUTHORIZED', 'Tabel raqami yoki parol noto‘g‘ri'));
    }
    const matches = await this.passwordHasher.verify(password, worker.password_hash);
    if (!matches) {
      return Err(AppErr('UNAUTHORIZED', 'Tabel raqami yoki parol noto‘g‘ri'));
    }

    const payload = {
      sub: worker.id,
      userId: worker.user_id,
      tabel: worker.employee_code,
      role: worker.role ?? 'operator',
      tablet: true,
    };
    const tabletToken = this.jwtService.sign(payload, { expiresIn: '8h' });

    return Ok({
      id: worker.id,
      name: `${worker.first_name} ${worker.last_name}`.trim(),
      role: worker.role,
      equipment:
        worker.equipment_id !== null && worker.equipment_name !== null
          ? { id: worker.equipment_id, name: worker.equipment_name }
          : null,
      tabletToken,
    });
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
