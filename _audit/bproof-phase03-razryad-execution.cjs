/** DB-PROOF (rollback-tx): FAZA-03 razryad EXECUTION + 2-imzo. Servis mantig'ini SQL'da takrorlaydi.
 *  Test-setup (threshold/min_months/joriy-razryad) TX ichida (rollback) — fabrikatsiya emas, sinov-sahna. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    const r2 = (await c.query(`SELECT id FROM razryad_levels WHERE level=2`)).rows[0].id;
    const r3 = (await c.query(`SELECT id FROM razryad_levels WHERE level=3`)).rows[0].id;
    console.log(`Test: karta=${card}, joriy-razryad(lvl2)=${r2}, target(lvl3)=${r3}`);
    await c.query('BEGIN');
    // sinov-sahna: target razryadga threshold=70, min_months=0; kartaga joriy razryad lvl2
    await c.query(`UPDATE razryad_levels SET exam_pass_threshold=70, min_months=0 WHERE id=$1`, [r3]);
    await c.query(`UPDATE org_departments SET razryad_level_id=$1 WHERE id=$2`, [r2, card]);
    // 1) createRequest (increase, examScore=80 >= 70): INSERT pending
    const req = (await c.query(`INSERT INTO razryad_requests (card_id, target_razryad_id, current_razryad_id, request_type, exam_score, status, created_at, updated_at) VALUES ($1,$2,$3,'increase',80,'pending',NOW(),NOW()) RETURNING id`, [card, r3, r2])).rows[0].id;
    console.log(`1) So'rov yaratildi #${req} (pending)`);
    // 2) hrApprove: pending -> hr_approved
    await c.query(`UPDATE razryad_requests SET status='hr_approved', hr_approved_by=1, hr_approved_at=NOW() WHERE id=$1 AND status='pending'`, [req]);
    const s1 = (await c.query(`SELECT status FROM razryad_requests WHERE id=$1`, [req])).rows[0].status;
    console.log(`2) HR imzo -> status=${s1} (hr_approved kutilgan)`);
    // 3) managerApprove (atomik): card razryad UPDATE + history INSERT + request approved
    await c.query(`UPDATE org_departments SET razryad_level_id=$1 WHERE id=$2`, [r3, card]);
    await c.query(`INSERT INTO razryad_history (card_id, old_razryad_id, new_razryad_id, change_type, exam_score, certificate_number, manager_approved_by, effective_at, created_at) VALUES ($1,$2,$3,'increase',80,$4,1,NOW(),NOW())`, [card, r2, r3, `CERT-RZ-${card}-test`]);
    await c.query(`UPDATE razryad_requests SET status='approved', manager_approved_by=1, manager_approved_at=NOW() WHERE id=$1`, [req]);
    const after = (await c.query(`SELECT razryad_level_id FROM org_departments WHERE id=$1`, [card])).rows[0].razryad_level_id;
    const hist = (await c.query(`SELECT old_razryad_id, new_razryad_id, change_type, certificate_number FROM razryad_history WHERE card_id=$1 ORDER BY id DESC LIMIT 1`, [card])).rows[0];
    const st = (await c.query(`SELECT status FROM razryad_requests WHERE id=$1`, [req])).rows[0].status;
    console.log(`3) Rahbar imzo (atomik): karta razryad=${after} (${r3} kutilgan) | tarix: ${hist.old_razryad_id}->${hist.new_razryad_id} ${hist.change_type} cert=${hist.certificate_number} | so'rov=${st}`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> jonli DB tegilmadi (sinov-sahna ham qaytdi)');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
