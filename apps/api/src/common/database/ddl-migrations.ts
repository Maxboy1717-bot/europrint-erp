/**
 * @module ddl-migrations
 * @description Source module. See exports for details.
 */

import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

export async function ensureOtpTables(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS otp_sessions (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await ddlRun(sql`CREATE INDEX IF NOT EXISTS idx_otp_sessions_identifier ON otp_sessions(identifier)`);
  await ddlRun(sql`ALTER TABLE otp_sessions ADD COLUMN IF NOT EXISTS session_id UUID NOT NULL DEFAULT gen_random_uuid()`);
  await ddlRun(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_sessions_session_id ON otp_sessions(session_id)`);
}

export async function ensureHrAssetsTables(): Promise<void> {
  // NOTE: P3-30 — literal CREATE TABLE DDL for `employee_assets`; no user input.
  await ddlRun(sql.raw(`
    CREATE TABLE IF NOT EXISTS employee_assets (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      asset_id TEXT NOT NULL,
      employee_id TEXT,
      assigned_date TEXT NOT NULL,
      return_date TEXT,
      condition_on_assign TEXT NOT NULL DEFAULT 'good',
      condition_on_return TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `));
  // NOTE: P3-30 — literal CREATE INDEX DDL for `employee_assets.asset_id`; no user input.
  await ddlRun(sql.raw(`CREATE INDEX IF NOT EXISTS employee_assets_asset_id_idx ON employee_assets(asset_id)`));
  // NOTE: P3-30 — literal CREATE INDEX DDL for `employee_assets.employee_id`; no user input.
  await ddlRun(sql.raw(`CREATE INDEX IF NOT EXISTS employee_assets_employee_id_idx ON employee_assets(employee_id)`));
}

export async function ensureChatTables(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id SERIAL PRIMARY KEY,
      name TEXT,
      type TEXT NOT NULL DEFAULT 'direct',
      department_id INTEGER REFERENCES org_departments(id) ON DELETE SET NULL,
      created_by INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      id SERIAL PRIMARY KEY,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      last_read_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL,
      content TEXT,
      file_url TEXT,
      file_name TEXT,
      file_type TEXT,
      message_type TEXT DEFAULT 'text',
      is_deleted BOOLEAN DEFAULT FALSE,
      is_edited BOOLEAN DEFAULT FALSE,
      is_pinned BOOLEAN DEFAULT FALSE,
      reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
      thread_root_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
      forward_from_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
      thread_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_reactions (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(message_id, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS chat_polls (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options JSONB NOT NULL DEFAULT '[]',
      is_multiple BOOLEAN DEFAULT FALSE,
      is_anonymous BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_poll_votes (
      id SERIAL PRIMARY KEY,
      poll_id INTEGER NOT NULL REFERENCES chat_polls(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL,
      option_index INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(poll_id, user_id, option_index)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_members_room_id ON chat_members(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);
    CREATE INDEX IF NOT EXISTS idx_chat_poll_votes_poll_id ON chat_poll_votes(poll_id);
  `);

  // Ensure all columns that the Drizzle schema expects actually exist (idempotent ALTERs)
  const columnMigrations = [
    // chat_rooms extras
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS last_message_text TEXT`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS context_type TEXT`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS context_id TEXT`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0`,
    `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS last_message_id TEXT`,
    // chat_members extras
    `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0`,
    `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ`,
    `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ`,
    `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ`,
    `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_read_message_id TEXT`,
    // chat_messages extras
    `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS text TEXT`,
    `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS mentioned_user_ids JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS client_msg_id TEXT`,
  ];
  for (const m of columnMigrations) {
    // NOTE: P3-30 — `m` is iterated from the local `columnMigrations` literal-string array above (ALTER TABLE … ADD COLUMN IF NOT EXISTS DDL); no user input.
    try { await ddlRun(sql.raw(m)); } catch { /* already exists */ }
  }
}

export async function runChatMigrations(migrations: string[]): Promise<void> {
  for (const m of migrations) {
    // NOTE: P3-30 — caller passes a literal `string[]` of chat-schema DDL statements (see callers in chat module bootstrap); never user input. Signature is internal-only.
    try { await ddlRun(sql.raw(m)); } catch { /* already exists */ }
  }
}

export async function ensureChatTrigger(): Promise<void> {
  try {
    await ddlRun(sql`
      CREATE OR REPLACE FUNCTION sync_chat_message_content()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.content IS NOT NULL AND (NEW.text IS NULL OR NEW.text <> NEW.content) THEN
          NEW.text := NEW.content;
        ELSIF NEW.text IS NOT NULL AND (NEW.content IS NULL OR NEW.content <> NEW.text) THEN
          NEW.content := NEW.text;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await ddlRun(sql`DROP TRIGGER IF EXISTS sync_content_text ON chat_messages`);
    await ddlRun(sql`
      CREATE TRIGGER sync_content_text
      BEFORE INSERT OR UPDATE ON chat_messages
      FOR EACH ROW EXECUTE FUNCTION sync_chat_message_content()
    `);
  } catch { /* trigger may already exist */ }
}

export async function ensureNotificationTables(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      email_enabled BOOLEAN DEFAULT TRUE,
      telegram_enabled BOOLEAN DEFAULT TRUE,
      push_enabled BOOLEAN DEFAULT FALSE,
      order_updates BOOLEAN DEFAULT TRUE,
      production_alerts BOOLEAN DEFAULT TRUE,
      hr_alerts BOOLEAN DEFAULT TRUE,
      qc_alerts BOOLEAN DEFAULT TRUE,
      finance_alerts BOOLEAN DEFAULT FALSE,
      system_alerts BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Granular per-type × per-channel matrix (owner-decisions batch item 7, 2026-07-09).
  // See migration notification-type-preferences-2026-07-09.sql.
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS notification_type_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      notification_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, notification_type, channel)
    )
  `);
  // Per-module/per-alert-type configurable trigger thresholds (Q-35 schema-gap
  // close — NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md §1.3/§6 P0-4).
  // Boot-time guard so a fresh/reset DB always has this table; seed defaults
  // live in migration alert-thresholds-2026-08-03.sql (idempotent, run once).
  // APPROVED: owner 2026-08-03 (autonomous vision-gap-closure mandate).
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS alert_thresholds (
      id SERIAL PRIMARY KEY,
      alert_type TEXT NOT NULL UNIQUE,
      threshold_value NUMERIC NOT NULL,
      unit VARCHAR(20) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    )
  `);
}

export async function ensureTechnologyTables(): Promise<void> {
  // NOTE: P3-30 — literal CREATE TABLE DDL for `technology_approvals`; no user input.
  await ddlRun(sql.raw(`
    CREATE TABLE IF NOT EXISTS technology_approvals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      papka_order_id TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'pending',
      bom_approved BOOLEAN NOT NULL DEFAULT FALSE,
      routing_approved BOOLEAN NOT NULL DEFAULT FALSE,
      tech_card_approved BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT,
      approved_by_id TEXT,
      approved_at TIMESTAMPTZ,
      is_rejected BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `));
  // NOTE: P3-30 — literal CREATE UNIQUE INDEX DDL for `technology_approvals.papka_order_id`; no user input.
  await ddlRun(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS technology_approvals_papka_order_id_uidx ON technology_approvals(papka_order_id)`));
  // NOTE: P3-30 — literal CREATE INDEX DDL for `technology_approvals.papka_order_id`; no user input.
  await ddlRun(sql.raw(`CREATE INDEX IF NOT EXISTS technology_approvals_papka_order_id_idx ON technology_approvals(papka_order_id)`));
}

export async function ensureBotTables(): Promise<void> {
  const tables: [string, string][] = [
    ['hr_sick_reports', `CREATE TABLE IF NOT EXISTS hr_sick_reports (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL, days INTEGER NOT NULL DEFAULT 1, reason TEXT, document_file_id TEXT, status VARCHAR(20) NOT NULL DEFAULT 'pending', reported_at TIMESTAMP NOT NULL DEFAULT NOW(), reviewed_at TIMESTAMP, reviewed_by INTEGER, notes TEXT)`],
    ['hr_leave_requests', `CREATE TABLE IF NOT EXISTS hr_leave_requests (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT, status VARCHAR(20) NOT NULL DEFAULT 'pending', requested_at TIMESTAMP NOT NULL DEFAULT NOW(), reviewed_at TIMESTAMP, reviewed_by INTEGER, notes TEXT)`],
    ['hr_leave_balances', `CREATE TABLE IF NOT EXISTS hr_leave_balances (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL, leave_type VARCHAR(30) NOT NULL DEFAULT 'annual', year INTEGER NOT NULL, total_days INTEGER NOT NULL DEFAULT 24, used_days INTEGER NOT NULL DEFAULT 0, remaining_days INTEGER NOT NULL DEFAULT 24, updated_at TIMESTAMP DEFAULT NOW(), UNIQUE (employee_id, leave_type, year))`],
    ['recruitment_bot_attempts', `CREATE TABLE IF NOT EXISTS recruitment_bot_attempts (id SERIAL PRIMARY KEY, telegram_chat_id VARCHAR(50) NOT NULL, vacancy_id INTEGER, attempts INTEGER NOT NULL DEFAULT 1, last_attempt_at TIMESTAMP NOT NULL DEFAULT NOW())`],
    ['recruitment_bot_attempts_idx', `CREATE INDEX IF NOT EXISTS idx_rba_chat_vacancy ON recruitment_bot_attempts (telegram_chat_id, vacancy_id)`],
    ['bot_candidates', `CREATE TABLE IF NOT EXISTS bot_candidates (id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, telegram_chat_id VARCHAR(50), vacancy_id INTEGER, cv_file_id TEXT, cv_file_name TEXT, screening_answers JSONB, lang VARCHAR(5) DEFAULT 'uz', status VARCHAR(30) NOT NULL DEFAULT 'new', is_archived BOOLEAN NOT NULL DEFAULT FALSE, applied_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE (telegram_chat_id, vacancy_id))`],
    ['hr_adaptation_cases', `CREATE TABLE IF NOT EXISTS hr_adaptation_cases (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL UNIQUE, adaptation_day INTEGER DEFAULT 1, risk_level VARCHAR(20) DEFAULT 'low', risk_reason TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active', notified_at TIMESTAMP DEFAULT NOW() - INTERVAL '2 days', started_at TIMESTAMP DEFAULT NOW(), completed_at TIMESTAMP)`],
    ['pip_goals', `CREATE TABLE IF NOT EXISTS pip_goals (id SERIAL PRIMARY KEY, pip_plan_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, status VARCHAR(20) NOT NULL DEFAULT 'pending', due_date DATE, completed_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT NOW())`],
  ];
  for (const [, ddl] of tables) {
    // NOTE: P3-30 — `ddl` is iterated from the local `tables` literal-tuple array (bot/HR DDL); no user input.
    try { await ddlRun(sql.raw(ddl)); } catch { /* already exists */ }
  }
}

export async function ensureDataRetentionArchiveTables(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS pos_movements_archive (
      id integer NOT NULL,
      movement_number varchar(50),
      movement_type_id integer,
      status varchar(50),
      from_warehouse_id integer,
      to_warehouse_id integer,
      received_by_employee_id integer,
      created_by integer,
      supplier_name text,
      document_number varchar(100),
      document_date timestamp,
      notes text,
      created_at timestamp,
      updated_at timestamp,
      archived_at timestamp NOT NULL DEFAULT NOW(),
      archive_reason text DEFAULT '7-yil data retention'
    )
  `);
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS hr_documents_archive (
      id integer NOT NULL,
      employee_id integer,
      document_type text,
      title text,
      content jsonb,
      pdf_url text,
      status text,
      initiated_by integer,
      created_at timestamp,
      updated_at timestamp,
      archived_at timestamp NOT NULL DEFAULT NOW(),
      archive_reason text
    )
  `);
}

