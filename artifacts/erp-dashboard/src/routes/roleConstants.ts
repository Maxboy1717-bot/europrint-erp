/**
 * @module roleConstants
 * @description Frontend route definition.
 */

export const ALL_AUTHENTICATED = [
  'employee', 'hr', 'hr_manager', 'finance', 'finance_manager', 'cfo',
  'accountant', 'manager', 'director', 'warehouse', 'warehouse_manager',
  'production', 'production_manager', 'pp_manager', 'qc_manager', 'sales',
  'it', 'lms_manager', 'admin', 'super_admin',
];
export const HR_ROLES = ['hr', 'hr_manager', 'admin', 'director', 'manager'];
export const FINANCE_ROLES = ['finance', 'finance_manager', 'cfo', 'accountant', 'admin'];
export const WAREHOUSE_ROLES = ['warehouse', 'warehouse_manager', 'admin', 'manager'];
export const PRODUCTION_ROLES = ['production', 'production_manager', 'pp_manager', 'admin', 'manager'];
export const SALES_ROLES = ['sales', 'admin', 'manager', 'director'];
export const QC_ROLES = ['qc_manager', 'production_manager', 'admin', 'manager'];
export const ADMIN_ROLES = ['admin', 'super_admin'];
export const DIRECTOR_ROLES = ['director', 'admin', 'super_admin', 'manager'];
export const CAMERA_ROLES = ['admin', 'manager', 'director'];
export const IOT_ROLES = ['production', 'production_manager', 'admin', 'manager'];
export const DESIGN_ROLES = ['admin', 'manager', 'director'];
export const MRO_ROLES = ['admin', 'manager', 'warehouse_manager'];
export const MARKETING_ROLES = ['admin', 'manager', 'director'];
export const SAAS_ROLES = ['admin', 'super_admin'];
export const LMS_ADMIN_ROLES = ['admin', 'lms_manager', 'hr_manager'];
export const AI_HR_ROLES = ['admin', 'hr_manager'];
