const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  admin: '/',
  super_admin: '/',
  director: '/',
  manager: '/',
  hr: '/hr',
  hr_manager: '/hr',
  finance: '/finance',
  finance_manager: '/finance',
  cfo: '/finance',
  accountant: '/finance',
  sales: '/crm-workspace',
  production: '/planning',
  production_manager: '/planning',
  pp_manager: '/planning',
  warehouse: '/warehouse',
  warehouse_manager: '/warehouse',
  qc_manager: '/qc-module',
  it: '/settings',
  lms_manager: '/lms',
  employee: '/hr',
};

export function getDefaultRouteForRole(role: string): string {
  return ROLE_DEFAULT_ROUTES[role] ?? '/';
}