export async function ensurePositionFolderTable(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS position_folders (
      id SERIAL PRIMARY KEY,
      node_id INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
      item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('document', 'video', 'test')),
      title VARCHAR(255) NOT NULL,
      url TEXT,
      description TEXT,
      lms_course_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await ddlRun(sql`CREATE INDEX IF NOT EXISTS idx_position_folders_node_id ON position_folders(node_id)`);
}

export async function ensureOrgNodePortretTable(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS org_node_portret (
      id SERIAL PRIMARY KEY,
      node_id INTEGER REFERENCES org_departments(id) ON DELETE CASCADE,
      card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
      portret_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      creator_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Card-centric portret: rows are either node-level (card_id NULL) or card-level
  // (card_id set). node_id is nullable so card rows need no department.
  // See migration org-node-portret-card-key-2026-06-20.sql.
  await ddlRun(sql`ALTER TABLE org_node_portret ALTER COLUMN node_id DROP NOT NULL`);
  await ddlRun(sql`ALTER TABLE org_node_portret ADD COLUMN IF NOT EXISTS card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL`);
  // node-level uniqueness only over node rows; card-level natural key over card rows.
  await ddlRun(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_org_node_portret_node_id ON org_node_portret(node_id) WHERE card_id IS NULL`);
  await ddlRun(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_org_node_portret_card_id ON org_node_portret(card_id) WHERE card_id IS NOT NULL`);
}

export async function ensureNodeHrRequestsTable(): Promise<void> {
  await ddlRun(sql`
    CREATE TABLE IF NOT EXISTS node_hr_requests (
      id SERIAL PRIMARY KEY,
      node_id INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
      portret_id INTEGER REFERENCES org_node_portret(id) ON DELETE SET NULL,
      request_type VARCHAR(40) NOT NULL DEFAULT 'new_hire',
      priority VARCHAR(20) NOT NULL DEFAULT 'normal',
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      comment TEXT,
      node_name TEXT,
      requester_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await ddlRun(sql`CREATE INDEX IF NOT EXISTS idx_node_hr_requests_node_id ON node_hr_requests(node_id)`);
}

/**
 * Backfill `employees.user_id` from the canonical FK `users.employee_id → employees.id`.
 *
 * WHY: in the live `europrint` DB `employees.user_id` was 30/30 NULL while
 * `users.employee_id` correctly pointed at `employees.id` (proven 1:1 bijection —
 * email / phone_number / full_name signals all agree). That NULL silently broke
 * the org-schema approver resolvers:
 *   - communication-center/cc-org-resolver.service.ts (resolveManagerOfSender,
 *     resolveByPosition — both key off `employees.user_id`)
 *   - org-structure/org-queries.repo.ts (getDirectManager / getTelegramGroup).
 *
 * The Drizzle schema already declares `employees.user_id` as a UNIQUE FK to
 * `users.id` (lib/db/src/schema/employees.ts) — this only fills data that was
 * never populated, it does not change the schema.
 *
 * ADD-ONLY + idempotent: updates only rows where `user_id IS NULL`, so reseeds
 * (hr-demo-seed / hr-full-seed) self-heal on next boot and re-runs touch 0 rows.
 * Mirrors apps/api/src/shared/db/migrations/backfill-employees-user-id.sql.
 */
export async function backfillEmployeeUserId(): Promise<void> {
  await ddlRun(sql`
    UPDATE employees e
    SET    user_id = u.id
    FROM   users u
    WHERE  u.employee_id = e.id
      AND  e.user_id IS NULL
  `);
}
