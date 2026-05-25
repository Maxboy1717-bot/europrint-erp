/**
 * @module mes.gateway
 * @description WebSocket gateway for the /mes namespace.
 * Provides real-time OEE, shift handover, and work-order status pushes
 * to connected MES dashboard clients.
 *
 * Per ADR-008: /mes WebSocket namespace for OEE live data.
 * Data flow: mes-oee-cron.service → emit('oee:update') → clients.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/mes',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class MesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MesGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');
      if (token) this.jwtService.verify(token);
      this.logger.debug(`MES client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`MES client disconnected: ${client.id}`);
  }

  /** Subscribe to OEE updates for a specific work center. */
  @SubscribeMessage('oee:subscribe')
  handleOeeSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workCenterId: string | number },
  ) {
    const room = `oee:${data.workCenterId}`;
    client.join(room);
    return { event: 'oee:subscribed', data: { room } };
  }

  /** Subscribe to shift-handover notifications. */
  @SubscribeMessage('shift:subscribe')
  handleShiftSubscribe(@ConnectedSocket() client: Socket) {
    client.join('shift:global');
    return { event: 'shift:subscribed', data: { room: 'shift:global' } };
  }

  /** Push OEE reading to work-center subscribers (called from OEE cron). */
  pushOeeUpdate(workCenterId: string | number, oee: Record<string, unknown>) {
    this.server.to(`oee:${workCenterId}`).emit('oee:update', { workCenterId, ...oee });
  }

  /** Broadcast shift-handover event to all MES clients. */
  pushShiftHandover(handover: Record<string, unknown>) {
    this.server.to('shift:global').emit('shift:handover', handover);
  }
}
