/**
 * @module territory.gateway
 * @description NestJS WebSocket gateway. Socket.IO handlers.
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  constructor(private readonly configService: ConfigService) {}

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

  @OnEvent('hr.room_anomaly')
  onRoomAnomaly(payload: unknown) {
    this.server.emit('territory.event', { type: 'room_anomaly', ...this._safeObj(payload) });
  }

  @OnEvent('hr.fatigue_alert')
  onFatigueAlert(payload: unknown) {
    this.server.emit('territory.event', { type: 'fatigue_alert', ...this._safeObj(payload) });
  }

  private _safeObj(payload: unknown): Record<string, unknown> {
    if (payload && typeof payload === 'object') {
      return payload as Record<string, unknown>;
    }
    return {};
  }
}
