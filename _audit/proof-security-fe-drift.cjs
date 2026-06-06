'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let visitorId, incidentId, ppeId;
  try {
    // POST /security/visitors → security_visitors INSERT
    const r1 = await p.query(`
      INSERT INTO security_visitors (full_name, company, purpose, host_employee_name, status, entered_at, created_at)
      VALUES ('Test Visitor', 'Test Co', 'Meeting', 'Test Host', 'active', NOW(), NOW())
      RETURNING id
    `);
    visitorId = r1.rows[0].id;
    console.log('security_visitors INSERT OK id=', visitorId);

    // POST /security/incidents → security_incidents INSERT
    const r2 = await p.query(`
      INSERT INTO security_incidents (type, description, severity, location, status, reported_by, created_by, created_at, updated_at)
      VALUES ('unauthorized_access', 'Test incident', 'medium', 'Entrance', 'open', 1, 1, NOW(), NOW())
      RETURNING id
    `);
    incidentId = r2.rows[0].id;
    console.log('security_incidents INSERT OK id=', incidentId);

    // POST /security/ppe-checks → security_ppe_checks INSERT
    const r3 = await p.query(`
      INSERT INTO security_ppe_checks (employee_name, department, helmet_ok, vest_ok, gloves_ok, boots_ok, checked_by, created_at)
      VALUES ('Test Employee', 'Production', true, true, false, true, 1, NOW())
      RETURNING id
    `);
    ppeId = r3.rows[0].id;
    console.log('security_ppe_checks INSERT OK id=', ppeId);

    console.log('ALL CHECKS PASSED');
  } finally {
    if (visitorId) await p.query('DELETE FROM security_visitors WHERE id=$1', [visitorId]);
    if (incidentId) await p.query('DELETE FROM security_incidents WHERE id=$1', [incidentId]);
    if (ppeId) await p.query('DELETE FROM security_ppe_checks WHERE id=$1', [ppeId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
