# FAZA 01 — Xodim↔Karta KO'P-KARTA + Lifecycle (BAJARUVCHI DIREKTIVASI)

> **Bajaruvchi:** Muslimbek (🟢 Bajaruvchi-rol, Q-23/Q-27).
> **Manba-reja:** [`00-MASTER-REJA.md`](00-MASTER-REJA.md) FAZA 1.
> **Bog'liqlik:** FAZA 0 (kanonik karta = `org_departments`; `employee_cards.card_id` FK → `org_departments`) BAJARILGAN bo'lishi SHART. Agar Faza 0 hali tugamagan bo'lsa, ushbu direktivaning §3.0 "OLD-GATE" bo'limini birinchi bajaring (FK holatini tekshirish + himoya).
> **Spec manba:** `decisions/01-org-kartalar.md` EP-ORG-004 / EP-ORG-066 / EP-ORG-142 / EP-ORG-006 / EP-ORG-038 / EP-ORG-060 / EP-ORG-083..086 / Q2 / Q12 / Q50 / Q97.
> **Egasi qarori (2026-06-25):** KO'P-karta — bitta xodim bir nechta kartani egallaydi; oylik = stavka-ulushlar yig'indisi (0.5 + 0.5 ≤ 1.0; oshsa OWNER ruxsati). "100%" = MEXANIZM 100% (struktura + gate + dizayn TO'G'RI ishlaydi; data egasidan keladi). FABRIKATSIYA TAQIQ.

---

## 0. ROL + QOIDALAR BLOKI (har sessiya boshida o'qi — Q-37)

Sen 🟢 **Bajaruvchi**san. Quyidagi qoidalar MAJBURIY va bu direktivaning HAR bosqichida amal qiladi:

### 0.1 Kod uslubi (LOYIHA_QOIDALARI Qoida 1-16)
- **Result<T>** — barcha repository/service metodi `Promise<Result<T>>` qaytaradi. `return null`/`undefined`/`throw new Error()` TAQIQ. `Ok()`/`Err()`/`AppErr()` ishlat (`@common/result`).
- **Zod** — har `@Body()` qabul qiladigan controller metodi Zod schema bilan `.parse()` qiladi. `class-validator` TAQIQ.
- **Drizzle ORM** — oddiy CRUD Drizzle bilan. Raw `sql` faqat ifodalab bo'lmaydigan murakkab holatlarda (recursive CTE, cross-module UPDATE) + `RULE4_EXCEPTION:` izoh bilan. `sql.raw(variable)` MUTLAQO TAQIQ (SQL injection).
- **Array xavfsizligi (Qoida 2):** `.map/.filter/.reduce/.find` dan OLDIN `Array.isArray()`.
- **Fayl ≤900 qator, funksiya ≤150 qator (Qoida 13).** Oshsa bo'lakla.
- **Magic number (Qoida 12):** biznes-raqamlar `apps/api/src/common/constants/business.constants.ts` da nomlangan konstanta.
- **Controller faqat transport (Qoida 6):** biznes-logika service/repo da.
- **Guard (Qoida 8):** controller `@UseGuards(JwtAuthGuard)` yoki `@Public()`.

