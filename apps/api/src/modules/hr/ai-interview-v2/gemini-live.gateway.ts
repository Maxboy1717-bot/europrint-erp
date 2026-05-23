/**
 * @module gemini-live.gateway
 * @description WebSocket gateway bridging client (browser) ↔ Gemini Live API.
 *   Bi-directional proxy:
 *     Browser → audio/text → Server → Gemini Live API
 *     Gemini → audio/text → Server → Browser
 *
 *   Token-gated: browser sends `tokenId` on connect (from InterviewLinkService).
 *
 * @layer Gateway (HR)
 */

import { Logger } from '@nestjs/common';
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { InterviewLinkService } from './interview-link.service';

interface ClientMessage {
  type: 'audio' | 'text' | 'end';
  data?: string;
  mimeType?: string;
}

interface ServerMessage {
  type: 'audio' | 'text' | 'transcript' | 'error' | 'ready';
  data?: string;
  message?: string;
}

interface UpstreamSession {
  candidateId: number;
  upstream?: WebSocket;
  upstreamReady: boolean;
}

const GEMINI_LIVE_HOST = 'generativelanguage.googleapis.com';
const GEMINI_LIVE_PATH = '/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const GEMINI_MODEL = 'models/gemini-2.0-flash-exp';

@WebSocketGateway({
  namespace: '/ai-interview-live',
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class GeminiLiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(GeminiLiveGateway.name);
  private readonly sessions = new Map<string, UpstreamSession>();

  constructor(
    private readonly cfg: ConfigService,
    private readonly linkSvc: InterviewLinkService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('message', { type: 'ready', message: 'Send start event with tokenId' } satisfies ServerMessage);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    const session = this.sessions.get(client.id);
    session?.upstream?.close();
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('start')
  async onStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tokenId: string },
  ): Promise<void> {
    const validation = await this.linkSvc.validateToken(payload.tokenId);
    if (!validation.ok) {
      client.emit('message', { type: 'error', message: validation.error.message } satisfies ServerMessage);
      client.disconnect(true);
      return;
    }
    const apiKey = this.cfg.get<string>('AI_INTEGRATIONS_GEMINI_API_KEY');
    if (!apiKey) {
      client.emit('message', { type: 'error', message: 'Gemini API key not configured' } satisfies ServerMessage);
      return;
    }

    const session: UpstreamSession = { candidateId: validation.data.candidateId, upstreamReady: false };
    this.sessions.set(client.id, session);

    // ── Open WS to Gemini Live ──────────────────────────────────────
    const url = `wss://${GEMINI_LIVE_HOST}${GEMINI_LIVE_PATH}?key=${apiKey}`;
    const upstream = new WebSocket(url);
    session.upstream = upstream;

    upstream.on('open', () => {
      // Send setup message (Gemini Live protocol)
      upstream.send(JSON.stringify({
        setup: {
          model: GEMINI_MODEL,
          generationConfig: { responseModalities: ['AUDIO'] },
          systemInstruction: {
            parts: [{ text: 'Siz EuroPrint kompaniyasining HR-AI rekruteri. Nomzod bilan o\'zbek tilida professional intervyu o\'tkazing. Tinch, do\'stona ohangda. 8-10 ta savol bering.' }],
          },
        },
      }));
      session.upstreamReady = true;
      client.emit('message', { type: 'ready', message: 'Gemini Live connected' } satisfies ServerMessage);
    });

    upstream.on('message', (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString()) as {
          serverContent?: {
            modelTurn?: { parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
            turnComplete?: boolean;
          };
        };
        const parts = parsed.serverContent?.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (part.text) {
            client.emit('message', { type: 'text', data: part.text } satisfies ServerMessage);
            client.emit('message', { type: 'transcript', data: part.text } satisfies ServerMessage);
          }
          if (part.inlineData?.data) {
            client.emit('message', { type: 'audio', data: part.inlineData.data } satisfies ServerMessage);
          }
        }
      } catch (err) {
        this.logger.warn(`Upstream parse error: ${String(err)}`);
      }
    });

    upstream.on('error', (err: Error) => {
      this.logger.error(`Upstream error: ${err.message}`);
      client.emit('message', { type: 'error', message: `Gemini xato: ${err.message}` } satisfies ServerMessage);
    });

    upstream.on('close', () => {
      this.logger.log(`Upstream closed for candidate ${session.candidateId}`);
      client.disconnect(true);
    });

    await this.linkSvc.markUsed(payload.tokenId);
  }

  @SubscribeMessage('message')
  onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ClientMessage,
  ): void {
    const session = this.sessions.get(client.id);
    if (!session || !session.upstreamReady || !session.upstream) {
      client.emit('message', { type: 'error', message: 'Gemini hali tayyor emas' } satisfies ServerMessage);
      return;
    }
    if (payload.type === 'end') {
      session.upstream.close();
      this.sessions.delete(client.id);
      return;
    }
    // Forward to Gemini Live
    if (payload.type === 'audio' && payload.data) {
      session.upstream.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: payload.mimeType ?? 'audio/pcm', data: payload.data }],
        },
      }));
    } else if (payload.type === 'text' && payload.data) {
      session.upstream.send(JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: payload.data }] }],
          turnComplete: true,
        },
      }));
    }
  }
}
