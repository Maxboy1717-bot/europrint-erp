/**
 * @module chat-gateway.cors
 * @description WebSocket gateway CORS + server-ref helpers extracted from chat.gateway.ts
 *   to keep the gateway file <300 lines (Rule 16).
 */

import type { Server } from 'socket.io';

// Expose server ref for REST controllers to broadcast
let _chatServer: Server | null = null;
export function setChatServer(s: Server | null): void { _chatServer = s; }
export function getChatServer(): Server | null { return _chatServer; }
export function broadcastToRoom(roomId: string | number, event: string, data: unknown): void {
  _chatServer?.to(`room:${roomId}`).emit(event, data);
}

// Mutable — populated from ConfigService in constructor before any connection is accepted
let _chatWsAllowedOrigins: string[] = [];
let _chatWsIsDev = true;

export function configureChatWsCors(allowedOriginsRaw: string, nodeEnv: string | undefined): void {
  _chatWsAllowedOrigins = (allowedOriginsRaw ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  _chatWsIsDev = nodeEnv !== 'production';
}

export function chatWsCorsAllowed(origin: string): boolean {
  if (!origin) return true;
  if (_chatWsAllowedOrigins.includes(origin)) return true;
  if (_chatWsIsDev && (
    origin.startsWith('http://localhost') ||
    origin.startsWith('https://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.endsWith('.replit.dev') ||
    origin.endsWith('.repl.co')
  )) return true;
  return false;
}
