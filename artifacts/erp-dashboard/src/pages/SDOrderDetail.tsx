/**
 * @module SDOrderDetail
 * @description Routed sales-order 360 detail page (`/sd/orders/:id`). Read-only.
 *   Mirrors the DesignOrderDetail / ProductionOrder360 template (back-header + Tabs,
 *   EP tokens, Skeleton loading, EPErrorState 404). Every tab is backed by a REAL
 *   existing SD backend endpoint — no fabricated data (Q-40):
 *     · Umumiy   → GET /api/sd/orders/:id            (GetOrderByIdHandler)
 *     · Bo'limlar → GET /api/sd/orders/:id/departments (SdOrderDepartmentsController.list)
 *     · Jarayon  → GET /api/sd/orders/:id/saga        (SdOrderDepartmentsController.saga)
 */

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ShoppingCart, Building2, Network, CheckCircle2, XCircle,
  ShieldCheck, Package, AlertTriangle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { tLabel } from "@/lib/i18n/tLabel";
import { fmt } from "@/lib/sd-helpers";
import { EPStatusPill, type EPStatusTone, EPEmptyState, EPErrorState } from "@/components/ep";

// ── Real endpoint response shapes (see @module doc) ──────────────────────────

/** GET /api/sd/orders/:id — GetOrderByIdHandler hand-built 360 card view. */
interface OrderOverview {
  id: number;
  orderNumber: string;
  status: string;
  companyId: number;
  totalAmount: number;
  advanceStatus: string;
  checkpoints: { bom: boolean; routing: boolean; card: boolean };
  threeCheckpointPassed: boolean;
  advanceBlock: { blocked: boolean; reason?: string };
}

/** GET /api/sd/orders/:id/departments — sd_order_departments rows. */
interface OrderDepartmentRow {
  id: number | string;
  order_id: number;
  department: string;
  mode: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

/** GET /api/sd/orders/:id/saga — per-department fan-out track progress. */
interface SagaTrack {
  name: string;
  count: number;
  done: number;
  progressPct: number;
  rows: Array<Record<string, unknown>>;
}
interface OrderSaga {
  order: Record<string, unknown>;
  departments: Array<{ department: string; mode: string | null; status: string }>;
  tracks: SagaTrack[];
}

// ── Label + tone maps ────────────────────────────────────────────────────────

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  pending_approval: "Tasdiq kutilmoqda",
  approved: "Tasdiqlangan",
  pending_advance: "Avans kutilmoqda",
  ready_for_planning: "Rejaga tayyor",
  in_planning: "Rejalashtirilmoqda",
  completed_planning: "Reja yakunlandi",
  ready_for_production: "Ishlab chiqarishga tayyor",
  in_production: "Ishlab chiqarishda",
  ready_for_shipment: "Jo'natishga tayyor",
  shipped: "Jo'natildi",
  delivered: "Yetkazildi",
  closed: "Yopilgan",
  cancelled: "Bekor qilingan",
  on_hold: "To'xtatilgan",
};

function orderStatusTone(status: string): EPStatusTone {
  if (status === "closed" || status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  if (status === "on_hold") return "warning";
  if (status.startsWith("in_") || status.startsWith("pending")) return "warning";
  return "info";
}

const ADVANCE_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  partial: "Qisman to'landi",
  approved: "To'landi",
  bypassed: "Chetlab o'tilgan",
};
function advanceTone(s: string): EPStatusTone {
  if (s === "approved") return "success";
  if (s === "bypassed") return "brand";
  return "warning";
}

const DEPT_STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  in_progress: "Jarayonda",
  done: "Bajarildi",
};
function deptStatusTone(s: string): EPStatusTone {
  if (s === "done") return "success";
  if (s === "in_progress") return "info";
  return "warning";
}

const DEPT_LABELS: Record<string, string> = {
  mold: "Qolip",
  design: "Dizayn / Texkarta",
  cliche: "Klishe",
  logistics: "Logistika",
  warehouse: "Ombor / Material",
  production: "Ishlab chiqarish",
};
const deptLabel = (d: string) => DEPT_LABELS[d] || d;

