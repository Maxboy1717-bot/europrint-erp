/**
 * @module PosMonitorApp
 * @description Source module. See exports for details.
 */

import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import "./styles/pos-theme.css";
import { initTelegramWebApp, isTelegramWebApp } from "./lib/telegram";
import { useTranslation } from '@/lib/i18n';
import { useAuth } from "@/hooks/useAuth";

const PosHome          = lazy(() => import("./pages/PosHome"));
const PosMonitorMain   = lazy(() => import("@/pages/PosMonitorPage"));
const PosWarehouses    = lazy(() => import("./pages/PosWarehouses"));
const PosWarehouseDetail = lazy(() => import("./pages/PosWarehouseDetail"));
const PosMaterials     = lazy(() => import("./pages/PosMaterials"));
const PosMaterialDetail = lazy(() => import("./pages/PosMaterialDetail"));
const PosMaterial360   = lazy(() => import("./pages/PosMaterial360"));
const PosMaterialNew   = lazy(() => import("./pages/PosMaterialNew"));
const PosKpiDashboard  = lazy(() => import("./pages/PosKpiDashboard"));
const PosGoodsReceipts = lazy(() => import("./pages/PosGoodsReceipts"));
const PosLotTraceability = lazy(() => import("./pages/PosLotTraceability"));
const PosReservations  = lazy(() => import("./pages/PosReservations"));
const PosMaterialBalance = lazy(() => import("./pages/PosMaterialBalance"));
const PosMovements      = lazy(() => import("./pages/PosMovements"));
const PosMovementNew    = lazy(() => import("./pages/PosMovementNew"));
const PosMovementKirim  = lazy(() => import("./pages/PosMovementKirim"));
const PosPresKirim      = lazy(() => import("./pages/PosPresKirim"));
const PosMovementChiqim = lazy(() => import("./pages/PosMovementChiqim"));
const PosMovementDetail = lazy(() => import("./pages/PosMovementDetail"));
const PosMyInventory   = lazy(() => import("./pages/PosMyInventory"));
const PosRequests      = lazy(() => import("./pages/PosRequests"));
const RequisitionDetail = lazy(() => import("./pages/RequisitionDetail"));
const PosInventory     = lazy(() => import("./pages/PosInventory"));
const PosReports       = lazy(() => import("./pages/PosReports"));
const PosAdmin         = lazy(() => import("./pages/PosAdmin"));
const PosQuarantine    = lazy(() => import("./pages/PosQuarantine"));
const PosQCReview      = lazy(() => import("./pages/PosQCReview"));
const PosHandovers     = lazy(() => import("./pages/PosHandovers"));
const PosLayout        = lazy(() => import("./layout/PosLayout"));

function PosLoader() {
  const { t } = useTranslation("common");
  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#3B82F6", fontFamily: "Inter, sans-serif", fontSize: 14,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "pos-pulse 1s infinite" }}>📦</div>
        <div style={{ fontWeight: 600 }}>{t("posMonitorYuklanmoqda")}</div>
      </div>
    </div>
  );
}

// §1.2: POS Monitor ERP SSO ishlatadi — alohida login YO'Q.
// Foydalanuvchi ERP'ga kirgan bo'lsa (httpOnly access_token cookie) POS ham ochiq.
const POS_ADMIN_ROLES = new Set(["pos_manager", "admin", "super_admin", "finance_head"]);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PosLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common");
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PosLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  const role = String((user as { role?: string } | null)?.role ?? "").toLowerCase();
  if (!POS_ADMIN_ROLES.has(role)) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 14, background: "var(--pos-bg)",
      }}>
        <div style={{ fontSize: 48, opacity: 0.6 }}>🚫</div>
        <div style={{ color: "var(--pos-danger)", fontWeight: 700, fontSize: 16 }}>{t("adminPanelgaKirishTaqiqlangan")}</div>
        <div style={{ color: "var(--pos-text-muted)", fontSize: 13 }}>Bu sahifaga faqat {[...POS_ADMIN_ROLES].join(", ")} rollari kira oladi</div>
      </div>
    );
  }
  return <>{children}</>;
}

function WithLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PosLoader />}>
      <PosLayout>
        {children}
      </PosLayout>
    </Suspense>
  );
}

export default function PosMonitorApp() {
  const { t } = useTranslation("common");
  useEffect(() => {
    initTelegramWebApp();
    // Apply Telegram dark/light theme to the POS UI if running inside TG
    if (isTelegramWebApp()) {
      document.documentElement.setAttribute("data-tg-app", "true");
    }
  }, []);

  return (
    <Suspense fallback={<PosLoader />}>
      <Switch>
        {/* §1.2: alohida login YO'Q — ERP SSO. Eski login URL → asosiy sahifaga. */}
        <Route path="/pos-monitor/login">
          <Redirect to="/pos-monitor" />
        </Route>

        {/* BOSH EKRAN — market-POS uslubi: ombor + katta rangli amal-tugmalari (spec 2026-06-27) */}
        <Route path="/pos-monitor">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosHome /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Eski tab-ko'rinishli boshqaruv sahifasi (PosMonitorPage) — saqlanadi, deep-link */}
        <Route path="/pos-monitor/legacy-main">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMonitorMain /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* KPI Dashboard */}
        <Route path="/pos-monitor/kpi">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosKpiDashboard /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Goods Receipts (GRN) */}
        <Route path="/pos-monitor/grn">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosGoodsReceipts /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Lot Traceability */}
        <Route path="/pos-monitor/lots">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosLotTraceability /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Reservations */}
        <Route path="/pos-monitor/reservations">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosReservations /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Material Balance */}
        <Route path="/pos-monitor/material-balance">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMaterialBalance /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Warehouses */}
        <Route path="/pos-monitor/warehouses">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosWarehouses /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>
        <Route path="/pos-monitor/warehouses/:id">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosWarehouseDetail /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Materials */}
        <Route path="/pos-monitor/materials">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMaterials /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>
        <Route path="/pos-monitor/materials/360/:id">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMaterial360 /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>
        <Route path="/pos-monitor/materials/new">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMaterialNew /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>
        <Route path="/pos-monitor/materials/:id">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMaterialDetail /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Movements — kirim sub-route must be declared BEFORE the generic /new */}
        <Route path="/pos-monitor/movements/new/kirim">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMovementKirim /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        <Route path="/pos-monitor/movements/new/chiqim">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMovementChiqim /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Pres-kirim — kg → barkod → ichki kirim tez oqimi (VISION-3340 #59) */}
        <Route path="/pos-monitor/movements/new/pres-kirim">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosPresKirim /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        <Route path="/pos-monitor/movements/new">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMovementNew /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>
        <Route path="/pos-monitor/movements/:id">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMovementDetail /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>
        <Route path="/pos-monitor/movements">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMovements /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* My Inventory */}
        <Route path="/pos-monitor/my-inventory">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMyInventory /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Requests — detail must be before the list route */}
        <Route path="/pos-monitor/requests/:id">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><RequisitionDetail /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Requests */}
        <Route path="/pos-monitor/requests">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosRequests /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Inventory */}
        <Route path="/pos-monitor/inventory">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosInventory /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Quarantine */}
        <Route path="/pos-monitor/quarantine">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosQuarantine /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Smena topshirish (2-imzo) */}
        <Route path="/pos-monitor/handovers">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosHandovers /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* QC Review */}
        <Route path="/pos-monitor/qc-review">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosQCReview /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Reports */}
        <Route path="/pos-monitor/reports">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosReports /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Admin — pos_manager, admin, super_admin, finance_head only */}
        <Route path="/pos-monitor/admin">
          <AdminGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosAdmin /></Suspense>
            </WithLayout>
          </AdminGuard>
        </Route>

        {/* Catch-all */}
        <Route path="/pos-monitor/:rest*">
          <Redirect to="/pos-monitor" />
        </Route>
      </Switch>
    </Suspense>
  );
}
