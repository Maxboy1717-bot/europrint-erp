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
import {
  CANDIDATE_STAGE_CHANGED_EVENT,
  type CandidateStageChangedPayload,
} from './recruitment-funnel.service';

/**
 * T5.2 — Recruitment websocket gateway.
 *
 * Broadcasts `candidate:moved` to every connected HR client whenever
 * a candidate's funnel stage transitions. The payload comes from the
 * `candidate.stage-changed` domain event emitted by
 * `RecruitmentFunnelService.moveFunnelStage`.
 *
 * Authentication: a JWT in `client.handshake.auth.token`. Authorization:
 * the user role must be one of the recruitment whitelist below.
 *
 * Note: this gateway intentionally has no `@SubscribeMessage` handlers —
 * the client only listens; all data flow is server → client.
 */
const ALLOWED_ROLES = new Set([
  'SUPER_ADMIN',
  'DIRECTOR',
  'HR_MANAGER',
  'HR_SPECIALIST',
  'admin',
  'hr_manager',
  'hr_recruiter',
  'hr',
]);

@WebSocketGateway({
  namespace: '/recruitment',
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class RecruitmentGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RecruitmentGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly config: ConfigService) {}

  afterInit(_server: Server): void {
    this.logger.log('RecruitmentGateway /recruitment initialized');
  }

  handleConnection(client: Socket): void {
    const jwtSecret = this.config.get<string>('JWT_SECRET') ?? '';
    if (!jwtSecret) {
      this.logger.error('RecruitmentGateway: JWT_SECRET missing — rejecting');
      client.disconnect(true);
      return;
    }

    const rawToken =
      (client.handshake.auth?.['token'] as string | undefined) ??
      (client.handshake.headers?.['authorization'] as string | undefined)
        ?.replace(/^Bearer\s+/i, '');

    if (!rawToken) {
      this.logger.warn('RecruitmentGateway: missing token from %s', client.id);
      client.disconnect(true);
      return;
    }

    try {
      const payload = jwt.verify(rawToken, jwtSecret) as jwt.JwtPayload;
      const rawRole = payload['role'] ?? payload['roles'];
      const roles: string[] = Array.isArray(rawRole)
        ? rawRole.map(String)
        : typeof rawRole === 'string'
          ? [rawRole]
          : [];

      const safeRoles = Array.isArray(roles) ? roles : [];
      const authorized = safeRoles.some((r) => ALLOWED_ROLES.has(r));
      if (!authorized) {
        this.logger.warn(
          'RecruitmentGateway: role %s not authorized — disconnecting %s',
          safeRoles.join(',') || 'none',
          client.id,
        );
        client.disconnect(true);
        return;
      }
      this.logger.debug('RecruitmentGateway: client connected %s', client.id);
    } catch {
      this.logger.warn('RecruitmentGateway: invalid JWT from %s', client.id);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug('RecruitmentGateway: client disconnected %s', client.id);
  }

  /**
   * Re-broadcast the domain event as a Socket.io message.
   * Front-end listens for `candidate:moved` and invalidates the
   * `/api/hr/recruitment/pipeline` query.
   */
  @OnEvent(CANDIDATE_STAGE_CHANGED_EVENT)
  onCandidateStageChanged(payload: CandidateStageChangedPayload): void {
    if (!this.server) return;
    this.server.emit('candidate:moved', {
      funnelId: payload.funnelId,
      candidateId: payload.candidateId,
      fromStage: payload.fromStage,
      toStage: payload.toStage,
      changedById: payload.changedById,
      occurredAt: payload.occurredAt instanceof Date
        ? payload.occurredAt.toISOString()
        : payload.occurredAt,
    });
  }
}
