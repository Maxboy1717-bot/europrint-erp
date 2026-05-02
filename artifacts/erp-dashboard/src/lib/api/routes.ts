export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    changePassword: '/api/auth/change-password',
  },
  admin: {
    settings: '/api/admin/settings',
    users: '/api/admin/users',
    userRole: (id: number) => `/api/admin/users/${id}/role`,
    user: (id: number) => `/api/admin/users/${id}`,
  },
  director: {
    approvals: '/api/director/approvals',
    approve: (id: number) => `/api/director/approvals/${id}/approve`,
    reject: (id: number) => `/api/director/approvals/${id}/reject`,
  },
  okr: {
    objectives: '/api/okr/objectives',
    objective: (id: number) => `/api/okr/objectives/${id}`,
    keyResults: '/api/okr/key-results',
    keyResult: (id: number) => `/api/okr/key-results/${id}`,
  },
  hr: {
    employees: '/api/hr/employees',
    employee: (id: number) => `/api/hr/employees/${id}`,
    attendance: '/api/hr/attendance',
  },
  finance: {
    advances: '/api/finance/advances',
    reports: '/api/finance/reports',
    accounting: '/api/finance/accounting',
  },
  mes: {
    orders: '/api/mes/orders',
    order: (id: number) => `/api/mes/orders/${id}`,
    shifts: '/api/mes/shifts',
    maintenance: '/api/mes/maintenance',
  },
  wms: {
    warehouses: '/api/wms/warehouses',
    stock: '/api/wms/stock',
    movements: '/api/wms/movements',
  },
  qc: {
    defects: '/api/qc/defects',
    approvals: '/api/qc/approvals',
  },
  iot: {
    sensors: '/api/iot/sensors',
    telemetry: '/api/iot/telemetry',
  },
} as const;
