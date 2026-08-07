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
 *
 *   2026-08-08 restyle: this panel used to render as a default shadcn Card
 *   (light bg-card/text-foreground) floating on top of the dark cosmic
 *   .aisha-immersive backdrop — a jarring visual mismatch. Every color-bearing
 *   shadcn element (Card/Badge/Input/Button) is replaced here with plain
 *   elements styled via the aisha-glass-* classes (aisha-immersive.css) so
 *   this panel shares the same dark glass/cyan-glow chrome as the orb and the
 *   other two floating panels. Logic, hooks, and every data-testid are
 *   unchanged — presentation only.
 */

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Check, History, Mic, MicOff, Send, ShieldAlert, X } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from '@/lib/i18n';
import { useAisha, useAishaApprovals, useAishaHistory } from '@/hooks/useAisha';
import { EPErrorState } from '@/components/ep/EPErrorState';
import { AishaHudCorners } from './AishaHudCorners';
import { cn } from '@/lib/utils';
import type {
  AishaApproval,
  AishaMessage,
  AishaConversationListItem,
  AishaToolCall,
} from '@/lib/api/aisha.schema';
import './aisha-immersive.css';

// ─── Form schema ─────────────────────────────────────────────────────────────
const ChatFormSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
type ChatFormValues = z.infer<typeof ChatFormSchema>;

// ─── Sub-components (each ≤ 30 lines) ────────────────────────────────────────

function StatusPill({ connected }: { connected: boolean }) {
  const { t } = useTranslation('aisha');
  return (
    <span
      className={cn('aisha-glass-badge', !connected && 'aisha-glass-badge--off')}
      style={{
        display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
        borderRadius: 999, fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.06em',
      }}
      data-testid="aisha-chat-status"
    >
      {connected ? t('connected') : t('disconnected')}
    </span>
  );
}

function MessageBubble({ msg }: { msg: AishaMessage }) {
  const { t } = useTranslation('aisha');
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <span className="aisha-glass-subtle" style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>
        {isUser ? t('you') : t('aisha')}
      </span>
      <div
        className={isUser ? 'aisha-glass-bubble-user' : 'aisha-glass-bubble-ai'}
        style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13, maxWidth: '85%', wordBreak: 'break-word' }}
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
    return <p className="aisha-glass-muted" style={{ fontSize: 12, textAlign: 'center', padding: '24px 0' }}>{t('noMessages')}</p>;
  }
  const safe = Array.isArray(messages) ? messages : [];
  return (
    <div className="flex flex-col gap-2" data-testid="aisha-chat-messages">
      {safe.map((m, i) => <MessageBubble key={`${m.timestamp}-${i}`} msg={m} />)}
      {isLoading && (
        <p className="aisha-glass-muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{t('thinking')}</p>
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
      className={cn('aisha-glass-row', active && 'aisha-glass-row--active')}
      style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: 12, transition: 'background-color .15s ease' }}
    >
      <div className="aisha-glass-title line-clamp-1" style={{ fontWeight: 500 }}>{title}</div>
      <div className="aisha-glass-muted" style={{ fontSize: 10 }}>
        {when} · {item.messageCount} · {item.toolCount} tool
      </div>
    </button>
  );
}

