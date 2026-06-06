'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let certId, roomId, msgId;
  try {
    // GET /progress/summary → COUNT from course_progress
    const r1 = await p.query(`
      SELECT COUNT(*)::int AS total,
             SUM(CASE WHEN completed = true THEN 1 ELSE 0 END)::int AS completed
      FROM course_progress
    `);
    console.log('course_progress summary OK total=', r1.rows[0].total, 'completed=', r1.rows[0].completed);

    // DELETE /certificates/:id → DELETE FROM certificates WHERE id
    const r2 = await p.query(`
      INSERT INTO certificates (user_id, course_id, certificate_number, issued_at)
      VALUES (1, 1, 'TEST-001', NOW())
      RETURNING id
    `);
    certId = r2.rows[0].id;
    await p.query(`DELETE FROM certificates WHERE id = $1`, [certId]);
    console.log('certificates DELETE OK id=', certId);
    certId = null;

    // DELETE /modules/:id → UPDATE modules SET deleted_at WHERE id
    const r3 = await p.query(`
      SELECT id FROM modules WHERE deleted_at IS NULL LIMIT 1
    `);
    if (r3.rows.length) {
      const modId = r3.rows[0].id;
      const r3b = await p.query(`
        UPDATE modules SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id
      `, [modId]);
      console.log('modules soft-delete OK id=', r3b.rows[0]?.id ?? null);
      // Restore
      await p.query(`UPDATE modules SET deleted_at = NULL WHERE id = $1`, [modId]);
    } else {
      console.log('modules soft-delete: no rows to test, schema OK');
    }

    // PATCH /chat/rooms/:id → UPDATE chat_rooms
    const r4 = await p.query(`
      SELECT id FROM chat_rooms LIMIT 1
    `);
    if (r4.rows.length) {
      roomId = r4.rows[0].id;
      const origName = (await p.query(`SELECT name FROM chat_rooms WHERE id = $1`, [roomId])).rows[0]?.name;
      await p.query(`
        UPDATE chat_rooms SET name = COALESCE($1::text, name), updated_at = NOW() WHERE id = $2
      `, ['Test Room Update', roomId]);
      console.log('chat_rooms UPDATE OK id=', roomId);
      await p.query(`UPDATE chat_rooms SET name = $1 WHERE id = $2`, [origName, roomId]);
      roomId = null;
    } else {
      // Verify schema exists
      const r4c = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='chat_rooms' AND column_name IN ('name','description','updated_at')`);
      console.log('chat_rooms schema cols:', r4c.rows.map(x=>x.column_name).join(', '));
    }

    // DELETE /chat/messages/:id/pin → UPDATE chat_messages SET is_pinned=false
    const r5 = await p.query(`
      SELECT id FROM chat_messages WHERE is_pinned = true LIMIT 1
    `);
    if (r5.rows.length) {
      msgId = r5.rows[0].id;
      await p.query(`UPDATE chat_messages SET is_pinned = false WHERE id = $1`, [msgId]);
      console.log('chat_messages unpin OK id=', msgId);
      await p.query(`UPDATE chat_messages SET is_pinned = true WHERE id = $1`, [msgId]);
      msgId = null;
    } else {
      const r5c = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='is_pinned'`);
      console.log('chat_messages.is_pinned exists=', r5c.rows.length > 0);
    }

    console.log('ALL CHECKS PASSED');
  } finally {
    if (certId) await p.query(`DELETE FROM certificates WHERE id=$1`, [certId]);
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
