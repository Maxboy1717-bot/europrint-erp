import { useEffect, useState, useCallback } from 'react';

const BASE = (import.meta.env.BASE_URL ?? '/erp-dashboard/').replace(/\/$/, '');
function getApiUrl(path: string) { return `${BASE}/api/${path}`; }

function getAuthToken(): string {
  try { return localStorage.getItem('token') ?? ''; } catch { return ''; }
}

interface OrderItem {
  id:          string;
  orderNumber: string;
  status:      string;
  customerId:  number | null;
  totalAmount: number;
  currency:    string;
  stateVersion: number;
}

interface SagaTrack {
  name:         string;
  status:       string;
  progressPct:  number;
  isBottleneck: boolean;
}

interface SagaDetail {
  orderId:     string;
  status:      string;
  tracks:      SagaTrack[];
  paymentPlan: Array<{ sequence: number; dueType: string; percent: string; status: string }>;
  statusHistory: Array<{ from: string | null; to: string; changedAt: string | null }>;
}

const PHASE_GROUPS = [
  { label: 'F1 Savdo', statuses: ['DRAFT', 'LEAD_INTAKE', 'PRICING'] },
  { label: 'F2 Namuna', statuses: ['SAMPLE_REQUESTED', 'SAMPLE_PRODUCTION', 'DESIGN_IN_PROGRESS'] },
  { label: 'F3 Shartnoma', statuses: ['CONTRACT_DRAFT', 'PAYMENT_PENDING', 'ORDER_CONFIRMED'] },
  { label: 'F4 Texnologiya', statuses: ['TECH_INTAKE', 'PREPRESS', 'MOLDS_ORDERED', 'CLICHE_ORDERED', 'TECHCARD_REVIEW', 'SPELL_CHECK', 'TECHCARD_CONFIRMED', 'CUSTOMER_APPROVED'] },
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
    <div style={{ background: '#1e293b', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 0.4s' }} />
    </div>
  );
}

function SagaTracker({ detail }: { detail: SagaDetail }) {
  const trackColors = ['#60a5fa', '#a78bfa', '#34d399'];
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {(detail.tracks ?? []).map((t, i) => (
        <div key={t.name} style={{ flex: 1, background: '#0f172a', borderRadius: 8, padding: '12px', border: t.isBottleneck ? '1.5px solid #ef4444' : '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{t.name}</span>
            {t.isBottleneck && <span style={{ color: '#ef4444', fontSize: 11 }}>⚠ Bottleneck</span>}
          </div>
          <ProgressBar pct={t.progressPct} color={trackColors[i] ?? '#60a5fa'} />
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{t.progressPct}% — {t.status}</div>
        </div>
      ))}
    </div>
  );
}

function PhaseBar({ status }: { status: string }) {
  const phaseIdx = PHASE_GROUPS.findIndex((g) => g.statuses.includes(status));
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {PHASE_GROUPS.map((g, i) => (
        <div key={g.label} style={{ flex: 1, height: 6, borderRadius: 3, background: i < phaseIdx ? '#4ade80' : i === phaseIdx ? '#60a5fa' : '#1e293b' }} title={g.label} />
      ))}
    </div>
  );
}

export default function OrderWorkflowPage() {
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
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
    if (!res.ok) { setError('Buyurtmalar yuklanmadi'); setLoading(false); return; }
    const data = await res.json();
    setOrders((data.items ?? []) as OrderItem[]);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openSaga = async (id: string) => {
    const res = await fetch(getApiUrl(`order-workflow/orders/${id}/saga-status`), {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setSelected(data as SagaDetail);
  };

  const grouped = PHASE_GROUPS.map((g) => ({
    ...g,
    items: (orders ?? []).filter((o) => g.statuses.includes(o.status)),
  }));

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: 20, color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            Order-to-Cash Workflow
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilter(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: '6px 12px', fontSize: 13 }}
            >
              <option value="">Barcha holatlar</option>
              {PHASE_GROUPS.flatMap((g) => g.statuses).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={fetchOrders}
              style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}
            >
              Yangilash
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 8, padding: 12, marginBottom: 16, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Yuklanmoqda...</div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
            {grouped.map((g) => (
              <div key={g.label} style={{ background: '#1e293b', borderRadius: 10, padding: 10, minHeight: 200 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {g.label}
                  <span style={{ marginLeft: 6, background: '#334155', borderRadius: 9, padding: '1px 7px', fontSize: 10, color: '#94a3b8' }}>
                    {g.items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(g.items ?? []).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => openSaga(o.id)}
                      style={{
                        background: '#0f172a', border: `1.5px solid ${STATUS_COLOR[o.status] ?? '#334155'}`,
                        borderRadius: 8, padding: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{o.orderNumber}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>ID: {o.customerId ?? '—'}</div>
                      <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>{formatAmount(o.totalAmount, o.currency)}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ background: STATUS_COLOR[o.status] ?? '#334155', color: '#0f172a', fontSize: 10, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
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

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#1e293b', borderRadius: 14, padding: 28, width: 640, maxHeight: '85vh', overflow: 'auto', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{selected.orderId.slice(0, 8)}... Saga</h2>
                <button onClick={() => setSelected(null)} style={{ background: '#334155', border: 'none', borderRadius: 6, color: '#94a3b8', padding: '4px 10px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Holat progressi (6 faza)</div>
                <PhaseBar status={selected.status} />
                <span style={{ background: STATUS_COLOR[selected.status] ?? '#334155', color: '#0f172a', fontSize: 12, borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                  {selected.status}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Parallel Saga Tracker</div>
                <SagaTracker detail={selected} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>To'lov rejasi</div>
                {(selected.paymentPlan ?? []).length === 0 && (
                  <div style={{ color: '#475569', fontSize: 13 }}>Hali to'lov rejasi yo'q</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(selected.paymentPlan ?? []).map((p) => (
                    <div key={p.sequence} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: 6, padding: '6px 10px' }}>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>#{p.sequence} {p.dueType}</span>
                      <span style={{ color: '#60a5fa', fontSize: 12 }}>{p.percent}%</span>
                      <span style={{
                        background: PAY_STATUS_COLOR[p.status] ?? '#334155',
                        color: '#0f172a', fontSize: 10, borderRadius: 4, padding: '1px 6px', fontWeight: 700,
                      }}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Holat tarixi</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflow: 'auto' }}>
                  {(selected.statusHistory ?? []).map((h) => (
                    <div key={`${h.from ?? 'start'}-${h.to}-${h.changedAt ?? ''}`} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: '#475569' }}>{h.from ?? '—'}</span>
                      <span style={{ color: '#334155' }}>→</span>
                      <span style={{ color: '#60a5fa', fontWeight: 600 }}>{h.to}</span>
                      <span style={{ color: '#334155', marginLeft: 'auto' }}>{h.changedAt ? new Date(h.changedAt).toLocaleString('uz-UZ') : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
