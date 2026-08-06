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
import { Bot, Check, History, Mic, MicOff, Send, ShieldAlert, X } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from '@/lib/i18n';
import { useAisha, useAishaApprovals, useAishaHistory } from '@/hooks/useAisha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EPErrorState } from '@/components/ep/EPErrorState';
import { cn } from '@/lib/utils';
import type {
  AishaApproval,
  AishaMessage,
  AishaConversationListItem,
  AishaToolCall,
} from '@/lib/api/aisha.schema';

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

// ─── History + transparency replay sub-components ────────────────────────────

function ConversationRow({
  item, active, onSelect,
}: { item: AishaConversationListItem; active: boolean; onSelect: () => void }) {
  const title = item.firstMessage?.trim() || item.id.slice(0, 8);
  const when = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid="aisha-history-row"
      className={cn(
        'w-full text-left rounded-md border px-2 py-1.5 text-xs transition-colors',
        active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted',
      )}
    >
      <div className="font-medium text-foreground line-clamp-1">{title}</div>
      <div className="text-[10px] text-muted-foreground">
        {when} · {item.messageCount} · {item.toolCount} tool
      </div>
    </button>
  );
}

function ToolCallRow({ tc }: { tc: AishaToolCall }) {
  return (
    <li className="rounded-md border bg-background/60 px-2 py-1.5 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{tc.toolName}</span>
        <span className="text-muted-foreground">
          {typeof tc.latencyMs === 'number' ? `${tc.latencyMs}ms` : tc.source ?? ''}
        </span>
      </div>
    </li>
  );
}

function HistoryPanel({ h }: { h: ReturnType<typeof useAishaHistory> }) {
  const { t } = useTranslation('aisha');
  const convs = Array.isArray(h.conversations) ? h.conversations : [];
  const tools = Array.isArray(h.detail?.toolCalls) ? h.detail!.toolCalls : [];
  return (
    <div className="space-y-2 border rounded-md bg-background/50 p-2" data-testid="aisha-history-panel">
      {h.error ? (
        <p className="text-[11px] text-destructive">{h.error.message}</p>
      ) : h.isLoadingList ? (
        <p className="text-[11px] italic text-muted-foreground">{t('thinking')}</p>
      ) : convs.length === 0 ? (
        <p className="text-[11px] text-center text-muted-foreground py-3">{t('noMessages')}</p>
      ) : (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {convs.map((c) => (
            <ConversationRow
              key={c.id}
              item={c}
              active={h.selectedId === c.id}
              onSelect={() => h.selectConversation(h.selectedId === c.id ? null : c.id)}
            />
          ))}
        </div>
      )}
      {h.selectedId && (
        <div className="border-t pt-2">
          {h.isLoadingDetail ? (
            <p className="text-[11px] italic text-muted-foreground">{t('thinking')}</p>
          ) : tools.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-1" data-testid="aisha-history-transcript">
              {tools.map((tc) => <ToolCallRow key={tc.id} tc={tc} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pending approvals (HITL: AI proposes, human decides) ────────────────────

function summariseApprovalInput(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  return Object.entries(input as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' · ')
    .slice(0, 160);
}

function ApprovalRow({
  item, busy, onApprove, onReject,
}: { item: AishaApproval; busy: boolean; onApprove: () => void; onReject: () => void }) {
  const { t } = useTranslation('aisha');
  return (
    <li
      className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-2 text-xs space-y-1.5"
      data-testid="aisha-approval-row"
    >
      <div className="flex items-center gap-1.5 font-medium text-amber-900 dark:text-amber-200">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        <span>{item.toolName ?? '—'}</span>
        <span className="text-[10px] font-normal text-amber-700/80 dark:text-amber-300/70">
          {t('approval.highStake')}
        </span>
      </div>
      {summariseApprovalInput(item.input) && (
        <p className="text-[11px] text-muted-foreground break-words">{summariseApprovalInput(item.input)}</p>
      )}
      <div className="flex gap-2 pt-0.5">
        <Button
          type="button" size="sm" variant="default"
          className="h-6 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700"
          disabled={busy}
          onClick={onApprove}
          data-testid="aisha-approval-approve"
        >
          <Check className="h-3 w-3 mr-1" />{t('approval.approve')}
        </Button>
        <Button
          type="button" size="sm" variant="outline"
          className="h-6 px-2 text-[11px]"
          disabled={busy}
          onClick={onReject}
          data-testid="aisha-approval-reject"
        >
          <X className="h-3 w-3 mr-1" />{t('approval.reject')}
        </Button>
      </div>
    </li>
  );
}

function ApprovalQueue({ a }: { a: ReturnType<typeof useAishaApprovals> }) {
  const { t } = useTranslation('aisha');
  if (a.pending.length === 0) return null;
  return (
    <ul className="space-y-1.5" data-testid="aisha-approval-queue">
      <li className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        {t('approval.title')} ({a.pending.length})
      </li>
      {a.pending.map((item) => (
        <ApprovalRow
          key={item.id}
          item={item}
          busy={a.isMutating && a.mutatingId === item.id}
          onApprove={() => a.approve(item.id)}
          onReject={() => a.reject(item.id)}
        />
      ))}
    </ul>
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
  const [showHistory, setShowHistory] = useState(false);
  const a = useAisha();
  const h = useAishaHistory();
  const approvals = useAishaApprovals();

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
          <Button
            variant="ghost" size="icon"
            aria-label={t('panel.history')}
            onClick={() => setShowHistory((v) => !v)}
            data-testid="aisha-chat-history-toggle"
            className={cn('h-7 w-7', showHistory && 'bg-primary/10 text-primary')}
          >
            <History className="h-4 w-4" />
          </Button>
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
        {showHistory && <HistoryPanel h={h} />}
        <ApprovalQueue a={approvals} />
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
