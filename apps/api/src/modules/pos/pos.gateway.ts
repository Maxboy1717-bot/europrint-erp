/**
 * @module pos.gateway
 * @description NestJS WebSocket gateway. Socket.IO handlers.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

let _posServer: Server | null = null;

/** Emit an event to all clients connected to the /pos namespace. */
export function broadcastPosEvent(event: string, data: unknown): void {
  _posServer?.emit(event, data);
}

/** Emit to a specific user's room. */
export function broadcastToUser(userId: number, event: string, data: unknown): void {
  _posServer?.to(`user:${userId}`).emit(event, data);
}

/** Emit to all clients in a department room. */
export function broadcastToDept(deptCode: string, event: string, data: unknown): void {
  _posServer?.to(`dept:${deptCode}`).emit(event, data);
}

/** Emit to all clients watching a specific warehouse. */
export function broadcastToWarehouse(warehouseId: string | number, event: string, data: unknown): void {
  _posServer?.to(`wh:${warehouseId}`).emit(event, data);
}

const POS_ALLOWED_ROLES = new Set([
  'pos', 'pos_manager', 'warehouse_manager', 'warehouse_staff',
  'warehouse_viewer', 'qc_inspector', 'finance_head', 'admin', 'super_admin',
]);

function extractToken(client: Socket): string | null {
  const auth  = client.handshake.auth as Record<string, unknown>;
  const query = client.handshake.query as Record<string, unknown>;
  return (
    (typeof auth?.token === 'string' ? auth.token : null) ??
    (typeof query?.token === 'string' ? query.token : null) ??
    null
  );
}

@WebSocketGateway({
  namespace: '/pos',
  cors: {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) { cb(null, true); return; }
      const allowed = process.env.FRONTEND_URL ?? '';
      const isSameHost =
        origin.includes('replit.dev') ||
        origin.includes('repl.co') ||
        origin.includes('localhost') ||
        (!!allowed && origin.startsWith(allowed));
      cb(null, isSameHost);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class PosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PosGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    _posServer = server;
    this.logger.log('[PosGateway] /pos namespace initialised');
  }

  handleConnection(client: Socket) {
    const token = extractToken(client);
    if (!token) {
      this.logger.warn(`[PosGateway] Rejected unauthenticated connection: ${client.id}`);
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<{ role?: string; sub?: number; dept?: string; warehouseId?: string | number }>(token);
      const role = (payload.role ?? '').toLowerCase();
      const hasPosRole = POS_ALLOWED_ROLES.has(role) || role.startsWith('pos');
      if (!hasPosRole) {
        this.logger.warn(`[PosGateway] Rejected connection — role '${role}' lacks POS access: ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Join targeted rooms so we can send scoped notifications
      if (payload.sub) void client.join(`user:${payload.sub}`);
      if (payload.dept) void client.join(`dept:${payload.dept}`);
      if (payload.warehouseId) void client.join(`wh:${payload.warehouseId}`);

      this.logger.debug(`[PosGateway] Client authenticated (role=${role}, userId=${payload.sub}): ${client.id}`);
    } catch {
      this.logger.warn(`[PosGateway] Rejected invalid token: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`[PosGateway] Client disconnected: ${client.id}`);
  }
}
