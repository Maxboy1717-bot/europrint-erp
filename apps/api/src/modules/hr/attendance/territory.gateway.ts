/**
 * @module territory.gateway
 * @description NestJS WebSocket gateway. Socket.IO handlers.
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import * as jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CreateNotificationCommand } from '../../notifications/application/commands/create-notification.command';

/**
 * `employees.role` (RoomAnalysisCron._notifyHrStaff bilan bir xil ro'yxat — HR/xavfsizlik
 * xodim-turi yozuvlari xona-anomaliyani ko'rishi kerak bo'lgan rollar).
 */
const ROOM_ALERT_NOTIFY_ROLES = ['HR_MANAGER', 'HR_DIRECTOR', 'SECURITY'] as const;

const ALLOWED_ORIGINS = [
  process.env['ERP_FRONTEND_URL'],
  process.env['REPLIT_DEV_DOMAIN'] ? `https://${process.env['REPLIT_DEV_DOMAIN']}` : undefined,
].filter(Boolean) as string[];

@WebSocketGateway({
  namespace: '/territory',
  cors: {
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : false,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class TerritoryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TerritoryGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {}

  private get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? '';
  }

  @WebSocketServer()
  server!: Server;

  afterInit(_server: Server) {
    this.logger.log('TerritoryGateway /territory initialized');
  }

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.['token'] as string | undefined) ??
      (client.handshake.headers?.['authorization'] as string | undefined)
        ?.replace(/^Bearer\s+/i, '');

    if (!this.jwtSecret) {
      this.logger.error('TerritoryGateway: JWT_SECRET not configured — rejecting all connections');
      client.disconnect(true);
      return;
    }

    if (!token) {
      this.logger.warn('TerritoryGateway: unauthenticated connection rejected %s', client.id);
      client.disconnect(true);
      return;
    }

    const ALLOWED_ROLES = new Set([
      'SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST',
      'admin', 'security', 'SECURITY',
    ]);

    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      const rawRole = payload['role'] ?? payload['roles'];
      const roles: string[] = Array.isArray(rawRole)
        ? (Array.isArray(rawRole) ? rawRole : []).map(String)
        : typeof rawRole === 'string' ? [rawRole] : [];

      const authorized = (Array.isArray(roles) ? roles : []).some((r) => ALLOWED_ROLES.has(r));
      if (!authorized) {
        this.logger.warn(
          'TerritoryGateway: role %s not authorized from %s — disconnecting',
          roles.join(',') || 'none',
          client.id,
        );
        client.disconnect(true);
        return;
      }
      this.logger.debug('TerritoryGateway: client connected %s role=%s', client.id, roles[0]);
    } catch {
      this.logger.warn('TerritoryGateway: invalid JWT from %s — disconnecting', client.id);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug('TerritoryGateway: client disconnected %s', client.id);
  }

  @OnEvent('attendance.territory_enter')
  onTerritoryEnter(payload: unknown) {
    this.server.emit('territory.event', { type: 'enter', ...this._safeObj(payload) });
  }

  @OnEvent('attendance.territory_exit')
  onTerritoryExit(payload: unknown) {
    this.server.emit('territory.event', { type: 'exit', ...this._safeObj(payload) });
  }

  @OnEvent('attendance.late_arrival')
  onLateArrival(payload: unknown) {
    this.server.emit('territory.event', { type: 'late_arrival', ...this._safeObj(payload) });
  }

  @OnEvent('security.unknown_face')
  onUnknownFace(payload: unknown) {
    this.server.emit('security.alert', { type: 'unknown_face', ...this._safeObj(payload) });
  }

  /**
   * Audit 2026-08-08: bu ikkala handler avval FAQAT WebSocket push qilardi
   * (`this.server.emit(...)`) — DB yozuv yo'q, Telegram yo'q. Agar shu lahzada hech kim
   * jonli-monitoring ekranini ochib turmasa, signal abadiy yo'qolardi (replay yo'q). Endi
   * WebSocket push bilan BIRGA `CreateNotificationCommand` orqali persistent bildirishnoma
   * ham yuboriladi — bu sessiyada allaqachon 6+ joyda ishlatilgan naqsh.
   */
  @OnEvent('hr.room_anomaly')
  onRoomAnomaly(payload: unknown) {
    const p = this._safeObj(payload);
    this.server.emit('territory.event', { type: 'room_anomaly', ...p });
    void this._notifyPersistent('room_anomaly', p, 'Xonada anomaliya aniqlandi',
      (name) => `${name}: xonada anomal holat aniqlandi${p['reason'] ? ` — ${String(p['reason'])}` : ''}.`);
  }

  @OnEvent('hr.fatigue_alert')
  onFatigueAlert(payload: unknown) {
    const p = this._safeObj(payload);
    this.server.emit('territory.event', { type: 'fatigue_alert', ...p });
    void this._notifyPersistent('fatigue_alert', p, 'Charchoq belgisi aniqlandi',
      (name) => `${name}: yuqori charchoq darajasi aniqlandi (${String(p['fatigue_score'] ?? '')}).`);
  }

  private _safeObj(payload: unknown): Record<string, unknown> {
    if (payload && typeof payload === 'object') {
      return payload as Record<string, unknown>;
    }
    return {};
  }

  /**
   * Ikkita qabul qiluvchi guruhiga yuboradi: (1) xodimning bevosita menejeri (`employees
   * .manager_id` orqali, `attendance-check.cron.ts` bilan bir xil ikki-bosqichli join),
   * (2) `RoomAnalysisCron._notifyHrStaff()` bilan bir xil rol-ro'yxati (HR_MANAGER/
   * HR_DIRECTOR/SECURITY, `employees.role`). Xato — faqat log, WebSocket push allaqachon
   * jo'natilgan, persistent qism qo'shimcha kafolat.
   */
  private async _notifyPersistent(
    eventType: 'room_anomaly' | 'fatigue_alert',
    payload: Record<string, unknown>,
    title: string,
    buildMessage: (employeeName: string) => string,
  ): Promise<void> {
    try {
      const employeeId = Number(payload['employee_id']);
      if (!Number.isFinite(employeeId) || employeeId <= 0) return;

      const rows = await runQuery<{ full_name: string | null; manager_user_id: number | null }>(sql`
        SELECT e.full_name, m.user_id AS manager_user_id
        FROM employees e
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const row = rows.rows[0];
      const employeeName = row?.full_name ?? `Xodim #${employeeId}`;
      const message = buildMessage(employeeName);

      const recipientUserIds = new Set<number>();
      if (row?.manager_user_id) recipientUserIds.add(row.manager_user_id);

      const hrRows = await runQuery<{ user_id: number | null }>(sql`
        SELECT user_id FROM employees
        WHERE role = ANY(${[...ROOM_ALERT_NOTIFY_ROLES]}::text[])
          AND user_id IS NOT NULL
        LIMIT 50
      `);
      for (const r of hrRows.rows) if (r.user_id) recipientUserIds.add(r.user_id);

      for (const userId of recipientUserIds) {
        await this.commandBus.execute(
          new CreateNotificationCommand(
            String(userId), title, message, `hr_${eventType}`,
            String(employeeId), 'employee_room_alert',
          ),
        ).catch((err: unknown) => {
          this.logger.warn('TerritoryGateway: notification failed userId=%s: %s', userId, String(err));
        });
      }
    } catch (err: unknown) {
      this.logger.warn('TerritoryGateway: _notifyPersistent failed: %s', String(err));
    }
  }
}
