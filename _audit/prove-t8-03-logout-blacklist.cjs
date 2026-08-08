/** T8-03 DB-PROOF (rollback-tx — DATA O'ZGARMAYDI). Logout blacklist + guard + refresh check.
 *  Tasdiqlaydi: (1) ON CONFLICT (jti) WHERE jti IS NOT NULL insert ISHLAYDI (eski ON CONFLICT (jti) XATO edi),
 *  (2) guard lookup (WHERE jti=$jti) revoke'ni TOPADI, (3) refresh check (token-hash YOKI jti) revoke'ni TOPADI,
 *  (4) idempotent re-blacklist (ON CONFLICT DO UPDATE) ishlaydi. Hammasi ROLLBACK — jonli data tegmaydi. */
const path = require('path');
const crypto = require('crypto');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');

    // Simulyatsiya: access va refresh AYNI jti (login bitta payload imzolaydi).
    const jti = crypto.randomUUID();
    const accessTok = 'ACCESS.' + jti;
    const refreshTok = 'REFRESH.' + jti; // boshqa string => boshqa hash
    const accessHash = hash(accessTok);
    const refreshHash = hash(refreshTok);
    const userIdText = '42'; // auth user.id INTEGER (matn) — fabrikatsiya yo'q

    // 1) blacklistToken(access): yangi kod statement (ON CONFLICT (jti) WHERE jti IS NOT NULL)
    await c.query(`
      INSERT INTO refresh_tokens (id, token, jti, user_id_text, is_revoked, expires_at, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, true, NOW() + INTERVAL '25 hours', NOW())
      ON CONFLICT (jti) WHERE jti IS NOT NULL DO UPDATE SET is_revoked = true
    `, [accessHash, jti, userIdText]);
    console.log('STEP1 access blacklisted (insert OK, no ON CONFLICT error)');

    // 2) blacklistToken(refresh): ayni jti => ON CONFLICT DO UPDATE (idempotent), token-hash yangilanmaydi
    //    (lekin refresh-check jti orqali ham topadi). Alohida string bo'lgani uchun guard'da token=hash ham ishlasin
    //    deb refresh uchun ALOHIDA satr emas — ayni jti satrini revoke ushlab turadi.
    await c.query(`
      INSERT INTO refresh_tokens (id, token, jti, user_id_text, is_revoked, expires_at, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, true, NOW() + INTERVAL '25 hours', NOW())
      ON CONFLICT (jti) WHERE jti IS NOT NULL DO UPDATE SET is_revoked = true
    `, [refreshHash, jti, userIdText]);
    console.log('STEP2 refresh blacklisted (idempotent ON CONFLICT DO UPDATE OK)');

    // 3) GUARD lookup — JwtAuthGuard.canActivate: WHERE jti=$jti
    const guard = await c.query(`SELECT is_revoked FROM refresh_tokens WHERE jti=$1 LIMIT 1`, [jti]);
    console.log('STEP3 GUARD finds revoked by jti:', guard.rows[0]?.is_revoked === true);

    // 4) REFRESH check — isTokenBlacklisted(refresh): token-hash YOKI jti, expires>NOW, is_revoked=true
    const refreshChk = await c.query(`
      SELECT is_revoked FROM refresh_tokens
      WHERE expires_at > NOW() AND (token=$1 OR ($2::text IS NOT NULL AND jti=$2)) AND is_revoked=true
      LIMIT 1
    `, [refreshHash, jti]);
    console.log('STEP4 REFRESH check finds revoked (token-hash or jti):', refreshChk.rows[0]?.is_revoked === true);

    // 5) NEGATIVE: ko'rilmagan jti revoke EMAS (false-positive yo'q)
    const otherJti = crypto.randomUUID();
    const neg = await c.query(`SELECT is_revoked FROM refresh_tokens WHERE jti=$1 LIMIT 1`, [otherJti]);
    console.log('STEP5 NEGATIVE unknown jti not found (correct):', neg.rows.length === 0);

    await c.query('ROLLBACK');
    console.log('ROLLBACK done — live data unchanged.');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('PROOF-ERR', e.message);
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
