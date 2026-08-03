/* PP Phase 1 write-proof — BEGIN/ROLLBACK, mirrors technology.repository SQL. Read-only net effect. */
const { Client } = require(require('path').join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
(async () => {
  const c = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
  await c.connect();
  const out = {};
  try {
    await c.query('BEGIN');

    // 1) create card (mirrors createCard)
    const ins = await c.query(
      `INSERT INTO technology_cards (code, name, direction, material_type, product_type, format_a, format_b, format_code, gofra_profile, raskroy_per_list, scrap_pct, print_params, kesim, post_press, ish_tartibi, calculated_by_ai, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,false,true,$16) RETURNING *`,
      ['TC-PROOF-001', 'Proof korobka', 'ofs-gof', 'mikrogofra', 'korobka', 105, 72, '105', 'E', 4, 3.5,
       JSON.stringify({ colors: 4, profile: 'CMYK' }), JSON.stringify({ w: 350, h: 250 }), JSON.stringify({ laminat: 'matte' }), JSON.stringify(['kesim', 'begovka']), 1]);
    const card = ins.rows[0];
    out.created = { id: card.id, code: card.code, version: card.version, status: card.status, calculated_by_ai: card.calculated_by_ai, print_params: card.print_params };

    // 2) reload (mirrors findTechnologyCardById)
    const rel = await c.query(`SELECT id, code, name, status, version, lab_approved, maket_approved FROM technology_cards WHERE id=$1 AND deleted_at IS NULL`, [card.id]);
    out.reloaded = rel.rows[0];

    // 3) BOM child
    const bom = await c.query(`INSERT INTO tech_card_bom (technology_card_id, material_code, quantity, unit, layer) VALUES ($1,$2,$3,$4,$5) RETURNING id, technology_card_id, material_code, quantity, unit`, [card.id, 'KRAFT-125', 12.5, 'kg', 'top']);
    out.bom = bom.rows[0];

    // 4) route child
    const rt = await c.query(`INSERT INTO tech_card_routes (technology_card_id, op_seq, operation, machine_id, norm_per_hour, setup_minutes, min_razryad, is_core) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, op_seq, operation, norm_per_hour`, [card.id, 10, 'Ofset bosma', 7, 8000, 30, 4, true]);
    out.route = rt.rows[0];

    // 5) version snapshot (mirrors snapshot())
    const ver = await c.query(`INSERT INTO tech_card_versions (technology_card_id, version, snapshot, changed_by) VALUES ($1,$2,$3::jsonb,$4) RETURNING id, version`, [card.id, card.version, JSON.stringify(card), 1]);
    out.version = ver.rows[0];

    // 6) lab-approve gate (mirrors setLabApproved)
    const lab = await c.query(`UPDATE technology_cards SET lab_approved=true, lab_approved_by=$2, lab_approved_at=now(), updated_at=now() WHERE id=$1 RETURNING lab_approved, lab_approved_by`, [card.id, 1]);
    out.labApproved = lab.rows[0];

    // 7) FK guard — bad technology_card_id must raise 23503
    try { await c.query(`SAVEPOINT sp1`); await c.query(`INSERT INTO tech_card_bom (technology_card_id, material_code, quantity) VALUES (99999999,'X',1)`); out.fkGuard = 'FAIL (no error)'; }
    catch (e) { out.fkGuard = e.code === '23503' ? 'OK 23503' : 'unexpected ' + e.code; await c.query(`ROLLBACK TO sp1`); }

    // 8) unique-code guard — duplicate code must raise 23505
    try { await c.query(`SAVEPOINT sp2`); await c.query(`INSERT INTO technology_cards (code, name) VALUES ('TC-PROOF-001','dup')`); out.uniqueGuard = 'FAIL (no error)'; }
    catch (e) { out.uniqueGuard = e.code === '23505' ? 'OK 23505' : 'unexpected ' + e.code; await c.query(`ROLLBACK TO sp2`); }

    await c.query('ROLLBACK');
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('PROOF ERROR:', e.message, e.code || '');
    process.exitCode = 1;
  } finally { await c.end(); }
})();
