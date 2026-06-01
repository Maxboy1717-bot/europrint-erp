/**
 * @module SDDashboard
 * @description CRM / Savdo dashboard — EuroPrint "EP Linear Soft" (SHIPNOW) layout.
 *   An operational sales dashboard: greeting + KPI cards + monthly order bar chart
 *   + order-status donut + recent orders + manager action-items + quota + funnel +
 *   top customers. The 4 "Savdo/CRM" panels (orders, quota, manager) are surfaced
 *   here INLINE — not as separate pages.
 *
 *   Every number is REAL backend data — no mock values, no fabricated percentages:
 *     GET /api/sd/dashboard/overview                     → KPI stats + top_customers
 *     GET /api/sd/reports/funnel                         → leads/deals funnel
 *     GET /api/sales/analytics/monthly-trend?months=8    → monthly order bar chart
 *     GET /api/sd/orders?limit=8                         → recent orders list
 *     GET /api/sd/dashboard/manager-actions              → advance/tech action items
 *     GET /api/sd/dashboard/quota                        → quota achieved per manager
 *
 *   Visuals use the canonical kit.css atoms (.kpi / .card / .bar.stripe / .donut /
 *   .tbl / .pill). Colours are tokens only (var(--ep-*)) — design-token guard green.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Package, TrendingUp, Truck, Wallet, Banknote, Wrench, type LucideIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { tLabel } from "@/lib/i18n/tLabel";
import { fmtMoney } from "./SDDashboardTypes";
import { EPSkeletonKpiRow, EPErrorState } from "@/components/ep";
import { useCountUp } from "@/components/ep/useCountUp";

// ─── Response shapes ────────────────────────────────────────────────────────
interface SdStats {
  total_orders?: number; pending_orders?: number; in_production?: number; delivered?: number;
  monthly_revenue?: string | number; weekly_revenue?: string | number;
  today_revenue?: string | number; pending_advance?: number;
}
interface TopCustomer {
  customer_id?: string | number; customer_name?: string;
  order_count?: number; total_revenue?: string | number;
}
interface OverviewResponse { stats?: SdStats; top_customers?: TopCustomer[]; }
interface FunnelData {
  total_leads?: number; active_leads?: number; total_deals?: number;
  won_deals?: number; won_revenue?: string | number;
}
interface TrendRow { month?: string; order_count?: number; revenue?: string | number; }
interface Money { amount?: string | number; currency?: string; }
interface OrderRow {
  _orderNumber?: string; orderNumber?: string; order_number?: string;
  _totalAmount?: Money | string | number; totalAmount?: Money | string | number; total_amount?: Money | string | number;
  _advanceStatus?: string; advanceStatus?: string;
  _createdAt?: string; createdAt?: string; created_at?: string;
}

// /api/sd/orders returns the order aggregate where money is a value-object
// { amount, currency } — unwrap to a number for display.
const moneyVal = (m: Money | string | number | undefined | null): number => {
  if (m == null) return 0;
  if (typeof m === "number") return m;
  if (typeof m === "string") return Number(m) || 0;
  return Number(m.amount ?? 0) || 0;
};
interface OrdersResp { data?: OrderRow[]; }
interface ActionRow {
  id?: number | string; order_number?: string; customer_name?: string;
  total_amount?: string | number; advance_amount?: string | number; tech_checkpoint_status?: string;
}
interface ManagerActionsResp { pending_advance?: ActionRow[]; tech_checkpoints?: ActionRow[]; total?: number; }
interface QuotaRow { manager_id?: number | string; manager_name?: string; achieved?: string | number; order_count?: number; }

const UZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

// Initials avatar (endpoints return names, not photo URLs — so we render a
// deterministic coloured initials badge; real photos would need a BE change).
const AV_COLORS = ["var(--ep-primary)", "var(--ep-blue)", "var(--ep-purple)", "var(--ep-green)", "var(--accent-coral)", "var(--ep-cyan)"];
const avInitials = (name?: string): string =>
  (name ?? "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const avColor = (name?: string): string =>
  AV_COLORS[[...(name ?? "?")].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
function Avatar({ name }: { name?: string }) {
  return <span className="av sm" style={{ background: avColor(name) }}>{avInitials(name)}</span>;
}

const fmtDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ru-RU");
};

// Advance-status → pill class + Uzbek label (real backend status values)
function AdvancePill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    paid: { cls: "success", label: tLabel("sd.advPaid", "To'langan") },
    pending: { cls: "warning", label: tLabel("sd.advPending", "Kutilmoqda") },
    partial: { cls: "info", label: tLabel("sd.advPartial", "Qisman") },
    not_required: { cls: "neutral", label: tLabel("sd.advNotReq", "Talab yo'q") },
    bypassed: { cls: "neutral", label: tLabel("sd.advBypass", "O'tkazilgan") },
  };
  const e = map[status] ?? { cls: "neutral", label: status || "—" };
  return <span className={`pill ${e.cls}`}>{e.label}</span>;
}

// ─── Local chart atoms (kit.css reference classes; token colours only) ────────
// Note: KPI cards show real values only — no synthetic deltas/percentages.

function KpiTile({ label, value, format, icon: Icon, iconBg, delayMs = 0 }: {
  label: string; value: number; format?: (n: number) => string; icon: LucideIcon; iconBg: string; delayMs?: number;
}) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString("en-US");
  return (
    <div className="kpi ep-fade-up" style={{ animationDelay: `${delayMs}ms` }}>
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{display}</div>
      </div>
      <div className="kpi-icn" style={{ background: iconBg }}>
        <Icon strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number; tip?: string }[] }) {
  const rows = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...rows.map((d) => d.value));
  if (rows.length === 0) {
    return <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg2)", fontSize: 13 }}>{tLabel("sd.noData", "Ma'lumot yo'q")}</div>;
  }
  return (
    <div className="chart-row">
      {rows.map((d, i) => {
        const isMax = d.value === max && d.value > 0;
        return (
          <div key={`${d.label}-${i}`} className="bar-grp group">
            {/* value label above every bar — so each month's count is readable */}
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: isMax ? "var(--ep-primary)" : "var(--fg1)" }}>{d.value}</div>
            <div className="stack" style={{ position: "relative" }}>
              <div
                className={`bar stripe${isMax ? " dark" : ""}`}
                style={{ height: `${Math.max(4, (d.value / max) * 130)}px` }}
              />
              {/* hover tooltip — month · count · revenue */}
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none text-white shadow-lg"
                style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "var(--fg1)", fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 8, whiteSpace: "nowrap", zIndex: 5 }}
              >
                {d.tip ?? `${d.label}: ${d.value}`}
              </div>
            </div>
            <div className="lbl">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ segments, centerLabel, centerValue, size = 168, thickness = 26 }: {
  segments: { name: string; value: number; color: string }[];
  centerLabel: string; centerValue: string; size?: number; thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-warm-dim)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          const start = cumulative;
          cumulative += pct;
          return (
            <circle
              key={`${s.name}-${i}`}
              cx={size / 2} cy={size / 2} r={r} pathLength={100}
              fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-start}
            />
          );
        })}
      </svg>
      <div className="donut-center" style={{ width: size }}>
        <div className="lbl">{centerLabel}</div>
        <div className="val">{centerValue}</div>
      </div>
    </div>
  );
}