### 0.2 Regress-himoya (Q-39 / Q-46) 🔴
- **Ishlab turgan + TO'G'RI kod O'CHIRILMAYDI.** EmployeesTab dagi mavjud xodim-kartochka, salary ko'rsatish, navigate — saqlanadi.
- **To'g'ri ISHLAMAYDIGAN kod (soxta/o'lik/dublikat/yarim) TO'LIQ o'chiriladi** — chala qoldirilmaydi. O'chirishdan oldin: (1) Q-29 verify ishlamasligini tasdiqla, (2) import-yo'qligini Grep bilan tekshir.
- **O'chirilgan narsa QAYTA yaratilmaydi.** Faza 0 da `org_functions` retire qilingan bo'lsa, uni qayta ishlatma.

### 0.3 Fabrikatsiya TAQIQ (Q-40) 🔴
- Data/AI yo'q bo'lsa → STRUKTURA + GATE qur, egasi-data ro'yxatiga (§11) yoz. SOXTA qiymat (hardcoded oylik, echo javob, fake-create) YOZMA.
- Stake-ulush DATA (kim qaysi kartada qancha ulush) — PRODUCTIONDA HR/egasi to'ldiradi. Default mexanizm: `is_primary=true && yagona aktiv link → 1.0`, aks holda NULL (egasi taqsimlaydi). Hech qachon soxta 0.5 tarqatma.

### 0.4 Verify (Q-29 / Q-32 / Q-40) 🔴
- Har bosqich oxiri: `tsc` GREEN (o'z fayllarda 0 xato) + END-TO-END **rollback-tx DB-proof** (`_audit/bproof-*.cjs`: kirit → oqdi → ko'rindi → ROLLBACK) + JONLI isbot (curl yoki FE round-trip).
- Struktura-only YETARLI EMAS. "Yashil lekin noto'g'ri" TAQIQ — biznes-qoida (ulush ≤1.0, karta-band rad, oylik = ulush×koeff×baza) DB-proof bilan tasdiqlanadi.
- Lokal/server tushsa (Q-44 Windows nest-watch): static fallback (tsc + diff o'qish + rollback-tx DB-proof). Jonli-HTTP server qaytgach.

### 0.5 Dizayn (Q-3 / Qoida 21/41/42/43) 🎨
- EP token (`var(--ep-*)` / `var(--mod-*)`) yoki semantic Tailwind class. Inline xom rang (`style={{color:'#fff'}}`) BLOK; Tailwind arbitrary hex (`text-[#abc]`) WARN.
- Yangi forma = mavjud komponent (`components/ui/dialog`, `components/ep/*`) + props; o'zboshimcha layout TAQIQ.
- Tab ≤2 daraja.
- **Forma REAL saqlaydi (F1/F2):** FE mutation (POST/PATCH) → BE endpoint → real INSERT/UPDATE → DB → qayta yuklashda ko'rinadi. "Ko'rinadi lekin saqlamaydi" TAQIQ.
- `useQuery` → `isLoading` skeleton (F1). `useMutation` → `onError` toast (F2).

### 0.6 Migration (Q-35) 🔴
- Yangi ustun/index `migrations-drift.ts` da idempotent (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE [UNIQUE] INDEX IF NOT EXISTS`).
- `CREATE TABLE`/`DROP` faqat `// APPROVED:` izoh bilan. Bu fazada YANGI JADVAL YO'Q (faqat `employee_cards` ga `stake_fraction` ustun + index — ALTER, owner §11 da tasdiqlangan).

### 0.7 Commit (GIT_QOIDALARI) 🔴
- Faqat o'z fayllar: `git add <aniq-fayl>` — `git add -A`/`git add .` MUTLAQO TAQIQ (boshqa sessiya ishini supuradi, Qoida 23).
- `git commit --no-verify` (pre-commit hook bypass faqat sabab bilan).
- Commit oxiriga: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Har bosqich oxirida commit (Q-33 boshlangan ish to'liq).

### 0.8 Atama
- Muloqotda doim **"karta"** (node/tugun EMAS). Kod-izohlarda "karta" + texnik nom (`org_departments`).

---

## 1. KONTEKST VA MAQSAD

### 1.1 Vizyon (egasi tilidan)
> "Bitta xodim bir nechta kartaga ega bo'lishi mumkin. Oylik = biriktirilgan kartalar oyliklari yig'indisi; har kartaga stavka-ulush (0.5 + 0.5 = 1.0); jami 1.0 dan oshmasin, oshsa OWNER ruxsati bilan. Karta-tomon esa doim 1 o'rin = 1 xodim. Xodim ketsa karta vakant bo'ladi (muzlatish), qaytsa restore. Vakant karta → HR talabnoma → recruitment → kartaga avtomatik biriktirish."

### 1.2 Bu faza nimani hal qiladi
ORGSXEMA-INTERVYU auditi (2026-06-25) bo'yicha **xodim-karta mavzusi 38%**. Bu fazada quyidagi BOSHLIQLAR yopiladi:

| EP-ORG | Talab | Hozir | Bu faza |
|--------|-------|-------|---------|
| EP-ORG-004 | 1 xodim → ko'p karta | `assignUser` 1:1 (eski karta o'chadi) | M:N — eski link saqlanadi |
| EP-ORG-066 / 142 | Oylik = ulush-yig'indi (0.5+0.5≤1.0) | oddiy SUM, ulush YO'Q | `stake_fraction` + ulush-yig'indi + cap-guard |
| Q2 / Q12 / Q97 | Jami ulush >1.0 blok + owner-override | YO'Q (ustun 0) | DB CHECK-mexanizm + app guard + override endpoint |
| EP-ORG-006 / 084 / 086 | Xodim ketsa freeze→vakant, qaytsa restore | qo'lda status PATCH, zanjir yo'q | freeze/restore lifecycle endpoint |
| EP-ORG-038 | Vakant → recruitment → avto-bind | YO'Q | recruitment yopilganda kartaga bind |
| EP-ORG-002 | Karta-tomon 1 o'rin = 1 xodim | guard BOR (saqlanadi) | guard QOLADI (position-type) |

### 1.3 Maqsad (mexanizm 100%)
1. Xodim 2+ kartaga ulanadi; eski bog'lanish SAQLANADI (1:1 "delete-previous" OLIB TASHLANADI).
2. Har bog'lanishda `stake_fraction` (ulush) bor; xodim bo'yicha aktiv ulushlar yig'indisi >1.0 → RAD (owner-override bilan ruxsat).
3. Karta-tomon 1-seat guard (position-type) QOLADI — band karta 2-xodimni rad qiladi.
4. Freeze/restore lifecycle: xodim ketsa karta `vacant`, link muzlaydi; qaytsa restore.
5. Vakant karta → recruitment yopilganda kartaga avto-bind.
6. `orgnode/EmployeesTab.tsx` ko'p-karta + ulush ko'rsatadi, ulush bilan biriktiradi.

---

## 2. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan 2026-06-25)

### 2.1 Ikki binding-jadval (DB-fakt)
`node _audit/q.cjs` bilan tasdiqlangan:

| Jadval | Qator | FK | is_active | stake | acting | Kim o'qiydi |
|--------|-------|----|-----------| ------|--------|-------------|
| `employee_org_departments` | **30** | `org_department_id` → `org_departments` | YO'Q ustun | YO'Q | YO'Q | AKTIV: tree, EmployeesTab, node-detail (`org-queries.repo.ts:153`) |
| `employee_cards` | **30** | `card_id` → **`org_functions`** (Faza 0 da → org_departments) | BOR | YO'Q (`stake_fraction` YO'Q) | `is_acting`/`acting_supplement` | M:N dunyo: `card.service.ts`/`card.repository.ts` |

**Muhim:** `employee_org_departments` da **`is_active` ustuni YO'Q** va **`stake_fraction` YO'Q**. `employee_cards` da `uq_employee_cards_active_link` (UNIQUE `(employee_id, card_id) WHERE is_active`) BOR, lekin `stake_fraction` YO'Q.

`employee_cards` ustunlari (jonli): `id, employee_id, card_id, is_primary, is_active, assigned_at, ended_at, created_at, updated_at, is_acting, acting_supplement`.

`employee_org_departments` ustunlari (jonli): `id, user_id, org_department_id, is_primary, assigned_at, employee_id, department_id, role, ...`.

**Namuna data:** user_id 35 va 36 ikkalasi `org_department_id=20` (department-type guruh-karta → ko'p tutadi; bu to'g'ri). 30 xodim, har biri aynan 1 aktiv `employee_org_departments` link.

### 2.2 ASOSIY MUAMMO — 1:1 "delete-previous"
**Fayl:** `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts:146-172`

```typescript
// 162-166-satr — XATO: xodimning HAMMA oldingi linkini o'chiradi (1 xodim = 1 karta)
async assignUser(userId: number, nodeId: number): Promise<{ assigned: boolean; reason?: string }> {
  // ... node lookup + 1-seat guard (154-160) ...
  // 1 xodim = 1 karta — xodimning oldingi bog'lanishi(lari) o'chadi (ko'chish).
  await db.delete(employeeOrgDepartments).where(eq(employeeOrgDepartments.user_id, userId));   // ← BUNI OLIB TASHLA
  await db
    .insert(employeeOrgDepartments)
    .values({ user_id: userId, org_department_id: nodeId, is_primary: true });
  // ...
}
```

Bu `EP-ORG-004` (ko'p-karta) vizyoniga ZID. Bu fazada `delete`-qatori olib tashlanadi va ulush + cap-guard qo'shiladi.

### 2.3 Karta-tomon 1-seat guard (SAQLANADI)
`org-mutations.repo.ts:154-160`:
```typescript
if (node.node_type === 'position') {
  const occupants = await db.select(...).from(employeeOrgDepartments)
    .where(and(eq(org_department_id, nodeId), ne(user_id, userId)));
  if (occupants.length > 0) return { assigned: false, reason: "Karta band — 1 o'rin = 1 xodim" };
}
```
Bu TO'G'RI (EP-ORG-002) — QOLADI. `card.service.ts:53 canAssignEmployee` (org_functions tomonda) ham bor — Faza 0 dan keyin bu ham `org_departments` ga ishlaydi.

### 2.4 Mavjud M:N oylik-SUM (ulushsiz)
`card.repository.ts:344 employeeSalaryTotal` — `SUM(max_salary) + SUM(acting_supplement)` — **ulush YO'Q, cap YO'Q**. Bu Faza 4 (payroll) da to'liq ishlatiladi; bu fazada `stake_fraction` ustun + ulush-yig'indi gate qo'shiladi (mexanizm), oylik formulasi to'liq Faza 4 da ulanadi.

### 2.5 FE EmployeesTab (1:1 matn)
`artifacts/erp-dashboard/src/components/hr/orgnode/EmployeesTab.tsx`:
- 173-satr: `t("birXodimBirKarta", "1 xodim = 1 karta — biriktirilsa, xodim oldingi kartasidan ko'chadi.")` — bu matn ko'p-kartaga MOS EMAS, o'zgaradi.
- Ulush (stake) maydoni YO'Q — biriktirish dialogiga qo'shiladi.
- `NodeEmployee` type (`types.ts:6-15`) — `stakeFraction` maydoni YO'Q, qo'shiladi.

### 2.6 Node-detail read (employees)
`org-queries.repo.ts:153-162` — `employee_org_departments` dan o'qiydi, faqat `id/firstName/lastName/fullName/phone`. Ulush + ko'p-karta belgisi YO'Q — qo'shiladi.

---

## 3. BOSQICHMA-BOSQICH IJRO

> Tartib MAJBURIY (har bosqich oldingiga bog'liq). Har bosqich: fayl → OLDIN → KEYIN → sabab → verify → commit.

### 3.0 OLD-GATE — Faza 0 holatini tekshir (BLOKLOVCHI)

**Maqsad:** `employee_cards.card_id` FK qaysi jadvalga qaratilganini aniqlash. Bu faza `org_departments` ni kanonik deb hisoblaydi.

```bash
node _audit/q.cjs "SELECT ccu.table_name AS foreign_table FROM information_schema.table_constraints tc JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name='employee_cards' AND tc.constraint_name='employee_cards_card_id_fkey'"
```

- Agar `org_departments` qaytsa → Faza 0 tugagan, davom et.
- Agar `org_functions` qaytsa → Faza 0 HALI TUGAMAGAN. **TO'XTA** va egasiga xabar ber: "Faza 0 (FK re-point) avval bajarilishi kerak." Bu fazada `org_functions` ga YOZMA (regress-himoya, retire qilinayotgan jadval).

**MUHIM ARXITEKTURA QARORI (bosh-dasturchi):** Bu fazada YAGONA aktiv binding-jadval = **`employee_org_departments`** (FE/tree/node-detail shuni o'qiydi, 30 jonli qator). `stake_fraction` + `is_active` + freeze SHU JADVALGA qo'shiladi. `employee_cards` (M:N + acting + salary-total) — Faza 4/payroll uchun parallel hisoblash qatlami; uni buzMA, lekin yangi ulush-mexanizm `employee_org_departments` ustida quriladi (FE shuni ishlatadi). Ikkala jadval Faza 8 da to'liq konvergatsiya qilinadi — bu fazada `employee_org_departments` kanonik biriktirish, `employee_cards` esa salary-komponent manbai.

> Sabab: FE va node-detail `employee_org_departments` ni o'qiydi; agar ulush `employee_cards` ga yozilsa, FE ko'rmaydi (ikki-olam davom etadi). Egasi "mexanizm TO'G'RI ishlaydi" deydi — demak FE ko'radigan jadvalga yozamiz.

---

### 3.1 BOSQICH 1 — DB migration: `stake_fraction` + `is_active` + freeze ustunlari + indekslar

**Fayl:** `migrations-drift.ts` (idempotent ALTER bloki). Avval faylni top:
```bash
find apps/api/src -name "migrations-drift.ts" -o -name "migrations-drift*.ts" | head
```

**OLDIN:** `employee_org_departments` da `is_active`, `stake_fraction`, `frozen_at`, `freeze_reason`, `ended_at` YO'Q.

**KEYIN — quyidagi idempotent blokni qo'sh:**

```typescript
// APPROVED (egasi 2026-06-25, MASTER-REJA Faza 1): xodim↔karta ko'p-karta + ulush + freeze.
// employee_org_departments = kanonik aktiv binding (FE/tree shuni o'qiydi). Faqat ALTER — yangi jadval YO'Q.
await db.execute(sql.raw(`
  ALTER TABLE employee_org_departments
    ADD COLUMN IF NOT EXISTS is_active     boolean       NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS stake_fraction numeric(4,3),                -- 0.000..1.000; NULL = egasi taqsimlamagan
    ADD COLUMN IF NOT EXISTS frozen_at      timestamptz,                 -- muzlatilgan vaqt (EP-ORG-084)
    ADD COLUMN IF NOT EXISTS freeze_reason  text,                        -- muzlatish sababi
    ADD COLUMN IF NOT EXISTS freeze_until   timestamptz,                 -- muzlatish muddati (NULL = muddatsiz)
    ADD COLUMN IF NOT EXISTS ended_at       timestamptz;                 -- bog'lanish tugagan vaqt
`));

// Ulush 0..1 oralig'ida bo'lsin (NULL ruxsat — egasi keyin to'ldiradi). FABRIKATSIYA emas: faqat chegara.
await db.execute(sql.raw(`
  ALTER TABLE employee_org_departments
    DROP CONSTRAINT IF EXISTS chk_eod_stake_range;
  ALTER TABLE employee_org_departments
    ADD  CONSTRAINT chk_eod_stake_range
    CHECK (stake_fraction IS NULL OR (stake_fraction >= 0 AND stake_fraction <= 1));
`));

// Karta-tomon 1-seat (position) himoyasini DB darajasida — faqat position-kartalar uchun emas,
// chunki department guruh-karta ko'p tutadi. Shuning uchun DB partial-unique QO'YILMAYDI (app guard yetarli).
// O'rniga: tezkor o'qish uchun index.
await db.execute(sql.raw(`
  CREATE INDEX IF NOT EXISTS ix_eod_user_active
    ON employee_org_departments (user_id) WHERE is_active = true;
  CREATE INDEX IF NOT EXISTS ix_eod_node_active
    ON employee_org_departments (org_department_id) WHERE is_active = true;
`));
```

**Sabab:** ulush + freeze maydonlari FE ko'radigan jadvalga (mexanizm 100%). CHECK faqat chegara (fabrikatsiya emas — NULL ruxsat). Partial-unique DB-da QO'YILMAYDI, chunki department guruh-kartalari ko'p xodim tutadi (live: user 35,36 → node 20); 1-seat app-guard (position-type) da qoladi.

**Backfill (idempotent, fabrikatsiya emas):** mavjud 30 link `is_active=true` (default). `stake_fraction` — agar xodimning aktiv linki YAGONA bo'lsa → 1.0 (mantiqan to'liq stavka), aks holda NULL (egasi taqsimlaydi):
```typescript
await db.execute(sql.raw(`
  UPDATE employee_org_departments eod
  SET stake_fraction = 1.0
  WHERE stake_fraction IS NULL AND is_active = true
    AND (SELECT COUNT(*) FROM employee_org_departments x
         WHERE x.user_id = eod.user_id AND x.is_active = true) = 1;
`));
```
> Bu fabrikatsiya EMAS: yagona kartali xodim 1.0 ulushga ega — bu mantiqiy haqiqat, taxmin emas. Ko'p kartali xodim NULL qoladi (egasi taqsimlaydi).

**Verify (DB-proof):**
```bash
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='employee_org_departments' AND column_name IN ('is_active','stake_fraction','frozen_at','freeze_reason','freeze_until','ended_at') ORDER BY column_name"
node _audit/q.cjs "SELECT conname FROM pg_constraint WHERE conname='chk_eod_stake_range'"
node _audit/q.cjs "SELECT count(*) FILTER (WHERE stake_fraction=1.0) AS solo, count(*) FILTER (WHERE stake_fraction IS NULL) AS multi FROM employee_org_departments WHERE is_active"
```
Kutilgan: 6 ustun, 1 constraint, solo=30 (hozir hammasi yagona link).

**Commit:** `git add <migrations-drift.ts> && git commit --no-verify -m "Faza1.1: employee_org_departments stake_fraction+is_active+freeze ustunlari (APPROVED)"`

---

### 3.2 BOSQICH 2 — `assignUser` dan 1:1 "delete-previous" OLIB TASHLA + ulush + cap-guard

**Fayl:** `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts:146-172`

**OLDIN (joriy):**
```typescript
async assignUser(userId: number, nodeId: number): Promise<{ assigned: boolean; reason?: string }> {
  const [node] = await db.select({ id: orgDepartments.id, node_type: orgDepartments.node_type })
    .from(orgDepartments).where(eq(orgDepartments.id, nodeId)).limit(1);
  if (!node) return { assigned: false, reason: 'Karta topilmadi' };

  if (node.node_type === 'position') {
    const occupants = await db.select({ user_id: employeeOrgDepartments.user_id })
      .from(employeeOrgDepartments)
      .where(and(eq(employeeOrgDepartments.org_department_id, nodeId), ne(employeeOrgDepartments.user_id, userId)));
    if (occupants.length > 0) return { assigned: false, reason: "Karta band — 1 o'rin = 1 xodim" };
  }

  // 1 xodim = 1 karta — xodimning oldingi bog'lanishi(lari) o'chadi (ko'chish).
  await db.delete(employeeOrgDepartments).where(eq(employeeOrgDepartments.user_id, userId));
  await db.insert(employeeOrgDepartments).values({ user_id: userId, org_department_id: nodeId, is_primary: true });

  if (node.node_type === 'department' || node.node_type === null) {
    await runQuery(sql`UPDATE users SET department_id = ${nodeId} WHERE id = ${userId}`);
  }
  return { assigned: true };
}
```

**KEYIN (ko'p-karta + ulush + cap-guard):**
```typescript
/**
 * VISION (egasi 2026-06-25): KO'P-KARTA. Bitta xodim bir nechta kartaga ulanadi (EP-ORG-004).
 *   - KARTA-tomon (EP-ORG-002): position (o'rindiq) band bo'lsa — boshqa faol xodim bilan — RAD.
 *     department/section guruh-kartalari ko'p tutadi.
 *   - XODIM-tomon (EP-ORG-066/142): har bog'lanishda ulush (stake_fraction); aktiv ulushlar
 *     yig'indisi >1.0 → RAD, owner-override (allowOverload) bilan ruxsat.
 *   - Eski link SAQLANADI (1:1 "delete-previous" OLIB TASHLANDI). Idempotent: shu karta-shu xodim
 *     aktiv link bo'lsa — qayta INSERT yo'q, faqat ulush yangilanadi.
 */
async assignUser(
  userId: number,
  nodeId: number,
  stakeFraction: number | null = null,
  allowOverload = false,
): Promise<{ assigned: boolean; reason?: string }> {
  const [node] = await db
    .select({ id: orgDepartments.id, node_type: orgDepartments.node_type })
    .from(orgDepartments)
    .where(eq(orgDepartments.id, nodeId))
    .limit(1);
  if (!node) return { assigned: false, reason: 'Karta topilmadi' };

  // KARTA-tomon 1-seat guard (position) — SAQLANADI (EP-ORG-002).
  if (node.node_type === 'position') {
    const occupants = await db
      .select({ user_id: employeeOrgDepartments.user_id })
      .from(employeeOrgDepartments)
      .where(and(
        eq(employeeOrgDepartments.org_department_id, nodeId),
        eq(employeeOrgDepartments.is_active, true),
        ne(employeeOrgDepartments.user_id, userId),
      ));
    if (occupants.length > 0) return { assigned: false, reason: "Karta band — 1 o'rin = 1 xodim" };
  }

  // XODIM-tomon ulush-cap guard (EP-ORG-066/142, Q2/Q12/Q97).
  // Yangi ulush qo'shilganda jami >1.0 bo'lsa → owner-override talab qilinadi.
  if (stakeFraction != null) {
    const existing = (await runQuery<{ total: string }>(sql`
      SELECT COALESCE(SUM(stake_fraction), 0)::numeric AS total
      FROM   employee_org_departments
      WHERE  user_id = ${userId} AND is_active = true
        AND  org_department_id <> ${nodeId}
    `)).rows;
    const currentTotal = Number(existing[0]?.total ?? 0);
    const newTotal = currentTotal + stakeFraction;
    if (newTotal > 1.0 && !allowOverload) {
      return {
        assigned: false,
        reason: `Ulush yig'indisi ${newTotal.toFixed(2)} > 1.0. Owner ruxsati (allowOverload) kerak.`,
      };
    }
  }

  // KO'P-KARTA: eski link SAQLANADI. Shu karta-shu xodim aktiv link bo'lsa → ulushni yangila (idempotent).
  // RULE4_EXCEPTION: ON CONFLICT-siz upsert mantiqi — bu jadvalda (user_id,node_id) unique yo'q
  // (department ko'p tutadi), shuning uchun SELECT-then-write. Parametrli sql — injection yo'q.
  const dup = (await runQuery<{ id: number }>(sql`
    SELECT id FROM employee_org_departments
    WHERE user_id = ${userId} AND org_department_id = ${nodeId} AND is_active = true LIMIT 1
  `)).rows;

  if (dup[0]) {
    await runQuery(sql`
      UPDATE employee_org_departments
      SET stake_fraction = ${stakeFraction}, updated_at = NOW()
      WHERE id = ${dup[0].id}
    `);
  } else {
    // is_primary: agar xodimning hech bir aktiv linki yo'q bo'lsa → bu birlamchi.
    const hasPrimary = (await runQuery<{ cnt: number }>(sql`
      SELECT COUNT(*)::int AS cnt FROM employee_org_departments
      WHERE user_id = ${userId} AND is_active = true AND is_primary = true
    `)).rows;
    const isPrimary = Number(hasPrimary[0]?.cnt ?? 0) === 0;
    await db.insert(employeeOrgDepartments).values({
      user_id: userId,
      org_department_id: nodeId,
      is_primary: isPrimary,
      is_active: true,
      stake_fraction: stakeFraction as unknown as number, // numeric — Drizzle-da string/number
    } as typeof employeeOrgDepartments.$inferInsert);
  }

  // department mirror (users.department_id) faqat birlamchi-kartaga (back-compat).
  if (node.node_type === 'department' || node.node_type === null) {
    await runQuery(sql`UPDATE users SET department_id = ${nodeId} WHERE id = ${userId} AND department_id IS NULL`);
  }
  return { assigned: true };
}
```

> Eslatma: `updated_at` ustuni `employee_org_departments` da bo'lmasligi mumkin. Avval tekshir:
> `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='employee_org_departments' AND column_name='updated_at'"`
> Yo'q bo'lsa: BOSQICH 1 migratsiyasiga `ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW()` qo'sh, yoki UPDATE dan `updated_at` ni olib tashla.

**Sabab:** EP-ORG-004 (ko'p-karta) + EP-ORG-066/142 (ulush-cap) + EP-ORG-002 (karta-tomon 1-seat) bir vaqtda. `delete` olib tashlandi → eski karta saqlanadi. Owner-override mexanizmi (Q97).

**Verify (DB-proof — bproof skript, §3.8):** xodimni 2 kartaga ula → ikkalasi ham `is_active=true` ko'rinadi; ulush 0.6+0.6 → RAD; allowOverload=true → ruxsat.

**Commit:** `git add <org-mutations.repo.ts> && git commit --no-verify -m "Faza1.2: assignUser ko'p-karta + stake-cap guard + owner-override (1:1 delete olib tashlandi)"`

---

### 3.3 BOSQICH 3 — Service + Controller: ulush + override parametrlari

**Fayl A:** `apps/api/src/modules/org-structure/org-structure.service.ts:218-225`

**OLDIN:**
```typescript
async assignUserToNode(userId: number, nodeId: number) {
  return safeCall(async () => {
    const r = await this.repo.assignUser(userId, nodeId);
    return r.assigned
      ? { assigned: true, message: 'Xodim kartaga biriktirildi' }
      : { assigned: false, message: r.reason ?? "Biriktirib bo'lmadi" };
  });
}
```

**KEYIN:**
```typescript
async assignUserToNode(
  userId: number,
  nodeId: number,
  stakeFraction: number | null = null,
  allowOverload = false,
) {
  return safeCall(async () => {
    const r = await this.repo.assignUser(userId, nodeId, stakeFraction, allowOverload);
    return r.assigned
      ? { assigned: true, message: 'Xodim kartaga biriktirildi' }
      : { assigned: false, message: r.reason ?? "Biriktirib bo'lmadi" };
  });
}
```

**Fayl B:** `apps/api/src/modules/org-structure.repository.ts` (mavjud `assignUser` shim, ~39-satr) — parametrlarni o't:
```typescript
// OLDIN
assignUser = (uid: number, nid: number) => this.mutations.assignUser(uid, nid);
// KEYIN
assignUser = (uid: number, nid: number, stake: number | null = null, overload = false) =>
  this.mutations.assignUser(uid, nid, stake, overload);
```

**Fayl C:** `apps/api/src/modules/org-structure/org-structure.controller.ts:208-214`

**OLDIN:**
```typescript
@Patch('users/:userId/node')
async assignUser(
  @Param('userId', ParseIntPipe) userId: number,
  @Body('nodeId') nodeId: number,
) {
  return unwrapOrInternal(await this.service.assignUserToNode(userId, nodeId));
}
```

**KEYIN (Zod body + ulush):**
```typescript
// Faylning yuqorisida, boshqa schema'lar yonida:
const AssignUserSchema = z.object({
  nodeId: z.coerce.number().int().positive(),
  stakeFraction: z.coerce.number().min(0).max(1).nullish(),   // 0..1; yo'q = NULL
  allowOverload: z.coerce.boolean().optional().default(false), // owner-override
});

@ApiOperation({ summary: 'Assign user (ko\'p-karta + ulush)' })
@ApiResponse({ status: 200, description: 'OK' })
@Patch('users/:userId/node')
async assignUser(
  @Param('userId', ParseIntPipe) userId: number,
  @Body() body: unknown,
) {
  const dto = AssignUserSchema.parse(body);
  return unwrapOrInternal(
    await this.service.assignUserToNode(userId, dto.nodeId, dto.stakeFraction ?? null, dto.allowOverload),
  );
}
```

**Sabab:** ulush + override FE dan BE ga oqishi (Zod whitelist, Qoida 3). `z.coerce` — FE string yuborsa ham number bo'ladi.

**Verify:** `tsc` GREEN. Curl:
```bash
curl -s -X PATCH localhost:3030/api/org-structure/users/35/node \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nodeId":21,"stakeFraction":0.5}' | head
```
Kutilgan: `{"assigned":true,...}` (user 35 endi 20 VA 21 kartada — eski 20 saqlanadi).

**Commit:** `git add <service> <repository> <controller> && git commit --no-verify -m "Faza1.3: assign endpoint ulush+override (Zod)"`

---

### 3.4 BOSQICH 4 — Owner-override alohida endpoint (allow-overload, muddatli)

Q97: "owner allow-overload endpoint muddatli". `allowOverload` flag bir martalik; lekin owner-tasdiq audit izi uchun alohida endpoint kerak.

**Fayl A:** `org-mutations.repo.ts` — yangi metod qo'sh (assignUser dan keyin):
```typescript
/**
 * EP-ORG-066/Q97 — Owner ruxsati bilan xodimning umumiy ulush-limitini muddatli ko'tarish.
 * Audit izi: kim, qachon, qancha, qachongacha. allow_overload_until > now() bo'lsa cap-guard yengillashadi.
 */
async setOverload(userId: number, until: string | null, approvedBy: number): Promise<Result<{ ok: boolean }>> {
  return safeCall(async () => {
    // RULE4_EXCEPTION: users-jadvaliga muddatli flag — auth modul sxemasi (cross-module), parametrli sql.
    await runQuery(sql`
      UPDATE users
      SET stake_overload_until = ${until}::timestamptz
      WHERE id = ${userId}
    `);
    // audit (mavjud audit_logs ga qo'lda yozuv emas — AuditInterceptor avto yozadi controller darajasida)
    return { ok: true };
  }, 'DB_ERROR');
}
```
> `users.stake_overload_until` ustuni yo'q bo'lsa BOSQICH 1 migratsiyasiga qo'sh: `ALTER TABLE users ADD COLUMN IF NOT EXISTS stake_overload_until timestamptz;` (APPROVED izoh bilan).

`assignUser` ichidagi cap-guardni yangilab, `allowOverload` yoki muddatli flagni hisobga ol:
```typescript
// cap-guard ichida, allowOverload tekshiruvidan oldin:
let overloadActive = allowOverload;
if (!overloadActive) {
  const ov = (await runQuery<{ active: boolean }>(sql`
    SELECT (stake_overload_until IS NOT NULL AND stake_overload_until > now()) AS active
    FROM users WHERE id = ${userId}
  `)).rows;
  overloadActive = ov[0]?.active === true;
}
if (newTotal > 1.0 && !overloadActive) { /* RAD */ }
```

**Fayl B:** controller — yangi endpoint:
```typescript
const OverloadSchema = z.object({
  until: z.string().datetime().nullish(),  // ISO8601 yoki NULL (muddatsiz emas — owner belgilaydi)
});

@ApiOperation({ summary: 'Owner: ulush-overload ruxsati (muddatli)' })
@Roles('admin', 'super_admin', 'director')   // faqat owner darajasi
@Patch('users/:userId/overload')
async setOverload(
  @Param('userId', ParseIntPipe) userId: number,
  @Body() body: unknown,
  @CurrentUser() user: { id: number },
) {
  const dto = OverloadSchema.parse(body);
  return unwrapOrInternal(await this.service.setUserOverload(userId, dto.until ?? null, user.id));
}
```
> `@CurrentUser()` dekoratori loyihada bormi tekshir: `grep -rn "CurrentUser" apps/api/src/common apps/api/src/modules/auth | head`. Yo'q bo'lsa `@Req()` dan `req.user.id` ol.

**Fayl C:** service:
```typescript
setUserOverload(userId: number, until: string | null, approvedBy: number) {
  return this.repo.setOverload(userId, until, approvedBy);
}
```

**Sabab:** Q97 — owner muddatli overload ruxsati, audit izi bilan, faqat owner-darajasi (`@Roles`).

**Verify:** override bermay 0.6+0.6 → RAD; `/overload` chaqirib until=kelajak → keyin 0.6+0.6 → ruxsat.

**Commit:** `git add <repo> <service> <controller> && git commit --no-verify -m "Faza1.4: owner overload muddatli endpoint (Q97)"`

---

### 3.5 BOSQICH 5 — Freeze/Restore lifecycle (EP-ORG-006/084/086)

Xodim ketsa karta vakant + link muzlaydi; qaytsa restore.

**Fayl A:** `org-mutations.repo.ts` — yangi metodlar:
```typescript
/**
 * EP-ORG-006/084 — Xodimning karta-bog'lanishini muzlatish (freeze). Link saqlanadi (tarix),
 * lekin is_active=false → oylik/ulush hisobidan tushadi, karta vakant ko'rinadi. Sabab + muddat majburiy.
 */
async freezeUserCard(userId: number, nodeId: number, reason: string, until: string | null): Promise<Result<{ frozen: boolean }>> {
  return safeCall(async () => {
    const r = (await runQuery<{ id: number }>(sql`
      UPDATE employee_org_departments
      SET is_active = false, frozen_at = NOW(), freeze_reason = ${reason}, freeze_until = ${until}::timestamptz
      WHERE user_id = ${userId} AND org_department_id = ${nodeId} AND is_active = true
      RETURNING id
    `)).rows;
    return { frozen: r.length > 0 };
  }, 'DB_ERROR');
}

/**
 * EP-ORG-086 — Muzlatilgan bog'lanishni tiklash (restore). Tarix to'liq saqlanadi.
 * Tiklashda karta-tomon 1-seat guard QAYTA tekshiriladi (boshqa xodim egallamagan bo'lishi kerak).
 */
async restoreUserCard(userId: number, nodeId: number): Promise<Result<{ restored: boolean; reason?: string }>> {
  return safeCall(async () => {
    const [node] = await db.select({ node_type: orgDepartments.node_type })
      .from(orgDepartments).where(eq(orgDepartments.id, nodeId)).limit(1);
    if (node?.node_type === 'position') {
      const occ = (await runQuery<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt FROM employee_org_departments
        WHERE org_department_id = ${nodeId} AND is_active = true AND user_id <> ${userId}
      `)).rows;
      if (Number(occ[0]?.cnt ?? 0) > 0) return { restored: false, reason: 'Karta band — boshqa xodim egalladi' };
    }
    const r = (await runQuery<{ id: number }>(sql`
      UPDATE employee_org_departments
      SET is_active = true, frozen_at = NULL, freeze_reason = NULL, freeze_until = NULL
      WHERE user_id = ${userId} AND org_department_id = ${nodeId} AND is_active = false
      RETURNING id
    `)).rows;
    return { restored: r.length > 0 };
  }, 'DB_ERROR');
}
```

**Fayl B:** controller — endpointlar:
```typescript
const FreezeSchema = z.object({
  nodeId: z.coerce.number().int().positive(),
  reason: z.string().min(1, 'Sabab majburiy'),       // EP-ORG-068: pul/holat o'zgarishida sabab majburiy
  until: z.string().datetime().nullish(),
});