function ToolCallRow({ tc }: { tc: AishaToolCall }) {
  return (
    <li className="aisha-glass-row" style={{ padding: '6px 8px', fontSize: 11 }}>
      <div className="flex items-center justify-between">
        <span className="aisha-glass-title" style={{ fontWeight: 500 }}>{tc.toolName}</span>
        <span className="aisha-glass-muted">
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
    <div className="space-y-2 aisha-glass-row" style={{ padding: 8 }} data-testid="aisha-history-panel">
      {h.error ? (
        <p className="aisha-glass-error" style={{ fontSize: 11 }}>{h.error.message}</p>
      ) : h.isLoadingList ? (
        <p className="aisha-glass-muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{t('thinking')}</p>
      ) : convs.length === 0 ? (
        <p className="aisha-glass-muted" style={{ fontSize: 11, textAlign: 'center', padding: '12px 0' }}>{t('noMessages')}</p>
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
        <div className="aisha-glass-divider" style={{ borderTop: '1px solid', paddingTop: 8 }}>
          {h.isLoadingDetail ? (
            <p className="aisha-glass-muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{t('thinking')}</p>
          ) : tools.length === 0 ? (
            <p className="aisha-glass-subtle" style={{ fontSize: 11 }}>—</p>
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
      className="aisha-glass-approval"
      style={{ padding: '8px 10px', fontSize: 12 }}
      data-testid="aisha-approval-row"
    >
      <div className="flex items-center gap-1.5" style={{ fontWeight: 500 }}>
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        <span>{item.toolName ?? '—'}</span>
        <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>
          {t('approval.highStake')}
        </span>
      </div>
      {summariseApprovalInput(item.input) && (
        <p className="aisha-glass-muted" style={{ fontSize: 11, wordBreak: 'break-word', marginTop: 4 }}>{summariseApprovalInput(item.input)}</p>
      )}
      <div className="flex gap-2" style={{ paddingTop: 6 }}>
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          data-testid="aisha-approval-approve"
          className="aisha-glass-btn aisha-glass-btn--success"
          style={{ height: 24, padding: '0 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}
        >
          <Check className="h-3 w-3 mr-1" />{t('approval.approve')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          data-testid="aisha-approval-reject"
          className="aisha-glass-btn"
          style={{ height: 24, padding: '0 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}
        >
          <X className="h-3 w-3 mr-1" />{t('approval.reject')}
        </button>
      </div>
    </li>
  );
}

function ApprovalQueue({ a }: { a: ReturnType<typeof useAishaApprovals> }) {
  const { t } = useTranslation('aisha');
  if (a.pending.length === 0) return null;
  return (
    <ul className="space-y-1.5" data-testid="aisha-approval-queue">
      <li className="aisha-glass-approval-title" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
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
    <div
      data-testid="aisha-chat-panel"
      className={cn('aisha-glass', className)}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, width: 384, maxWidth: 'calc(100vw - 2rem)' }}
    >
      <AishaHudCorners />
      <div
        className="aisha-glass-divider"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid' }}
      >
        <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
          <Bot className="h-4 w-4 aisha-glass-accent" />
          <span className="aisha-glass-title">{t('title')}</span>
          <span className="aisha-glass-muted" style={{ fontSize: 11, fontWeight: 400 }}>— {t('subtitle')}</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusPill connected={a.isConnected} />
          <button
            type="button"
            aria-label={t('panel.history')}
            onClick={() => setShowHistory((v) => !v)}
            data-testid="aisha-chat-history-toggle"
            className={cn('aisha-glass-btn', showHistory && 'aisha-glass-btn')}
            style={{ height: 28, width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <History className="h-4 w-4" />
          </button>
          {closable && (
            <button
              type="button"
              aria-label={t('close')}
              onClick={() => setOpen(false)}
              data-testid="aisha-chat-close"
              className="aisha-glass-btn"
              style={{ height: 28, width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="aisha-hud-scanline" />
      <div className="space-y-3" style={{ padding: 18 }}>
        {showHistory && <HistoryPanel h={h} />}
        <ApprovalQueue a={approvals} />
        <div className="aisha-glass-row" style={{ maxHeight: 288, minHeight: '8rem', overflowY: 'auto', padding: 12 }}>
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
          <input
            data-testid="aisha-chat-input"
            placeholder={a.isListening ? t('listening') : t('placeholder')}
            autoComplete="off"
            disabled={a.isLoading}
            className="aisha-glass-input"
            style={{ flex: 1, height: 36, padding: '0 12px', fontSize: 13 }}
            {...form.register('message')}
          />
          <button
            type="button"
            aria-label={a.isListening ? t('listening') : t('listen')}
            onClick={a.isListening ? a.stopListening : a.startListening}
            data-testid="aisha-chat-mic"
            className="aisha-glass-btn"
            style={{
              height: 36, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              ...(a.isListening ? { background: 'rgba(244,63,94,.16)', color: '#fca5b5', borderColor: 'rgba(244,63,94,.4)' } : {}),
            }}
          >
            {a.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="submit"
            disabled={a.isLoading || !form.formState.isValid}
            data-testid="aisha-chat-send"
            aria-label={t('send')}
            className="aisha-glass-btn aisha-glass-btn--primary"
            style={{ height: 36, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
