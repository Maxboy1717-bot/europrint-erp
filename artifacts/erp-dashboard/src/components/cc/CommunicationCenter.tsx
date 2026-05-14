/**
 * Kommunikatsiya Markazi — 3 Savat Tizimi
 *
 * Embeddable React komponenti.
 * CoordinationPage ichida `<TabsContent value="baskets">` ichiga joylashadi.
 * Light theme — ERP ning umumiy uslubiga moslashgan (shadcn Card, muted-foreground).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Clock, Send, Plus, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { BasketColumn, type BasketCard } from "./BasketColumn";
import { NewDocumentModal } from "./NewDocumentModal";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { useTranslation } from '@/lib/i18n';

interface BasketSummary {
  inbox: number; pending: number; outbox: number; inboxOverdue: number;
}

export function CommunicationCenter() {
  const { t } = useTranslation("common");
  const [showNew, setShowNew]     = useState(false);
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  const summary = useQuery<BasketSummary>({
    queryKey: ["/api/cc/baskets/summary"],
    queryFn: () => apiRequest<BasketSummary>("GET", "/api/cc/baskets/summary"),
    refetchInterval: 30_000,
  });

  const inbox = useQuery<BasketCard[]>({
    queryKey: ["/api/cc/baskets/inbox"],
    queryFn: () => apiRequest<BasketCard[]>("GET", "/api/cc/baskets/inbox"),
    refetchInterval: 30_000,
  });
  const pending = useQuery<BasketCard[]>({
    queryKey: ["/api/cc/baskets/pending"],
    queryFn: () => apiRequest<BasketCard[]>("GET", "/api/cc/baskets/pending"),
    refetchInterval: 30_000,
  });
  const outbox = useQuery<BasketCard[]>({
    queryKey: ["/api/cc/baskets/outbox"],
    queryFn: () => apiRequest<BasketCard[]>("GET", "/api/cc/baskets/outbox"),
    refetchInterval: 30_000,
  });

  const s = summary.data ?? { inbox: 0, pending: 0, outbox: 0, inboxOverdue: 0 };

  return (
    <div className="space-y-3">
      {/* ── Sarlavha + badge'lar + Yangi hujjat tugmasi ────────────── */}
      <Card className="p-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--ep-blue)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t("kommunikatsiyaMarkazi")}</h2>
            <p className="text-xs text-muted-foreground">{t("k3SavatTizimiHujjatOqimi")}</p>
          </div>
          {summary.isLoading && <Loader2 className="animate-spin text-muted-foreground" size={14} />}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge color="blue"  icon={<Inbox size={12} />}         count={s.inbox}   label={t("kiruvchi")} />
          <Badge color="amber" icon={<Clock size={12} />}         count={s.pending} label={t("kutish")} />
          <Badge color="emerald" icon={<Send size={12} />}        count={s.outbox}  label={t("chiquvchi")} />
          {s.inboxOverdue > 0 && (
            <Badge color="red" icon={<AlertTriangle size={12} />} count={s.inboxOverdue} label={t("muddatiOtgan")} />
          )}
          <Button onClick={() => setShowNew(true)} size="sm" data-testid="button-new-document" className="ml-1">
            <Plus className="h-4 w-4 mr-1" /> {t("yangiHujjat")}
          </Button>
        </div>
      </Card>

      {/* ── 24h qoida banneri ──────────────────────────────────────── */}
      <div
        className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2"
        data-testid="rule-banner"
      >
        <AlertTriangle size={14} className="text-[var(--ep-yellow)] shrink-0" />
        <span>
          <strong>24 soat qoidasi:</strong> kiruvchi savatdagi har bir hujjat 24 soat ichida ko'rib chiqilishi shart.
          Yakunlangach hujjat avtomatik arxivga topshiriladi.
        </span>
      </div>

      {/* ── 3 ustun ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BasketColumn
          title={t("kiruvchi")}      color="blue"
          count={s.inbox}       overdue={s.inboxOverdue}
          cards={inbox.data ?? []} kind="inbox"
          isLoading={inbox.isLoading} onCardClick={setOpenDocId}
        />
        <BasketColumn
          title={t("kutish")}        color="amber"
          count={s.pending}
          cards={pending.data ?? []} kind="pending"
          isLoading={pending.isLoading} onCardClick={setOpenDocId}
        />
        <BasketColumn
          title={t("chiquvchi")}     color="emerald"
          count={s.outbox}
          cards={outbox.data ?? []} kind="outbox"
          isLoading={outbox.isLoading} onCardClick={setOpenDocId}
        />
      </div>

      {/* ── Modallar ───────────────────────────────────────────────── */}
      {showNew && (
        <NewDocumentModal
          open={showNew}
          onOpenChange={setShowNew}
          onCreated={(docId) => { setShowNew(false); setOpenDocId(docId); }}
        />
      )}
      {openDocId && (
        <DocumentDetailModal
          documentId={openDocId}
          open={!!openDocId}
          onOpenChange={(open) => !open && setOpenDocId(null)}
        />
      )}
    </div>
  );
}

// ── Badge (light theme) ─────────────────────────────────────────────
const BADGE_TONES: Record<string, string> = {
  blue:    "bg-blue-50 text-[var(--ep-blue)] border-blue-200",
  amber:   "bg-amber-50 text-[var(--ep-yellow)] border-amber-200",
  emerald: "bg-emerald-50 text-[var(--ep-green)] border-emerald-200",
  red:     "bg-red-50 text-[var(--ep-red)] border-red-200",
};

function Badge({ color, icon, count, label }: { color: string; icon: React.ReactNode; count: number; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${BADGE_TONES[color] ?? BADGE_TONES.blue}`}
    >
      {icon}
      {count}
      <span className="font-normal opacity-70 hidden sm:inline">— {label}</span>
    </span>
  );
}
