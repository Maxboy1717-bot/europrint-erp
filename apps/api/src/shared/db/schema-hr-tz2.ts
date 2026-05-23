/**
 * schema-hr-tz2.ts — HR Foundation tables for NestJS shared DB layer
 *
 * Mirrors the Drizzle schema defined in lib/db/src/schema/hr-tz2-schema.ts
 * but lives here so NestJS services can import from @shared/db.
 *
 * Tables:
 *   hr_tz2_territory_logs    — Employee territory entry/exit events from cameras
 *   hr_tz2_attendance_photos — AI camera snapshot analysis results (every 2h)
 */

import {
  pgTable,
  uuid,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// ─────────────────────────────────────────────────────────────────────────────
// 1. hr_tz2_territory_logs — camera entry/exit events per employee
// ─────────────────────────────────────────────────────────────────────────────

export const hr_tz2_territory_logs = pgTable(
  'hr_tz2_territory_logs',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    employee_id:    integer('employee_id'),
    event_type:     varchar('event_type', { length: 30 }).notNull(),
    camera_id:      text('camera_id'),
    ts:             timestamp('ts').notNull(),
    face_confidence: numeric('face_confidence', { precision: 5, scale: 2 }),
    room_code:      varchar('room_code', { length: 50 }),
    created_at:     timestamp('created_at').notNull().defaultNow(),
    updated_at:     timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('hrtz2_territory_emp_ts_idx').on(t.employee_id, t.ts),
    index('hrtz2_territory_event_idx').on(t.event_type),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. hr_tz2_attendance_photos — AI photo analysis every 2 hours
// ─────────────────────────────────────────────────────────────────────────────

type AttendancePhotoAnalysis = {
  emotion: string;
  fatigue_score: number;
  posture_score: number;
  anomaly: boolean;
  anomaly_reason?: string;
};

export const hr_tz2_attendance_photos = pgTable(
  'hr_tz2_attendance_photos',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    employee_id:     integer('employee_id').notNull(),
    photo_url:       text('photo_url').notNull(),
    taken_at:        timestamp('taken_at').notNull(),
    room_code:       varchar('room_code', { length: 50 }),
    analysis_result: jsonb('analysis_result').$type<AttendancePhotoAnalysis>(),
    processed:       boolean('processed').notNull().default(false),
    created_at:      timestamp('created_at').notNull().defaultNow(),
    updated_at:      timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('hrtz2_photos_emp_taken_idx').on(t.employee_id, t.taken_at),
    index('hrtz2_photos_processed_idx').on(t.processed),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. hr_tz2_room_reference_photos — ideal room state photos for inspection
// ─────────────────────────────────────────────────────────────────────────────

export const hr_tz2_room_reference_photos = pgTable(
  'hr_tz2_room_reference_photos',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    room_code:       varchar('room_code', { length: 50 }).notNull().unique(),
    room_name:       varchar('room_name', { length: 200 }).notNull(),
    department_code: varchar('department_code', { length: 50 }),
    photo_url:       text('photo_url').notNull(),
    description:     text('description'),
    last_updated_at: timestamp('last_updated_at'),
    updated_by:      text('updated_by'),
    created_at:      timestamp('created_at').notNull().defaultNow(),
    updated_at:      timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('hrtz2_room_ref_code_idx2').on(t.room_code)],
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. hr_tz2_ai_room_analysis — AI room comparison results (every 2 hours)
// ─────────────────────────────────────────────────────────────────────────────

type RoomAnomaly = {
  type: string;
  description: string;
  severity: string;
};

export const hr_tz2_ai_room_analysis = pgTable(
  'hr_tz2_ai_room_analysis',
  {
    id:                  uuid('id').primaryKey().defaultRandom(),
    room_code:           varchar('room_code', { length: 50 }).notNull(),
    reference_photo_id:  uuid('reference_photo_id').references(
      () => hr_tz2_room_reference_photos.id,
      { onDelete: 'set null' },
    ),
    current_photo_url:   text('current_photo_url').notNull(),
    analyzed_at:         timestamp('analyzed_at').notNull(),
    cleanliness_score:   numeric('cleanliness_score', { precision: 5, scale: 2 }),
    order_score:         numeric('order_score', { precision: 5, scale: 2 }),
    equipment_ok:        boolean('equipment_ok'),
    issues:              jsonb('issues').$type<string[]>(),
    anomalies:           jsonb('anomalies').$type<RoomAnomaly[]>(),
    pdf_url:             text('pdf_url'),
    notified_hr:         boolean('notified_hr').notNull().default(false),
    created_at:          timestamp('created_at').notNull().defaultNow(),
    updated_at:          timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('hrtz2_room_analysis_code_idx2').on(t.room_code),
    index('hrtz2_room_analysis_at_idx2').on(t.analyzed_at),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. hr_tz2_daily_attendance — camera-based territory check-in/out per day
// ─────────────────────────────────────────────────────────────────────────────

export const hr_tz2_daily_attendance = pgTable(
  'hr_tz2_daily_attendance',
  {
    id:                   serial('id').primaryKey(),
    employee_id:          integer('employee_id').notNull(),
    date:                 varchar('date', { length: 10 }).notNull(),
    check_in_territory:   timestamp('check_in_territory'),
    check_out_territory:  timestamp('check_out_territory'),
    status:               varchar('status', { length: 20 }).default('present'),
    created_at:           timestamp('created_at').notNull().defaultNow(),
    updated_at:           timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('hrtz2_daily_emp_date_idx').on(t.employee_id, t.date),
  ],
);
