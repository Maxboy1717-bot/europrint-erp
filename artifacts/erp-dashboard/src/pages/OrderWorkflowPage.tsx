/**
 * @module OrderWorkflowPage
 * @description React page component. Route-level UI.
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
const BASE = (import.meta.env.BASE_URL ?? '/erp-dashboard/').replace(/\/$/, '');
function getApiUrl(path: string) { return `${BASE}/api/${path}`; }

interface OrderItem {
  id:           string;
  orderNumber:  string;
  status:       string;
  customerId:   number | null;
  totalAmount:  number;
  currency:     string;
  stateVersion: number;
}

interface SagaTrack {
  name:         string;
  status:       string;
  progressPct:  number;
  isBottleneck: boolean;
}

interface SagaDetail {
  orderId:       string;
  status:        string;
  tracks:        SagaTrack[];
  paymentPlan:   Array<{ sequence: number; dueType: string; percent: string; status: string }>;
  statusHistory: Array<{ from: string | null; to: string; changedAt: string | null }>;
}

const PHASE_GROUPS = [
  { label: 'F1 Savdo',          statuses: ['DRAFT', 'LEAD_INTAKE', 'PRICING'] },
  { label: 'F2 Namuna',         statuses: ['SAMPLE_REQUESTED', 'SAMPLE_PRODUCTION', 'DESIGN_IN_PROGRESS'] },
  { label: 'F3 Shartnoma',      statuses: ['CONTRACT_DRAFT', 'PAYMENT_PENDING', 'ORDER_CONFIRMED'] },
  { label: 'F4 Texnologiya',    statuses: ['TECH_INTAKE', 'PREPRESS', 'MOLDS_ORDERED', 'CLICHE_ORDERED', 'TECHCARD_REVIEW', 'SPELL_CHECK', 'TECHCARD_CONFIRMED', 'CUSTOMER_APPROVED'] },
  { label: 'F5 Ishlab chiqarish', statuses: ['PLANNING', 'MATERIAL_WAIT', 'LAB_WAIT', 'PRODUCTION_SCHEDULED', 'IN_PRODUCTION', 'FINISHED_AWAITING_QC'] },
  { label: 'F6 Yetkazib berish', statuses: ['PACKAGED', 'IN_FG_WAREHOUSE', 'SHIPPING_READY', 'SHIPPING', 'SHIPPED', 'DELIVERED', 'CLOSED'] },
];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#94a3b8', LEAD_INTAKE: '#60a5fa', PRICING: '#34d399',
  SAMPLE_REQUESTED: '#a78bfa', SAMPLE_PRODUCTION: '#f472b6',
  DESIGN_IN_PROGRESS: '#fb923c', CONTRACT_DRAFT: '#facc15',
  PAYMENT_PENDING: '#f87171', ORDER_CONFIRMED: '#4ade80',
  TECH_INTAKE: '#2dd4bf', PREPRESS: '#818cf8', MOLDS_ORDERED: '#c084fc',
  CLICHE_ORDERED: '#f9a8d4', TECHCARD_REVIEW: '#fcd34d',
  SPELL_CHECK: '#6ee7b7', TECHCARD_CONFIRMED: '#5eead4',
  CUSTOMER_APPROVED: '#86efac', PLANNING: '#93c5fd',
  MATERIAL_WAIT: '#fca5a5', LAB_WAIT: '#fdba74',
  PRODUCTION_SCHEDULED: '#6ee7b7', IN_PRODUCTION: '#34d399',
  FINISHED_AWAITING_QC: '#a3e635', PACKAGED: '#bef264',
  IN_FG_WAREHOUSE: '#67e8f9', SHIPPING_READY: '#38bdf8',
  SHIPPING: '#818cf8', SHIPPED: '#c084fc', DELIVERED: '#4ade80',
  CLOSED: '#6ee7b7', LOST_DEAL: '#ef4444', CANCELLED: '#64748b',
};

const PAY_STATUS_COLOR: Record<string, string> = {
  PAID: '#4ade80', OVERDUE: '#ef4444', PENDING: '#94a3b8',
  PARTIAL: '#facc15', WRITTEN_OFF: '#64748b',
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' ' + currency;
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="rounded bg-muted h-1.5 overflow-hidden">
      <div style={{ width: `${pct}%`, background: color }} className="h-full transition-[width] duration-300" />
    </div>
  );
}

function SagaTracker({ detail }: { detail: SagaDetail }) {
  const { t } = useTranslation("common");
  const trackColors = ['#60a5fa', '#a78bfa', '#34d399'];
  return (
    <div className="flex gap-3">
      {(Array.isArray(detail.tracks) ? detail.tracks : []).map((t, i) => (
        <div
          key={t.name}
          className={cn(
            'flex-1 bg-muted/50 rounded-lg p-3 border',
            t.isBottleneck ? 'border-destructive' : 'border-border',
          )}
        >
          <div className="flex justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-foreground">{t.name}</span>
            {t.isBottleneck && (
              <span className="text-[11px] text-destructive">{tLabel("orders.bottleneck", "Bottleneck")}</span>
            )}
          </div>
          <ProgressBar pct={t.progressPct} color={trackColors[i] ?? '#60a5fa'} />
          <div className="text-[12px] text-muted-foreground mt-1">
            {t.progressPct}% — {t.status}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhaseBar({ status }: { status: string }) {
  const phaseIdx = PHASE_GROUPS.findIndex((g) => g.statuses.includes(status));
  return (
    <div className="flex gap-1 mb-3">
      {PHASE_GROUPS.map((g, i) => (
        <div
          key={g.label}
          title={g.label}
          className={cn(
            'flex-1 h-1.5 rounded',
            i < phaseIdx  ? 'bg-success'
            : i === phaseIdx ? 'bg-primary'
            : 'bg-muted',
          )}
        />
      ))}
    </div>
  );
}

export default function OrderWorkflowPage() {
  const { t } = useTranslation('common');
  const [orders, setOrders]       = useState<OrderItem[]>([]);
  const [selected, setSelected]   = useState<SagaDetail | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [filterStatus, setFilter] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const url = filterStatus
      ? getApiUrl(`order-workflow/orders?status=${filterStatus}&limit=100`)
      : getApiUrl('order-workflow/orders?limit=100');
    try {
      const data = await apiRequest<{ items?: OrderItem[] }>('GET', url);
      setOrders((data?.items ?? []) as OrderItem[]);
    } catch {
      setError('Buyurtmalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openSaga = async (id: string) => {
    try {
      const data = await apiRequest<SagaDetail>('GET', getApiUrl(`order-workflow/orders/${id}/saga-status`));
      setSelected(data);
    } catch {
      // ignore
    }
  };

  const grouped = PHASE_GROUPS.map((g) => ({
    ...g,
    items: (Array.isArray(orders) ? orders : []).filter((o) => g.statuses.includes(o.status)),
  }));

  const allStatuses = PHASE_GROUPS.flatMap((g) => g.statuses);

  return (
    <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">{t('orderToCashWorkflow')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("buyurtmaJarayoniniKuzatish")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterStatus || "all"} onValueChange={(v) => setFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48 h-9 text-[13px]">
                <SelectValue placeholder={t("barchaHolatlar")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("barchaHolatlar")}</SelectItem>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
              {t("refresh")}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground text-sm">{t("Yuklanmoqda...")}</div>
        )}

        {/* Kanban board */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {grouped.map((g) => (
              <div key={g.label} className="bg-card rounded-xl border border-border p-2.5 min-h-48">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {g.label}
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-px text-[10px] font-semibold">
                    {g.items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {(Array.isArray(g.items) ? g.items : []).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => openSaga(o.id)}
                      className="bg-background rounded-lg p-2.5 cursor-pointer text-left w-full hover:shadow-sm transition-shadow"
                      style={{ border: `1.5px solid ${STATUS_COLOR[o.status] ?? 'hsl(var(--border))'}` }}
                    >
                      <div className="text-[12px] font-bold text-foreground mb-0.5">{o.orderNumber}</div>
                      <div className="text-[11px] text-muted-foreground mb-1">ID: {o.customerId ?? '—'}</div>
                      <div className="text-[12px] text-primary font-semibold">{formatAmount(o.totalAmount, o.currency)}</div>
                      <div className="mt-1.5">
                        <span
                          className="text-[10px] rounded px-1.5 py-px font-bold"
                          style={{
                            background: STATUS_COLOR[o.status] ?? 'hsl(var(--muted))',
                            color: '#0f172a',
                          }}
                        >
                          {o.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saga detail modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelected(null)}
          >
            <Card
              className="w-full max-w-[640px] max-h-[85vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[18px]">{selected.orderId.slice(0, 8)}... Saga</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>✕</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Phase progress */}
                <div>
                  <p className="text-[12px] text-muted-foreground mb-1.5">{t("holatProgressi6Faza")}</p>
                  <PhaseBar status={selected.status} />
                  <span
                    className="text-[12px] rounded px-2 py-0.5 font-bold"
                    style={{
                      background: STATUS_COLOR[selected.status] ?? 'hsl(var(--muted))',
                      color: '#0f172a',
                    }}
                  >
                    {selected.status}
                  </span>
                </div>

                {/* Saga tracker */}
                <div>
                  <p className="text-[12px] text-muted-foreground mb-2">{t("parallelSagaTracker")}</p>
                  <SagaTracker detail={selected} />
                </div>

                {/* Payment plan */}
                <div>
                  <p className="text-[12px] text-muted-foreground mb-2">{t("tolovRejasi")}</p>
                  {(selected.paymentPlan ?? []).length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">{t("haliTolovRejasiYoq")}</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {(Array.isArray(selected.paymentPlan) ? selected.paymentPlan : []).map((p) => (
                        <div key={p.sequence} className="flex justify-between items-center bg-muted/40 rounded-lg px-3 py-2">
                          <span className="text-[12px] text-muted-foreground">#{p.sequence} {p.dueType}</span>
                          <span className="text-[12px] text-primary font-medium">{p.percent}%</span>
                          <span
                            className="text-[10px] rounded px-1.5 py-px font-bold"
                            style={{
                              background: PAY_STATUS_COLOR[p.status] ?? 'hsl(var(--muted))',
                              color: '#0f172a',
                            }}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status history */}
                <div>
                  <p className="text-[12px] text-muted-foreground mb-2">{t("holatTarixi")}</p>
                  <div className="flex flex-col gap-1.5 max-h-44 overflow-auto">
                    {(Array.isArray(selected.statusHistory) ? selected.statusHistory : []).map((h) => (
                      <div
                        key={`${h.from ?? 'start'}-${h.to}-${h.changedAt ?? ''}`}
                        className="flex items-center gap-2 text-[12px]"
                      >
                        <span className="text-muted-foreground">{h.from ?? '—'}</span>
                        <span className="text-border">→</span>
                        <span className="text-primary font-semibold">{h.to}</span>
                        <span className="text-muted-foreground ml-auto">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString('uz-UZ') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

    </div>
  );
}
