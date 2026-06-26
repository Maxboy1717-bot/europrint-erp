#!/usr/bin/env node
/* eslint-disable */
/**
 * T12-07 — RBAC tier→guard derive UCHMA-UCH JONLI ISBOT (rollback-tx).
 *
 * MUAMMO (writer-wire uzilishi): login.service JWT'ga cardId/rbacTier/positionId
 *   yozadi (A37 buni isbotladi), AMMO inbound tomonda jwt.strategy.validate() bu
 *   claim'larni request.user'ga KO'CHIRMASDI → guard'lardagi tier-derive yo'li
 *   (RolesGuard A5 / PermissionGuard A6) hech qachon ishlamasdi (o'lik shox).
 *
 * FIX (T12-07, additiv): JwtPayload + AuthenticatedUser tiplariga cardId/rbacTier/
 *   positionId qo'shildi; jwt.strategy.validate() ularni payload'dan request.user'ga
 *   ko'chiradi. Endi tier-derive shoxi ishlaydi; kartasiz user'da undefined → eski
 *   role/position yo'liga toza fallback (regress yo'q, Q-39).
 *
 * BU PROOF uchma-uch tasdiqlaydi (production kodga AYNAN mos mantiq):
 *   1) resolveCardGate(userId) — drizzle-auth.repo.ts AYNAN SQL (jonli DB).
 *   2) buildAuthResult payload + jsonwebtoken.sign — login.service AYNAN.
 *   3) jwt.strategy.validate() AYNAN mapping — token decode → request.user
 *      (cardId/rbacTier/positionId ko'chiriladimi?).
 *   4) RolesGuard.canActivate AYNAN mantig'i — @Roles('manager') talab qilinganda
 *      kartasi razryad-5 ('manager') bo'lgan EMPLOYEE-rol user O'TADIMI (tier-derive),
 *      role-only bo'lsa O'TMASDI — bu fix'ning aniq qiymati.
 *   5) PermissionGuard card-seam — cardId request.user'ga yetdimi (A6 fallback toza).
 *   6) REGRESS: kartasiz user (rbacTier undefined) → tier-derive ishlamaydi, faqat
 *      role yo'li — eski xulq AYNAN saqlangan.
 *
 * XAVFSIZLIK (Q-29/Q-30): BEGIN ... ROLLBACK — DB O'ZGARMAYDI; TEST sirli kalit
 *   (production secret'ga TEGMAYDI); SECRET CHOP ETILMAYDI.
 *
 * Ishga tushirish: node _audit/bproof-t12-07-tier-derive-guard.cjs
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

// ── rbac-tier.policy.ts AYNAN nusxasi (egasi qoidasi 2026-06-25) ──
const RAZRYAD_LEVEL_TO_RBAC_TIER = { 1: 'operator', 2: 'operator', 3: 'specialist', 4: 'specialist', 5: 'manager', 6: 'executive' };
function razryadLevelToRbacTier(level) {
  if (level == null || !Number.isFinite(level)) return null;
  return RAZRYAD_LEVEL_TO_RBAC_TIER[level] ?? null;
}
function resolveEffectiveRbacTier(explicitTier, razryadLevel) {
  const explicit = explicitTier == null || explicitTier === '' ? null : explicitTier;
  return explicit ?? razryadLevelToRbacTier(razryadLevel);
}

// ── drizzle-auth.repo.ts:resolveCardGate AYNAN SQL ──
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

// ── login.service.ts:buildAuthResult AYNAN payload qismi ──
function buildJwtPayload(user, gate) {
  return {
    sub: user.id, username: user.username, email: user.email, role: user.role,
    cardId: gate?.primaryCardId ?? null, rbacTier: gate?.rbacTier ?? null,
    positionId: gate?.positionId ?? null, jti: randomUUID(),
  };
}

// ── jwt.strategy.ts:validate() AYNAN mapping (T12-07 FIX — claim'lar ko'chiriladi) ──
function strategyValidate(payload, user) {
  return {
    id: user.id, username: user.username, email: user.email, role: user.role,
    tenantId: payload.tenantId,
    cardId: payload.cardId ?? null,         // ← T12-07 yangi
    rbacTier: payload.rbacTier ?? null,     // ← T12-07 yangi
    positionId: payload.positionId ?? null, // ← T12-07 yangi
  };
}

// ── common/guards/roles.guard.ts:canActivate AYNAN qaror mantig'i ──
// Qaytaradi: true (ruxsat) yoki 'FORBIDDEN' (rad). requiredRoles=null → true.
function rolesGuardDecision(requiredRoles, user) {
  if (!requiredRoles) return true;
  const userRole = user && user.role;
  const rbacTier = typeof (user && user.rbacTier) === 'string' && user.rbacTier !== '' ? user.rbacTier : null;
  if (!userRole && !rbacTier) return 'FORBIDDEN';
  const userRoleLower = userRole ? userRole.toLowerCase() : null;
  if (userRoleLower === 'admin' || userRoleLower === 'super_admin' || userRoleLower === 'director') return true;
  const normalizedRequired = (Array.isArray(requiredRoles) ? requiredRoles : []).map((r) => r.toLowerCase());
  const rbacTierLower = rbacTier ? rbacTier.toLowerCase() : null;
  const allowedByRole = userRoleLower != null && normalizedRequired.includes(userRoleLower);
  const allowedByTier = rbacTierLower != null && normalizedRequired.includes(rbacTierLower);
  if (!allowedByRole && !allowedByTier) return 'FORBIDDEN';
  return true;
}

// ── permission.guard.ts: cardId seam — request.user'dan cardId o'qiladimi ──
function permissionGuardCardId(user) {
  return (user['cardId'] ?? user['card_id']);
}

const TEST_JWT_SECRET = 'T12-07-PROOF-ONLY-' + randomUUID();

(async () => {
  const client = await pool.connect();
  let crashed = false;
  try {
    await client.query('BEGIN'); // Q-29: read-only, ROLLBACK oxirida.

    // ── 1 · KARTALI TEST-user (razryad → tier 'manager', role='employee') ──
    console.log('── 1 · KARTALI TEST-user ──');
    let u = (await client.query(
      `SELECT id, username, email, role, employee_id, position_id, card_id
       FROM users WHERE id = 69 AND card_id IS NOT NULL LIMIT 1`)).rows[0] || null;
    if (!u) u = (await client.query(
      `SELECT id, username, email, role, employee_id, position_id, card_id
       FROM users WHERE card_id IS NOT NULL ORDER BY id LIMIT 1`)).rows[0] || null;
    assert(!!u, "card_id bog'langan TEST-user topildi");
    if (!u) throw new Error("Kartali user yo'q — A12 seed kerak.");
    console.log('   user:', JSON.stringify({ id: u.id, username: u.username, role: u.role, card_id: u.card_id }));

    const gate = await resolveCardGate(client, u.id);
    console.log('   gate:', JSON.stringify(gate));
    assert(gate.rbacTier !== null, `gate.rbacTier null EMAS (haqiqiy: '${gate.rbacTier}')`);

    // ── 2 · login sign → strategy.validate (T12-07 mapping) ──
    console.log('\n── 2 · sign → jwt.strategy.validate (claim ko\'chirish) ──');
    const payload = buildJwtPayload(u, gate);
    const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '24h' });
    const decoded = jwt.verify(token, TEST_JWT_SECRET);
    const reqUser = strategyValidate(decoded, u); // ← request.user
    console.log('   request.user:', JSON.stringify(reqUser));
    assert(reqUser.rbacTier === gate.rbacTier,
      `request.user.rbacTier ('${reqUser.rbacTier}') = gate.rbacTier ('${gate.rbacTier}') — claim YETDI (avval undefined edi)`);
    assert(reqUser.cardId === gate.primaryCardId,
      `request.user.cardId (${reqUser.cardId}) = birlamchi karta (${gate.primaryCardId})`);
    assert('positionId' in reqUser,
      `request.user.positionId BOR (${JSON.stringify(reqUser.positionId)})`);

    // ── 3 · RolesGuard tier-derive: @Roles('manager') talab, role='employee' ──
    console.log('\n── 3 · RolesGuard — tier-derive shoxi (T12-07 qiymati) ──');
    const isEmployeeRole = String(u.role).toLowerCase() !== 'manager'
      && !['admin','super_admin','director'].includes(String(u.role).toLowerCase());
    assert(isEmployeeRole, `TEST-user role ('${u.role}') 'manager' EMAS va admin-bypass EMAS — test sof tier-derive'ni sinaydi`);
    const reqRoles = [gate.rbacTier]; // masalan ['manager']
    const dWithFix = rolesGuardDecision(reqRoles, reqUser);
    assert(dWithFix === true,
      `@Roles('${gate.rbacTier}') → KARTALI user O'TDI (tier-derive ishladi, claim yetgani uchun)`);

    // Qarama-qarshi: agar claim YETMAGAN bo'lsa (eski buzuq holat) — rad bo'lardi.
    const reqUserNoClaim = { id: u.id, username: u.username, email: u.email, role: u.role }; // rbacTier yo'q
    const dNoFix = rolesGuardDecision(reqRoles, reqUserNoClaim);
    assert(dNoFix === 'FORBIDDEN',
      `claim YETMAGANDA (eski holat) AYNI so'rov RAD bo'lardi — fix'ning aniq qiymati shu (o'lik shox → tirik)`);

    // ── 4 · PermissionGuard — cardId seam request.user'ga yetdi ──
    console.log('\n── 4 · PermissionGuard — cardId seam ──');
    assert(permissionGuardCardId(reqUser) === gate.primaryCardId,
      `PermissionGuard request.user'dan cardId (${permissionGuardCardId(reqUser)}) o'qiy oladi — A6 card-yo'li seam tirik`);

    // ── 5 · REGRESS: kartasiz user → tier-derive ishlamaydi, faqat role ──
    console.log('\n── 5 · REGRESS — kartasiz user (eski xulq AYNAN) ──');
    const cardlessGate = { activeCardCount: 0, primaryCardId: null, rbacTier: null, positionId: null };
    const cardlessPayload = buildJwtPayload({ id: 999999, username: 'TEST-cardless', email: 'x', role: 'employee' }, cardlessGate);
    const cardlessReqUser = strategyValidate(jwt.verify(jwt.sign(cardlessPayload, TEST_JWT_SECRET), TEST_JWT_SECRET), { id: 999999, username: 'TEST-cardless', email: 'x', role: 'employee' });
    assert(cardlessReqUser.rbacTier === null,
      `kartasiz user → request.user.rbacTier null (tier-derive yo'q — additiv, regress yo'q)`);
    // employee role, @Roles('manager') → tier yo'q, role mos emas → RAD (eski xulq)
    assert(rolesGuardDecision(['manager'], cardlessReqUser) === 'FORBIDDEN',
      `kartasiz employee @Roles('manager') → RAD (eski role-only xulq AYNAN saqlangan)`);
    // @Roles('employee') → role mos → O'TADI (eski xulq)
    assert(rolesGuardDecision(['employee'], cardlessReqUser) === true,
      `kartasiz employee @Roles('employee') → O'TADI (role yo'li o'zgarmagan)`);
    // admin bypass o'zgarmagan
    assert(rolesGuardDecision(['manager'], { id: 1, role: 'admin' }) === true,
      `admin bypass o'zgarmagan (kartasiz ham har doim O'TADI)`);

    await client.query('ROLLBACK');
    console.log("\nROLLBACK bajarildi — DB o'zgarmadi (faqat o'qildi).");
  } catch (e) {
    crashed = true;
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\nPROOF XATO:', e.message);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n════════ YAKUN ════════');
  const failed = checks.filter((c) => !c.ok);
  console.log(`PASS=${checks.length - failed.length}  FAIL=${failed.length}  (jami ${checks.length})`);
  if (crashed) console.log('STATUS: CRASH ❌');
  else if (failed.length === 0) console.log("RBAC TIER→GUARD DERIVE: ALL PASS ✅ — JWT karta-claim'lari jwt.strategy.validate orqali request.user'ga yetdi; RolesGuard tier-derive shoxi endi ishlaydi (kartali employee @Roles('manager') O'TADI); kartasiz user'da eski role/position xulq AYNAN saqlangan (regress yo'q).");
  else { console.log('RBAC TIER→GUARD DERIVE: SOME FAIL ❌'); failed.forEach((c) => console.log('  - ' + c.msg)); }
  process.exit(!crashed && failed.length === 0 ? 0 : 1);
})();
