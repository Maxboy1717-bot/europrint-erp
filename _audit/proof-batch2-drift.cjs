// _audit/proof-batch2-drift.cjs
// DB-proof: warehouses DELETE, material_movements POST, employee_files POST,
//           hr_documents CRUD, nps_responses POST, vendor_performance POST,
//           sd_payments PUT
'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function q(label, query, params = []) {
  try {
    const r = await p.query(query, params);
    console.log(`✅ ${label}:`, r.rows?.[0] ?? r.rowCount);
  } catch (e) {
    console.error(`❌ ${label}: ${e.message}`);
  }
}

async function main() {
  // 1. warehouses table exists + soft-delete
  await q('warehouses table', `SELECT id FROM warehouses LIMIT 1`);
  await q('warehouses UPDATE deleted_at', `
    UPDATE warehouses SET deleted_at = NOW() WHERE id = -9999 AND deleted_at IS NULL
  `);

  // 2. material_movements — INSERT + SELECT
  await q('material_movements cols', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name='material_movements'
    ORDER BY ordinal_position
  `);
  await q('material_movements INSERT', `
    INSERT INTO material_movements (material_id, material_name, movement_type, quantity, unit, performed_by, scanned_at)
    VALUES (1, 'test-mat', 'in', 1, 'шт', 0, NOW())
    RETURNING id
  `);

  // 3. employee_files — INSERT
  await q('employee_files cols', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name='employee_files'
    ORDER BY ordinal_position
  `);
  await q('employee_files INSERT', `
    INSERT INTO employee_files (employee_id, user_id, file_name, file_path, uploaded_by, created_at)
    VALUES (1, 1, 'test.pdf', '/tmp/test.pdf', 0, NOW())
    RETURNING id, file_name
  `);

  // 4. hr_documents — INSERT
  await q('hr_documents cols', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name='hr_documents'
    ORDER BY ordinal_position
  `);
  await q('hr_documents INSERT', `
    INSERT INTO hr_documents (employee_id, document_type, status)
    VALUES (1, 'contract', 'pending')
    RETURNING id, document_type
  `);

  // 5. nps_responses — INSERT (id=varchar NOT NULL no default → must supply)
  await q('nps_responses cols', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name='nps_responses'
    ORDER BY ordinal_position
  `);
  await q('nps_responses INSERT', `
    INSERT INTO nps_responses (id, score, created_at)
    VALUES (gen_random_uuid()::text, 8, NOW())
    RETURNING id, score
  `);

  // 6. vendor_performance — INSERT
  await q('vendor_performance cols', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name='vendor_performance'
    ORDER BY ordinal_position
  `);
  await q('vendor_performance INSERT', `
    INSERT INTO vendor_performance (vendor_id, score, on_time_rate, quality_rate, created_at)
    VALUES (1, 85, 0.9, 0.95, NOW())
    RETURNING id, vendor_id, score
  `);

  // 7. sd_payments — UPDATE (id=uuid, status=varchar)
  await q('sd_payments cols', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name='sd_payments'
    ORDER BY ordinal_position
  `);
  await q('sd_payments UPDATE (no-op uuid sentinel)', `
    UPDATE sd_payments SET
      amount   = COALESCE(NULL::numeric, amount),
      notes    = COALESCE(NULL::text, notes),
      status   = COALESCE(NULL::varchar, status),
      updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
    RETURNING id
  `);

  await p.end();
}

main().catch(e => { console.error(e); process.exit(1); });