@ApiOperation({ summary: 'Freeze xodim-karta bog\'lanishi' })
@Patch('users/:userId/freeze')
async freezeUserCard(@Param('userId', ParseIntPipe) userId: number, @Body() body: unknown) {
  const dto = FreezeSchema.parse(body);
  return unwrapOrInternal(await this.service.freezeUserCard(userId, dto.nodeId, dto.reason, dto.until ?? null));
}

@ApiOperation({ summary: 'Restore xodim-karta bog\'lanishi' })
@Patch('users/:userId/restore')
async restoreUserCard(@Param('userId', ParseIntPipe) userId: number, @Body() body: unknown) {
  const dto = z.object({ nodeId: z.coerce.number().int().positive() }).parse(body);
  return unwrapOrInternal(await this.service.restoreUserCard(userId, dto.nodeId));
}
```

**Fayl C:** service:
```typescript
freezeUserCard(userId: number, nodeId: number, reason: string, until: string | null) {
  return safeCall(async () => {
    const r = await this.repo.freezeUserCard(userId, nodeId, reason, until);
    if (!r.ok) return { frozen: false, message: r.error.message };
    return r.data.frozen ? { frozen: true, message: 'Bog\'lanish muzlatildi' } : { frozen: false, message: 'Aktiv bog\'lanish topilmadi' };
  });
}
restoreUserCard(userId: number, nodeId: number) {
  return safeCall(async () => {
    const r = await this.repo.restoreUserCard(userId, nodeId);
    if (!r.ok) return { restored: false, message: r.error.message };
    return r.data.restored
      ? { restored: true, message: 'Bog\'lanish tiklandi' }
      : { restored: false, message: r.data.reason ?? 'Muzlatilgan bog\'lanish topilmadi' };
  });
}
```

**Fayl D:** repository shim (`org-structure.repository.ts`):
```typescript
freezeUserCard = (uid: number, nid: number, reason: string, until: string | null) => this.mutations.freezeUserCard(uid, nid, reason, until);
restoreUserCard = (uid: number, nid: number) => this.mutations.restoreUserCard(uid, nid);
```

**Sabab:** EP-ORG-006/084/086 — freeze/restore zanjiri (sabab majburiy EP-ORG-068, restore-da 1-seat qayta tekshir). Bu fazada QO'LDA endpoint; offboarding avto-trigger BOSQICH 6 da.

**Verify:** freeze → link `is_active=false`, `frozen_at` to'ladi; restore → `is_active=true`, frozen-maydonlar NULL; band kartani restore → RAD.

**Commit:** `git add <repo> <service> <repository.ts> <controller> && git commit --no-verify -m "Faza1.5: freeze/restore lifecycle (EP-ORG-006/084/086)"`

---

### 3.6 BOSQICH 6 — Recruitment → vakant-karta → avto-bind (EP-ORG-038)

Vakant karta → HR talabnoma → recruitment yopilganda kartaga avto-biriktirish.

**Tekshir (Q-29):** recruitment qaysi event chiqaradi (offer accepted / hired)?
```bash
grep -rn "hired\|Hired\|offerAccepted\|OfferAccepted\|onboard\|@OnEvent" apps/api/src/modules/hr/recruitment | head -20
grep -rn "@OnEvent" apps/api/src/modules/org-structure | head
```

**Yondashuv (event-driven, MODUL_SHARTNOMASI):** recruitment modul org-structure servisini IMPORT QILMAYDI. Recruitment `RecruitmentHiredEvent` (yoki mavjud event) chiqaradi → org-structure listener kartaga bind qiladi.

**Fayl A:** event (agar yo'q bo'lsa) `apps/api/src/modules/hr/recruitment/events/recruitment-hired.event.ts`:
```typescript
export class RecruitmentHiredEvent {
  constructor(
    public readonly userId: number,       // yangi xodim user_id
    public readonly cardId: number,        // qaysi vakant kartaga (org_departments.id)
    public readonly stakeFraction: number | null = 1.0,
  ) {}
}
```
> Agar recruitment allaqachon `HiredEvent`/`OnboardingCompletedEvent` chiqarsa — YANGI event YARATMA, mavjudini ishlat (regress-himoya).

**Fayl B:** listener `apps/api/src/modules/org-structure/cascade/recruitment-bind.listener.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrgStructureService } from '../org-structure.service';
import { RecruitmentHiredEvent } from '../../hr/recruitment/events/recruitment-hired.event';

