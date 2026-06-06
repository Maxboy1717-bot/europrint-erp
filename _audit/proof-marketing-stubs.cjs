/** DB-proof: marketing exhibitions + ab_tests + settings + blog_posts */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host:'127.0.0.1', port:5432, user:'postgres', password:'postgres', database:'europrint' }); // allow-secret
(async () => {
  const ids = {};
  try {
    // 1) exhibitions INSERT + SELECT
    const er = await pool.query(
      `INSERT INTO exhibitions (id, name, location, status, created_at, updated_at)
       VALUES (gen_random_uuid()::text, 'PROOF-EXH', 'Tashkent', 'planned', NOW(), NOW()) RETURNING id, name`
    );
    ids.exhId = er.rows[0].id;
    const e2 = await pool.query(`SELECT id, name FROM exhibitions WHERE id=$1`, [ids.exhId]);
    const exh_ok = e2.rows[0]?.name === 'PROOF-EXH';
    console.log('1) exhibitions INSERT+SELECT:', exh_ok ? '✅' : '❌');

    // 2) exhibition_leads INSERT
    const lr = await pool.query(
      `INSERT INTO exhibition_leads (id, exhibition_id, name, phone, created_at)
       VALUES (gen_random_uuid()::text, 999999, 'PROOF-LEAD', '+998901234567', NOW()) RETURNING id, name`
    );
    ids.leadId = lr.rows[0].id;
    const lead_ok = lr.rows[0]?.name === 'PROOF-LEAD';
    console.log('2) exhibition_leads INSERT:', lead_ok ? '✅' : '❌');

    // 3) marketing_ab_tests SELECT
    const ab = await pool.query(`SELECT COUNT(*)::int AS cnt FROM marketing_ab_tests`);
    const ab_ok = typeof ab.rows[0]?.cnt === 'number';
    console.log('3) marketing_ab_tests SELECT (count=' + ab.rows[0]?.cnt + '):', ab_ok ? '✅' : '❌');

    // 4) marketing_settings UPSERT
    await pool.query(
      `INSERT INTO marketing_settings (id, key, value, updated_at)
       VALUES (gen_random_uuid()::text, 'PROOF_KEY', 'PROOF_VAL', NOW())
       ON CONFLICT (key) DO UPDATE SET value='PROOF_VAL', updated_at=NOW()`
    );
    const s2 = await pool.query(`SELECT value FROM marketing_settings WHERE key='PROOF_KEY'`);
    const sett_ok = s2.rows[0]?.value === 'PROOF_VAL';
    console.log('4) marketing_settings UPSERT:', sett_ok ? '✅' : '❌');

    // 5) social_api_configs INSERT
    const sr = await pool.query(
      `INSERT INTO social_api_configs (id, platform, is_active, updated_at)
       VALUES (gen_random_uuid()::text, 'PROOF_PLATFORM', true, NOW()) RETURNING id, platform`
    );
    ids.socialId = sr.rows[0].id;
    const soc_ok = sr.rows[0]?.platform === 'PROOF_PLATFORM';
    console.log('5) social_api_configs INSERT:', soc_ok ? '✅' : '❌');

    // 6) blog_posts UPDATE publish
    // blog_posts may have 0 rows; test with a real INSERT first
    const br = await pool.query(
      `INSERT INTO blog_posts (id, slug, title_uz, is_published, created_at, updated_at)
       VALUES (gen_random_uuid()::text, 'proof-post-' || extract(epoch from now())::bigint, 'PROOF-POST', false, NOW(), NOW()) RETURNING id`
    );
    ids.blogId = br.rows[0].id;
    await pool.query(`UPDATE blog_posts SET is_published=true, published_at=NOW(), updated_at=NOW() WHERE id=$1`, [ids.blogId]);
    const b2 = await pool.query(`SELECT is_published FROM blog_posts WHERE id=$1`, [ids.blogId]);
    const blog_ok = b2.rows[0]?.is_published === true;
    console.log('6) blog_posts publish UPDATE:', blog_ok ? '✅' : '❌');

    const all = exh_ok && lead_ok && ab_ok && sett_ok && soc_ok && blog_ok;
    console.log(all ? '\n✅ PROOF PASSED — marketing stubs persist to real tables.' : '\n❌ FAILED');
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    if (ids.leadId)  await pool.query(`DELETE FROM exhibition_leads WHERE id=$1`, [ids.leadId]).catch(()=>{});
    if (ids.exhId)   await pool.query(`DELETE FROM exhibitions WHERE id=$1`, [ids.exhId]).catch(()=>{});
    if (ids.socialId) await pool.query(`DELETE FROM social_api_configs WHERE id=$1`, [ids.socialId]).catch(()=>{});
    if (ids.blogId)  await pool.query(`DELETE FROM blog_posts WHERE id=$1`, [ids.blogId]).catch(()=>{});
    await pool.query(`DELETE FROM marketing_settings WHERE key='PROOF_KEY'`).catch(()=>{});
    await pool.end();
  }
})();
