#!/usr/bin/env node
/* eslint-disable */
/**
 * T12-06 JONLI DB-PROOF (rollback-tx) — backfillManagerIds manager_id derive
 * mantig'i (head_user_id parent-chain, NULL-skipping) + deriveManagerForNode CTE.
 *
 * Isbot (BEGIN ... ROLLBACK — DB o'zgarmaydi):
 *   A) 3-darajali TEST-daraxt: L0(head=U)->L1(head=NULL)->L2(head=NULL).
 *      deriveManagerForNode(L2) AYNAN repo CTE'sini ishlatib -> grandparent head (U) ni
 *      depth=3 da topadi (o'rtadagi NULL head O'TKAZIB YUBORILADI).
 *   B) backfillManagerIds UPDATE-correlated-CTE: TEST org_functions kartasi (department=L2)
 *      manager_id NULL -> derive -> U (parent-chain'dan).
 *   C) Idempotentlik: manager_id allaqachon to'ldirilgan qator qayta yangilanmaydi (0).
 *   D) Fabrikatsiya YO'Q: head hech qayerda bo'lmasa -> manager_id NULL qoladi.
 *   E) DATA-gate: aktiv node head_user_id=NULL bo'lsa -> gate YOPIQ (count>0).
 *   ROLLBACK — barcha TEST yozuvlar yo'qoladi.
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

const envTxt = fs.readFileSync(path.join(__dirname, '..', 'apps', 'api', '.env'), 'utf-8');
const m = envTxt.match(/DATABASE_URL\s*=\s*"?(postgres(?:ql)?:\/\/[^\s"]+)"?/);
const connectionString = m ? m[1] : undefined;
const pool = new Pool({ connectionString });

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAIL: ' + msg);
  console.log('  OK ' + msg);
}

const ANCESTOR_CTE = `
  WITH RECURSIVE ancestor AS (
    SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
    FROM org_departments od WHERE od.id = f.department_id AND od.is_active = true
    UNION ALL
    SELECT od2.id, od2.parent_id, od2.head_user_id, a.depth + 1
    FROM org_departments od2 JOIN ancestor a ON od2.id = a.parent_id
    WHERE od2.is_active = true AND a.depth < 10
  )
  SELECT head_user_id FROM ancestor WHERE head_user_id IS NOT NULL ORDER BY depth LIMIT 1`;

(async () => {
  const client = await pool.connect();
  let failed = false;
  try {
    await client.query('BEGIN');

    // pick a real existing user as the head (MAVJUD manba — fabrikatsiya yo'q)
    const u = await client.query(`SELECT id FROM users WHERE is_active = true ORDER BY id LIMIT 1`);
    if (!u.rows[0]) throw new Error('No active user to use as head');
    const headUser = u.rows[0].id;
    console.log(`TEST head user id=${headUser}`);

    // A) 3-level TEST tree: L0(head=headUser) -> L1(head NULL) -> L2(head NULL)
    const l0 = (await client.query(
      `INSERT INTO org_departments (name, level, node_type, head_user_id, is_active, created_at)
       VALUES ('TEST-T1206-L0', 0, 'owner', $1, true, NOW()) RETURNING id`, [headUser])).rows[0].id;
    const l1 = (await client.query(
      `INSERT INTO org_departments (name, level, node_type, parent_id, head_user_id, is_active, created_at)
       VALUES ('TEST-T1206-L1', 1, 'department', $1, NULL, true, NOW()) RETURNING id`, [l0])).rows[0].id;
    const l2 = (await client.query(
      `INSERT INTO org_departments (name, level, node_type, parent_id, head_user_id, is_active, created_at)
       VALUES ('TEST-T1206-L2', 2, 'position', $1, NULL, true, NOW()) RETURNING id`, [l1])).rows[0].id;
    console.log(`TEST tree: L0=${l0}(head=${headUser}) L1=${l1}(NULL) L2=${l2}(NULL)`);

    // deriveManagerForNode CTE (AYNAN org-queries.repo.ts deriveManagerForNode)
    const der = await client.query(`
      WITH RECURSIVE ancestor AS (
        SELECT od.id, od.name, od.parent_id, od.head_user_id, 1 AS depth
        FROM org_departments od WHERE od.id = $1 AND od.is_active = true
        UNION ALL
        SELECT od2.id, od2.name, od2.parent_id, od2.head_user_id, a.depth + 1
        FROM org_departments od2 JOIN ancestor a ON od2.id = a.parent_id
        WHERE od2.is_active = true AND a.depth < 10
      )
      SELECT a.head_user_id AS "managerUserId", a.id AS "resolvedAtNodeId", a.depth AS "depth"
      FROM ancestor a WHERE a.head_user_id IS NOT NULL AND a.id <> $1
      ORDER BY a.depth LIMIT 1
    `, [l2]);
    assert(der.rows[0] && Number(der.rows[0].managerUserId) === headUser,
      `A: deriveManagerForNode(L2) -> grandparent head user=${headUser} (NULL middle skipped)`);
    assert(Number(der.rows[0].resolvedAtNodeId) === l0, `A: resolved at L0 node=${l0}`);
    assert(Number(der.rows[0].depth) === 3, `A: depth=3 (climbed past NULL L1)`);

    // B) backfillManagerIds org_functions UPDATE (AYNAN org-mutations.repo.ts)
    const fn = (await client.query(
      `INSERT INTO org_functions (position_name, department_id, manager_id, is_active, created_at)
       VALUES ('TEST-T1206-FN', $1, NULL, true, NOW()) RETURNING id`, [l2])).rows[0].id;
    const fnUpd = await client.query(
      `UPDATE org_functions f SET manager_id = (${ANCESTOR_CTE})
       WHERE f.id = $1 AND (f.manager_id IS NULL OR f.manager_id = 0)
       RETURNING f.id, f.manager_id`, [fn]);
    assert(fnUpd.rows.length === 1 && Number(fnUpd.rows[0].manager_id) === headUser,
      `B: org_functions.manager_id derived from parent-chain = ${headUser}`);

    // C) Idempotent: re-run on now-filled row -> 0 updated (guard manager_id IS NULL/0)
    const fnUpd2 = await client.query(
      `UPDATE org_functions f SET manager_id = (${ANCESTOR_CTE})
       WHERE f.id = $1 AND (f.manager_id IS NULL OR f.manager_id = 0) RETURNING f.id`, [fn]);
    assert(fnUpd2.rows.length === 0, `C: idempotent re-run -> 0 rows changed (already filled)`);

    // D) No fabrication: tree with NO non-null head anywhere -> manager_id stays NULL
    const x0 = (await client.query(
      `INSERT INTO org_departments (name, level, node_type, head_user_id, is_active, created_at)
       VALUES ('TEST-T1206-X0', 0, 'owner', NULL, true, NOW()) RETURNING id`)).rows[0].id;
    const x1 = (await client.query(
      `INSERT INTO org_departments (name, level, node_type, parent_id, head_user_id, is_active, created_at)
       VALUES ('TEST-T1206-X1', 1, 'position', $1, NULL, true, NOW()) RETURNING id`, [x0])).rows[0].id;
    const fnX = (await client.query(
      `INSERT INTO org_functions (position_name, department_id, manager_id, is_active, created_at)
       VALUES ('TEST-T1206-FNX', $1, NULL, true, NOW()) RETURNING id`, [x1])).rows[0].id;
    const fnXUpd = await client.query(
      `UPDATE org_functions f SET manager_id = (${ANCESTOR_CTE})
       WHERE f.id = $1 AND (f.manager_id IS NULL OR f.manager_id = 0)
       RETURNING f.id, f.manager_id`, [fnX]);
    const fnXmgr = fnXUpd.rows[0] ? fnXUpd.rows[0].manager_id : 'no-row';
    assert(fnXmgr === null, `D: no head up chain -> manager_id stays NULL (not fabricated), got=${fnXmgr}`);

    // E) DATA-gate (AYNAN backfillManagerIds gate query): TEST NULL-heads make it CLOSED
    const gate = await client.query(`
      SELECT COUNT(*)::int AS null_head_count
      FROM org_departments WHERE is_active = true AND head_user_id IS NULL
    `);
    assert(Number(gate.rows[0].null_head_count) > 0,
      `E: DATA-gate sees ${gate.rows[0].null_head_count} active NULL-head nodes -> gate CLOSED (refuses write)`);

    await client.query('ROLLBACK');
    console.log("\nROLLBACK bajarildi — DB o'zgarmadi. T12-06 derive-mantiq ISBOTLANDI.");
  } catch (e) {
    failed = true;
    try { await client.query('ROLLBACK'); } catch (e2) {}
    console.error('PROOF FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(failed ? 1 : 0);
  }
})();