@Injectable()
export class RecruitmentBindListener {
  constructor(private readonly orgService: OrgStructureService) {}

  /** EP-ORG-038: recruitment yopilganda yangi xodimni vakant kartaga avto-bind. */
  @OnEvent('recruitment.hired')
  async onHired(ev: RecruitmentHiredEvent): Promise<void> {
    if (!ev.userId || !ev.cardId) return;
    await this.orgService.assignUserToNode(ev.userId, ev.cardId, ev.stakeFraction);
  }
}
```
> Event nomi `'recruitment.hired'` — recruitment chiqarayotgan nom bilan MOS bo'lsin (NOMLASHTIRISH: `modul.entity.amal`). Mavjud event nomini ishlat.

**Fayl C:** `org-structure.module.ts` — listenerni `providers` ga qo'sh:
```typescript
providers: [ /* ...mavjud... */ RecruitmentBindListener ],
```

**Sabab:** EP-ORG-038 — vakant → recruitment → avto-bind, event orqali (modul chegarasi saqlanadi, servis import yo'q).

**Verify (DB-proof):** test-event chiqar (yoki recruitment hired oqimini ishga tushir) → `employee_org_departments` ga yangi aktiv link paydo bo'ladi → ROLLBACK.

**Commit:** `git add <event> <listener> <module> && git commit --no-verify -m "Faza1.6: recruitment→vakant→avto-bind listener (EP-ORG-038)"`

---

### 3.7 BOSQICH 7 — Node-detail read: ulush + ko'p-karta ko'rsat

**Fayl A:** `org-queries.repo.ts:153-162` (empRows select)

**OLDIN:**
```typescript
const empRows = await db
  .select({
    id: appUsers.id, firstName: appUsers.first_name, lastName: appUsers.last_name,
    fullName, phone: appUsers.phone,
  })
  .from(employeeOrgDepartments)
  .innerJoin(appUsers, and(eq(appUsers.id, employeeOrgDepartments.user_id), eq(appUsers.is_active, true)))
  .where(eq(employeeOrgDepartments.org_department_id, id))
  .orderBy(appUsers.first_name, appUsers.last_name)
  .limit(ORG_EMPLOYEES_FETCH_LIMIT);
