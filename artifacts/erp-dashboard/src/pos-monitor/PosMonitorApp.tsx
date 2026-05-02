import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import "./styles/pos-theme.css";

const PosLogin         = lazy(() => import("./pages/PosLogin"));
const PosDashboard     = lazy(() => import("./pages/PosDashboard"));
const PosWarehouses    = lazy(() => import("./pages/PosWarehouses"));
const PosWarehouseDetail = lazy(() => import("./pages/PosWarehouseDetail"));
const PosMaterials     = lazy(() => import("./pages/PosMaterials"));
const PosMaterialDetail = lazy(() => import("./pages/PosMaterialDetail"));
const PosMovements     = lazy(() => import("./pages/PosMovements"));
const PosMovementNew   = lazy(() => import("./pages/PosMovementNew"));
const PosMovementDetail = lazy(() => import("./pages/PosMovementDetail"));
const PosLedger        = lazy(() => import("./pages/PosLedger"));
const PosRequests      = lazy(() => import("./pages/PosRequests"));
const PosInventory     = lazy(() => import("./pages/PosInventory"));
const PosReports       = lazy(() => import("./pages/PosReports"));
const PosAdmin         = lazy(() => import("./pages/PosAdmin"));
const PosLayout        = lazy(() => import("./layout/PosLayout"));

function PosLoader() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#00D4FF", fontFamily: "JetBrains Mono, monospace", fontSize: 14,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "pos-pulse 1s infinite" }}>📡</div>
        <div>POS Monitor yuklanmoqda...</div>
      </div>
    </div>
  );
}

function isAuthenticated(): boolean {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return false;
    const parsed = JSON.parse(sess) as { token?: string };
    if (!parsed.token) return false;
    const parts = parsed.token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("pos_session");
      return false;
    }
    return true;
  } catch { return false; }
}

const POS_ADMIN_ROLES = new Set(["pos_manager", "admin", "super_admin", "finance_head"]);

function getPosRole(): string {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return "";
    const parsed = JSON.parse(sess) as { role?: string };
    return (parsed.role ?? "").toLowerCase();
  } catch { return ""; }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Redirect to="/pos-monitor/login" />;
  }
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Redirect to="/pos-monitor/login" />;
  const role = getPosRole();
  if (!POS_ADMIN_ROLES.has(role)) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>🚫</div>
        <div style={{ color: "var(--pos-danger)", fontWeight: 600 }}>Admin panelga kirish taqiqlangan</div>
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
  return (
    <Suspense fallback={<PosLoader />}>
      <Switch>
        {/* Login — public */}
        <Route path="/pos-monitor/login">
          <Suspense fallback={<PosLoader />}>
            <PosLogin />
          </Suspense>
        </Route>

        {/* Dashboard */}
        <Route path="/pos-monitor">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosDashboard /></Suspense>
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
        <Route path="/pos-monitor/materials/:id">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosMaterialDetail /></Suspense>
            </WithLayout>
          </AuthGuard>
        </Route>

        {/* Movements */}
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

        {/* Ledger */}
        <Route path="/pos-monitor/ledger">
          <AuthGuard>
            <WithLayout>
              <Suspense fallback={<PosLoader />}><PosLedger /></Suspense>
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
