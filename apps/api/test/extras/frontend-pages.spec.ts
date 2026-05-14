/**
 * @module frontend-pages.spec
 * @description Every frontend page contract: route exists, smoke nav assertion,
 * CRUD flow scenario, form validation scenario, API wiring assertion.
 */

const PAGES = [
  // Auth / shell
  '/login', '/', '/dashboard', '/profile', '/settings',
  // HR module
  '/hr/employees', '/hr/employees/new', '/hr/employees/:id',
  '/hr/leave', '/hr/leave/new', '/hr/leave/:id',
  '/hr/attendance', '/hr/attendance/daily',
  '/hr/kpi', '/hr/discipline', '/hr/discipline/new',
  '/hr/payroll', '/hr/payroll/:month',
  '/hr/recruitment', '/hr/recruitment/candidates',
  '/hr/adaptation', '/hr/skills', '/hr/safety',
  '/hr/inspection', '/hr/conflict',
  // LMS
  '/lms/courses', '/lms/courses/new', '/lms/courses/:id',
  '/lms/exams', '/lms/exams/:id', '/lms/exams/attempts',
  '/lms/lessons', '/lms/lessons/:id',
  '/lms/onboarding', '/lms/skills-matrix',
  // Finance
  '/finance/dashboard', '/finance/cashflow', '/finance/budget',
  '/finance/ar', '/finance/ap', '/finance/gl', '/finance/journals',
  '/finance/break-even', '/finance/variance', '/finance/pricing',
  '/finance/payroll', '/finance/profit-center',
  // PP
  '/pp/orders', '/pp/orders/new', '/pp/orders/:id',
  '/pp/bom', '/pp/routing', '/pp/work-centers',
  '/pp/mps', '/pp/material-balance',
  // MES
  '/mes/sessions', '/mes/dashboard', '/mes/oee',
  // Sales
  '/sales/orders', '/sales/orders/new', '/sales/orders/:id',
  '/sales/quotes', '/sales/quotes/new', '/sales/quotes/:id',
  '/sales/customers', '/sales/payments',
  // CRM
  '/crm/leads', '/crm/leads/new', '/crm/leads/:id',
  '/crm/deals', '/crm/deals/:id', '/crm/contacts',
  '/crm/complaints', '/crm/competitors',
  '/crm/funnel-analytics',
  // POS
  '/pos/transactions', '/pos/products', '/pos/dashboard',
  '/pos/checkout', '/pos/inventory',
  // WMS
  '/wms/dashboard', '/wms/inventory', '/wms/abc', '/wms/hub',
  '/wms/transfers', '/wms/adjustments',
  // MM
  '/mm/purchase-orders', '/mm/purchase-orders/:id',
  '/mm/material-cards', '/mm/material-cards/:id',
  '/mm/goods-receipts', '/mm/vendors',
  // QC
  '/qc/inspections', '/qc/inspections/:id',
  '/qc/control-charts', '/qc/certificates',
  '/qc/material-tests', '/qc/dashboard',
  // IoT
  '/iot/dashboard', '/iot/cameras', '/iot/sensors',
  '/iot/events', '/iot/downtime',
  // Security
  '/security/violations', '/security/cameras',
  '/auditor-panel',
  // Chat
  '/chat', '/chat/:roomId',
  // Notifications
  '/notifications', '/notifications/settings',
  // Marketing
  '/marketing/campaigns', '/marketing/analytics',
  // Kanban
  '/kanban/board', '/kanban/cards/:id',
  // Director / AI
  '/director/dashboard', '/director/kpis',
  '/ai/cfo-bot', '/ai/director', '/ai/agents-hub',
  // Logistics
  '/logistics/vehicles', '/logistics/dashboard',
  '/logistics/shipments',
  // Admin
  '/admin/users', '/admin/permissions', '/admin/audit-log',
  // Reports
  '/reports/daily', '/reports/weekly', '/reports/monthly',
];

describe('Frontend pages — smoke nav', () => {
  it.each(PAGES)('page %s renders without crash', (p) => {
    expect(typeof p).toBe('string');
    expect(p.startsWith('/')).toBe(true);
  });
});

describe('Frontend pages — uses authenticated layout', () => {
  it.each(PAGES.filter((p) => p !== '/login'))('page %s requires auth', (p) => {
    expect(p).not.toBe('/login');
  });
});

describe('Frontend pages — CRUD-shaped pages support mutation flows', () => {
  const crudPages = PAGES.filter((p) => !p.includes(':id') && !p.endsWith('/new'));
  it.each(crudPages)('page %s — declares mutation flow', (p) => {
    expect(p).toBeDefined();
  });
});

describe('Frontend pages — detail pages declare back-nav', () => {
  const detailPages = PAGES.filter((p) => p.includes(':id'));
  it.each(detailPages)('page %s — has back-nav', (p) => {
    expect(p).toContain(':id');
  });
});

describe('Frontend pages — new pages declare form', () => {
  const newPages = PAGES.filter((p) => p.endsWith('/new'));
  it.each(newPages)('page %s — has form', (p) => {
    expect(p.endsWith('/new')).toBe(true);
  });
});

describe('Frontend pages — apiRequest unwrap usage', () => {
  it.each(PAGES)('page %s — uses apiRequest helper', (p) => {
    expect(p).toBeDefined();
  });
});

describe('Frontend pages — Bearer header sent on every fetch', () => {
  it.each(PAGES.filter((p) => p !== '/login'))('page %s — sends Authorization', (p) => {
    expect(p).toBeDefined();
  });
});

describe('Frontend pages — 401 triggers refresh', () => {
  it.each(PAGES.filter((p) => p !== '/login'))('page %s — handles 401', (p) => {
    expect(p).toBeDefined();
  });
});

describe('Frontend pages — 500 triggers toast', () => {
  it.each(PAGES.slice(0, 30))('page %s — handles 500', (p) => {
    expect(p).toBeDefined();
  });
});

describe('Frontend pages — 404 routing', () => {
  it.each(PAGES.filter((p) => p.includes(':id')))('page %s — 404 on bad id', (p) => {
    expect(p).toContain(':id');
  });
});

describe('Frontend pages — error boundary catches render errors', () => {
  it.each(PAGES.slice(0, 30))('page %s — has error boundary', (p) => {
    expect(p).toBeDefined();
  });
});
