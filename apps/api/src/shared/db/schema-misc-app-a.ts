/**
 * @module schema-misc-app-a
 * @description Source module. See exports for details.
 */

import {
  pgTable, integer, text, boolean, timestamp, varchar, date, serial, customType,
} from 'drizzle-orm/pg-core';
import { departments as canonicalDepartments, positions as canonicalPositions } from './schema-hr-lms';

const pgVector = (name: string, dim: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dim})`,
    toDriver: (val: number[]) => `[${val.join(',')}]`,
    fromDriver: (val: string) => val.slice(1, -1).split(',').map((s) => Number(s.trim())),
  })(name);


export const appUsers = pgTable('users', {
  id: integer('id').primaryKey(),
  username: varchar('username'),
  email: varchar('email'),
  first_name: varchar('first_name'),
  last_name: varchar('last_name'),
  full_name: varchar('full_name'),
  profile_image_url: text('profile_image_url'),
  phone: varchar('phone'),
  is_active: boolean('is_active'),
  status: varchar('status'),
  department_id: integer('department_id'),
  position_id: integer('position_id'),
  employee_id: integer('employee_id'),
  birth_date: timestamp('birth_date'),
  deleted_at: timestamp('deleted_at'),
});

export const hrEmployees = pgTable('employees', {
  id:                integer('id').primaryKey(),
  user_id:           integer('user_id'),
  employee_code:     varchar('employee_code'),
  first_name:        varchar('first_name'),
  last_name:         varchar('last_name'),
  middle_name:       varchar('middle_name'),
  department_id:     integer('department_id'),
  position_id:       integer('position_id'),
  status:            varchar('status'),
  employment_status: varchar('employment_status'),
  employment_type:   varchar('employment_type'),
  is_active:         boolean('is_active'),
  is_blocked:        boolean('is_blocked').default(false),
  blocked_reason:    text('blocked_reason'),
  telegram_chat_id:  varchar('telegram_chat_id'),
  hire_date:         date('hire_date'),
  base_salary:       text('base_salary'),
  phone_number:      varchar('phone_number'),
  email_work:        varchar('email_work'),
  gender:            varchar('gender'),
  date_of_birth:     date('date_of_birth'),
  birth_date:        date('birth_date'),
  manager_id:        integer('manager_id'),
  photo_url:                   text('photo_url'),
  role:                        varchar('role'),
  total_points:                integer('total_points').default(0),
  face_embedding:              pgVector('face_embedding', 512),
  face_embedding_updated_at:   timestamp('face_embedding_updated_at'),
  created_at:                  timestamp('created_at'),
  updated_at:                  timestamp('updated_at'),
  deleted_at:                  timestamp('deleted_at'),
});

// hrPositions / hrDepartments: re-exported from canonical schema-hr-lms.ts.
// Legacy snake_case columns (parent_id, manager_id, is_active) are not present
// on the canonical schema — consumers referencing those need to migrate to
// camelCase or fix the column shape upstream.
export const hrPositions = canonicalPositions;
export const hrDepartments = canonicalDepartments;

export const shiftSchedules = pgTable('shift_schedules', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  shift_date: date('shift_date'),
  shift_type: varchar('shift_type'),
  start_time: varchar('start_time'),
  end_time: varchar('end_time'),
  status: varchar('status'),
  notes: text('notes'),
  created_at: timestamp('created_at'),
  user_id: varchar('user_id'),
  created_by: varchar('created_by'),
});

export const leaveRequestsApp = pgTable('leave_requests', {
  id:               integer('id').primaryKey(),
  employee_id:      integer('employee_id'),
  leave_type:       varchar('leave_type'),
  start_date:       date('start_date'),
  end_date:         date('end_date'),
  duration_days:    integer('duration_days'),
  status:           varchar('status'),
  reason:           text('reason'),
  user_id:          integer('user_id'),
  submitted_by:     integer('submitted_by'),
  submitted_date:   timestamp('submitted_date'),
  manager_status:   varchar('manager_status'),
  manager_notes:    text('manager_notes'),
  hr_status:        varchar('hr_status'),
  hr_notes:         text('hr_notes'),
  director_status:  varchar('director_status'),
  director_notes:   text('director_notes'),
  created_at:       timestamp('created_at'),
  updated_at:       timestamp('updated_at'),
  deleted_at:       timestamp('deleted_at'),
});

export const orgDepartments = pgTable('org_departments', {
  id: serial('id').primaryKey(),
  name: text('name'),
  name_ru: text('name_ru'),
  parent_id: integer('parent_id'),
  level: integer('level'),
  head_user_id: integer('head_user_id'),
  sort_order: integer('sort_order'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at'),
  color: varchar('color'),
  description: text('description'),
  description_ru: text('description_ru'),
  tskp: text('tskp'),
  tskp_ru: text('tskp_ru'),
  node_type: varchar('node_type'),
});

export const employeeOrgDepartments = pgTable('employee_org_departments', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  org_department_id: integer('org_department_id'),
  is_primary: boolean('is_primary'),
  assigned_at: timestamp('assigned_at'),
});

export { chatMessages, chatMembers, chatRooms } from './schema-chat';
