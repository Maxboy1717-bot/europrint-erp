/**
 * @module dashboard.gateway
 * @description WebSocket gateway for the /dashboard namespace.
 * Broadcasts real-time KPI snapshots, alert counts, and production
 * summaries to Director Dashboard clients.
 *
 * Per ADR-008: /dashboard WebSocket namespace for real-time KPI.
 * Data flow: director-cron.service → emit('kpi:update') → clients.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/dashboard',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');
      if (token) this.jwtService.verify(token);
      // On connect: immediately join the director KPI room
      client.join('kpi:global');
      this.logger.debug(`Dashboard client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Dashboard client disconnected: ${client.id}`);
  }

  /** Client can explicitly re-subscribe to KPI stream (idempotent). */
  @SubscribeMessage('kpi:subscribe')
  handleKpiSubscribe(@ConnectedSocket() client: Socket) {
    client.join('kpi:global');
    return { event: 'kpi:subscribed', data: { room: 'kpi:global' } };
  }

  /** Broadcast KPI snapshot to all director dashboard clients. */
  pushKpiUpdate(snapshot: Record<string, unknown>) {
    this.server.to('kpi:global').emit('kpi:update', snapshot);
  }

  /** Broadcast critical alert count change. */
  pushAlertUpdate(alertCount: number, criticalCount: number) {
    this.server.to('kpi:global').emit('alerts:update', { alertCount, criticalCount });
  }
}
