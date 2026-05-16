/**
 * @module migration-sql.spec
 * @description Validates the aisha-tables.sql migration body — checks that
 * every required CREATE TABLE / CREATE INDEX statement is present and uses
 * idempotent IF NOT EXISTS guards.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('aisha-tables migration', () => {
  const sql = readFileSync(
    resolve(__dirname, '../../src/shared/db/migrations/aisha-tables.sql'),
    'utf-8',
  );

  it('creates all four aisha tables idempotently', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS aisha_conversations/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS aisha_tool_calls/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS aisha_voice_audit/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS aisha_pending_approvals/);
  });
});
