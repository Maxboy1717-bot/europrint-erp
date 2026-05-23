/**
 * @module iot.gateway
 * @description WebSocket gateway for the /iot namespace.
 * Provides real-time sensor data pushes and equipment status streams
 * to connected frontend clients (IoT dashboard, live sensor view).
 *
 * Per ADR-008: /iot WebSocket namespace for sensor live stream.
 * Data flow: iot-sensor-cron.service.ts → emit('sensor:update') → clients.
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
  namespace: '/iot',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class IotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IotGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');
      if (token) this.jwtService.verify(token);
      this.logger.debug(`IoT client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`IoT client disconnected: ${client.id}`);
  }

  /** Subscribe to a sensor's live feed. Room = `sensor:${sensorId}`. */
  @SubscribeMessage('sensor:subscribe')
  handleSensorSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sensorId: string | number },
  ) {
    const room = `sensor:${data.sensorId}`;
    client.join(room);
    return { event: 'sensor:subscribed', data: { room } };
  }

  /** Subscribe to all equipment alerts. Room = `equipment:alerts`. */
  @SubscribeMessage('equipment:subscribe')
  handleEquipmentSubscribe(@ConnectedSocket() client: Socket) {
    client.join('equipment:alerts');
    return { event: 'equipment:subscribed', data: { room: 'equipment:alerts' } };
  }

  /** Push live sensor reading to subscribers (called from cron/event handlers). */
  pushSensorUpdate(sensorId: string | number, reading: Record<string, unknown>) {
    this.server.to(`sensor:${sensorId}`).emit('sensor:update', { sensorId, ...reading });
  }

  /** Push equipment alert to all subscribers. */
  pushEquipmentAlert(alert: Record<string, unknown>) {
    this.server.to('equipment:alerts').emit('equipment:alert', alert);
  }
}
