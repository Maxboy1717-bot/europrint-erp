/**
 * @module schema-hr-overtime
 * @description Canonical definitions live in lib/db/src/schema/hr-overtime-schema.ts
 * Re-exported here for backward compatibility with apps/api consumers.
 *
 * Tables: overtime_policy, employee_separation
 */

// Canonical definitions sourced from @workspace/db — do NOT redefine here.
export {
  overtimePolicy,
  employeeSeparation,
  insertOvertimePolicySchema,
  insertEmployeeSeparationSchema,
} from '@workspace/db';
export type {
  OvertimePolicy,
  InsertOvertimePolicy,
  EmployeeSeparation,
  InsertEmployeeSeparation,
} from '@workspace/db';

// Snake_case aliases for legacy callers
export {
  overtimePolicy    as overtime_policy,
  employeeSeparation as employee_separation,
} from '@workspace/db';
