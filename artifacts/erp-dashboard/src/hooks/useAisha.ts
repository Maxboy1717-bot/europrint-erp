/**
 * @module useAisha
 * @description React hook that owns the AIsha chat state and HTTP wiring.
 *
 *   Layers it talks to:
 *     - `apiRequest` (POST `/api/aisha/chat`, GET `/api/aisha/wake/config`)
 *     - Browser SpeechRecognition (mic toggle — graceful no-op where missing)
 *     - EventSource (SSE `/api/aisha/stream/:sessionId`) for incremental tokens
 *
 *   Every HTTP payload is validated through `aisha.schema.ts` so the
 *   panel can treat `messages: AishaMessage[]` as guaranteed-shape.
 *
 *   Functions stay short (≤ 30 lines) — heavier flows (`sendMessage`,
 *   `subscribeStream`) live in private helpers below.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  AishaChatResponseSchema,
  AishaStreamEventSchema,
  AishaWakeConfigSchema,
  normaliseWakeConfig,
  type AishaChatResponse,
  type AishaMessage,
  type AishaWakeConfigView,
} from '@/lib/api/aisha.schema';

// ─── Speech Recognition typings ──────────────────────────────────────────────
interface SpeechRecognitionResult { transcript: string }
interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
}
interface SpeechRecognitionInstance {
  lang:           string;
  interimResults: boolean;
  continuous:     boolean;
  onresult:       ((e: SpeechRecognitionEvent) => void) | null;
  onerror:        ((e: Event) => void) | null;
  onend:          (() => void) | null;
  start(): void;
  stop():  void;
}
interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?:        SpeechRecognitionCtor;
    webkitSpeechRecognition?:  SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Helpers (≤ 30 lines each) ───────────────────────────────────────────────

function newSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `aisha-${ts}-${rand}`;
}

function makeMessage(role: AishaMessage['role'], content: string): AishaMessage {
  return { role, content, timestamp: Date.now() };
}

async function postChat(message: string, sessionId: string): Promise<AishaChatResponse> {
  const raw = await apiRequest<unknown>('POST', '/api/aisha/chat', { message, sessionId });
  // Backend may return either `{ success, data: { reply, sessionId } }` or a
  // bare `{ reply, sessionId }`. Parse loosely then normalise.
  if (raw && typeof raw === 'object' && 'success' in raw) {
    return AishaChatResponseSchema.parse(raw);
  }
  return AishaChatResponseSchema.parse({ success: true, data: raw });
}

async function getWakeConfig(): Promise<AishaWakeConfigView> {
  const raw = await apiRequest<unknown>('GET', '/api/aisha/wake/config');
  const parsed = AishaWakeConfigSchema.parse(raw);
  return normaliseWakeConfig(parsed);
}

// ─── Hook return shape ───────────────────────────────────────────────────────

export interface UseAishaReturn {
  messages:       AishaMessage[];
  sendMessage:    (text: string) => void;
  isLoading:      boolean;
  isListening:    boolean;
  startListening: () => void;
  stopListening:  () => void;
  error:          Error | null;
  wakeConfig:     AishaWakeConfigView | null;
  isConnected:    boolean;
  retry:          () => void;
  sessionId:      string;
}

export function useAisha(): UseAishaReturn {
  const [messages,    setMessages]    = useState<AishaMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [sessionId]                   = useState<string>(() => newSessionId());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const wakeQuery = useQuery<AishaWakeConfigView>({
    queryKey: ['/api/aisha/wake/config'],
    queryFn:  getWakeConfig,
    staleTime: 5 * 60 * 1000,
  });

  const chatMutation = useMutation<AishaChatResponse, Error, string>({
    mutationFn: (text: string) => postChat(text, sessionId),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, makeMessage('assistant', res.data.reply)]);
    },
  });

  useStreamSubscription(sessionId, setMessages);

  const sendMessage = useCallback((text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, makeMessage('user', trimmed)]);
    chatMutation.mutate(trimmed);
  }, [chatMutation]);

  const startListening = useCallback((): void => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) { setIsListening(false); return; }
    const rec = new Ctor();
    rec.lang = 'uz-UZ';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const first = e.results?.[0]?.[0];
      if (first?.transcript) sendMessage(first.transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  }, [sendMessage]);

  const stopListening = useCallback((): void => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const error = useMemo<Error | null>(() => {
    if (chatMutation.error) return chatMutation.error;
    if (wakeQuery.error)    return wakeQuery.error as Error;
    return null;
  }, [chatMutation.error, wakeQuery.error]);

  return {
    messages,
    sendMessage,
    isLoading:      chatMutation.isPending,
    isListening,
    startListening,
    stopListening,
    error,
    wakeConfig:     wakeQuery.data ?? null,
    isConnected:    !wakeQuery.isError,
    retry:          () => { chatMutation.reset(); void wakeQuery.refetch(); },
    sessionId,
  };
}

// ─── Streaming subscription (SSE) ────────────────────────────────────────────

/**
 * Subscribe to `/api/aisha/stream/:sessionId` Server-Sent Events and append
 * incremental `text_delta` tokens to the last assistant message. Skipped
 * silently if `EventSource` isn't available (tests, SSR).
 */
function useStreamSubscription(
  sessionId: string,
  setMessages: React.Dispatch<React.SetStateAction<AishaMessage[]>>,
): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    const url = `/api/aisha/stream/${encodeURIComponent(sessionId)}`;
    let es: EventSource;
    try { es = new EventSource(url, { withCredentials: true }); }
    catch { return; }

    const onText = (event: MessageEvent): void => {
      const parsed = safeParseEvent(event.data);
      if (parsed?.kind !== 'text_delta') return;
      setMessages((prev) => appendStreamDelta(prev, parsed.text));
    };

    es.addEventListener('text_delta', onText as EventListener);
    es.addEventListener('done', () => es.close());
    es.addEventListener('error', () => es.close());
    return () => es.close();
  }, [sessionId, setMessages]);
}

function safeParseEvent(raw: unknown): ReturnType<typeof AishaStreamEventSchema.safeParse>['data'] | null {
  try {
    const json = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const parsed = AishaStreamEventSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

function appendStreamDelta(prev: AishaMessage[], text: string): AishaMessage[] {
  const last = prev[prev.length - 1];
  if (last && last.role === 'assistant') {
    return [...prev.slice(0, -1), { ...last, content: last.content + text }];
  }
  return [...prev, makeMessage('assistant', text)];
}