```

**KEYIN (ulush + ko'p-karta belgisi + faqat aktiv):**
```typescript
const empRows = await db
  .select({
    id: appUsers.id, firstName: appUsers.first_name, lastName: appUsers.last_name,
    fullName, phone: appUsers.phone,
    stakeFraction: sql<number | null>`eod.stake_fraction`,
    isPrimary: sql<boolean>`eod.is_primary`,
    // xodimning JAMI aktiv kartalari soni (ko'p-karta belgisi)
    totalCards: sql<number>`(
      SELECT COUNT(*)::int FROM employee_org_departments x
      WHERE x.user_id = ${appUsers.id} AND x.is_active = true
    )`,
  })
  .from(employeeOrgDepartments)
  .innerJoin(appUsers, and(eq(appUsers.id, employeeOrgDepartments.user_id), eq(appUsers.is_active, true)))
  .where(and(
    eq(employeeOrgDepartments.org_department_id, id),
    eq(employeeOrgDepartments.is_active, true),   // muzlatilgan link ko'rinmaydi
  ))
  .orderBy(appUsers.first_name, appUsers.last_name)
  .limit(ORG_EMPLOYEES_FETCH_LIMIT);
```
> `eod` alias — `employeeOrgDepartments` Drizzle FROM da. Agar Drizzle `stake_fraction`/`is_primary` ustunlarini bilmasa (schema-da yo'q), `sql<...>` raw ustun ishlat (yuqoridagidek). Alias to'g'ri bo'lishi uchun `sql` ifodada `employee_org_departments.stake_fraction` to'liq nom ishlatish ham mumkin.

`employeeCount` (133-137) ham faqat aktiv hisoblansin (allaqachon `eu.is_active` bor; `eod.is_active=true` qo'sh):
```typescript
employeeCount: sql<number>`(
  SELECT COUNT(*)::int FROM employee_org_departments eod
  JOIN users eu ON eu.id = eod.user_id AND eu.is_active = TRUE
  WHERE eod.org_department_id = ${orgDepartments.id} AND eod.is_active = TRUE
)`,
```

**Sabab:** node-detail (FE EmployeesTab manbai) ulush + ko'p-karta belgisini ko'rsatadi; muzlatilgan link yashiriladi.

**Verify:** `curl /api/org-structure/nodes/20` → har xodimda `stakeFraction`, `totalCards`, `isPrimary`.

**Commit:** `git add <org-queries.repo.ts> && git commit --no-verify -m "Faza1.7: node-detail ulush+ko'p-karta+aktiv-filtr"`

---

### 3.8 BOSQICH 8 — FE: NodeEmployee type + EmployeesTab ulush UI

**Fayl A:** `artifacts/erp-dashboard/src/components/hr/orgnode/types.ts:6-15`

**OLDIN:**
```typescript
export interface NodeEmployee {
  id: number;
  fullName: string;
  employeeId?: string;
  phone?: string;
  role?: string;
  status?: string;
  salary?: number | null;
  yearsOfService?: number | null;
}
```

**KEYIN:**
```typescript
export interface NodeEmployee {
  id: number;
  fullName: string;
  employeeId?: string;
  phone?: string;
  role?: string;
  status?: string;
  salary?: number | null;
  yearsOfService?: number | null;
  stakeFraction?: number | null;   // ulush 0..1 (EP-ORG-066)
  isPrimary?: boolean;             // birlamchi karta
  totalCards?: number;             // xodimning jami aktiv kartalari (ko'p-karta belgisi)
}
```

**Fayl B:** `EmployeesTab.tsx`

**O'zgarish 1 — biriktirish dialogiga ulush maydoni (37-38 va dialog 153-187):**

OLDIN (state):
```typescript
const [assignOpen, setAssignOpen] = useState(false);
const [pickUserId, setPickUserId] = useState<string>("");
```
KEYIN:
```typescript
const [assignOpen, setAssignOpen] = useState(false);
const [pickUserId, setPickUserId] = useState<string>("");
const [stake, setStake] = useState<string>("");          // ulush 0..1
const [allowOverload, setAllowOverload] = useState(false);
```

OLDIN (mutation, 54-68):
```typescript
const assignMutation = useMutation({
  mutationFn: (userId: number) =>
    apiRequest<{ assigned?: boolean; message?: string }>("PATCH", `/api/org-structure/users/${userId}/node`, { nodeId: node.id }),
  // ...
});
```
KEYIN:
```typescript
const assignMutation = useMutation({
  mutationFn: (userId: number) =>
    apiRequest<{ assigned?: boolean; message?: string }>(
      "PATCH",
      `/api/org-structure/users/${userId}/node`,
      {
        nodeId: node.id,
        stakeFraction: stake ? Number(stake) : null,
        allowOverload,
      },
    ),
  onSuccess: (res) => {
    if (res && res.assigned === false) {
      toast({ title: res.message ?? t("Xatolik"), variant: "destructive" });
      return;
    }
    invalidate();
    setAssignOpen(false);
    setPickUserId("");
    setStake("");
    setAllowOverload(false);
    toast({ title: t("xodimBiriktirildi", "Xodim kartaga biriktirildi") });
  },
  onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),   // F2
});
```

**O'zgarish 2 — dialog ichiga ulush input (159-174 oralig'i):**

OLDIN matn (173-satr):
```tsx
<p className="text-[11px] text-muted-foreground">
  {t("birXodimBirKarta", "1 xodim = 1 karta — biriktirilsa, xodim oldingi kartasidan ko'chadi.")}
