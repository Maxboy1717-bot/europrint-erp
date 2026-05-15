/**
 * @module AppRouter
 * @description Frontend route definition.
 */

import { Suspense, lazy } from "react";
import { Route, useLocation, Redirect } from "wouter";
import { PageLoader } from "@/components/PageLoader";
import { RoleRoute } from "@/components/RoleRoute";
import ErrorBoundary from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import { ModuleGroup } from "@/routes/ModuleGroup";

const ChatPage = lazy(() => import("@/pages/chat/ChatPage"));
const ChatAdminPage = lazy(() => import("@/pages/chat/ChatAdminPage"));

import { ANALYTICS_ROUTES } from "@/routes/AnalyticsRoutes";
import { HR_ROUTES, AI_HR_ROUTES, SELF_SERVICE_ROUTES } from "@/routes/HRRoutes";
import { FINANCE_ROUTES } from "@/routes/FinanceRoutes";
import {
  PRODUCTION_ROUTES, MES_ROUTES, QC_ROUTES,
  DESIGN_ROUTES, MRO_ROUTES, IOT_ROUTES,
} from "@/routes/ProductionRoutes";
import { SALES_ROUTES, MARKETING_ROUTES } from "@/routes/CRMRoutes";
import { WAREHOUSE_ROUTES } from "@/routes/WarehouseRoutes";
import {
  ADMIN_ROUTES, INTEGRATION_ROUTES,
  SAAS_ROUTES, LMS_ADMIN_ROUTES, LMS_LEARNER_ROUTES,
  KAIZEN_ROUTES, ORDERS_REGISTRY_ROUTES,
  ARCHITECTURE_GAP_ROUTES,
} from "@/routes/AdminRoutes";
import { DIRECTOR_ROUTES } from "@/routes/DirectorRoutes";
import { CAMERA_ROUTES } from "@/routes/CameraRoutes";
import { STUB_ROUTES } from "@/routes/StubRoutes";

import {
  ALL_AUTHENTICATED, HR_ROLES, FINANCE_ROLES, WAREHOUSE_ROLES,
  PRODUCTION_ROLES, SALES_ROLES, QC_ROLES, ADMIN_ROLES, DIRECTOR_ROLES,
  CAMERA_ROLES, IOT_ROLES, DESIGN_ROLES, MRO_ROLES, MARKETING_ROLES,
  SAAS_ROLES, LMS_ADMIN_ROLES, AI_HR_ROLES,
} from "@/routes/roleConstants";

const DirectorDashboard = lazy(() => import("@/pages/DirectorDashboard"));
const DepartmentsPage = lazy(() => import("@/pages/Departments"));
const PositionsPage = lazy(() => import("@/pages/Positions"));
const OrderWorkflowPage = lazy(() => import("@/pages/OrderWorkflowPage"));

const ALL_MODULE_ROUTES = [
  ...ANALYTICS_ROUTES, ...HR_ROUTES, ...AI_HR_ROUTES, ...ADMIN_ROUTES, ...SELF_SERVICE_ROUTES,
  ...WAREHOUSE_ROUTES, ...MARKETING_ROUTES, ...FINANCE_ROUTES,
  ...INTEGRATION_ROUTES, ...CAMERA_ROUTES, ...SALES_ROUTES,
  ...PRODUCTION_ROUTES, ...DIRECTOR_ROUTES, ...MES_ROUTES,
  ...QC_ROUTES, ...DESIGN_ROUTES, ...MRO_ROUTES, ...IOT_ROUTES,
  ...SAAS_ROUTES, ...LMS_ADMIN_ROUTES, ...LMS_LEARNER_ROUTES,
  ...KAIZEN_ROUTES, ...ORDERS_REGISTRY_ROUTES,
  ...ARCHITECTURE_GAP_ROUTES,
  ...STUB_ROUTES,
];

const REDIRECT_PATHS = [
  '/chat', '/chat/admin',
  '/departments', '/positions', '/orgstructure', '/org-structure/builder',
  '/org-structure/view', '/erp-analytics', '/erp-roles',
  '/warehouse-management', '/warehouse/dashboard', '/logistics/dashboard',
  '/accounting-dashboard', '/fi-finance', '/erp-finance', '/fi/dashboard',
  '/cfo-dashboard', '/accounting/payroll', '/integration/shift-scheduling',
  '/erp-cameras', '/erp/cameras/reports', '/erp/cameras/heatmap',
  '/security/dashboard', '/crm', '/crm/dashboard', '/crm/leads',
  '/crm/deals', '/crm/contacts', '/crm/companies', '/crm/proposals',
  '/crm/invoices', '/erp/planning', '/erp/pp/mrp',
  '/tech/dashboard',
  '/iot/live', '/europrint/director', '/qc/dashboard',
  '/succession-planning', '/feedback', '/logout',
  '/order-workflow', '/sales',
];

function pathMatches(pattern: string, loc: string): boolean {
  const regStr = '^' + pattern
    .replace(/:[^/]+\*/g, '.*')
    .replace(/:[^/]+/g, '[^/]+') + '$';
  return new RegExp(regStr).test(loc);
}