// One manager action-item row (advance-pending or tech-checkpoint order)
function ActionItem({ icon: Icon, iconBg, orderNo, customer, amount }: {
  icon: LucideIcon; iconBg: string; orderNo: string; customer: string; amount: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderTop: "1px solid var(--line-warm)" }}>
      <div className="text-white" style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{customer}</div>
        <div style={{ fontSize: 11.5, color: "var(--fg2)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{orderNo}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{fmtMoney(amount)}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SDDashboard() {
  const { t } = useTranslation("common");
  const { isAuthenticated, user } = useAuth();

  const { data: overview, isLoading: overviewLoad, isError: overviewError, refetch: refetchOverview } =
    useQuery<OverviewResponse>({
      queryKey: ["/api/sd/dashboard/overview"],
      queryFn: () => apiRequest("GET", "/api/sd/dashboard/overview"),
      enabled: isAuthenticated === true,
    });

  const { data: funnel } = useQuery<FunnelData>({
    queryKey: ["/api/sd/reports/funnel"],
    queryFn: () => apiRequest("GET", "/api/sd/reports/funnel"),
    enabled: isAuthenticated === true,
  });

  const { data: trend } = useQuery<TrendRow[]>({
    queryKey: ["/api/sales/analytics/monthly-trend", 8],
    queryFn: () => apiRequest("GET", "/api/sales/analytics/monthly-trend?months=8"),
    enabled: isAuthenticated === true,
  });

  const { data: ordersResp } = useQuery<OrdersResp>({
    queryKey: ["/api/sd/orders", 8],
    queryFn: () => apiRequest("GET", "/api/sd/orders?limit=8"),
    enabled: isAuthenticated === true,
  });

  const { data: managerActions } = useQuery<ManagerActionsResp>({
    queryKey: ["/api/sd/dashboard/manager-actions", 10],
    queryFn: () => apiRequest("GET", "/api/sd/dashboard/manager-actions?limit=10"),
    enabled: isAuthenticated === true,
  });

  const { data: quotaData } = useQuery<{ managers?: QuotaRow[]; quota?: unknown } | QuotaRow[]>({
    queryKey: ["/api/sd/dashboard/quota"],
    queryFn: () => apiRequest("GET", "/api/sd/dashboard/quota"),
    enabled: isAuthenticated === true,
  });

  const stats: SdStats = overview?.stats ?? {};
  const topCustomers: TopCustomer[] = Array.isArray(overview?.top_customers) ? overview!.top_customers! : [];
  const trendRows: TrendRow[] = Array.isArray(trend) ? trend : [];
  const orderRows: OrderRow[] = Array.isArray(ordersResp?.data) ? ordersResp!.data! : [];
  const pendingAdvance: ActionRow[] = Array.isArray(managerActions?.pending_advance) ? managerActions!.pending_advance! : [];
  const techCheckpoints: ActionRow[] = Array.isArray(managerActions?.tech_checkpoints) ? managerActions!.tech_checkpoints! : [];
  const quotaRows: QuotaRow[] = Array.isArray(quotaData)
    ? (quotaData as QuotaRow[])
    : Array.isArray((quotaData as { managers?: QuotaRow[] })?.managers)
      ? (quotaData as { managers: QuotaRow[] }).managers
      : [];
  const actionTotal = pendingAdvance.length + techCheckpoints.length;

  // Greeting (time-of-day) + first name
  const hour = new Date().getHours();
  const greet = hour < 12 ? tLabel("sd.morning", "Xayrli tong") : hour < 18 ? tLabel("sd.day", "Xayrli kun") : tLabel("sd.evening", "Xayrli kech");
  const firstName = user?.firstName || tLabel("sd.colleague", "hamkasb");

  // Bar chart — monthly order counts (peak month(s) highlighted, value on each bar, hover tooltip)
  const barData = trendRows.map((row) => {
    const m = row.month ? new Date(row.month).getMonth() : NaN;
    const label = Number.isFinite(m) ? UZ_MONTHS[m] : "";
    const value = Number(row.order_count ?? 0);
    return { label, value, tip: `${label}: ${value} ${tLabel("sd.taBuyurtma", "ta buyurtma")} · ${fmtMoney(Number(row.revenue ?? 0))}` };
  });

  // Donut — order-status breakdown (real status counts)
  const pend = Number(stats.pending_orders ?? 0);
  const prod = Number(stats.in_production ?? 0);
  const deliv = Number(stats.delivered ?? 0);
  const totalOrders = Number(stats.total_orders ?? 0);
  const otherOrders = Math.max(0, totalOrders - pend - prod - deliv);
  const donutSegments = [
    { name: tLabel("sd.yetkazilgan", "Yetkazilgan"), value: deliv, color: "var(--ep-green)" },
    { name: tLabel("sd.ishlabChiqarishda", "Ishlab chiqarishda"), value: prod, color: "var(--ep-blue)" },
    { name: tLabel("sd.kutilmoqda", "Kutilmoqda"), value: pend, color: "var(--ep-yellow)" },
    { name: tLabel("sd.boshqa", "Boshqa"), value: otherOrders, color: "var(--line-warm)" },
  ].filter((s) => s.value > 0);
  const donutTotal = donutSegments.reduce((s, x) => s + x.value, 0);

  const funnelItems = [
    { l: tLabel("sd.leadlar", "Leadlar"), v: String(funnel?.total_leads ?? 0) },
    { l: tLabel("sd.faolLeadlar", "Faol leadlar"), v: String(funnel?.active_leads ?? 0) },
    { l: tLabel("sd.bitimlar", "Bitimlar"), v: String(funnel?.total_deals ?? 0) },
    { l: tLabel("sd.yutilgan", "Yutilgan"), v: String(funnel?.won_deals ?? 0) },
    { l: tLabel("sd.yutilganDaromad", "Yutilgan daromad"), v: fmtMoney(Number(funnel?.won_revenue ?? 0)) },
  ];

  const orderNo = (o: OrderRow) => String(o._orderNumber ?? o.orderNumber ?? o.order_number ?? "—");
  const orderAmt = (o: OrderRow) => moneyVal(o._totalAmount ?? o.totalAmount ?? o.total_amount);

  return (
    <div className="ep-shipnow flex flex-col min-h-full p-5 lg:p-7 gap-4">
      {/* Greeting header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="page-bc">{t("dashboardSd")} · <b>{t("crmSavdoDashbordi")}</b></p>
          <h1 className="page-title">
            {greet}, <span style={{ color: "var(--ep-primary)" }}>{firstName}</span> 👋
          </h1>
        </div>
        <Link href="/sd/sales-orders" className="btn btn-primary">
          <Plus aria-hidden /> {tLabel("sd.newOrder", "Yangi buyurtma")}
        </Link>
      </div>

      {/* KPI row */}
      {overviewLoad ? (
        <EPSkeletonKpiRow count={4} />
      ) : overviewError ? (
        <EPErrorState onRetry={refetchOverview} />
      ) : (
        <div className="kpi-grid">
          <KpiTile label={tLabel("sd.jamiBuyurtmalar", "Jami buyurtmalar (90 kun)")} value={totalOrders} icon={Package} iconBg="var(--ep-primary)" delayMs={0} />
          <KpiTile label={tLabel("sd.oylikDaromad", "Oylik daromad")} value={Number(stats.monthly_revenue ?? 0)} format={fmtMoney} icon={TrendingUp} iconBg="var(--accent-coral)" delayMs={80} />
          <KpiTile label={tLabel("sd.yetkazilgan", "Yetkazilgan")} value={deliv} icon={Truck} iconBg="var(--ep-green)" delayMs={160} />
          <KpiTile label={tLabel("sd.avansKutilmoqda", "Avans kutilmoqda")} value={Number(stats.pending_advance ?? 0)} icon={Wallet} iconBg="var(--ep-purple)" delayMs={240} />
        </div>
      )}

      {/* Charts row: monthly orders (2) + status donut (1) */}
      <div className="grid-2-1">
        <div className="card hover-lift ep-fade-up">
          <div className="card-head">
            <div>
              <div className="card-ttl">{tLabel("sd.orderStats", "Buyurtma statistikasi")}</div>
              <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 3 }}>{tLabel("sd.monthlyOrders", "Oylik buyurtmalar · 8 oy")}</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingBottom: 28 }}>
            <BarChart data={barData} />
          </div>
        </div>

        <div className="card hover-lift ep-fade-up">
          <div className="card-head">
            <div className="card-ttl">{tLabel("sd.orderStatus", "Buyurtma holati")}</div>
          </div>
          <div className="donut-wrap" style={{ paddingTop: 6 }}>
            <Donut
              segments={donutSegments.length ? donutSegments : [{ name: "—", value: 1, color: "var(--line-warm)" }]}
              centerLabel={tLabel("sd.jami", "Jami")}
              centerValue={totalOrders.toLocaleString("en-US")}
            />
          </div>
          <div className="donut-legend">
            {donutSegments.map((s) => (
              <div key={s.name} className="donut-leg-row">
                <span className="swatch" style={{ background: s.color }} />
                <span className="name">{s.name}</span>
                <span className="qty">{s.value} {tLabel("sd.taShort", "ta")}</span>
                <span className="pct">{donutTotal ? Math.round((s.value / donutTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders (2) + Quota by manager (1) */}
      <div className="grid-2-1">
        <div className="card">
          <div className="card-head">
            <div className="card-ttl">{tLabel("sd.recentOrders", "So'nggi buyurtmalar")}</div>
            <Link href="/sd/sales-orders" className="card-act">{tLabel("sd.hammasi", "Hammasi")}</Link>
          </div>
          {orderRows.length === 0 ? (
            <div style={{ padding: "28px 22px", textAlign: "center", color: "var(--fg2)", fontSize: 13 }}>{tLabel("sd.noOrders", "Buyurtma yo'q")}</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>{tLabel("sd.buyurtma", "Buyurtma")}</th>
                  <th>{tLabel("sd.avansHolati", "Avans holati")}</th>
                  <th style={{ textAlign: "right" }}>{tLabel("sd.summa", "Summa")}</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((o, i) => (
                  <tr key={`o-${orderNo(o)}-${i}`}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600 }}>{orderNo(o)}</td>
                    <td><AdvancePill status={String(o._advanceStatus ?? o.advanceStatus ?? "")} /></td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtMoney(orderAmt(o))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-ttl">{tLabel("sd.kvotaBajarilishi", "Kvota bajarilishi")}</div>
          </div>
          {quotaRows.length === 0 ? (
            <div style={{ padding: "28px 22px", textAlign: "center", color: "var(--fg2)", fontSize: 13 }}>{tLabel("sd.noQuota", "Ma'lumot yo'q")}</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>{tLabel("sd.menejer", "Menejer")}</th>
                  <th style={{ textAlign: "right" }}>{tLabel("sd.erishilgan", "Erishilgan")}</th>
                </tr>
              </thead>
              <tbody>
                {quotaRows.slice(0, 6).map((q, i) => (
                  <tr key={`q-${q.manager_id ?? i}`}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Avatar name={q.manager_name} />
                        <div>
                          <b>{q.manager_name ?? "—"}</b>
                          <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2 }}>{Number(q.order_count ?? 0)} {tLabel("sd.taBuyurtma", "ta buyurtma")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--ep-green)" }}>{fmtMoney(Number(q.achieved ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manager panel — action items (advance pending + tech checkpoints) */}
      <div className="card">
        <div className="card-head">
          <div className="card-ttl">{tLabel("sd.menejerPaneli", "Menejer paneli — diqqat talab")}</div>
          {actionTotal > 0 && (
            <span style={{ fontSize: 12, color: "var(--accent-coral)", fontWeight: 600 }}>{actionTotal} {tLabel("sd.taShort", "ta")}</span>
          )}
        </div>
        {actionTotal === 0 ? (
          <div style={{ padding: "28px 22px", textAlign: "center", color: "var(--ep-green)", fontSize: 13, fontWeight: 600 }}>
            {tLabel("sd.allClear", "Hammasi joyida — diqqat talab buyurtma yo'q")}
          </div>
        ) : (
          <div style={{ paddingBottom: 8 }}>
            {pendingAdvance.map((a, i) => (
              <ActionItem
                key={`adv-${a.id ?? i}`}
                icon={Banknote}
                iconBg="var(--accent-coral)"
                orderNo={`${a.order_number ?? "—"} · ${tLabel("sd.avans", "Avans")}`}
                customer={a.customer_name ?? "—"}
                amount={Number(a.advance_amount ?? a.total_amount ?? 0)}
              />
            ))}
            {techCheckpoints.map((a, i) => (
              <ActionItem
                key={`tech-${a.id ?? i}`}
                icon={Wrench}
                iconBg="var(--ep-yellow)"
                orderNo={`${a.order_number ?? "—"} · ${tLabel("sd.texnik", "Texnik nazorat")}`}
                customer={a.customer_name ?? "—"}
                amount={Number(a.total_amount ?? 0)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sales funnel */}
      <div className="card">
        <div className="card-head">
          <div className="card-ttl">{tLabel("sd.savdoFunnel", "Savdo funnel")}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" style={{ borderTop: "1px solid var(--line-warm)" }}>
          {funnelItems.map((s, i) => (
            <div key={s.l} style={{ padding: "18px 22px", borderRight: i < funnelItems.length - 1 ? "1px solid var(--line-warm)" : "none" }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div className="card-ttl">{tLabel("sd.topMijozlar", "Top mijozlar (oylik)")}</div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>{tLabel("sd.mijoz", "Mijoz")}</th>
                <th style={{ textAlign: "right" }}>{tLabel("sd.buyurtmalarSoni", "Buyurtmalar")}</th>
                <th style={{ textAlign: "right" }}>{tLabel("sd.daromad", "Daromad")}</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={`tc-${c.customer_id ?? i}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Avatar name={c.customer_name} />
                      <b>{c.customer_name ?? "—"}</b>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{Number(c.order_count ?? 0)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--ep-green)" }}>
                    {fmtMoney(Number(c.total_revenue ?? 0))} {tLabel("sd.soum", "so'm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