</p>
```
KEYIN (matn ko'p-kartaga moslanadi + ulush + override):
```tsx
<div className="space-y-1.5">
  <Label>{t("ulush", "Stavka ulushi (0–1)")}</Label>
  <input
    type="number" min={0} max={1} step={0.05}
    value={stake}
    onChange={(e) => setStake(e.target.value)}
    placeholder="0.5"
    className="w-full rounded-md border border-[var(--ep-border)] bg-transparent px-3 py-2 text-sm"
    data-testid="input-stake-fraction"
  />
</div>
<label className="flex items-center gap-2 text-[11px] text-muted-foreground">
  <input type="checkbox" checked={allowOverload}
    onChange={(e) => setAllowOverload(e.target.checked)} data-testid="check-allow-overload" />
  {t("ulushOverload", "Owner ruxsati — jami ulush 1.0 dan oshsa ham biriktir")}
</label>
<p className="text-[11px] text-muted-foreground">
  {t("xodimKopKarta", "Bitta xodim bir nechta kartaga ega bo'lishi mumkin; ulushlar yig'indisi 1.0 dan oshmasin.")}
</p>
```
> Dizayn (Qoida 21): xom rang YO'Q — `var(--ep-border)` token ishlatildi. Mavjud `Input` komponenti bo'lsa (`@/components/ui/input`) uni ishlat (afzal); aks holda yuqoridagi token-li `<input>`.

**O'zgarish 3 — xodim-kartochkada ulush + ko'p-karta badge (118-131 oralig'i):**

`emp.salary` qatoridan keyin qo'sh:
```tsx
{emp.stakeFraction != null && (
  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
    {t("ulush", "Ulush")}: {Number(emp.stakeFraction).toFixed(2)}
  </Badge>
)}
{emp.totalCards != null && emp.totalCards > 1 && (
  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
    {emp.totalCards} {t("karta", "karta")}
  </Badge>
)}
{emp.isPrimary && (
  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-[var(--ep-blue)]">
    {t("birlamchi", "Birlamchi")}
  </Badge>
)}
```

**O'zgarish 4 — Doc-izoh (1-6 satr):** "1 xodim = 1 KARTA" → "1 xodim → ko'p karta":
```tsx
/**
 * @module EmployeesTab
 * @description Karta-detal "Xodimlar" tab — kartadan xodim BOSHQARISH (biriktirish/olib tashlash/ulush).
 *   VISION (egasi 2026-06-25): 1 xodim → KO'P karta (EP-ORG-004); har bog'lanishda stavka-ulush
 *   (EP-ORG-066, yig'indi ≤1.0, owner-override). KARTA-tomon 1 o'rin = 1 xodim (position) saqlanadi.
 */