export function AppRouter() {
  const [location] = useLocation();

  const isKnownPath = location === '/'
    || ALL_MODULE_ROUTES.some(([p]) => pathMatches(p, location))
    || REDIRECT_PATHS.some(p => location === p);

  return (
    <>
      {/* ── Home ── */}
      <Route path="/">
        <RoleRoute roles={DIRECTOR_ROLES}>
          <ErrorBoundary><Suspense fallback={<PageLoader />}><DirectorDashboard /></Suspense></ErrorBoundary>
        </RoleRoute>
      </Route>

      {/* ── Module groups ── */}
      <ModuleGroup roles={ALL_AUTHENTICATED}  routes={ANALYTICS_ROUTES}    />
      <ModuleGroup roles={HR_ROLES}           routes={HR_ROUTES}           />
      <ModuleGroup roles={AI_HR_ROLES}        routes={AI_HR_ROUTES}        />
      <ModuleGroup roles={ADMIN_ROLES}        routes={ADMIN_ROUTES}        />
      <ModuleGroup roles={WAREHOUSE_ROLES}    routes={WAREHOUSE_ROUTES}    />
      <ModuleGroup roles={MARKETING_ROLES}    routes={MARKETING_ROUTES}    />
      <ModuleGroup roles={FINANCE_ROLES}      routes={FINANCE_ROUTES}      />
      <ModuleGroup roles={ADMIN_ROLES}        routes={INTEGRATION_ROUTES}  />
      <ModuleGroup roles={CAMERA_ROLES}       routes={CAMERA_ROUTES}       />
      <ModuleGroup roles={SALES_ROLES}        routes={SALES_ROUTES}        />
      <ModuleGroup roles={PRODUCTION_ROLES}   routes={PRODUCTION_ROUTES}   />
      <ModuleGroup roles={DIRECTOR_ROLES}     routes={DIRECTOR_ROUTES}     />
      <ModuleGroup roles={PRODUCTION_ROLES}   routes={MES_ROUTES}          />
      <ModuleGroup roles={QC_ROLES}           routes={QC_ROUTES}           />
      <ModuleGroup roles={DESIGN_ROLES}       routes={DESIGN_ROUTES}       />
      <ModuleGroup roles={MRO_ROLES}          routes={MRO_ROUTES}          />
      <ModuleGroup roles={IOT_ROLES}          routes={IOT_ROUTES}          />
      <ModuleGroup roles={SAAS_ROLES}         routes={SAAS_ROUTES}         />
      <ModuleGroup roles={LMS_ADMIN_ROLES}    routes={LMS_ADMIN_ROUTES}    />
      <ModuleGroup roles={ALL_AUTHENTICATED}  routes={LMS_LEARNER_ROUTES}  />
      <ModuleGroup roles={ALL_AUTHENTICATED}  routes={SELF_SERVICE_ROUTES} />
      <ModuleGroup roles={ALL_AUTHENTICATED}  routes={KAIZEN_ROUTES}          />
      <ModuleGroup roles={ALL_AUTHENTICATED}  routes={ORDERS_REGISTRY_ROUTES} />
      <ModuleGroup roles={ADMIN_ROLES}        routes={ARCHITECTURE_GAP_ROUTES} />
      <ModuleGroup roles={ALL_AUTHENTICATED}  routes={STUB_ROUTES}            />

      {/* ── Redirect aliases ── */}
      <Route path="/departments">
        <RoleRoute roles={HR_ROLES}>
          <ErrorBoundary><Suspense fallback={<PageLoader />}><DepartmentsPage /></Suspense></ErrorBoundary>
        </RoleRoute>
      </Route>
      <Route path="/positions">
        <RoleRoute roles={HR_ROLES}>
          <ErrorBoundary><Suspense fallback={<PageLoader />}><PositionsPage /></Suspense></ErrorBoundary>
        </RoleRoute>
      </Route>
      <Route path="/orgstructure"><RoleRoute roles={HR_ROLES}><Redirect to="/org-structure/hierarchy" /></RoleRoute></Route>
      <Route path="/org-structure/builder"><RoleRoute roles={HR_ROLES}><Redirect to="/org-chart" /></RoleRoute></Route>
      <Route path="/org-structure/view"><RoleRoute roles={HR_ROLES}><Redirect to="/org-structure/hierarchy" /></RoleRoute></Route>
      <Route path="/erp-analytics"><RoleRoute roles={ADMIN_ROLES}><Redirect to="/analytics" /></RoleRoute></Route>
      <Route path="/erp-roles"><RoleRoute roles={ADMIN_ROLES}><Redirect to="/settings" /></RoleRoute></Route>
      <Route path="/warehouse-management"><RoleRoute roles={WAREHOUSE_ROLES}><Redirect to="/warehouse/hub" /></RoleRoute></Route>
      <Route path="/warehouse/dashboard"><RoleRoute roles={WAREHOUSE_ROLES}><Redirect to="/warehouse/hub" /></RoleRoute></Route>
      <Route path="/logistics/dashboard"><RoleRoute roles={WAREHOUSE_ROLES}><Redirect to="/logistics" /></RoleRoute></Route>
      <Route path="/accounting-dashboard"><RoleRoute roles={FINANCE_ROLES}><Redirect to="/finance-dashboard" /></RoleRoute></Route>
      <Route path="/fi-finance"><RoleRoute roles={FINANCE_ROLES}><Redirect to="/finance-dashboard" /></RoleRoute></Route>
      <Route path="/erp-finance"><RoleRoute roles={FINANCE_ROLES}><Redirect to="/finance-dashboard" /></RoleRoute></Route>
      <Route path="/fi/dashboard"><RoleRoute roles={FINANCE_ROLES}><Redirect to="/finance-dashboard" /></RoleRoute></Route>
      <Route path="/cfo-dashboard"><RoleRoute roles={FINANCE_ROLES}><Redirect to="/cfo/dashboard" /></RoleRoute></Route>
      <Route path="/accounting/payroll"><RoleRoute roles={FINANCE_ROLES}><Redirect to="/accounting/payroll-automation" /></RoleRoute></Route>
      <Route path="/integration/shift-scheduling"><RoleRoute roles={ADMIN_ROLES}><Redirect to="/shift-schedule" /></RoleRoute></Route>
      <Route path="/erp-cameras"><RoleRoute roles={CAMERA_ROLES}><Redirect to="/camera-dashboard" /></RoleRoute></Route>
      <Route path="/erp/cameras/reports"><RoleRoute roles={CAMERA_ROLES}><Redirect to="/camera-reports" /></RoleRoute></Route>
      <Route path="/erp/cameras/heatmap"><RoleRoute roles={CAMERA_ROLES}><Redirect to="/camera-heatmap" /></RoleRoute></Route>
      <Route path="/security/dashboard"><RoleRoute roles={CAMERA_ROLES}><Redirect to="/security" /></RoleRoute></Route>
      <Route path="/sales"><RoleRoute roles={SALES_ROLES}><Redirect to="/sd/dashboard" /></RoleRoute></Route>
      <Route path="/crm"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/dashboard"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/leads"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/deals"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/contacts"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/companies"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/proposals"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/crm/invoices"><RoleRoute roles={SALES_ROLES}><Redirect to="/crm-workspace" /></RoleRoute></Route>
      <Route path="/erp/planning"><RoleRoute roles={PRODUCTION_ROLES}><Redirect to="/planning?tab=plans" /></RoleRoute></Route>
      <Route path="/erp/pp/mrp"><RoleRoute roles={PRODUCTION_ROLES}><Redirect to="/planning?tab=mrp" /></RoleRoute></Route>
      {/* Legacy redirects — eski URL'lar yangi sahifalarga yo'naltirilgan.
       *  Sidebar endi to'g'ridan-to'g'ri yangi URL'ga ishora qiladi, lekin
       *  eski bookmark'lar ishlashi uchun redirect'lar saqlangan. */}
      <Route path="/tech/dashboard"><RoleRoute roles={PRODUCTION_ROLES}><Redirect to="/tech/dashboard-home" /></RoleRoute></Route>
      <Route path="/iot/live"><RoleRoute roles={IOT_ROLES}><Redirect to="/iot/dashboard" /></RoleRoute></Route>
      <Route path="/europrint/director"><RoleRoute roles={DIRECTOR_ROLES}><Redirect to="/" /></RoleRoute></Route>
      <Route path="/qc/dashboard"><RoleRoute roles={QC_ROLES}><Redirect to="/qc/dashboard-home" /></RoleRoute></Route>
      {/* /qc/tests, /qc/parameters, /qc/standards endi QCModule'ga to'g'ridan-to'g'ri
       *  registratsiya qilingan (ProductionRoutes.tsx) — redirect kerak emas. */}
      <Route path="/succession-planning"><RoleRoute roles={HR_ROLES}><Redirect to="/hr/succession-planning" /></RoleRoute></Route>
      <Route path="/feedback"><Redirect to="/kanban" /></Route>
      <Route path="/logout"><Redirect to="/login" /></Route>

      {/* ── Order Workflow (Sprint 4) ── */}
      <Route path="/order-workflow">
        <RoleRoute roles={[...DIRECTOR_ROLES, ...SALES_ROLES, ...PRODUCTION_ROLES, ...FINANCE_ROLES]}>
          <ErrorBoundary><Suspense fallback={<PageLoader />}><OrderWorkflowPage /></Suspense></ErrorBoundary>
        </RoleRoute>
      </Route>

      {/* ── Chat ── */}
      <Route path="/chat">
        <RoleRoute roles={ALL_AUTHENTICATED}>
          <ErrorBoundary><Suspense fallback={<PageLoader />}><ChatPage /></Suspense></ErrorBoundary>
        </RoleRoute>
      </Route>
      <Route path="/chat/admin">
        <RoleRoute roles={["admin", "director"]}>
          <ErrorBoundary><Suspense fallback={<PageLoader />}><ChatAdminPage /></Suspense></ErrorBoundary>
        </RoleRoute>
      </Route>

      {/* ── 404 ── */}
      {!isKnownPath && <NotFound />}
    </>
  );
}