// ── Small presentational bits (token-only, no raw hex) ───────────────────────

function CheckpointPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="text-sm">{label}</span>
      <span className="ml-auto">
        <EPStatusPill tone={ok ? "success" : "neutral"} hideDot>
          {ok ? "Tasdiqlangan" : "Kutilmoqda"}
        </EPStatusPill>
      </span>
    </div>
  );
}

function TrackBar({ track }: { track: SagaTrack }) {
  const pct = Math.max(0, Math.min(100, Number(track.progressPct) || 0));
  return (
    <div className="rounded-lg border border-border p-4" data-testid={`saga-track-${track.name}`}>
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className="text-sm font-medium">{deptLabel(track.name)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Number(track.done) || 0} / {Number(track.count) || 0} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={pct >= 100 ? "h-full rounded-full bg-[var(--ep-green)]" : "h-full rounded-full bg-primary"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SDOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<OrderOverview>({
    queryKey: ["/api/sd/orders", id],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${id}`),
    enabled: !!id,
  });

  const { data: deptData, isLoading: deptLoading } = useQuery<OrderDepartmentRow[]>({
    queryKey: ["/api/sd/orders", id, "departments"],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${id}/departments`),
    enabled: !!id,
  });
  const departments = Array.isArray(deptData) ? deptData : [];

  const { data: sagaData, isLoading: sagaLoading } = useQuery<OrderSaga>({
    queryKey: ["/api/sd/orders", id, "saga"],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${id}/saga`),
    enabled: !!id,
  });
  const tracks = Array.isArray(sagaData?.tracks) ? sagaData.tracks : [];
  const sagaHasActivity = tracks.some((t) => (Number(t.count) || 0) > 0);

  // ── 404 / not-found (mirror DesignOrderDetail) ──
  if (!id) {
    return (
      <div className="p-8">
        <EPEmptyState icon={Package} title={tLabel("sd.orderDetail.notFoundTitle", "Buyurtma topilmadi")} description={tLabel("sd.orderDetail.noIdDesc", "Buyurtma identifikatori ko'rsatilmagan.")} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <EPErrorState onRetry={refetch} error={error} />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-8">
        <EPEmptyState icon={Package} title={tLabel("sd.orderDetail.notFoundTitle", "Buyurtma topilmadi")} description={`#${id} ${tLabel("sd.orderDetail.notExistDesc", "raqamli buyurtma mavjud emas.")}`} />
      </div>
    );
  }

  const cp = overview.checkpoints || { bom: false, routing: false, card: false };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="border-b px-6 py-4 flex items-center gap-3 flex-wrap">
        <Button size="icon" variant="ghost" onClick={() => navigate("/sd/sales-orders")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold font-mono" data-testid="text-order-number">
              {overview.orderNumber}
            </h1>
            <EPStatusPill tone={orderStatusTone(overview.status)} data-testid="badge-status">
              {ORDER_STATUS_LABELS[overview.status] || overview.status}
            </EPStatusPill>
          </div>
          <p className="text-sm text-muted-foreground">Kompaniya raqami: #{overview.companyId}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-sd-order">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Umumiy
              </TabsTrigger>
              <TabsTrigger value="departments" data-testid="tab-departments">
                <Building2 className="w-3.5 h-3.5 mr-1.5" />Bo'limlar
              </TabsTrigger>
              <TabsTrigger value="saga" data-testid="tab-saga">
                <Network className="w-3.5 h-3.5 mr-1.5" />Jarayon
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: OVERVIEW — GET /api/sd/orders/:id ── */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{tLabel("sd.orderDetail.totalSum", "Umumiy summa")}</div>
                  <div className="text-lg font-bold mt-1">{fmt(overview.totalAmount)} {tLabel("common.currencySom", "so'm")}</div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{tLabel("sd.orderDetail.advanceStatusLabel", "Avans holati")}</div>
                  <div className="mt-1.5">
                    <EPStatusPill tone={advanceTone(overview.advanceStatus)} data-testid="pill-advance-status">
                      {ADVANCE_LABELS[overview.advanceStatus] || overview.advanceStatus}
                    </EPStatusPill>
                  </div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{tLabel("sd.orderDetail.threeCheckpoints", "3 nazorat nuqtasi")}</div>
                  <div className="mt-1.5">
                    <EPStatusPill tone={overview.threeCheckpointPassed ? "success" : "warning"} data-testid="pill-three-checkpoint">
                      {overview.threeCheckpointPassed ? tLabel("sd.orderDetail.passed", "O'tdi") : tLabel("sd.orderDetail.incomplete", "To'liq emas")}
                    </EPStatusPill>
                  </div>
                </div>
              </div>

              {/* Advance block (real advanceBlock from GET :id) */}
              <div
                className="flex items-start gap-2 rounded-xl border border-border p-4"
                data-testid="advance-block"
              >
                {overview.advanceBlock?.blocked ? (
                  <AlertTriangle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)] mt-0.5 shrink-0" />
                )}
                <div className="text-sm">
                  <div className="font-medium">
                    {overview.advanceBlock?.blocked ? tLabel("sd.orderDetail.advBlocked", "Buyurtma bloklangan (avans)") : tLabel("sd.orderDetail.advOpen", "Avans darvozasi ochiq")}
                  </div>
                  {overview.advanceBlock?.reason && (
                    <div className="text-xs text-muted-foreground mt-0.5">{overview.advanceBlock.reason}</div>
                  )}
                </div>
              </div>

              {/* 3 tech checkpoints (real checkpoints from GET :id) */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  {tLabel("sd.orderDetail.techCheckpoints", "Texnologik nazorat nuqtalari")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <CheckpointPill ok={!!cp.bom} label="BOM" />
                  <CheckpointPill ok={!!cp.routing} label={tLabel("sd.orderDetail.cpRouting", "Marshrut")} />
                  <CheckpointPill ok={!!cp.card} label={tLabel("sd.orderDetail.cpCard", "Texkarta")} />
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 2: DEPARTMENTS — GET /api/sd/orders/:id/departments ── */}
            <TabsContent value="departments" className="mt-4">
              {deptLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={`d-${i}`} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : departments.length === 0 ? (
                <EPEmptyState
                  icon={Building2}
                  title={tLabel("sd.orderDetail.noDeptTitle", "Bo'lim tanlanmagan")}
                  description={tLabel("sd.orderDetail.noDeptDesc", "Bu buyurtma uchun hali bo'lim (fan-out) tanlanmagan.")}
                />
              ) : (
                <div className="space-y-2" data-testid="departments-list">
                  {departments.map((d) => (
                    <div
                      key={String(d.id)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                      data-testid={`department-${d.department}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{deptLabel(d.department)}</div>
                        {d.mode && <div className="text-xs text-muted-foreground">Rejim: {d.mode}</div>}
                      </div>
                      <EPStatusPill tone={deptStatusTone(d.status)}>
                        {DEPT_STATUS_LABELS[d.status] || d.status}
                      </EPStatusPill>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── TAB 3: SAGA (fan-out progress) — GET /api/sd/orders/:id/saga ── */}
            <TabsContent value="saga" className="mt-4">
              {sagaLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`s-${i}`} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : !sagaHasActivity ? (
                <EPEmptyState
                  icon={Network}
                  title={tLabel("sd.orderDetail.noSagaTitle", "Fan-out boshlanmagan")}
                  description={tLabel("sd.orderDetail.noSagaDesc", "Avans to'langach, buyurtma bo'limlarga tarqatiladi va bu yerda jarayon ko'rinadi.")}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="saga-tracks">
                  {tracks.map((t) => (
                    <TrackBar key={t.name} track={t} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
