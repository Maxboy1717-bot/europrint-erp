/**
 * @module SDDashboard
 * @description CRM / Savdo dashboard — EuroPrint "EP Linear Soft" (SHIPNOW) layout.
 *   Greeting header + 4 KPI cards (striped icon tiles, real month-over-month deltas)
 *   + monthly order bar chart + order-status donut + sales funnel + top customers.
 *
 *   Every number is REAL backend data — no mock values:
 *     GET /api/sd/dashboard/overview                     → stats + top_customers
 *     GET /api/sd/reports/funnel                         → leads/deals funnel
 *     GET /api/sales/analytics/monthly-trend?months=8    → bar chart + MoM deltas
 *
 *   Visuals come from the canonical kit.css atoms (.kpi / .card / .bar.stripe /
 *   .donut / .seg / .tbl / .pill). Colours are tokens only (var(--ep-*)) — no raw
 *   hex — so the design-token guard (Qoida 21) stays green.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Plus, Package, TrendingUp, Truck, Trophy, type LucideIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { tLabel } from "@/lib/i18n/tLabel";
import { fmtMoney } from "./SDDashboardTypes";
import { EPSkeletonKpiRow, EPErrorState } from "@/components/ep";

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

type Delta = { value: string; trend: "up" | "down" } | null;

const UZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

const pctDelta = (cur?: number, prev?: number): Delta => {
  if (cur == null || prev == null || !Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return null;
  const d = ((cur - prev) / prev) * 100;
  return { value: `${Math.abs(d).toFixed(1)}%`, trend: d >= 0 ? "up" : "down" };
};

// ─── Local chart atoms (kit.css reference classes; token colours only) ────────

function KpiTile({ label, value, delta, icon: Icon, iconBg }: {
  label: string; value: React.ReactNode; delta?: Delta; icon: LucideIcon; iconBg: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="kpi">
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{value}</div>
        {delta && (
          <span className={`kpi-delta ${delta.trend === "up" ? "up" : "dn"}`}>
            {delta.trend === "up" ? <ArrowUpRight /> : <ArrowDownRight />}
            {delta.value} {tLabel("sd.vsLastMonth", "o'tgan oydan")}
          </span>
        )}
      </div>
      <div className="kpi-icn" style={{ background: iconBg }}>
        <Icon strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function BarChart({ data, calloutIndex = -1 }: {
  data: { label: string; value: number }[]; calloutIndex?: number;
}) {
  const rows = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...rows.map((d) => d.value));
  if (rows.length === 0) {
    return <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg2)", fontSize: 13 }}>{tLabel("sd.noData", "Ma'lumot yo'q")}</div>;
  }
  return (
    <div className="chart-row">
      {rows.map((d, i) => (
        <div key={`${d.label}-${i}`} className="bar-grp">
          {i === calloutIndex && <div className="bar-callout">{d.label} · {d.value}</div>}
          <div className="stack">
            <div
              className={`bar stripe${i === calloutIndex ? " dark" : ""}`}
              style={{ height: `${Math.max(4, (d.value / max) * 140)}px` }}
            />
          </div>
          <div className="lbl">{d.label}</div>
        </div>
      ))}
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

  const stats: SdStats = overview?.stats ?? {};
  const topCustomers: TopCustomer[] = Array.isArray(overview?.top_customers) ? overview!.top_customers! : [];
  const trendRows: TrendRow[] = Array.isArray(trend) ? trend : [];

  // Greeting (time-of-day) + first name
  const hour = new Date().getHours();
  const greet = hour < 12 ? tLabel("sd.morning", "Xayrli tong") : hour < 18 ? tLabel("sd.day", "Xayrli kun") : tLabel("sd.evening", "Xayrli kech");
  const firstName = user?.firstName || tLabel("sd.colleague", "hamkasb");

  // Real MoM deltas from the monthly trend (current vs previous month)
  const cur = trendRows[trendRows.length - 1];
  const prev = trendRows[trendRows.length - 2];
  const ordersDelta = pctDelta(Number(cur?.order_count), Number(prev?.order_count));
  const revenueDelta = pctDelta(Number(cur?.revenue), Number(prev?.revenue));

  // Bar chart — monthly order counts; highlight the peak month
  const barData = trendRows.map((row) => {
    const m = row.month ? new Date(row.month).getMonth() : NaN;
    return { label: Number.isFinite(m) ? UZ_MONTHS[m] : "", value: Number(row.order_count ?? 0) };
  });
  const calloutIndex = barData.length
    ? barData.reduce((best, d, i, arr) => (d.value > arr[best].value ? i : best), 0)
    : -1;

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
          <KpiTile
            label={tLabel("sd.jamiBuyurtmalar", "Jami buyurtmalar (90 kun)")}
            value={totalOrders.toLocaleString("en-US")}
            delta={ordersDelta}
            icon={Package}
            iconBg="var(--ep-primary)"
          />
          <KpiTile
            label={tLabel("sd.oylikDaromad", "Oylik daromad")}
            value={fmtMoney(Number(stats.monthly_revenue ?? 0))}
            delta={revenueDelta}
            icon={TrendingUp}
            iconBg="var(--accent-coral)"
          />
          <KpiTile
            label={tLabel("sd.yetkazilgan", "Yetkazilgan")}
            value={deliv.toLocaleString("en-US")}
            icon={Truck}
            iconBg="var(--ep-green)"
          />
          <KpiTile
            label={tLabel("sd.yutilganDaromad", "Yutilgan daromad")}
            value={fmtMoney(Number(funnel?.won_revenue ?? 0))}
            icon={Trophy}
            iconBg="var(--ep-purple)"
          />
        </div>
      )}

      {/* Charts row: monthly orders (2) + status donut (1) */}
      <div className="grid-2-1">
        <div className="card hover-lift">
          <div className="card-head">
            <div>
              <div className="card-ttl">{tLabel("sd.orderStats", "Buyurtma statistikasi")}</div>
              <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 3 }}>
                {tLabel("sd.monthlyOrders", "Oylik buyurtmalar · 8 oy")}
              </div>
            </div>
          </div>
          <div className="card-body" style={{ paddingBottom: 28 }}>
            <BarChart data={barData} calloutIndex={calloutIndex} />
          </div>
        </div>

        <div className="card hover-lift">
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
                  <td><b>{c.customer_name ?? "—"}</b></td>
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

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/sd/sales-orders" className="btn btn-secondary btn-sm">{t("buyurtmalar")}</Link>
        <Link href="/sd/quota-dashboard" className="btn btn-secondary btn-sm">{t("kvota")}</Link>
        <Link href="/sd/manager-panel" className="btn btn-secondary btn-sm">{tLabel("sd.managerPanel", "Menejer paneli")}</Link>
      </div>
    </div>
  );
}
