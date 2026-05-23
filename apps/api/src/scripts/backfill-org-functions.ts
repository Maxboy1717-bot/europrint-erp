/**
 * @module backfill-org-functions
 * @description One-time backfill script: populate org_functions from positions,
 *   then employee_functions from employees.positionId.
 *
 * Run: pnpm --filter @europrint/api exec tsx src/scripts/backfill-org-functions.ts
 */
import { db, pool } from '@workspace/db';
import { sql } from 'drizzle-orm';

interface PositionRow {
  id: number;
  code: string;
  position_name: string;
  position_name_ru: string | null;
  level: number;
}

interface EmployeeRow {
  id: number;
  user_id: number | null;
  department_id: number | null;
  position_id: number | null;
}

async function main() {
  console.log('🌱 Backfill org_functions + employee_functions starting...');

  // ─── 1. Map departments.id → org_departments.id ────────────────────────
  // Find the most likely matching org_department per department by name/code.
  // For now, fall back to a single placeholder org_department if mapping fails.
  // (Better mapping requires manual review of org_departments tree.)
  const deptRows = await pool.query<{ id: number; code: string; name: string }>(
    `SELECT id, code, name FROM org_departments`
  );
  console.log(`  Found ${deptRows.rowCount} departments to map`);

  const orgDeptRows = await pool.query<{ id: number; name: string }>(
    `SELECT id, name FROM org_departments WHERE is_active = true`
  );
  console.log(`  Found ${orgDeptRows.rowCount} org_departments candidates`);

  // Build mapping: department.id → org_department.id (best-effort by name)
  const deptMap = new Map<number, number>();
  for (const dept of deptRows.rows) {
    const match = orgDeptRows.rows.find(
      o => o.name.toLowerCase().includes(dept.name.toLowerCase()) ||
           dept.name.toLowerCase().includes(o.name.toLowerCase())
    );
    if (match) {
      deptMap.set(dept.id, match.id);
    }
  }
  console.log(`  Mapped ${deptMap.size}/${deptRows.rowCount} departments to org_departments`);

  // Fallback org_department for unmapped (root-level placeholder)
  const rootOrgDept = orgDeptRows.rows.find(r => r.name === "Ma'muriyat") ?? orgDeptRows.rows[0];
  if (!rootOrgDept) {
    throw new Error('No org_departments exist — cannot backfill');
  }
  console.log(`  Fallback org_department: id=${rootOrgDept.id} (${rootOrgDept.name})`);

  // ─── 2. Populate org_functions from positions ────────────────────────
  const posRows = await pool.query<PositionRow>(
    `SELECT id, code, position_name, position_name_ru, level FROM org_functions ORDER BY display_order`
  );
  console.log(`  Backfilling ${posRows.rowCount} positions → org_functions`);

  let createdFunctions = 0;
  const positionToFunctionMap = new Map<number, number>();

  for (const pos of posRows.rows) {
    // Determine which org_department this position belongs to.
    // For now, attach all to the fallback. Later refinement: match by
    // position's typical department (CEO → CEO office, HR_MANAGER → HR dept, etc.)
    const targetOrgDeptId = rootOrgDept.id;

    const result = await pool.query<{ id: number }>(
      `INSERT INTO org_functions (department_id, position_name, position_name_ru, display_order, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id`,
      [targetOrgDeptId, pos.position_name, pos.position_name_ru ?? pos.position_name, pos.id]
    );

    positionToFunctionMap.set(pos.id, result.rows[0].id);
    createdFunctions++;
  }
  console.log(`  ✅ Created ${createdFunctions} org_functions`);

  // ─── 3. Populate employee_functions from employees ────────────────────
  const empRows = await pool.query<EmployeeRow>(
    `SELECT id, user_id, department_id, position_id
     FROM employees
     WHERE deleted_at IS NULL`
  );
  console.log(`  Backfilling ${empRows.rowCount} employees → employee_functions`);

  let createdEmpFunctions = 0;
  let skippedEmpFunctions = 0;

  for (const emp of empRows.rows) {
    if (!emp.user_id || !emp.position_id) {
      skippedEmpFunctions++;
      continue;
    }

    const functionId = positionToFunctionMap.get(emp.position_id);
    if (!functionId) {
      skippedEmpFunctions++;
      continue;
    }

    // Check if employee already has this function (idempotent)
    const existing = await pool.query(
      `SELECT id FROM employee_functions WHERE user_id = $1 AND function_id = $2 AND deleted_at IS NULL`,
      [emp.user_id, functionId]
    );
    if ((existing.rowCount ?? 0) > 0) {
      skippedEmpFunctions++;
      continue;
    }

    await pool.query(
      `INSERT INTO employee_functions (user_id, function_id, is_primary, workload_percent)
       VALUES ($1, $2, true, 100)`,
      [emp.user_id, functionId]
    );

    createdEmpFunctions++;
  }
  console.log(`  ✅ Created ${createdEmpFunctions} employee_functions`);
  console.log(`  ⚠ Skipped ${skippedEmpFunctions} employees (no user_id, position_id, or already linked)`);

  // ─── 4. Verify ───────────────────────────────────────────────────────
  const verifyOrg = await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM org_functions WHERE is_active = true`);
  const verifyEmp = await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM employee_functions WHERE deleted_at IS NULL`);
  console.log(`\n📊 Final counts:`);
  console.log(`  org_functions: ${verifyOrg.rows[0].count}`);
  console.log(`  employee_functions: ${verifyEmp.rows[0].count}`);

  console.log('\n🎉 Backfill complete!');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
