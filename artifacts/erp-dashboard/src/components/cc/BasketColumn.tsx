/**
 * 3 Savat — bitta ustun. Light theme — ERP'ning umumiy uslubiga moslashgan.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, ChevronRight, AlertTriangle, Send, Check, X, RotateCw, Inbox,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PinPromptModal } from "./PinPromptModal";

export interface BasketCard {
  id:                string;
  documentNumber:    string;
  subject:           string;
  templateCode:      string;
  templateNameUz:    string;
  templateNameRu:    string;
  priority:          'low' | 'normal' | 'high' | 'urgent';
  language:          'uz' | 'ru';
  basketState:       'inbox' | 'pending' | 'outbox' | 'archived';
  basketEnteredAt:   string;
  isInboxOverdue:    boolean;
  workflowState:     string;
  currentStepOrder:  number;
  senderName:        string | null;
  basketOwnerUserId: number | null;
  createdAt:         string;
  updatedAt:         string;
}

export type BasketKind = 'inbox' | 'pending' | 'outbox';

const COLOR_MAP = {
  blue:    { dot: "bg-blue-500",    badge: "bg-blue-50 text-[var(--ep-blue)] border-blue-200",       header: "border-blue-200/60" },
  amber:   { dot: "bg-amber-500",   badge: "bg-amber-50 text-[var(--ep-yellow)] border-amber-200",     header: "border-amber-200/60" },
  emerald: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-[var(--ep-green)] border-emerald-200", header: "border-emerald-200/60" },
};

const PRIORITY_LIGHT: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-50 text-[var(--ep-red)] border-red-200",         label: "Kritik"   },
  high:   { color: "bg-amber-50 text-[var(--ep-yellow)] border-amber-200",   label: "Yuqori"   },
  normal: { color: "bg-blue-50 text-[var(--ep-blue)] border-blue-200",      label: "O'rtacha" },
  low:    { color: "bg-slate-50 text-slate-600 border-slate-200",   label: "Past"     },
};

export function BasketColumn({
  title, color, count, overdue = 0, cards, kind, isLoading, onCardClick,
}: {
  title: string;
  color: 'blue' | 'amber' | 'emerald';
  count: number;
  overdue?: number;
  cards: BasketCard[];
  kind: BasketKind;
  isLoading: boolean;
  onCardClick: (id: string) => void;
}) {
  const c = COLOR_MAP[color];
  return (
    <Card className="flex flex-col min-h-[420px]">
      <CardHeader className={cn("py-2.5 px-3 border-b", c.header)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2.5 h-2.5 rounded-full", c.dot)} />
            <h3 className="text-sm font-semibold">{title}</h3>
            {overdue > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-[var(--ep-red)] border border-red-200">
                <AlertTriangle size={9} />
                {overdue}
              </span>
            )}
          </div>
          <span className={cn("inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-semibold border", c.badge)}>
            {count}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-2 flex-1 overflow-y-auto flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={14} />
            Yuklanmoqda...
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-xs text-muted-foreground/70 gap-2">
            <Inbox size={28} className="opacity-30" />
            Savat bo'sh
          </div>
        ) : (
          cards.map(card => (
            <DocumentCard key={card.id} card={card} kind={kind} onOpen={() => onCardClick(card.id)} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Bitta hujjat kartasi (light) ─────────────────────────────────────
function DocumentCard({ card, kind, onOpen }: { card: BasketCard; kind: BasketKind; onOpen: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pinModal, setPinModal] = useState<{ action: 'approve' | 'reject' | 'cancel'; open: boolean }>({
    action: 'approve', open: false,
  });

  const badge = PRIORITY_LIGHT[card.priority] ?? PRIORITY_LIGHT.normal;

  const moveTo = useMutation({
    mutationFn: (to: 'pending' | 'outbox') =>
      apiRequest("POST", `/api/cc/baskets/${card.id}/move`, { to }),
    onSuccess: () => {
      toast({ title: "Savat yangilandi" });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/inbox"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/outbox"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/summary"] });
    },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const elapsed = formatElapsed(card.basketEnteredAt);

  return (
    <div
      onClick={onOpen}
      data-testid={`cc-card-${card.id}`}
      className={cn(
        "rounded-lg border bg-card p-3 cursor-pointer transition-all hover:shadow-md",
        card.isInboxOverdue ? "border-red-300 bg-red-50/30" : "border-border hover:border-foreground/20",
      )}
    >
      {/* Row 1: priority + ID */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", badge.color)}>
          {badge.label}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{card.documentNumber}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-1.5">
        {card.subject}
      </p>

      {/* Sender + elapsed */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate max-w-[160px]">{card.senderName ?? "Noma'lum"}</span>
        <span className={card.isInboxOverdue ? "text-[var(--ep-red)] font-semibold" : ""}>
          {card.isInboxOverdue ? `⏰ ${elapsed}` : elapsed}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
        {kind === 'inbox' && (
          <>
            <ActionPill onClick={() => moveTo.mutate('pending')} tone="amber" disabled={moveTo.isPending}>
              <ChevronRight size={11} /> Kutishga
            </ActionPill>
            <ActionPill onClick={() => setPinModal({ action: 'approve', open: true })} tone="emerald">
              <Check size={11} /> Tasdiq
            </ActionPill>
            <ActionPill onClick={() => setPinModal({ action: 'reject', open: true })} tone="red">
              <X size={11} /> Rad
            </ActionPill>
          </>
        )}
        {kind === 'pending' && (
          <>
            <ActionPill onClick={() => setPinModal({ action: 'approve', open: true })} tone="emerald">
              <Check size={11} /> Tasdiq
            </ActionPill>
            <ActionPill onClick={() => setPinModal({ action: 'reject', open: true })} tone="red">
              <X size={11} /> Rad
            </ActionPill>
          </>
        )}
        {kind === 'outbox' && card.workflowState === 'rejected' && (
          <ActionPill onClick={onOpen} tone="blue">
            <RotateCw size={11} /> Qayta yuborish
          </ActionPill>
        )}
        {kind === 'outbox' && card.workflowState === 'draft' && (
          <ActionPill onClick={onOpen} tone="blue">
            <Send size={11} /> Yuborish
          </ActionPill>
        )}
      </div>

      {pinModal.open && (
        <PinPromptModal
          documentId={card.id}
          action={pinModal.action}
          open={pinModal.open}
          onOpenChange={(open) => setPinModal({ ...pinModal, open })}
        />
      )}
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  emerald: "bg-emerald-50 text-[var(--ep-green)] border-emerald-200 hover:bg-emerald-100",
  amber:   "bg-amber-50 text-[var(--ep-yellow)] border-amber-200 hover:bg-amber-100",
  red:     "bg-red-50 text-[var(--ep-red)] border-red-200 hover:bg-red-100",
  blue:    "bg-blue-50 text-[var(--ep-blue)] border-blue-200 hover:bg-blue-100",
};

function ActionPill({ onClick, tone, disabled, children }: {
  onClick: () => void; tone: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition disabled:opacity-50 disabled:cursor-not-allowed",
        PILL_TONES[tone] ?? PILL_TONES.blue,
      )}
    >
      {children}
    </button>
  );
}

function formatElapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat`;
  const d = Math.floor(h / 24);
  return `${d} kun`;
}
