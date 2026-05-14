/**
 * @module roles.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

// §7 - 11 rol va huquqlar

export enum Role {
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
  SALES_MANAGER = 'sales_manager',
  DESIGNER = 'designer',
  TECHNOLOGIST = 'technologist',
  OPERATOR = 'operator',
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  QC_SPECIALIST = 'qc_specialist',
  FINANCE = 'finance',
  HR_SPECIALIST = 'hr_specialist',
  DRIVER = 'driver',
  FINANCE_MANAGER = 'finance_manager',
  HR_MANAGER = 'hr_manager',
  PRODUCTION_MANAGER = 'production_manager',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
}

export const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR]

export const FINANCE_ROLES = [Role.FINANCE, Role.FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR]

export const PRODUCTION_ROLES = [
  Role.OPERATOR,
  Role.TECHNOLOGIST,
  Role.QC_SPECIALIST,
  Role.PRODUCTION_MANAGER,
  Role.SUPER_ADMIN,
  Role.DIRECTOR,
]

export const WAREHOUSE_ROLES = [
  Role.WAREHOUSE_KEEPER,
  Role.SUPER_ADMIN,
  Role.DIRECTOR,
]

export const SALES_ROLES = [
  Role.SALES_MANAGER,
  Role.DESIGNER,
  Role.SUPER_ADMIN,
  Role.DIRECTOR,
]

export const HR_ROLES = [Role.HR_SPECIALIST, Role.HR_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR]

export const LOGISTICS_ROLES = [Role.DRIVER, Role.SUPER_ADMIN, Role.DIRECTOR]

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Barcha tizimga to'liq kirish",
  [Role.DIRECTOR]: 'Kompaniya direktori',
  [Role.SALES_MANAGER]: 'Sotuvlar menedzheri',
  [Role.DESIGNER]: 'Dizayner',
  [Role.TECHNOLOGIST]: 'Texnolog',
  [Role.OPERATOR]: 'Operator',
  [Role.WAREHOUSE_KEEPER]: 'Ombor noziri',
  [Role.QC_SPECIALIST]: 'Sifat nazorati mutaxassisi',
  [Role.FINANCE]: 'Moliya mutaxassisi',
  [Role.FINANCE_MANAGER]: 'Moliya menedzheri',
  [Role.HR_SPECIALIST]: 'HR mutaxassisi',
  [Role.HR_MANAGER]: 'HR menedzheri',
  [Role.DRIVER]: 'Haydovchi',
  [Role.PRODUCTION_MANAGER]: 'Ishlab chiqarish menedzheri',
  [Role.EMPLOYEE]: 'Xodim',
  [Role.MANAGER]: 'Menejer',
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: [
    'all:create',
    'all:read',
    'all:update',
    'all:delete',
    'system:manage',
  ],
  [Role.DIRECTOR]: [
    'all:create',
    'all:read',
    'all:update',
    'reports:view',
    'users:manage',
  ],
  [Role.SALES_MANAGER]: [
    'lead:create',
    'lead:read',
    'lead:update',
    'deal:create',
    'deal:read',
    'deal:update',
    'order:read',
  ],
  [Role.DESIGNER]: ['order:read', 'design:create', 'design:update'],
  [Role.TECHNOLOGIST]: ['order:read', 'tech:create', 'tech:update'],
  [Role.OPERATOR]: ['order:read', 'mes:read', 'production:update'],
  [Role.WAREHOUSE_KEEPER]: [
    'warehouse:read',
    'warehouse:update',
    'stock:read',
  ],
  [Role.QC_SPECIALIST]: ['qc:create', 'qc:read', 'qc:update'],
  [Role.FINANCE]: [
    'invoice:read',
    'invoice:create',
    'payment:read',
    'payment:update',
  ],
  [Role.FINANCE_MANAGER]: [
    'invoice:read',
    'invoice:create',
    'invoice:update',
    'payment:read',
    'payment:update',
    'budget:manage',
  ],
  [Role.HR_SPECIALIST]: ['payroll:read', 'payroll:create', 'employees:read'],
  [Role.HR_MANAGER]: [
    'payroll:read',
    'payroll:create',
    'payroll:update',
    'employees:read',
    'employees:manage',
    'hr:manage',
  ],
  [Role.DRIVER]: ['delivery:read', 'delivery:update'],
  [Role.PRODUCTION_MANAGER]: [
    'order:read',
    'mes:read',
    'mes:manage',
    'production:read',
    'production:update',
    'production:manage',
  ],
  [Role.EMPLOYEE]: ['profile:read', 'profile:update'],
  [Role.MANAGER]: ['all:read', 'reports:view'],
}
