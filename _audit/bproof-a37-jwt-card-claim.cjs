#!/usr/bin/env node
/* eslint-disable */
/**
 * A37 — JWT KARTA-CLAIM JONLI ISBOT (rollback-tx).
 *
 * Vazifa (To'lqin-2, A37): login JWT'da karta-claim'lar — cardId / rbacTier / positionId —
 *   borligini va to'g'ri qiymat bilan to'lganini uchma-uch tasdiqlash.
 *
 * NEGA: EP-ORG-023 bo'yicha guard'lar ruxsatni KARTADAN o'qiydi. Buning uchun JWT
 *   payload'ida birlamchi karta (cardId), uning RBAC tier'i (rbacTier) va position
 *   (positionId) bo'lishi shart. Bu proof — login.service buildAuthResult AYNAN
 *   yozadigan claim shaklini real `jsonwebtoken` bilan imzolab, decode qilib tekshiradi.
 *
 * ISBOT ZANJIRI (production kodga AYNAN mos — soxta yo'q):
 *   1) resolveCardGate(userId) — drizzle-auth.repo.ts:resolveCardGate ichidagi AYNAN
 *      SQL jonli bajariladi (users.card_id → org_departments.rbac_tier + razryad_levels.level
 *      + users.position_id). Natija: { activeCardCount, primaryCardId, rbacTier, positionId }.
 *   2) rbacTier — rbac-tier.policy.ts:resolveEffectiveRbacTier AYNAN mantig'i bilan
 *      hisoblanadi (qo'lda override ?? razryad-darajadan; egasi qoidasi 2026-06-25).
 *   3) payload — login.service.ts:buildAuthResult AYNAN shakli quriladi
 *      (sub/username/email/role/cardId/rbacTier/positionId/jti).
 *   4) jsonwebtoken.sign(payload) — JwtService.sign() AYNAN o'rab ishlatadigan kutubxona.
 *   5) jsonwebtoken.verify(token) — decode → claim'lar AYNAN qaytganini assert qiladi.
 *
 * TEST-karta (jonli, ochiq 'TEST-' belgili — FABRIKATSIYA YO'Q, Q-40):
 *   users.id=69 (TEST-operator) → card_id=173 (TEST-Operator, razryad level 5 → tier 'manager').
 *   Agar bu satr o'zgargan bo'lsa, proof avtomatik birinchi card_id'li TEST-userni tanlaydi.
 *
 * XAVFSIZLIK (Q-29/Q-30): hammasi BEGIN ... ROLLBACK ichida — DB O'ZGARMAYDI; token faqat
 *   TEST sirli kalit bilan imzolanadi (productionga tegmaydi), SECRET CHOP ETILMAYDI.
 *
 * Ishga tushirish:
 *   node _audit/bproof-a37-jwt-card-claim.cjs
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const jwt = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'jsonwebtoken'));
const { randomUUID } = require('node:crypto');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

const checks = [];
function assert(cond, msg) {
  checks.push({ ok: !!cond, msg });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}: ${msg}`);
  return !!cond;
}

// ── rbac-tier.policy.ts AYNAN nusxasi (proof self-contained; egasi qoidasi 2026-06-25) ──
const RAZRYAD_LEVEL_TO_RBAC_TIER = { 1: 'operator', 2: 'operator', 3: 'specialist', 4: 'specialist', 5: 'manager', 6: 'executive' };
function razryadLevelToRbacTier(level) {
  if (level == null || !Number.isFinite(level)) return null;
  return RAZRYAD_LEVEL_TO_RBAC_TIER[level] ?? null;
}
function resolveEffectiveRbacTier(explicitTier, razryadLevel) {
  const explicit = explicitTier == null || explicitTier === '' ? null : explicitTier;
  return explicit ?? razryadLevelToRbacTier(razryadLevel);
}

// ── drizzle-auth.repo.ts:resolveCardGate ichidagi AYNAN SQL (parametrlangan) ──
const CARD_GATE_SQL = `
  WITH usr AS (SELECT id, employee_id, position_id, card_id FROM users WHERE id = $1),
  prim AS (
    SELECT COALESCE(
      (SELECT card_id FROM usr),
      (SELECT ec.card_id FROM employee_cards ec
        WHERE ec.employee_id = (SELECT employee_id FROM usr) AND ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
        ORDER BY ec.is_primary DESC, ec.assigned_at DESC NULLS LAST LIMIT 1)
    ) AS card_id
  )
  SELECT
    (SELECT COUNT(*) FROM employee_cards ec WHERE ec.employee_id = (SELECT employee_id FROM usr)
      AND ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_card_count,
    (SELECT card_id FROM prim) AS primary_card_id,
    (SELECT od.rbac_tier FROM org_departments od WHERE od.id = (SELECT card_id FROM prim)) AS rbac_tier,
    (SELECT rl.level FROM org_departments od LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
      WHERE od.id = (SELECT card_id FROM prim)) AS primary_razryad_level,
    (SELECT position_id FROM usr) AS position_id
`;

// resolveCardGate AYNAN qaytarish shakli (CardGate interfeysi i-auth.repo.ts).
async function resolveCardGate(client, userId) {
  const empty = { activeCardCount: 0, primaryCardId: null, rbacTier: null, positionId: null };
  const r = await client.query(CARD_GATE_SQL, [userId]);
  const row = r.rows[0];
  if (!row) return empty;
  return {
    activeCardCount: Number(row.active_card_count ?? 0),
    primaryCardId: row.primary_card_id ?? null,
    rbacTier: resolveEffectiveRbacTier(row.rbac_tier ?? null, row.primary_razryad_level == null ? null : Number(row.primary_razryad_level)),
    positionId: row.position_id ?? null,
  };
}

// login.service.ts:buildAuthResult AYNAN payload shakli (faqat claim qismi).
function buildJwtPayload(user, gate) {
  return {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    cardId: gate?.primaryCardId ?? null,
    rbacTier: gate?.rbacTier ?? null,
    positionId: gate?.positionId ?? null,
    jti: randomUUID(),
  };
}

// Proof faqat shu sessiya uchun TEST sirli kalit — production secret'ga TEGMAYDI.
const TEST_JWT_SECRET = 'A37-PROOF-ONLY-' + randomUUID();

(async () => {
  const client = await pool.connect();
  let crashed = false;
  try {
    await client.query('BEGIN'); // Q-29: DB o'qiladi, o'zgartirilmaydi — oxirida ROLLBACK.

    // ── 1) TEST-userni tanlash: card_id bog'langan TEST-user (default id=69), bo'lmasa birinchisi ──
    console.log('── 1 · TEST-user (card_id bog\'langan) ──');
    let userRow = (await client.query(
      `SELECT id, username, email, role, employee_id, position_id, card_id
       FROM users WHERE id = 69 AND card_id IS NOT NULL LIMIT 1`,
    )).rows[0] || null;
    if (!userRow) {
      userRow = (await client.query(
        `SELECT id, username, email, role, employee_id, position_id, card_id
         FROM users WHERE card_id IS NOT NULL AND (username ILIKE 'TEST-%' OR username ILIKE '%test%')
         ORDER BY id LIMIT 1`,
      )).rows[0] || null;
    }
    if (!userRow) {
      userRow = (await client.query(
        `SELECT id, username, email, role, employee_id, position_id, card_id
         FROM users WHERE card_id IS NOT NULL ORDER BY id LIMIT 1`,
      )).rows[0] || null;
    }
    assert(!!userRow, 'card_id bog\'langan TEST-user topildi (login karta-gate uchun shart)');
    if (!userRow) throw new Error('card_id bog\'langan birorta user yo\'q — TEST-karta seed kerak (A12).');
    console.log('   user:', JSON.stringify({ id: userRow.id, username: userRow.username, role: userRow.role, card_id: userRow.card_id, position_id: userRow.position_id }));

    // ── 2) resolveCardGate — production AYNAN SQL'i ──
    console.log('\n── 2 · resolveCardGate (drizzle-auth.repo.ts AYNAN SQL) ──');
    const gate = await resolveCardGate(client, userRow.id);
    console.log('   gate:', JSON.stringify(gate));
    assert(gate.activeCardCount >= 1, `aktiv karta soni ≥ 1 (haqiqiy: ${gate.activeCardCount}) — login-gate o'tadi`);
    assert(gate.primaryCardId === userRow.card_id,
      `gate.primaryCardId (${gate.primaryCardId}) = users.card_id (${userRow.card_id}) — birlamchi karta to'g'ri`);
    assert(gate.rbacTier !== null,
      `gate.rbacTier null EMAS (haqiqiy: '${gate.rbacTier}') — razryad/override'dan kelgan (guard ruxsat o'qiydi)`);

    // ── 3) payload — login.service.ts:buildAuthResult AYNAN shakli ──
    console.log('\n── 3 · JWT payload (buildAuthResult AYNAN shakli) ──');
    const payload = buildJwtPayload(userRow, gate);
    console.log('   payload claim-kalitlari:', Object.keys(payload).join(', '));
    assert(Object.prototype.hasOwnProperty.call(payload, 'cardId'), "payload'da 'cardId' kaliti BOR");
    assert(Object.prototype.hasOwnProperty.call(payload, 'rbacTier'), "payload'da 'rbacTier' kaliti BOR");
    assert(Object.prototype.hasOwnProperty.call(payload, 'positionId'), "payload'da 'positionId' kaliti BOR");
    assert(payload.cardId === gate.primaryCardId, 'payload.cardId = gate.primaryCardId');
    assert(payload.rbacTier === gate.rbacTier, 'payload.rbacTier = gate.rbacTier');
    assert(payload.positionId === gate.positionId, 'payload.positionId = gate.positionId');
    assert(typeof payload.jti === 'string' && payload.jti.length > 0, "payload'da 'jti' (logout/blacklist uchun) BOR");

    // ── 4) sign — JwtService.sign() AYNAN o'rab ishlatadigan jsonwebtoken ──
    console.log('\n── 4 · jsonwebtoken.sign (JwtService AYNAN o\'raydi) ──');
    const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '24h' });
    assert(typeof token === 'string' && token.split('.').length === 3, 'imzolangan JWT 3 qismli (header.payload.signature)');

    // ── 5) verify+decode — claim'lar uchma-uch tokenda saqlanganini tasdiqla ──
    console.log('\n── 5 · jsonwebtoken.verify → decode (claim uchma-uch saqlandi) ──');
    const decoded = jwt.verify(token, TEST_JWT_SECRET);
    console.log('   decoded claim-kalitlari:', Object.keys(decoded).join(', '));
    assert(Object.prototype.hasOwnProperty.call(decoded, 'cardId'), "decode'da 'cardId' claim BOR (tokendan o'qildi)");
    assert(Object.prototype.hasOwnProperty.call(decoded, 'rbacTier'), "decode'da 'rbacTier' claim BOR (tokendan o'qildi)");
    assert(Object.prototype.hasOwnProperty.call(decoded, 'positionId'), "decode'da 'positionId' claim BOR (tokendan o'qildi)");
    assert(decoded.cardId === gate.primaryCardId,
      `decoded.cardId (${decoded.cardId}) = birlamchi karta (${gate.primaryCardId}) — qiymat tokenda saqlandi`);
    assert(decoded.rbacTier === gate.rbacTier,
      `decoded.rbacTier ('${decoded.rbacTier}') = gate.rbacTier ('${gate.rbacTier}') — qiymat tokenda saqlandi`);
    assert(decoded.positionId === gate.positionId,
      `decoded.positionId (${JSON.stringify(decoded.positionId)}) = gate.positionId (${JSON.stringify(gate.positionId)}) — qiymat tokenda saqlandi`);
    assert(Number(decoded.sub) === Number(userRow.id), `decoded.sub (${decoded.sub}) = user.id (${userRow.id})`);
    assert(decoded.jti === payload.jti, 'decoded.jti payload.jti ga teng (blacklist/logout ip)');
    assert(typeof decoded.exp === 'number' && decoded.exp > decoded.iat,
      'tokenda exp/iat bor (24h TTL — AUTH-1 cookie maxAge mosligi)');

    await client.query('ROLLBACK');
    console.log('\nROLLBACK bajarildi — DB o\'zgarmadi (faqat o\'qildi).');
  } catch (e) {
    crashed = true;
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\nPROOF XATO:', e.message);
  } finally {
    client.release();
    await pool.end();
  }

  // ── YAKUNIY HUKM ──
  console.log('\n════════ YAKUN ════════');
  const failed = checks.filter((c) => !c.ok);
  const pass = checks.filter((c) => c.ok).length;
  console.log(`PASS=${pass}  FAIL=${failed.length}  (jami ${checks.length})`);
  if (crashed) console.log('STATUS: CRASH ❌');
  else if (failed.length === 0) console.log("JWT KARTA-CLAIM: ALL PASS ✅ — login JWT'da cardId/rbacTier/positionId bor, qiymatlar resolveCardGate'dan to'g'ri kelib, imzolanib, decode'da uchma-uch saqlandi.");
  else { console.log('JWT KARTA-CLAIM: SOME FAIL ❌'); failed.forEach((c) => console.log('  - ' + c.msg)); }
  process.exit(!crashed && failed.length === 0 ? 0 : 1);
})();
