/**
 * @module ai-interview-v2-cors
 * @description Module-scoped CORS origin allow-list + callback for the AI Interview WebSocket gateway.
 * Populated from ConfigService in the gateway constructor before any connection is accepted.
 */

// Mutable — populated from ConfigService in constructor before any connection is accepted
let _aiInterviewOrigins: string[] | '*' = '*';

export function setAiInterviewOrigins(origins: string[] | '*'): void {
  _aiInterviewOrigins = origins;
}

export function aiInterviewCorsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (!origin || _aiInterviewOrigins === '*' || _aiInterviewOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`WebSocket CORS: origin '${origin}' ruxsat etilmagan`));
  }
}
