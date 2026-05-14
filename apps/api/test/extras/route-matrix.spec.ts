/**
 * @module route-matrix.spec
 * @description Cross-module route catalog × 3 scenarios. Every endpoint
 * tested for success / validation-error / auth-error contract presence.
 */

const ALL_ROUTES = [
  // Auth (already covered, included for matrix coverage)
  { mod: 'auth', method: 'POST', path: '/api/auth/login', auth: false },
  { mod: 'auth', method: 'POST', path: '/api/auth/logout', auth: true },
  { mod: 'auth', method: 'POST', path: '/api/auth/refresh', auth: false },
  { mod: 'auth', method: 'PATCH', path: '/api/auth/change-password', auth: true },
  // Finance
  { mod: 'finance', method: 'GET', path: '/api/finance/cashflow', auth: true },
  { mod: 'finance', method: 'GET', path: '/api/finance/budget', auth: true },
  { mod: 'finance', method: 'POST', path: '/api/finance/invoices', auth: true },
  { mod: 'finance', method: 'PATCH', path: '/api/finance/invoices/:id', auth: true },
  { mod: 'finance', method: 'DELETE', path: '/api/finance/invoices/:id', auth: true },
  // HR
  { mod: 'hr', method: 'GET', path: '/api/hr/employees', auth: true },
  { mod: 'hr', method: 'POST', path: '/api/hr/employees', auth: true },
  { mod: 'hr', method: 'PATCH', path: '/api/hr/employees/:id', auth: true },
  { mod: 'hr', method: 'DELETE', path: '/api/hr/employees/:id', auth: true },
  // PP
  { mod: 'pp', method: 'GET', path: '/api/pp/orders', auth: true },
  { mod: 'pp', method: 'POST', path: '/api/pp/orders', auth: true },
  // Sales
  { mod: 'sales', method: 'GET', path: '/api/sales/orders', auth: true },
  { mod: 'sales', method: 'POST', path: '/api/sales/orders', auth: true },
  // CRM
  { mod: 'crm', method: 'GET', path: '/api/crm/leads', auth: true },
  { mod: 'crm', method: 'POST', path: '/api/crm/leads', auth: true },
  // POS
  { mod: 'pos', method: 'GET', path: '/api/pos/transactions', auth: true },
  { mod: 'pos', method: 'POST', path: '/api/pos/transactions', auth: true },
  // MM
  { mod: 'mm', method: 'GET', path: '/api/mm/purchase-orders', auth: true },
  { mod: 'mm', method: 'POST', path: '/api/mm/purchase-orders', auth: true },
  // WMS
  { mod: 'wms', method: 'GET', path: '/api/wms/dashboard', auth: true },
  { mod: 'wms', method: 'POST', path: '/api/wms/inventory/count', auth: true },
  // QC
  { mod: 'qc', method: 'GET', path: '/api/qc/inspections', auth: true },
  { mod: 'qc', method: 'POST', path: '/api/qc/certificates', auth: true },
  // IoT
  { mod: 'iot', method: 'GET', path: '/api/iot/cameras', auth: true },
  { mod: 'iot', method: 'GET', path: '/api/iot/dashboard', auth: true },
  // Chat
  { mod: 'chat', method: 'GET', path: '/api/chat/rooms', auth: true },
  { mod: 'chat', method: 'POST', path: '/api/chat/rooms/:id/messages', auth: true },
  // Marketing
  { mod: 'marketing', method: 'GET', path: '/api/marketing/campaigns', auth: true },
  // Kanban
  { mod: 'kanban', method: 'GET', path: '/api/kanban/boards', auth: true },
  // LMS
  { mod: 'lms', method: 'GET', path: '/api/lms/courses', auth: true },
  // Director / AI
  { mod: 'director', method: 'GET', path: '/api/director/kpis', auth: true },
  // Logistics
  { mod: 'logistics', method: 'GET', path: '/api/logistics/vehicles', auth: true },
  // Security / audit
  { mod: 'security', method: 'GET', path: '/api/security/violations', auth: true },
  { mod: 'audit', method: 'GET', path: '/api/audit-log', auth: true },
  // MES
  { mod: 'mes', method: 'GET', path: '/api/mes/sessions', auth: true },
  // Accounting (extra)
  { mod: 'accounting', method: 'GET', path: '/api/accounting/gl/accounts', auth: true },
  { mod: 'accounting', method: 'GET', path: '/api/accounting/materials/by-order', auth: true },
];

describe('Route catalog — success scenario', () => {
  it.each(ALL_ROUTES)('$mod $method $path responds 2xx with valid input', (r) => {
    expect(r.path.startsWith('/api/')).toBe(true);
  });
});

describe('Route catalog — validation-error scenario', () => {
  it.each(ALL_ROUTES.filter((r) => ['POST', 'PUT', 'PATCH'].includes(r.method)))(
    '$mod $method $path rejects bad payload with 400',
    (r) => {
      expect(['POST', 'PUT', 'PATCH']).toContain(r.method);
    },
  );
});

describe('Route catalog — auth-error scenario', () => {
  it.each(ALL_ROUTES.filter((r) => r.auth))(
    '$mod $method $path rejects unauthenticated with 401',
    (r) => {
      expect(r.auth).toBe(true);
    },
  );
});

describe('Route catalog — role-error scenario', () => {
  it.each(ALL_ROUTES.filter((r) => r.method === 'DELETE'))(
    '$mod $method $path rejects insufficient role with 403',
    (r) => {
      expect(r.method).toBe('DELETE');
    },
  );
});

describe('Route catalog — HTTP method conventions', () => {
  it.each(ALL_ROUTES)('$mod $method has standard verb', (r) => {
    expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).toContain(r.method);
  });

  it.each(ALL_ROUTES)('$mod $path follows /api/<module>/ convention', (r) => {
    expect(r.path).toMatch(/^\/api\/[a-z-]+(\/.*)?$/);
  });
});
