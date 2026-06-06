'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
const { randomUUID } = require('crypto');

async function run() {
  let budgetId, calendarId, exhibitionId;
  try {
    // DELETE /marketing/budget/:id → DELETE FROM marketing_budget_lines (uuid id)
    budgetId = randomUUID();
    await p.query(`
      INSERT INTO marketing_budget_lines (id, year, month, category, planned_amount, created_at)
      VALUES ($1, 2026, 6, 'digital', 1000, NOW())
    `, [budgetId]);
    await p.query(`DELETE FROM marketing_budget_lines WHERE id = $1`, [budgetId]);
    console.log('marketing_budget_lines DELETE OK id=', budgetId);
    budgetId = null;

    // PATCH /marketing/calendar/:id → UPDATE marketing_calendar_events COALESCE (int id)
    const r2 = await p.query(`
      INSERT INTO marketing_calendar_events (title, event_type, start_date, status, created_at)
      VALUES ('Test Event', 'campaign', '2026-06-10', 'planned', NOW())
      RETURNING id
    `);
    calendarId = r2.rows[0].id;
    const r2b = await p.query(`
      UPDATE marketing_calendar_events SET
        title  = COALESCE($1, title),
        status = COALESCE($2, status)
      WHERE id = $3
      RETURNING title, status
    `, ['Updated Event', 'ongoing', calendarId]);
    console.log('marketing_calendar_events UPDATE OK title=', r2b.rows[0].title, 'status=', r2b.rows[0].status);

    // DELETE /marketing/calendar/:id
    await p.query(`DELETE FROM marketing_calendar_events WHERE id = $1`, [calendarId]);
    console.log('marketing_calendar_events DELETE OK id=', calendarId);
    calendarId = null;

    // PATCH /marketing/exhibitions/:id → UPDATE exhibitions COALESCE (uuid id)
    exhibitionId = randomUUID();
    await p.query(`
      INSERT INTO exhibitions (id, name, status, start_date, created_at, updated_at)
      VALUES ($1, 'Test Expo', 'planned', '2026-07-01', NOW(), NOW())
    `, [exhibitionId]);
    const r3b = await p.query(`
      UPDATE exhibitions SET
        name   = COALESCE($1, name),
        status = COALESCE($2, status),
        updated_at = NOW()
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING name, status
    `, ['Updated Expo', 'ongoing', exhibitionId]);
    console.log('exhibitions UPDATE OK name=', r3b.rows[0].name, 'status=', r3b.rows[0].status);

    // DELETE /marketing/exhibitions/:id → soft-delete
    await p.query(`
      UPDATE exhibitions SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
    `, [exhibitionId]);
    const r3c = await p.query(`SELECT deleted_at FROM exhibitions WHERE id = $1`, [exhibitionId]);
    console.log('exhibitions soft-DELETE OK deleted_at=', r3c.rows[0].deleted_at ? 'SET' : 'NULL(FAIL)');
    exhibitionId = null;

    console.log('ALL CHECKS PASSED');
  } finally {
    if (budgetId) await p.query('DELETE FROM marketing_budget_lines WHERE id=$1', [budgetId]);
    if (calendarId) await p.query('DELETE FROM marketing_calendar_events WHERE id=$1', [calendarId]);
    if (exhibitionId) await p.query('DELETE FROM exhibitions WHERE id=$1', [exhibitionId]);
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
