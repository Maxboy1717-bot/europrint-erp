/**
 * Communication Center — Socket.IO real-time gateway
 *
 * Namespace: /cc
 *
 * Eventlar (server → client):
 *   inbox:new          — yangi hujjat kiruvchi savatga tushdi
 *   inbox:overdue      — kiruvchi savat 24h muddati o'tdi
 *   pending:moved      — kutish savatiga o'tdi
 *   outbox:moved       — chiquvchi savatga o'tdi
 *   approved           — hujjat tasdiqlandi
 *   rejected           — hujjat rad etildi
 *   cancelled          — hujjat bekor qilindi
 *   summary:updated    — savat sonlari yangilandi
 *
 * Foydalanuvchi xonasi: `cc:user:<userId>`
 * Director / super-admin xonasi: `cc:role:director`, `cc:role:admin`
 */

import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

export type CcEvent =
  | 'inbox:new' | 'inbox:overdue'
  | 'pending:moved' | 'outbox:moved'
  | 'approved' | 'rejected' | 'cancelled'
  | 'summary:updated';

let _ccGatewayInstance: CcGateway | null = null;
export function getCcGateway(): CcGateway | null { return _ccGatewayInstance; }

@WebSocketGateway({
  namespace: '/cc',
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class CcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(CcGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {
    _ccGatewayInstance = this;
  }

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, ''));
      if (!token) { socket.disconnect(true); return; }
      const payload = await this.jwt.verifyAsync<{ sub: number; role?: string }>(token, {
        secret: this.cfg.get<string>('JWT_SECRET'),
      });
      const userId = payload.sub;
      socket.data.userId = userId;
      socket.join(`cc:user:${userId}`);
      if (payload.role) socket.join(`cc:role:${payload.role}`);
      this.logger.log(`Connected user=${userId} sock=${socket.id}`);
    } catch (err) {
      this.logger.warn(`Auth failed: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket): void {
    this.logger.log(`Disconnected sock=${socket.id} user=${socket.data.userId}`);
  }

  // ── Helper'lar (servislardan chaqiriladi) ────────────────────────────
  emitToUser(userId: number, event: CcEvent, data: Record<string, unknown>): void {
    this.server?.to(`cc:user:${userId}`).emit(event, data);
  }
  emitToRole(role: 'director' | 'admin' | 'ceo', event: CcEvent, data: Record<string, unknown>): void {
    this.server?.to(`cc:role:${role}`).emit(event, data);
  }
  broadcast(event: CcEvent, data: Record<string, unknown>): void {
    this.server?.emit(event, data);
  }
}