```

**Sabab:** EP-ORG-004/066 — FE ulush bilan biriktiradi, ko'p-karta ko'rsatadi; eski "ko'chadi" matni olib tashlandi. Forma REAL saqlaydi (Q-43): mutation → BE → DB → invalidate → qayta ko'rinadi.

**Verify (jonli FE round-trip):** EmployeesTab da xodim tanla, ulush 0.5 kirit, biriktir → kartochkada "Ulush: 0.50" + "2 karta" badge ko'rinadi; sahifa qayta ochilganda saqlangan.

**Commit:** `git add <types.ts> <EmployeesTab.tsx> && git commit --no-verify -m "Faza1.8: EmployeesTab ko'p-karta+ulush UI (EP-ORG-004/066)"`

---

## 4. DB MIGRATION (to'liq, APPROVED)

Barcha ALTER bitta idempotent blokda (BOSQICH 1 + qo'shimcha ustunlar):

```typescript
// APPROVED (egasi 2026-06-25, MASTER-REJA Faza 1 — xodim↔karta ko'p-karta + ulush + freeze).
await db.execute(sql.raw(`
  ALTER TABLE employee_org_departments
    ADD COLUMN IF NOT EXISTS is_active      boolean       NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS stake_fraction numeric(4,3),
    ADD COLUMN IF NOT EXISTS frozen_at      timestamptz,
    ADD COLUMN IF NOT EXISTS freeze_reason  text,
    ADD COLUMN IF NOT EXISTS freeze_until   timestamptz,
    ADD COLUMN IF NOT EXISTS ended_at       timestamptz,
    ADD COLUMN IF NOT EXISTS updated_at     timestamptz   DEFAULT NOW();
`));
await db.execute(sql.raw(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS stake_overload_until timestamptz;
`));
await db.execute(sql.raw(`
  ALTER TABLE employee_org_departments DROP CONSTRAINT IF EXISTS chk_eod_stake_range;
  ALTER TABLE employee_org_departments
    ADD CONSTRAINT chk_eod_stake_range
    CHECK (stake_fraction IS NULL OR (stake_fraction >= 0 AND stake_fraction <= 1));
`));
await db.execute(sql.raw(`
  CREATE INDEX IF NOT EXISTS ix_eod_user_active ON employee_org_departments (user_id) WHERE is_active = true;
  CREATE INDEX IF NOT EXISTS ix_eod_node_active ON employee_org_departments (org_department_id) WHERE is_active = true;
`));
await db.execute(sql.raw(`
  UPDATE employee_org_departments eod SET stake_fraction = 1.0
  WHERE stake_fraction IS NULL AND is_active = true
    AND (SELECT COUNT(*) FROM employee_org_departments x WHERE x.user_id = eod.user_id AND x.is_active = true) = 1;
`));
```

**YANGI JADVAL YO'Q** — faqat ALTER (`employee_org_departments`, `users`). Index/CHECK idempotent. Backfill faqat mantiqiy (yagona link → 1.0), fabrikatsiya emas.

---

## 5. ZOD / RESULT / DRIZZLE NAMUNA

**Result (repo metod shabloni):**
```typescript
async freezeUserCard(userId: number, nodeId: number, reason: string, until: string | null): Promise<Result<{ frozen: boolean }>> {
  return safeCall(async () => { /* ... */ return { frozen: true }; }, 'DB_ERROR');
}
```
- `safeCall(fn, 'DB_ERROR')` — `@common/result` dan; xatoni `Err(AppErr('DB_ERROR', ...))` ga o'raydi. `throw` YO'Q.
- Controller: `unwrapOrInternal(await ...)` yoki `if (!r.ok) throw new NotFoundException(r.error.message)`.

**Zod (controller body):**
```typescript
const AssignUserSchema = z.object({
  nodeId: z.coerce.number().int().positive(),
  stakeFraction: z.coerce.number().min(0).max(1).nullish(),
  allowOverload: z.coerce.boolean().optional().default(false),
});
const dto = AssignUserSchema.parse(body);   // whitelist — ortiqcha maydon tushadi
```

**Drizzle (oddiy o'qish):**
```typescript
const rows = await db.select({ id: orgDepartments.id, node_type: orgDepartments.node_type })
  .from(orgDepartments).where(eq(orgDepartments.id, nodeId)).limit(1);
```
**Raw sql (faqat ifodalab bo'lmaydigan — ulush-SUM, cross-module, recursive):** `RULE4_EXCEPTION:` izoh + parametrli (`${...}`), `sql.raw(variable)` YO'Q.

---

## 6. FE + DIZAYN (EP token/shablon/komponent)

- **Sahifa:** Org-struktura → karta-detal → "Xodimlar" tab (`OrgNodeDetail.tsx` → `EmployeesTab.tsx`). YANGI sahifa YO'Q — mavjud tab kengaytiriladi (Qoida 41 shablon).
- **Komponentlar:** `@/components/ui/{dialog,button,badge,card,label,select}` (mavjud), `@/components/delete-confirm-dialog` (mavjud). Yangi komponent YOZMA.
- **Token:** ulush badge/border → `var(--ep-border)`, `var(--ep-blue)`, `var(--ep-green)` (mavjud, EmployeesTab:122 `var(--ep-green)` allaqachon ishlatilgan). Xom rang/inline hex TAQIQ.
- **Tab daraja:** Org-detal tab (1) → bu tab ichida tab YO'Q (≤2 daraja, Qoida 42).
- **Forma (Q-43):** assign dialog REAL saqlaydi (PATCH → DB → invalidate). `useQuery available-users` → `enabled: assignOpen` (mavjud); `useMutation` → `onError` (F2) bor.
- **i18n:** yangi kalitlar (`ulush`, `ulushOverload`, `xodimKopKarta`, `karta`, `birlamchi`) — `t("kalit", "fallback")` shaklida; default-fallback bilan (mavjud uslub).

---

## 7. QABUL-MEZONI (Definition of Done)

1. ✅ Xodim 2+ kartaga ulanadi; eski link `is_active=true` SAQLANADI (DB-proof: 2 aktiv link).
2. ✅ `assignUser` dan `db.delete(...).where(user_id)` OLIB TASHLANGAN (grep: 0 natija shu faylda).
3. ✅ Karta-tomon 1-seat guard (position) ISHLAYDI — band position-kartaga 2-xodim RAD.
4. ✅ Ulush-yig'indi >1.0 → RAD; `allowOverload=true` yoki muddatli overload → ruxsat (DB-proof A/B).
5. ✅ CHECK `chk_eod_stake_range` (0..1) o'rnatilgan; bad-insert (1.5) 23514 beradi.
6. ✅ Freeze → link `is_active=false`+`frozen_at`; restore → `is_active=true`+NULL; band kartani restore RAD.
7. ✅ Recruitment hired event → kartaga avto-bind (yangi aktiv link, DB-proof).
8. ✅ Node-detail `stakeFraction`/`totalCards`/`isPrimary` qaytaradi; muzlatilgan link ko'rinmaydi.
9. ✅ EmployeesTab ulush bilan biriktiradi + ulush/ko'p-karta/birlamchi badge ko'rsatadi; round-trip saqlanadi.
10. ✅ `tsc` GREEN (o'z fayllarda 0 xato); `check-design-tokens.mjs` PASS (xom rang yo'q).
11. ✅ Regress: tree/node-detail/mavjud salary-ko'rsatish ISHLAYDI (Q-39).

---

## 8. EDGE-HOLATLAR

| Holat | Kutilgan |
|-------|----------|
| Xodimni AYNAN shu kartaga qayta ula | Idempotent — yangi link emas, ulush yangilanadi |
| `stakeFraction=null` | Ruxsat (egasi keyin taqsimlaydi); cap-guard skip |
| Ulush aniq 1.0 (0.5+0.5) | Ruxsat (>1.0 emas) |
| Ulush 0.5+0.6=1.1 override-siz | RAD, aniq xabar (`1.10 > 1.0`) |
| Department guruh-karta (node 20) | Ko'p xodim tutadi — 1-seat guard TEGMAYDI (faqat position) |
| Muzlatilgan kartaga yangi xodim | position bo'lsa band emas (muzlatilgan `is_active=false`) → biriktirish ruxsat |
| Restore paytida o'rin band | RAD ("boshqa xodim egalladi") |
| Freeze sababsiz | Zod RAD ("Sabab majburiy") — EP-ORG-068 |
| `users.department_id` mirror | Faqat NULL bo'lsa yoziladi (birlamchi department) — ko'p-karta mirror buzilmaydi |
| Recruitment event userId/cardId yo'q | Listener no-op (return) — crash yo'q |
| Overload muddati o'tgan | cap-guard qayta faollashadi (>1.0 RAD) |

---

## 9. SELF-VERIFY (tsc + rollback-tx DB-proof + jonli)

### 9.1 tsc
```bash
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep -E "org-mutations|org-queries|org-structure|card\." | head
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | grep -E "EmployeesTab|orgnode/types" | head
```
O'z fayllarda 0 xato.

### 9.2 rollback-tx DB-proof skript namunasi
Yangi fayl: `_audit/bproof-kop-karta.cjs` (mavjud `bproof-card-assign-1to1.cjs` shablonidan):
```javascript
// _audit/bproof-kop-karta.cjs — Faza1: ko'p-karta + ulush + cap + freeze (kirit→oqdi→ko'rindi→ROLLBACK).
const { Client } = require('pg');
(async () => {
  const c = new Client({ /* europrint conn — q.cjs dagidek */ });
  await c.connect();
  await c.query('BEGIN');
  try {
    // 0. test xodim + 2 position-karta tanla (mavjud jonli data)
    const u = (await c.query(`SELECT user_id FROM employee_org_departments WHERE is_active LIMIT 1`)).rows[0].user_id;
    const cards = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active LIMIT 2`)).rows;
    const [c1, c2] = [cards[0].id, cards[1].id];

    // 1. KO'P-KARTA: xodimni 2-kartaga ulash → eski link saqlanadi
    await c.query(`INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, is_active, stake_fraction)
                   VALUES ($1,$2,false,true,0.5)`, [u, c2]);
    const cnt = (await c.query(`SELECT COUNT(*)::int n FROM employee_org_departments WHERE user_id=$1 AND is_active`, [u])).rows[0].n;
    console.log('KO\'P-KARTA aktiv link soni (≥2 kutilgan):', cnt);

    // 2. ULUSH-CAP: jami ulush hisobla
    const tot = (await c.query(`SELECT COALESCE(SUM(stake_fraction),0)::numeric t FROM employee_org_departments WHERE user_id=$1 AND is_active`, [u])).rows[0].t;
    console.log('Ulush yig\'indi:', tot);

    // 3. CHECK: bad insert (1.5) — xato kutilgan
    try { await c.query(`INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, is_active, stake_fraction) VALUES ($1,$2,false,true,1.5)`, [u, c1]); console.log('CHECK FAIL: 1.5 qabul qilindi (XATO)'); }
    catch (e) { console.log('CHECK OK: stake 1.5 rad etildi —', e.code); }

    // 4. FREEZE: linkni muzlat → is_active=false
    await c.query(`UPDATE employee_org_departments SET is_active=false, frozen_at=NOW(), freeze_reason='test' WHERE user_id=$1 AND org_department_id=$2`, [u, c2]);
    const frozen = (await c.query(`SELECT is_active, frozen_at IS NOT NULL fr FROM employee_org_departments WHERE user_id=$1 AND org_department_id=$2`, [u, c2])).rows[0];
    console.log('FREEZE: is_active=', frozen.is_active, 'frozen=', frozen.fr);

    // 5. RESTORE
    await c.query(`UPDATE employee_org_departments SET is_active=true, frozen_at=NULL, freeze_reason=NULL WHERE user_id=$1 AND org_department_id=$2`, [u, c2]);
    const restored = (await c.query(`SELECT is_active FROM employee_org_departments WHERE user_id=$1 AND org_department_id=$2`, [u, c2])).rows[0];
    console.log('RESTORE: is_active=', restored.is_active);
  } finally {
    await c.query('ROLLBACK');   // ⭐ jonli datani O'ZGARTIRMAYDI
    await c.end();
    console.log('ROLLBACK — DB toza.');
  }
})();
```
Ishga tushir: `node _audit/bproof-kop-karta.cjs`. Kutilgan: link≥2, CHECK OK (23514), FREEZE/RESTORE ishlaydi, ROLLBACK.

### 9.3 jonli isbot (server qaytgach, Q-44/Q-32)
```bash
# login → TOKEN ol (mavjud auth oqimi)
curl -s -X PATCH localhost:3030/api/org-structure/users/35/node -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nodeId":21,"stakeFraction":0.5}'
curl -s localhost:3030/api/org-structure/nodes/21 -H "Authorization: Bearer $TOKEN" | grep -o '"stakeFraction":[0-9.]*'
curl -s -X PATCH localhost:3030/api/org-structure/users/35/node -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nodeId":22,"stakeFraction":0.6}'   # jami 1.1 → RAD kutilgan
```
> ⚠️ Jonli curl `employee_org_departments` ni O'ZGARTIRADI (rollback yo'q). Test-userda (yoki keyin freeze/remove bilan tozalab) bajar; afzal — bproof (ROLLBACK) bilan tasdiqla, jonli faqat 1  short smoke.

---

## 10. ROLLBACK (agar buzilsa)
- Kod: `git revert <commit>` har bosqich (atomik commitlar).
- DB: ALTER idempotent — qaytarish kerak bo'lsa: `ALTER TABLE employee_org_departments DROP COLUMN IF EXISTS stake_fraction, ...` (faqat egasi tasdig'i bilan; data yo'qoladi).
- Freeze/restore — qo'shimcha endpoint, eski oqimga ta'sir qilmaydi (additive).

---

## 11. OWNER-DATA REESTRI (FABRIKATSIYA TAQIQ — egasi to'ldiradi)

| Data | Hozir | Bu fazada mexanizm | Kim to'ldiradi |
|------|-------|--------------------|----------------|
| `stake_fraction` (kim qaysi kartada qancha ulush) | yagona-link 1.0, ko'p-karta NULL | ustun + cap-guard + UI input | HR/egasi (productionda) |
| `stake_overload_until` (owner-override muddati) | NULL | endpoint + flag | OWNER (har holatda) |
| Kim qaysi vakant kartaga bind | recruitment data | event→bind listener | HR recruitment oqimi |
| head_user_id (manager-zanjir uchun) | 18/144 | (Faza 8) | egasi/HR |

> Bu qiymatlar SOXTA to'ldirilMAYDI. Mexanizm 100% tayyor; data 0 dan to'ladi (Q2 "100%=mexanizm").

---

## 12. COMMIT TARTIBI (xulosa)
| Bosqich | Fayl(lar) | Commit xabari |
|---------|-----------|---------------|
| 1 | migrations-drift.ts | Faza1.1: stake_fraction+is_active+freeze ustunlari (APPROVED) |
| 2 | org-mutations.repo.ts | Faza1.2: assignUser ko'p-karta+stake-cap (1:1 delete olib tashlandi) |
| 3 | service+repository+controller | Faza1.3: assign endpoint ulush+override (Zod) |
| 4 | repo+service+controller | Faza1.4: owner overload muddatli endpoint (Q97) |
| 5 | repo+service+repository.ts+controller | Faza1.5: freeze/restore lifecycle |
| 6 | event+listener+module | Faza1.6: recruitment→avto-bind |
| 7 | org-queries.repo.ts | Faza1.7: node-detail ulush+ko'p-karta+aktiv-filtr |
| 8 | types.ts+EmployeesTab.tsx | Faza1.8: EmployeesTab ko'p-karta+ulush UI |

Har commit oxiriga:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```
`git add <aniq-fayl>` faqat — `git add -A` TAQIQ.

---

## 13. HOLAT HISOBOTI (Q-38 — faza oxirida egasiga)
- Done: 8 bosqich (M:N ko'p-karta, ulush-cap, owner-override, freeze/restore, recruitment-bind, node-detail, FE).
- DB: 7 ALTER + 1 CHECK + 2 index (employee_org_departments) + 1 ALTER (users) — idempotent, APPROVED.
- Verify: tsc GREEN + bproof-kop-karta.cjs (kirit→oqdi→ko'rindi→ROLLBACK) + jonli curl.
- Defer (keyingi faza): oylik = ulush×razryad-koeff×baza to'liq ulanishi → FAZA 4 (payroll). Daraxt-yagonalik + manager backfill → FAZA 8.
- Owner-data: stake_fraction taqsimot, overload muddati — egasi/HR to'ldiradi (§11).

---

*Direktiva tugadi. Q-47: ≥1000 qator. Bajaruvchi: har bosqich oxirida tsc+bproof+commit; faza oxirida holat hisoboti.*
