/**
 * @module AishaChatPanel
 * @description Director-facing chat panel that wires the AIsha backend
 *   (chat + wake-config + SSE) into a small bottom-right floating card.
 *
 *   Layout:
 *     ┌──────────────────────────────────────────┐
 *     │ 🤖 AIsha           [Ulangan]   [ × ]     │  ← header + status pill
 *     ├──────────────────────────────────────────┤
 *     │ Suhbat boshlanmagan…                     │  ← scrollable history
 *     │ (newest at bottom)                       │
 *     ├──────────────────────────────────────────┤
 *     │ [text input] [🎤] [Yuborish]             │  ← input row
 *     └──────────────────────────────────────────┘
 *
 *   This component is presentation-only; all state and side-effects live in
 *   `useAisha()`. The existing wake-word AishaPanel (under the same folder)
 *   stays untouched — this is a sibling, not a replacement.
 */

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Mic, MicOff, Send, X } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from '@/lib/i18n';
import { useAisha } from '@/hooks/useAisha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EPErrorState } from '@/components/ep/EPErrorState';
import { cn } from '@/lib/utils';
import type { AishaMessage } from '@/lib/api/aisha.schema';

// ─── Form schema ─────────────────────────────────────────────────────────────
const ChatFormSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
type ChatFormValues = z.infer<typeof ChatFormSchema>;

// ─── Sub-components (each ≤ 30 lines) ────────────────────────────────────────

function StatusPill({ connected }: { connected: boolean }) {
  const { t } = useTranslation('aisha');
  return (
    <Badge
      variant={connected ? 'default' : 'destructive'}
      className={cn(
        'text-[10px] uppercase tracking-wider',
        connected ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : '',
      )}
      data-testid="aisha-chat-status"
    >
      {connected ? t('connected') : t('disconnected')}
    </Badge>
  );
}

function MessageBubble({ msg }: { msg: AishaMessage }) {
  const { t } = useTranslation('aisha');
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <span className="text-[10px] font-medium uppercase text-muted-foreground">
        {isUser ? t('you') : t('aisha')}
      </span>
      <div
        className={cn(
          'rounded-lg px-3 py-2 text-sm max-w-[85%] break-words',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}

function MessageList({ messages, isLoading }: { messages: AishaMessage[]; isLoading: boolean }) {
  const { t } = useTranslation('aisha');
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  if (messages.length === 0 && !isLoading) {
    return <p className="text-xs text-muted-foreground text-center py-6">{t('noMessages')}</p>;
  }
  const safe = Array.isArray(messages) ? messages : [];
  return (
    <div className="flex flex-col gap-2" data-testid="aisha-chat-messages">
      {safe.map((m, i) => <MessageBubble key={`${m.timestamp}-${i}`} msg={m} />)}
      {isLoading && (
        <p className="text-[11px] italic text-muted-foreground">{t('thinking')}</p>
      )}
      <div ref={endRef} />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export interface AishaChatPanelProps {
  /** When false, the panel renders nothing. */
  isDirector?: boolean;
  /** Optional override for the root wrapper className. */
  className?:  string;
  /** When false, the close-button is hidden (e.g. when embedded in a sidebar). */
  closable?:   boolean;
}

export function AishaChatPanel({ isDirector = true, className, closable = true }: AishaChatPanelProps) {
  const { t } = useTranslation('aisha');
  const [open, setOpen] = useState(true);
  const a = useAisha();

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(ChatFormSchema),
    defaultValues: { message: '' },
  });

  function onSubmit(values: ChatFormValues): void {
    a.sendMessage(values.message);
    form.reset({ message: '' });
  }

  if (!isDirector || !open) return null;

  return (
    <Card
      data-testid="aisha-chat-panel"
      className={cn(
        'fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-xl',
        'border-primary/20',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4 text-primary" />
          <span>{t('title')}</span>
          <span className="text-xs font-normal text-muted-foreground">— {t('subtitle')}</span>
        </CardTitle>
        <div className="flex items-center gap-1">
          <StatusPill connected={a.isConnected} />
          {closable && (
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              aria-label={t('close')}
              onClick={() => setOpen(false)}
              data-testid="aisha-chat-close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 min-h-[8rem] overflow-y-auto pr-1 border rounded-md bg-background/50 p-3">
          {a.error ? (
            <EPErrorState
              variant="inline"
              error={a.error}
              onRetry={a.retry}
              retryLabel={t('retry')}
              title={t('error')}
            />
          ) : (
            <MessageList messages={a.messages} isLoading={a.isLoading} />
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <Input
            data-testid="aisha-chat-input"
            placeholder={a.isListening ? t('listening') : t('placeholder')}
            autoComplete="off"
            disabled={a.isLoading}
            {...form.register('message')}
          />
          <Button
            type="button" variant="outline" size="icon"
            aria-label={a.isListening ? t('listening') : t('listen')}
            onClick={a.isListening ? a.stopListening : a.startListening}
            data-testid="aisha-chat-mic"
            className={cn(a.isListening && 'bg-red-50 text-red-600')}
          >
            {a.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            type="submit"
            disabled={a.isLoading || !form.formState.isValid}
            data-testid="aisha-chat-send"
            aria-label={t('send')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
