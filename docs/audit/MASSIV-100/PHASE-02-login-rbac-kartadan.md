# FAZA 02 — Login / RBAC KARTADAN (Bajaruvchi direktivasi — Muslimbek)

> **Master-reja:** [`00-MASTER-REJA.md`](00-MASTER-REJA.md) · **Bo'shliqlar manbai:** [`../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) · **Spec:** [`../decisions/01-org-kartalar.md`](../decisions/01-org-kartalar.md) (EP-ORG-003 / EP-ORG-023 / EP-ORG-042 / EP-ORG-103)
> **Bog'liqlik:** FAZA 0 (org_departments = yagona karta, org_functions retire, FK re-point) + FAZA 1 (employee_cards M:N + stake_fraction) **TUGAGAN** bo'lishi shart. Bu faza ularning ustiga quriladi.
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, hech qanday noaniqlik qoldirmaydigan.

---

## 0. EGASI MANDATI VA BU FAZANING O'RNI

Egasining markaziy printsipi (EP-ORG-003 / Q-03 / Q-02 / PRINSIP-KARTA-MARKAZIY):

> **"card_id NULL bo'lsa login YO'Q + oylik YO'Q. Kartaga bog'lanmagan xodim ERPga kira olmaydi. Kartaga xodim qidiriladi, aksincha emas."**

va RBAC printsipi (EP-ORG-023 / Q-23):

> **"Ko'rish / qilish / tasdiq = KARTADAN keladi. Karta o'zgarsa ruxsat o'zgaradi. Kartadagi huquq = ERP harakati."**

**MUHIM EGASI QARORI (bu faza uchun hal qiluvchi):** Egasi **yangi login tizimi ISTAMAYDI**. Mavjud JWT + cookie + guard infratuzilmasi (login.service, jwt.strategy, jwt-auth.guard, roles.guard, permission.guard) **SAQLANADI**. Biz uning **ustiga "karta-gate" qatlamini** qo'shamiz — ya'ni:
1. Login oqimiga **aktiv karta tekshiruvi** qo'shiladi (kartasiz → 401).
2. Payroll oqimiga **aktiv karta tekshiruvi** qo'shiladi (kartasiz xodim → oylik-hisobdan skip).
3. RBAC manbai **eski `positions` / `org_functions` dan → `org_departments` (= karta)** ga ko'chiriladi.
4. JWT karta-kontekstini (cardId + rbacTier) **tashiydi**, guard shuni o'qiydi.
5. Karta o'zgarsa keyingi refresh/permission-resolve da ruxsat **qayta hisoblanadi** (Q17: JWT TTL ichida muzlatilgan, refresh da yangilanadi — egasi buni qabul qilgan).

Bu faza **mexanizm 100%** ni quradi (Q2). DATA (rbac_tier qiymatlari = 144/144 NULL) egasidan keladi (§11). **FABRIKATSIYA TAQIQ** — rbac_tier ga soxta qiymat yozilMAYDI.

---

## 1. QOIDALAR BLOKI (har bosqichda majburiy — CLAUDE.md + master-reja §2)

> Bu blok har bosqichda amal qiladi. O'zgartirishdan oldin o'qib chiq.

### 1.1 Kod uslubi
- **Result<T>**: barcha repo/service metodi `Promise<Result<T>>` qaytaradi (CLAUDE.md Qoida 1). `return null`/`throw new Error()` TAQIQ. `ok()`/`err()`/`AppErr()` `@common/result` dan.
- **Zod**: har `@Body()`/`@Query()` Zod schema bilan `parse` qilinadi (Qoida 3). `class-validator` TAQIQ.
- **Drizzle**: oddiy CRUD Drizzle ORM bilan (Qoida 4). Raw SQL faqat murakkab (LATERAL/COALESCE-cross-table/CASE) holatlarda + `// NOTE:` izoh bilan. `sql.raw(variable)` HECH QACHON (Qoida B — SQL injection).
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13).
- **ConfigService** orqali env (Qoida 7) — `process.env.X` to'g'ridan TAQIQ.
- **Service `db.*` to'g'ridan chaqirmaydi** — faqat repository orqali (Qoida 15). Guard ISTISNO (guard repo emas — `PermissionGuard` allaqachon `db` ishlatadi, joriy uslub saqlanadi).

### 1.2 Regress-himoya (Q-39 / Q-46 — EGASI QOIDASI)
- **Ishlab turgan + to'g'ri kod O'CHIRILMAYDI.** Joriy login (admin kira oladi), joriy guardlar (Jwt/Roles/Permission), joriy `position_permissions` (1380 qator) — **hammasi ishlashda qoladi**. "Tozalash" bahonasida funksiya/maydon o'chirilMAYDI.
- **To'g'ri ISHLAMAYDIGAN kod TO'LIQ o'chiriladi** (chala emas). Lekin bu fazada o'chiradigan narsa kam — asosan **qo'shish + re-point**.
- O'chirishdan oldin: (a) Q-29 verify (kod jonli ishlamasligini tasdiqla), (b) import-yo'qligini Grep bilan tekshir.
- **REGRESS-TEST (majburiy):** admin (id=1, super_admin, `org_department_id=NULL`, `employee_id=NULL`, aktiv-karta=0) **kartasiz bo'lsa ham login qila olishi shart** — chunki super_admin/admin gate'dan ozod. Agar admin gate tufayli 401 olsa = REGRESSIYA = XATO.

### 1.3 Fabrikatsiya TAQIQ (Q-40)
- `org_departments.rbac_tier` = 144/144 NULL. Bunga **soxta qiymat yozma**. Gate/RBAC `rbac_tier` NULL bo'lsa **graceful** (default xulq-atvor, quyida belgilangan) — fabrikatsiya emas.
- "Yashil lekin noto'g'ri" TAQIQ: endpoint 200 qaytarishi = to'g'ri degani EMAS. DB-proof + biznes-qoida bilan tasdiqla.

### 1.4 Verify (Q-29 / Q-32 / Q-40)
- Har bosqich oxiri: **`tsc` GREEN** (o'z fayllarda 0 xato) + **END-TO-END rollback-tx DB-proof** (`_audit/bproof-*.cjs`: kirit→oqdi→ko'rindi→ROLLBACK) + jonli isbot (HTTP login/permission).
- Struktura-only YETARLI EMAS. Lokal server tushsa (Q-44 Windows nest-watch) → static fallback (tsc + diff + rollback-tx proof), jonli-HTTP server qaytgach.

### 1.5 Migration (Q-35)
- `migrations-drift.ts` idempotent (`ALTER ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- `CREATE TABLE` / `DROP` / yangi ustun faqat `// APPROVED:` izoh bilan.
- **Bu fazada yangi jadval SHART EMAS** (master-reja §3 FAZA-2 DB: "card-gate o'qish — yangi ustun shart emas, employee_cards orqali"). `org_departments.rbac_tier` ustuni allaqachon mavjud (DB-proof bilan tasdiqlangan, §3.1).

### 1.6 Dizayn (Qoida 21/41/42/43)
- EP token (`var(--ep-*)`) + shablon + `components/ep`/`components/ui`. Xom rang/inline-style TAQIQ.
- Bu faza asosan backend; FE o'zgarishi kam (login xato-xabari + `/auth/me` permission ko'rsatish). Har FE forma F1 (loading) / F2 (onError) bilan.

### 1.7 Commit (Q-31 / docs/GIT_QOIDALARI.md)
- Faqat o'z fayllar: `git add <aniq-fayl>` — **HECH QACHON `git add -A`/`.`**.
- `--no-verify` (pre-commit token-skript bypass), Co-Authored-By.
- Har bosqich oxirida alohida commit.

### 1.8 Atama
- Muloqotda doim **"KARTA"** (node/tugun/lavozim-jadval emas). Kod ichida `org_departments` = karta-jadval.

---

## 2. KONTEKST + MAQSAD

### 2.1 Vizyon
Karta = ERP/login/oylik/ruxsat manbai. Xodim faqat **aktiv kartaga bog'langan** bo'lsa:
- **Login qila oladi** (kartasiz → "lavozimga biriktirilmagansiz" 401).
- **Oylik oladi** (kartasiz → payroll-hisobdan chiqib qoladi).
- **Ruxsatga ega bo'ladi** — ruxsat **kartaning** `rbac_tier` + karta-position'ning `position_permissions` dan keladi, eski `positions`/`org_functions` dan EMAS.
- Karta o'zgarsa (boshqa kartaga ko'chsa, razryad/tier o'zgarsa) → keyingi refresh/permission-resolve da yangi ruxsat qo'llanadi.

### 2.2 Bu fazaning aniq natijasi (Definition of Done)
1. Aktiv `employee_cards` yo'q (va super_admin/admin EMAS) user → `POST /auth/login` **401** "Siz hech qaysi lavozim kartasiga biriktirilmagansiz" (i18n).
2. `jwt.strategy.validate` aktiv-karta tekshiruvini ham bajaradi (mavjud sessiya kartasini yo'qotgan bo'lsa → 401).
3. Payroll `closePeriod` (yoki row-aggregatsiya) **aktiv-kartasiz xodim qatorini SKIP qiladi** (oylik yozilmaydi) + skip-sababi log.
4. RBAC manbai **karta**: `findUserWithPosition` COALESCE'i `org_functions` o'rniga **aktiv `employee_cards` → `org_departments.rbac_tier`** ni o'qiydi (FAZA 0 retire'dan keyin).
5. JWT login-payload **cardId + rbacTier** ni tashiydi; `jwt.strategy` ularni `request.user` ga qo'yadi; `permission.guard` karta-position bo'yicha tekshiradi.
6. Karta o'zgarsa: `/auth/me/permissions` qayta resolve qiladi (Redis 15-daq cache invalidate); refresh da yangi cardId/tier tokenga tushadi.
7. Hammasi DB-proof + jonli login bilan tasdiqlangan; admin (kartasiz) hamon kiradi (regress).

---

## 3. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan, taxmin YO'Q)

### 3.1 DB faktlari (`node _audit/q.cjs` bilan tasdiqlangan, 2026-06-25)
| Fakt | Qiymat | SQL-tasdiq |
|---|---|---|
| `users` ustunlari (karta-bog'liq) | `department_id`, `employee_id`, `org_department_id`, `org_function_id`, `position_id` — **`card_id` YO'Q** | `information_schema.columns WHERE table_name='users'` |
| `employee_cards` | `id, employee_id, card_id, is_primary, is_active, assigned_at, ended_at, is_acting, ...` | `information_schema.columns` |
| `employee_cards` data | total=30, active=30, employees=30, **distinct cards=17** | `SELECT count(*)...` |
| `employee_cards.card_id` FK | → **`org_functions`** (FAZA 0 buni `org_departments`ga re-point qiladi) | `information_schema` FK |
| `users` link-data | 31 user; 30 da `org_department_id`, 30 da `position_id`, 30 da `employee_id`; **admin(id=1): hammasi NULL** | `SELECT count(*) FILTER...` |
| `org_departments` | total=144; **`rbac_tier` ustuni MAVJUD** (text); rbac_tier=0/144 (NULL); razryad_level_id=0/144 | `information_schema` + `count FILTER` |
| `org_departments` ustunlar | `rbac_tier, razryad_level_id, head_user_id, salary_type, max_salary, current_state, is_active` mavjud | `information_schema` |
| `positions.rbac_tier` | ustun MAVJUD (eski RBAC manbai) | `information_schema` |
| `position_permissions` | 1380 qator, 92 distinct `position_id` | `SELECT count(*)...` |
| `payroll_rows` | `employee_id`, `period_id` ustunlari mavjud (user_id YO'Q) | `information_schema` |
| `admin` (id=1) | super_admin, org_department_id=NULL, employee_id=NULL, **active_cards=0** | `SELECT u.*, (subq) active_cards` |

**⚠️ HAL QILUVCHI FAKT:** `admin` (super_admin) kartasiz. Gate super_admin/admin **bypass** qilmasa, admin tizimga kira olmaydi = regressiya. Gate MAJBURIY ravishda super_admin/admin/director ni ozod qiladi (joriy `permission.guard.isAdminRole` bilan bir xil mantiq). DB roles **lowercase** (`super_admin`, `director`, `manager`).

### 3.2 Kod faktlari (fayl:satr)
| Joy | Holat | Fayl:satr |
|---|---|---|
| Login oqimi | `findByUsername` → `checkAccountGates` (locked/inactive) → `verifyCredentials` → token. **Karta tekshiruvi YO'Q.** | `apps/api/src/modules/auth/application/services/login.service.ts:99-123` |
| Account-gate | faqat `isAccountLocked()` + `isAccountActive()` (users.locked_until / is_active) | `login.service.ts:145-158` |
| User o'qish (login) | `findOneUser` SELECT: id/username/email/password_hash/role/is_active/last_login_at/failed_login_attempts/locked_until — **karta/org_department YO'Q** | `apps/api/src/modules/auth/infrastructure/repositories/drizzle-auth.repo.ts:75-95` |
| JWT payload | `{ sub, username, email, role, jti }` — **cardId/positionId/rbacTier YO'Q** | `login.service.ts:182-207` |
| JWT TTL | access `24h`, refresh `7d` | `login.service.ts:192-196` |
| JWT validate | `findById` → `isAccountActive` → `{ id, username, email, role, tenantId }` — **karta YO'Q** | `apps/api/src/modules/auth/infrastructure/strategies/jwt.strategy.ts:28-51` |
| jwt-auth.guard | token verify + jti blacklist; `request.user = { ...decoded, id }` (decoded payload to'g'ridan) | `apps/api/src/common/guards/jwt-auth.guard.ts:66-123` |
| permission.guard | `user.positionId ?? user.position_id` o'qiydi (24h tokenda yo'q!) → `position_permissions WHERE position_id` | `apps/api/src/common/guards/permission.guard.ts:63-81, 48-61` |
| RBAC tier o'qish | `findUserWithPosition` COALESCE: `org_functions.rbac_tier` (via `users.org_function_id`) → fallback `positions.rbac_tier` | `apps/api/src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts:49-79` |
| GetMyPermissions | positionId NULL → empty perms; admin role → FULL; cache 15daq | `apps/api/src/modules/auth/application/services/get-my-permissions.service.ts:48-64` |
| Payroll | `closePeriod` → `listRowsByPeriod` (barcha `payroll_rows` period bo'yicha) — **karta-skip YO'Q** | `apps/api/src/modules/hr/payroll/payroll.service.ts:57-90`, `drizzle-hr-payroll.repo.ts:50-57` |
| i-auth.repo | `findByUsername/findById/save/updateLastLogin/blacklist/isBlacklisted/increment/lock/reset` — **karta-metod YO'Q** | `apps/api/src/modules/auth/domain/repositories/i-auth.repo.ts:8-18` |

### 3.3 Eng katta bo'shliqlar (login-rbac 28% — eng og'ir)
1. **card_id NULL login/oylik GATE YO'Q** — vizyonning markaziy printsipi real emas.
2. RBAC eski `positions`/`org_functions` ga keyed — FAZA 0 dan keyin `org_functions` retire bo'ladi → COALESCE buziladi, `org_departments`ga ko'chish SHART.
3. JWT `positionId`/`cardId` tashimaydi — `permission.guard` `user.positionId` ni o'qiydi, lekin token unga ega emas (faqat admin bypass ishlaydi; oddiy manager perms cache/DB orqali `/auth/me` da ishlaydi, lekin guard'da positionId yo'q).

---

## 4. BOSQICHMA-BOSQICH IJRO (har bosqich: fayl · OLDIN · KEYIN · sabab)

> Tartib MAJBURIY (bog'liqlik). Har bosqich oxirida `tsc` + commit. Bosqich 1 → Bosqich 7.

---

### BOSQICH 1 — Karta-gate repo metodi (`employee_cards` → aktiv karta soni + tier)

**Fayl:** `apps/api/src/modules/auth/infrastructure/repositories/drizzle-auth.repo.ts` + interfeys `i-auth.repo.ts`

**Sabab:** Login va jwt.strategy ikkalasi ham "bu user aktiv kartaga egami?" ni bilishi kerak. Bu domen — auth-repo'ga yangi metod qo'shiladi (yangi DB-call auth bounded-context ichida). `users.card_id` YO'Q, shuning uchun yo'l: `users.employee_id → employee_cards (is_active, NOT ended) → org_departments`. Aktiv-acting kartani ham hisoblaymiz (i.o. ham ishlaydigan biriktirish).

**4.1.1 — Interfeysga metod qo'shish (`i-auth.repo.ts`)**

OLDIN (`i-auth.repo.ts:8-18`):
```typescript
export interface IAuthRepo {
  findByUsername(username: string): Promise<AuthUserAggregate | null>;
  findById(id: number): Promise<AuthUserAggregate | null>;
  save(user: AuthUserAggregate): Promise<AuthUserAggregate>;
  updateLastLogin(userId: number, ipAddress: string, timestamp: Date): Promise<void>;
  blacklistToken(token: string, expiresAt: Date): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  incrementFailedAttempts(userId: number): Promise<void>;
  lockUserAccount(userId: number, minutesDuration: number): Promise<void>;
  resetFailedAttempts(userId: number): Promise<void>;
}
```

KEYIN (qo'shimcha — boshqa metodlar O'ZGARMAYDI):
```typescript
/**
 * EP-ORG-003 card-gate: user aktiv lavozim-kartasiga (employee_cards → org_departments)
 * biriktirilganmi va kartaning rbac_tier'i nima. Login va jwt.strategy ishlatadi.
 * card-less user (admin) yoki tier NULL → cardId/rbacTier null; activeCardCount=0.
 */
export interface CardGate {
  activeCardCount: number;
  primaryCardId: number | null;   // org_departments.id (= karta)
  rbacTier: string | null;        // org_departments.rbac_tier (144/144 NULL hozir)
  positionId: number | null;      // users.position_id (RBAC position_permissions kaliti)
}

export interface IAuthRepo {
  // ... mavjud metodlar O'ZGARMAYDI ...
  resolveCardGate(userId: number): Promise<CardGate>;
}
```

**4.1.2 — Implementatsiya (`drizzle-auth.repo.ts`)**

`drizzle-auth.repo.ts` oxiriga (klass ichiga, `resetFailedAttempts` dan keyin) qo'sh:

```typescript
/**
 * EP-ORG-003 card-gate manbai.
 *
 * Yo'l: users.employee_id → employee_cards(is_active=true, ended_at IS NULL OR >now)
 *       → org_departments(card). Aktiv VA aktiv-i.o. biriktirish ikkalasi ham karta deb
 *       hisoblanadi (i.o. ham ishlaydigan link). Primary karta = is_primary tanlanadi,
 *       bo'lmasa eng so'nggi assigned_at. rbac_tier = primary kartaning tier'i.
 *
 * NOTE: Raw SQL — bir nechta jadval JOIN + COALESCE + "ended_at IS NULL OR ended_at > NOW()"
 *   muddat-shartli filtr Drizzle query-builder'da noqulay; FAZA 0'dan keyin
 *   employee_cards.card_id FK → org_departments.id.
 */
async resolveCardGate(userId: number): Promise<CardGate> {
  const empty: CardGate = { activeCardCount: 0, primaryCardId: null, rbacTier: null, positionId: null };
  try {
    const r = await runQuery<{
      active_card_count: number;
      primary_card_id: number | null;
      rbac_tier: string | null;
      position_id: number | null;
    }>(sql`
      SELECT
        COUNT(ec.id) FILTER (
          WHERE ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
        )::int AS active_card_count,
        (
          SELECT od.id FROM employee_cards ec2
          JOIN org_departments od ON od.id = ec2.card_id
          WHERE ec2.employee_id = u.employee_id
            AND ec2.is_active = true AND (ec2.ended_at IS NULL OR ec2.ended_at > NOW())
          ORDER BY ec2.is_primary DESC, ec2.assigned_at DESC NULLS LAST
          LIMIT 1
        ) AS primary_card_id,
        (
          SELECT od.rbac_tier FROM employee_cards ec3
          JOIN org_departments od ON od.id = ec3.card_id
          WHERE ec3.employee_id = u.employee_id
            AND ec3.is_active = true AND (ec3.ended_at IS NULL OR ec3.ended_at > NOW())
          ORDER BY ec3.is_primary DESC, ec3.assigned_at DESC NULLS LAST
          LIMIT 1
        ) AS rbac_tier,
        u.position_id AS position_id
      FROM users u
      LEFT JOIN employee_cards ec ON ec.employee_id = u.employee_id
      WHERE u.id = ${userId}
      GROUP BY u.id, u.employee_id, u.position_id
      LIMIT 1
    `);
    const row = r.rows[0];
    if (!row) return empty;
    return {
      activeCardCount: Number(row.active_card_count ?? 0),
      primaryCardId: row.primary_card_id ?? null,
      rbacTier: row.rbac_tier ?? null,
      positionId: row.position_id ?? null,
    };
  } catch (error: unknown) {
    this.logger.error(`resolveCardGate failed: ${error}`);
    // FAIL-CLOSED tanlovi: gate'ni login.service hal qiladi (admin bypass undan oldin).
    // Bu yerda xato → empty (0 karta). login.service admin/super_admin'ni bypass qiladi,
    // shuning uchun admin DB-xato bo'lsa ham kiradi; oddiy user DB-xato → 401 (xavfsiz tomon).
    return empty;
  }
}
```

> **Eslatma (regress):** `runQuery` import allaqachon mavjud (fayl boshida). Yangi import shart emas.

**Qabul:** `tsc` GREEN. `resolveCardGate(34)` (bobur.k) → activeCardCount=1; `resolveCardGate(1)` (admin) → activeCardCount=0.

**Commit:** `git add apps/api/src/modules/auth/infrastructure/repositories/drizzle-auth.repo.ts apps/api/src/modules/auth/domain/repositories/i-auth.repo.ts && git commit --no-verify -m "feat(auth): resolveCardGate — EP-ORG-003 aktiv-karta gate manbai"`

---

### BOSQICH 2 — Login card-gate (kartasiz → 401)

**Fayl:** `apps/api/src/modules/auth/application/services/login.service.ts`

**Sabab:** EP-ORG-003: kartasiz user login qila olmaydi. Mavjud `checkAccountGates` yonida yangi **card-gate** qadami. super_admin/admin/director bypass (admin kartasiz — regress himoyasi).

**4.2.1 — AuthErrorCode ga yangi kod (`domain/types/index.ts`)**

OLDIN (`domain/types/index.ts:38-46`):
```typescript
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PASSWORD_INVALID = 'PASSWORD_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
```

KEYIN (1 qator qo'sh):
```typescript
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PASSWORD_INVALID = 'PASSWORD_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  NO_ACTIVE_CARD = 'NO_ACTIVE_CARD',   // EP-ORG-003: lavozim-kartasiga biriktirilmagan
  UNAUTHORIZED = 'UNAUTHORIZED',
}
```

**4.2.2 — login.service execute() ga card-gate qadami**

OLDIN (`login.service.ts:109-123`):
```typescript
    const gateError = await this.checkAccountGates(user, command);
    if (gateError) {
      const msg = await this.resolveAuthErrorMessage(gateError);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    const credentialError = await this.verifyCredentials(user, command);
    if (credentialError) {
      const msg = await this.resolveAuthErrorMessage(credentialError);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    await this.recordSuccessfulLogin(user, command);
    return { ok: true, data: this.buildAuthResult(user) };
  }
```

KEYIN (parol tekshirilgandan KEYIN gate — parol noto'g'ri bo'lsa "karta yo'q" deb ma'lumot oqib ketmasligi uchun):
```typescript
    const gateError = await this.checkAccountGates(user, command);
    if (gateError) {
      const msg = await this.resolveAuthErrorMessage(gateError);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    const credentialError = await this.verifyCredentials(user, command);
    if (credentialError) {
      const msg = await this.resolveAuthErrorMessage(credentialError);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    // EP-ORG-003 card-gate: parol to'g'ri, lekin aktiv lavozim-kartasi yo'q → kira olmaydi.
    // super_admin/admin/director bypass (admin kartasiz — tizim-darajasi rol).
    const gate = await this.authRepo.resolveCardGate(user.getId());
    if (!this.isCardExemptRole(user.getRole()) && gate.activeCardCount === 0) {
      this.logger.warn({ userId: user.getId() }, 'Login bloklandi: aktiv karta yo\'q');
      await this.auditFailure(user.getId(), command, AuthErrorCode.NO_ACTIVE_CARD);
      const msg = await this.resolveAuthErrorMessage(AuthErrorCode.NO_ACTIVE_CARD);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    await this.recordSuccessfulLogin(user, command);
    return { ok: true, data: this.buildAuthResult(user, gate) };
  }

  /** super_admin/admin/director — tizim-darajasi rollar, kartasiz ham kiradi (regress: admin). */
  private isCardExemptRole(role: string | undefined): boolean {
    const r = String(role ?? '').toLowerCase();
    return r === 'super_admin' || r === 'admin' || r === 'director';
  }
```

**4.2.3 — resolveAuthErrorMessage ga NO_ACTIVE_CARD**

OLDIN (`login.service.ts:131-143`):
```typescript
  private async resolveAuthErrorMessage(code: AuthErrorCode): Promise<string> {
    switch (code) {
      case AuthErrorCode.USER_NOT_FOUND:
      case AuthErrorCode.INVALID_CREDENTIALS:
        return this.i18n.t('auth.invalidCredentials');
      case AuthErrorCode.ACCOUNT_LOCKED:
        return this.i18n.t('auth.accountLocked');
      case AuthErrorCode.ACCOUNT_INACTIVE:
        return this.i18n.t('auth.accountInactive');
      default:
        return this.i18n.t('errors.unauthorized');
    }
  }
```

KEYIN (1 case qo'sh):
```typescript
  private async resolveAuthErrorMessage(code: AuthErrorCode): Promise<string> {
    switch (code) {
      case AuthErrorCode.USER_NOT_FOUND:
      case AuthErrorCode.INVALID_CREDENTIALS:
        return this.i18n.t('auth.invalidCredentials');
      case AuthErrorCode.ACCOUNT_LOCKED:
        return this.i18n.t('auth.accountLocked');
      case AuthErrorCode.ACCOUNT_INACTIVE:
        return this.i18n.t('auth.accountInactive');
      case AuthErrorCode.NO_ACTIVE_CARD:
        return this.i18n.t('auth.noActiveCard');
      default:
        return this.i18n.t('errors.unauthorized');
    }
  }
```

**4.2.4 — buildAuthResult JWT ga cardId/rbacTier/positionId qo'shadi**

OLDIN (`login.service.ts:182-207`):
```typescript
  private buildAuthResult(user: NonNullable<...>): AuthResult {
    const payload = {
      sub: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
      jti: randomUUID(),
    };
    const accessToken  = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
    return { accessToken, refreshToken, user: { id, username, email, role } };
  }
```

KEYIN (gate parametri + payload-claim):
```typescript
  private buildAuthResult(
    user: NonNullable<Awaited<ReturnType<IAuthRepo['findByUsername']>>>,
    gate: CardGate,
  ): AuthResult {
    // SEC-3: jti. EP-ORG-023: cardId/rbacTier/positionId tokenda — guard kartadan o'qiydi.
    const payload = {
      sub: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
      cardId: gate.primaryCardId,
      rbacTier: gate.rbacTier,
      positionId: gate.positionId,
      jti: randomUUID(),
    };
    const accessToken  = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.getId(),
        username: user.getUsername(),
        email: user.getEmail(),
        role: user.getRole(),
      },
    };
  }
```

> `CardGate` ni `import { CardGate } from '../../domain/repositories/i-auth.repo';` bilan import qil (fayl boshiga). `IAuthRepo` allaqachon import qilingan (`login.service.ts:28`).

**4.2.5 — i18n kalit qo'shish (3 til)**

Fayllar: `apps/api/src/i18n/uz/auth.json`, `.../ru/auth.json`, `.../uz-cyr/auth.json` (mavjud namespace). Har biriga:
```json
"noActiveCard": "Siz hech qaysi lavozim kartasiga biriktirilmagansiz. HR bilan bog'laning."
```
RU: `"Вы не привязаны ни к одной карте должности. Обратитесь в HR."`
UZ-CYR: `"Сиз ҳеч қайси лавозим картасига бириктирилмагансиз. HR билан боғланинг."`

> Avval `find apps/api/src/i18n -name auth.json` bilan aniq yo'lni tasdiqla. Agar `auth.invalidCredentials` qaysi faylda bo'lsa, `noActiveCard` ham o'sha yerga.

**Qabul:** `tsc` GREEN. Jonli: `curl POST /api/auth/login` admin → 200 (bypass); kartasiz oddiy user → 401 "lavozim kartasiga biriktirilmagansiz".

**Commit:** `git add apps/api/src/modules/auth/application/services/login.service.ts apps/api/src/modules/auth/domain/types/index.ts apps/api/src/i18n/uz/auth.json apps/api/src/i18n/ru/auth.json apps/api/src/i18n/uz-cyr/auth.json && git commit --no-verify -m "feat(auth): login card-gate — kartasiz user 401, admin bypass (EP-ORG-003)"`

---

### BOSQICH 3 — jwt.strategy aktiv-karta tekshiruvi + claim propagatsiya

**Fayl:** `apps/api/src/modules/auth/infrastructure/strategies/jwt.strategy.ts` + `domain/types/index.ts`

**Sabab:** Login paytida karta bor edi, lekin sessiya davomida karta o'chsa/ko'chsa, har request da `jwt.strategy.validate` aktiv-kartani qayta tekshirishi kerak (EP-ORG-003: kartasiz ERPga kira olmaydi). Hamda tokendagi `cardId/rbacTier/positionId` ni `request.user` ga uzatish (permission.guard shularni o'qiydi).

> **DIQQAT:** Joriy `permission.guard` `request.user` ni **`jwt-auth.guard`** dan oladi (`common/guards/jwt-auth.guard.ts:117` → `request.user = { ...decoded, id }`), passport `jwt.strategy` dan EMAS (global guard JwtAuthGuard). Shuning uchun **claim-propagatsiya jwt-auth.guard'da** ham bo'lishi shart (Bosqich 4). jwt.strategy faqat passport-himoyalangan endpointlarda ishlaydi — lekin uni ham to'g'rilash izchillik uchun zarur.

**4.3.1 — JwtPayload va AuthenticatedUser ga karta-claim**

OLDIN (`domain/types/index.ts:6-30`):
```typescript
export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role?: string;
  tenantId?: number;
  iat: number;
  exp: number;
}
export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  sub?: number;
  employeeId?: number;
  tenantId?: number;
}
```

KEYIN (karta-claim qo'sh):
```typescript
export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role?: string;
  tenantId?: number;
  /** EP-ORG-023 — primary karta (org_departments.id) tokenda; guard kartadan o'qiydi. */
  cardId?: number | null;
  /** EP-ORG-103 — kartaning rbac_tier (РД). */
  rbacTier?: string | null;
  /** RBAC position_permissions kaliti (users.position_id). */
  positionId?: number | null;
  iat: number;
  exp: number;
}
export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  sub?: number;
  employeeId?: number;
  tenantId?: number;
  cardId?: number | null;
  rbacTier?: string | null;
  positionId?: number | null;
}
```

**4.3.2 — jwt.strategy.validate aktiv-karta + claim**

OLDIN (`jwt.strategy.ts:28-51`):
```typescript
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authRepo.findById(payload.sub);
    if (!user) { ... throw UnauthorizedException('User not found'); }
    if (!user.isAccountActive()) { ... throw UnauthorizedException('Account inactive'); }
    return {
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
      tenantId: payload.tenantId,
    };
  }
```

KEYIN (karta re-check + claim):
```typescript
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authRepo.findById(payload.sub);
    if (!user) {
      this.logger.warn('JWT validation failed: user not found');
      throw new UnauthorizedException('User not found');
    }
    if (!user.isAccountActive()) {
      this.logger.warn('JWT validation failed: account inactive');
      throw new UnauthorizedException('Account inactive');
    }

    // EP-ORG-003: sessiya davomida karta o'chsa/ko'chsa → kira olmaydi (kartasiz ERP yo'q).
    // super_admin/admin/director bypass (admin kartasiz). Tier/cardId KARTADAN qayta o'qiladi
    // (token-claim eskirgan bo'lishi mumkin — karta o'zgargan bo'lsa).
    const gate = await this.authRepo.resolveCardGate(user.getId());
    if (!this.isCardExemptRole(user.getRole()) && gate.activeCardCount === 0) {
      this.logger.warn('JWT validation failed: no active card');
      throw new UnauthorizedException('No active card');
    }

    return {
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
      tenantId: payload.tenantId,
      cardId: gate.primaryCardId,
      rbacTier: gate.rbacTier,
      positionId: gate.positionId,
    };
  }

  private isCardExemptRole(role: string | undefined): boolean {
    const r = String(role ?? '').toLowerCase();
    return r === 'super_admin' || r === 'admin' || r === 'director';
  }
```

**Qabul:** `tsc` GREEN. (jonli passport-himoyalangan endpoint kam — asosiy yo'l jwt-auth.guard, Bosqich 4.)

**Commit:** `git add apps/api/src/modules/auth/infrastructure/strategies/jwt.strategy.ts apps/api/src/modules/auth/domain/types/index.ts && git commit --no-verify -m "feat(auth): jwt.strategy aktiv-karta re-check + karta-claim propagatsiya"`

---

### BOSQICH 4 — jwt-auth.guard claim-propagatsiya (permission.guard positionId/cardId oladi)

**Fayl:** `apps/api/src/common/guards/jwt-auth.guard.ts`

**Sabab:** Global `JwtAuthGuard` token'ni verify qiladi va `request.user = { ...decoded, id }` qiladi (`:117`). Token endi `cardId/rbacTier/positionId` ni o'z ichiga oladi (Bosqich 2). `{ ...decoded }` ular avtomatik o'tadi — lekin `decoded` raw payload, biz `request.user.positionId` mavjudligini KAFOLATLAYMIZ va tip-xavfsiz qilamiz. **Asosiy o'zgarish kerak emas** (spread allaqachon claim'larni o'tkazadi); lekin biz aniqlik uchun `request.user` shaklini tasdiqlaymiz va REGRESS himoyasini ta'minlaymiz.

OLDIN (`common/guards/jwt-auth.guard.ts:116-118`):
```typescript
      request.user = { ...decoded, id: userId };
      return true;
```

KEYIN (claim'larni aniq surat + raqamga aylantir; spread saqlanadi, regress yo'q):
```typescript
      // EP-ORG-023: token karta-kontekstini tashiydi. permission.guard `user.positionId` ni,
      // RBAC-resolver `user.cardId/rbacTier` ni o'qiydi. spread bilan barcha claim o'tadi;
      // positionId/cardId raqam-tipini kafolatlash uchun aniq map qilamiz.
      const positionId = typeof decoded['positionId'] === 'number' ? decoded['positionId'] : undefined;
      const cardId = typeof decoded['cardId'] === 'number' ? decoded['cardId'] : undefined;
      const rbacTier = typeof decoded['rbacTier'] === 'string' ? decoded['rbacTier'] : undefined;
      request.user = { ...decoded, id: userId, positionId, cardId, rbacTier };
      return true;
```

> **Regress:** super_admin admin tokenida `positionId`/`cardId` null bo'ladi (gate-exempt). `permission.guard.isAdminRole` ulardan oldin `return true` qiladi (`permission.guard.ts:68`) — admin perms'siz ham FULL. Tekshir: o'zgarish admin oqimini buzmaydi.

**Qabul:** `tsc` GREEN. Jonli: oddiy manager login → token decode → `positionId` mavjud (Bosqich 7 DB-proof).

**Commit:** `git add apps/api/src/common/guards/jwt-auth.guard.ts && git commit --no-verify -m "feat(auth): jwt-auth.guard karta-claim (positionId/cardId/rbacTier) request.user'ga"`

---

### BOSQICH 5 — RBAC tier manbasini KARTAga ko'chirish (org_functions → org_departments)

**Fayl:** `apps/api/src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts`

**Sabab:** EP-ORG-023: ruxsat kartadan. Joriy `findUserWithPosition` (`:54-72`) COALESCE bilan `org_functions.rbac_tier` (via `users.org_function_id`) o'qiydi. FAZA 0 `org_functions` ni retire qiladi → bu so'rov buziladi yoki eski dunyoni o'qiydi. Kanonik karta = `org_departments`; tier aktiv `employee_cards` orqali kelishi kerak.

OLDIN (`drizzle-my-permissions.repo.ts:51-72`):
```typescript
      // EP-ORG-003 card-gate: RBAC tier resolves FROM THE CARD (canonical org_functions via
      // users.org_function_id) first, falling back to positions.rbac_tier for card-less users
      const rows = await rawSql(sql`
        SELECT
          u.id                                   AS "userId",
          u.username                             AS username,
          u.role                                 AS role,
          p.id                                   AS "positionId",
          p.code                                 AS "positionCode",
          p.name_uz                              AS "positionNameUz",
          p.name_ru                              AS "positionNameRu",
          COALESCE(ofn.rbac_tier, p.rbac_tier)   AS "rbacTier",
          d.code                                 AS "departmentCode",
          d.name_uz                              AS "departmentNameUz"
        FROM users u
        LEFT JOIN positions p      ON p.id = u.position_id
        LEFT JOIN org_functions ofn ON ofn.id = u.org_function_id AND ofn.deleted_at IS NULL
        LEFT JOIN departments d    ON d.id = u.department_id
        WHERE u.id = ${userId}
        LIMIT 1
      `);
```

KEYIN (karta = org_departments orqali, aktiv employee_cards bilan):
```typescript
      // EP-ORG-023 RBAC tier KARTADAN: aktiv employee_cards → org_departments.rbac_tier (kanonik).
      // Fallback positions.rbac_tier — faqat kartasiz tizim-rollar (admin) uchun. FAZA 0'dan keyin
      // org_functions retire — endi org_departments yagona karta.
      // NOTE: Raw SQL — aktiv-karta LATERAL subquery + COALESCE-cross-table; muddat-shartli filtr.
      const rows = await rawSql(sql`
        SELECT
          u.id                                       AS "userId",
          u.username                                 AS username,
          u.role                                     AS role,
          p.id                                       AS "positionId",
          p.code                                     AS "positionCode",
          p.name_uz                                  AS "positionNameUz",
          p.name_ru                                  AS "positionNameRu",
          COALESCE(card.rbac_tier, p.rbac_tier)      AS "rbacTier",
          d.code                                     AS "departmentCode",
          d.name_uz                                  AS "departmentNameUz"
        FROM users u
        LEFT JOIN positions p   ON p.id = u.position_id
        LEFT JOIN departments d ON d.id = u.department_id
        LEFT JOIN LATERAL (
          SELECT od.rbac_tier
          FROM employee_cards ec
          JOIN org_departments od ON od.id = ec.card_id
          WHERE ec.employee_id = u.employee_id
            AND ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
          ORDER BY ec.is_primary DESC, ec.assigned_at DESC NULLS LAST
          LIMIT 1
        ) card ON true
        WHERE u.id = ${userId}
        LIMIT 1
      `);
```

> **Fabrikatsiya TAQIQ:** `org_departments.rbac_tier` = 144/144 NULL. So'rov NULL qaytaradi → `rbacTier` null → `GetMyPermissions` empty perms (kartali, lekin tier kiritilmagan). Bu **to'g'ri** (egasi tier kiritmaguncha tier-asosli ruxsat yo'q). Module-darajasi ruxsat hamon `position_permissions` (positionId) orqali ishlaydi — u 1380 qator, jonli.

**Qabul:** `tsc` GREEN. Jonli: `GET /api/auth/me/permissions` (manager token) → 200, positionId-asosli modullar; rbacTier=null (egasi-data kutilmoqda).

**Commit:** `git add apps/api/src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts && git commit --no-verify -m "feat(auth): RBAC tier manbasini KARTAga (org_departments) ko'chirish — EP-ORG-023"`

---

### BOSQICH 6 — Payroll aktiv-kartasiz xodimni SKIP

**Fayl:** `apps/api/src/modules/hr/payroll/payroll.service.ts` + `drizzle-hr-payroll.repo.ts` + `i-hr-payroll.repo.ts`

**Sabab:** EP-ORG-003: kartasiz oylik yo'q. `closePeriod` (`payroll.service.ts:68`) `listRowsByPeriod` bilan barcha qatorlarni oladi. Aktiv-kartasiz xodim qatorini agregatsiya/GL'dan **chiqarib tashlash** kerak.

**4.6.1 — Repo'ga aktiv-karta tekshiruvi (yangi metod)**

`i-hr-payroll.repo.ts` ga (interfeysga):
```typescript
/** EP-ORG-003: berilgan employee_id'lar ichida aktiv lavozim-kartasi BO'LGANlarini qaytaradi. */
filterEmployeesWithActiveCard(employeeIds: number[]): Promise<Result<number[]>>;
```

`drizzle-hr-payroll.repo.ts` ga implementatsiya:
```typescript
/**
 * EP-ORG-003 oylik-gate: aktiv employee_cards (→ org_departments) bo'lgan employee_id'lar.
 * NOTE: Raw SQL — ANY($array) + muddat-shartli filtr.
 */
async filterEmployeesWithActiveCard(employeeIds: number[]): Promise<Result<number[]>> {
  try {
    const ids = Array.isArray(employeeIds) ? employeeIds.filter((n) => Number.isInteger(n)) : [];
    if (ids.length === 0) return Ok([]);
    const rows = await rawSql(sql`
      SELECT DISTINCT ec.employee_id AS "employeeId"
      FROM employee_cards ec
      WHERE ec.employee_id = ANY(${ids})
        AND ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
    `);
    const data = dbRows<{ employeeId: number }>(rows);
    return Ok((Array.isArray(data) ? data : []).map((r) => r.employeeId));
  } catch (e: unknown) {
    return Err((e as Error)?.message || 'filterEmployeesWithActiveCard xatosi');
  }
}
```
> `rawSql`, `dbRows`, `Ok/Err` import'larini fayl boshidagi mavjud import'lardan tekshirib qo'sh (agar yo'q bo'lsa).

**4.6.2 — payroll.service.closePeriod skip**

OLDIN (`payroll.service.ts:68-74`):
```typescript
    const rowsR = await this.hrPayrollRepo.listRowsByPeriod(periodId);
    if (!rowsR.ok) return rowsR as unknown as Result<never>;
    const rows = (Array.isArray(rowsR.data) ? rowsR.data : []).map((r) => this.normalizeRow(r));

    const canClose = this.closure.canClose(period, rows);
```

KEYIN (kartasiz qatorlarni skip):
```typescript
    const rowsR = await this.hrPayrollRepo.listRowsByPeriod(periodId);
    if (!rowsR.ok) return rowsR as unknown as Result<never>;
    const allRows = (Array.isArray(rowsR.data) ? rowsR.data : []).map((r) => this.normalizeRow(r));

    // EP-ORG-003 oylik-gate: aktiv lavozim-kartasi yo'q xodim oyligi YOZILMAYDI (skip).
    const empIds = allRows
      .map((r) => Number((r as Record<string, unknown>)['employeeId'] ?? (r as Record<string, unknown>)['employee_id']))
      .filter((n) => Number.isInteger(n));
    const cardedR = await this.hrPayrollRepo.filterEmployeesWithActiveCard(empIds);
    if (!cardedR.ok) return cardedR as unknown as Result<never>;
    const carded = new Set(cardedR.data);
    const rows = allRows.filter((r) => {
      const eid = Number((r as Record<string, unknown>)['employeeId'] ?? (r as Record<string, unknown>)['employee_id']);
      const keep = carded.has(eid);
      if (!keep) this.logger.warn(`Payroll skip: employee #${eid} aktiv-kartasiz (EP-ORG-003)`);
      return keep;
    });

    const canClose = this.closure.canClose(period, rows);
```

> `normalizeRow` qaysi nom bilan `employeeId` qaytarayotganini tekshir (`payroll.service.ts` `normalizeRow` metodida). Agar boshqa nom bo'lsa, moslab map qil. Agar `payroll_rows.employee_id` to'g'ridan o'qilsa, snake_case ham qamrab olingan (yuqorida ikkala variant).

**Qabul:** `tsc` GREEN. DB-proof (§9.3): kartasiz xodim qatori bo'lsa, totals'ga kirmaydi.

**Commit:** `git add apps/api/src/modules/hr/payroll/payroll.service.ts apps/api/src/modules/hr/payroll/drizzle-hr-payroll.repo.ts apps/api/src/modules/hr/payroll/i-hr-payroll.repo.ts && git commit --no-verify -m "feat(payroll): aktiv-kartasiz xodimni oylik-hisobdan skip (EP-ORG-003)"`

---

### BOSQICH 7 — Karta o'zgarsa ruxsat re-resolve (cache invalidate)

**Fayl:** RBAC cache invalidatsiya — `apps/api/src/common/cache/rbac-cache.service.ts` + chaqiruvchi (org-mutations / employee_cards assign).

**Sabab:** EP-ORG-023: "karta o'zgarsa ruxsat o'zgaradi". `GetMyPermissions` Redis'da 15-daq cache qiladi (positionId bo'yicha). Karta-biriktirish o'zgarsa (assign/unassign/move/razryad-tier), kesh **invalidate** bo'lishi shart, aks holda 15 daq eski ruxsat qoladi. Q17: JWT TTL ichida (24h) token-claim eski, lekin `/auth/me/permissions` (cache 15daq) va keyingi refresh yangilanadi — egasi buni qabul qilgan.

**4.7.1 — Cache invalidate metodi mavjudligini tekshir**

`rbac-cache.service.ts` da `invalidatePositionPerms(positionId)` yoki shunga o'xshash metod bor-yo'qligini Grep bilan tekshir:
```
grep -n "invalidate\|del\|clear" apps/api/src/common/cache/rbac-cache.service.ts
```
Agar yo'q bo'lsa, qo'sh:
```typescript
/** EP-ORG-023: karta/lavozim o'zgarsa position-perms keshini tozalaydi (keyingi resolve DB'dan). */
async invalidatePositionPerms(positionId: number): Promise<Result<void>> {
  if (!this.isRedisConnected) return Ok(undefined);
  try {
    await this.redis.del(this.positionKey(positionId));  // mavjud key-builder'ni ishlat
    return Ok(undefined);
  } catch (e: unknown) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}
```
> Mavjud `setPositionPerms`/`getPositionPerms` key-builder pattern'ini (`positionKey`) qayta ishlat — yangi nomlash kiritma (regress).

**4.7.2 — Karta-biriktirish o'zgarganda chaqirish**

FAZA 1 da `employee_cards` assign/unassign org-mutations yoki card.service'da bo'ladi. O'sha joyga (assign muvaffaqiyatidan keyin) cache invalidate qo'sh:
```typescript
// EP-ORG-023: karta o'zgardi → ruxsat keshini tozala (15-daq eski perm qolmasin).
if (user.positionId) await this.rbacCache?.invalidatePositionPerms(user.positionId);
```
> Aniq joy FAZA 1 yetkazib bergan `assignEmployee`/`assignUser` muvaffaqiyat-shoxida. Agar FAZA 1 hali employee_cards yozuvchi yo'lni org_departments'ga ulamagan bo'lsa — bu invalidatsiya o'sha yo'lga qo'shiladi. RbacCacheService DI orqali in'ektsiya qilinadi (`@Optional()`).

**Qabul:** `tsc` GREEN. Jonli: karta tier o'zgartirilsa → `/auth/me/permissions` keyingi chaqiruvda yangi tier (DB-dan, kesh-miss).

**Commit:** `git add <faqat-o'zgargan-fayllar> && git commit --no-verify -m "feat(auth): karta o'zgarsa RBAC kesh invalidate — ruxsat re-resolve (EP-ORG-023)"`

---

## 5. DB (migration — bu fazada YANGI JADVAL/USTUN KERAK EMAS)

Master-reja §3 FAZA-2 DB: *"card-gate o'qish (yangi ustun shart emas — employee_cards orqali)"*. DB-proof bilan tasdiqlangan:
- `org_departments.rbac_tier` ustuni **mavjud** (text, 144/144 NULL) — yangi ALTER kerak emas.
- `employee_cards` (FAZA 1) — bu faza faqat **o'qiydi**.
- `position_permissions` (1380 qator) — o'zgarmaydi.

**Shuning uchun `migrations-drift.ts` ga DDL qo'shilmaydi.** Agar verify paytida `rbac_tier` yo'qligi aniqlansa (kutilmagan) → faqat shunda, `// APPROVED:` izoh bilan idempotent ALTER:
```sql
-- APPROVED: EP-ORG-103 RBAC tier kartada (faqat ustun yo'q bo'lsa — DB-proof rbac_tier mavjudligini ko'rsatdi)
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS rbac_tier text;
```
Aks holda — DDL YO'Q.

---

## 6. Zod / Result / Drizzle NAMUNALARI (bu fazaga xos)

**Result (repo metodi):**
```typescript
async resolveCardGate(userId: number): Promise<CardGate> { /* try → row → CardGate; catch → empty */ }
// closePeriod ichida: const cardedR = await this.hrPayrollRepo.filterEmployeesWithActiveCard(empIds);
//                     if (!cardedR.ok) return cardedR as unknown as Result<never>;
```

**Zod (login DTO — mavjud, o'zgarmaydi):** `LoginSchema` (`presentation/dto/login.dto.ts`) — bu faza yangi `@Body()` qo'shmaydi, shuning uchun yangi Zod schema kerak emas. Agar admin "kartali userlar" hisobotini ko'rsatuvchi yangi endpoint qo'shilsa (ixtiyoriy, ko'lamda yo'q) — Zod query-schema bilan.

**Drizzle vs Raw:** Karta-gate so'rovlari (LATERAL + COALESCE-cross-table + muddat-shart) **raw SQL** bilan + `// NOTE:` izoh (Qoida 4 ruxsat). Oddiy o'qishlar (agar bo'lsa) Drizzle bilan.

---

## 7. FE + DIZAYN (EP token / shablon / komponent)

Bu faza asosan **backend**. FE o'zgarishi minimal:

### 7.1 Login xato-xabari (`artifacts/erp-dashboard/src/pages/Login.tsx` + `LoginSections.tsx`)
- Login 401 "lavozim kartasiga biriktirilmagansiz" xabarini ko'rsatish — **mavjud `error` state** (`Login.tsx:28` `error: string | null`) avtomatik BE xabarini ko'rsatadi. **Yangi UI kerak emas** — faqat tasdiqla: BE'dan kelgan `message` `error` state'ga tushadi va render bo'ladi.
- Dizayn: mavjud xato-blok (`LoginSections.tsx`) EP token bilan — o'zgartirma (regress).
- F2 (onError): login mutation'da onError mavjudligini tasdiqla (`Login.tsx` `handleSubmit` catch → setError).

### 7.2 `/auth/me/permissions` ko'rsatish (ixtiyoriy — ko'lamda asosiy emas)
- Agar admin "Mening ruxsatlarim" sahifasi bo'lsa, `rbacTier` ni ko'rsatish mumkin. **Yangi sahifa qo'shilMAYDI** (ko'lamda yo'q). Mavjud `use-auth.ts`/`useAuth.tsx` permission-state'i o'zgarmaydi.

### 7.3 i18n (3 til)
- `noActiveCard` kaliti FE `locales/{uz,ru,uz-cyr}/auth.json` ga ham qo'shilishi mumkin (agar FE BE-xabarni emas, kalit bo'yicha render qilsa). Lekin joriy oqim BE `message` ni to'g'ridan ko'rsatadi → FE kalit shart emas. Avval tekshir: `Login.tsx` xatoni BE-message dan oladimi yoki i18n-kalit dan.

**Dizayn-qoida (Qoida 21/41/43):** Hech qanday inline xom rang qo'shilmaydi; mavjud shablon saqlanadi; ishlayotgan element o'chirilmaydi.

---

## 8. QABUL-MEZONI (Definition of Done — har biri DB-proof + jonli)

| # | Mezon | Tekshiruv |
|---|---|---|
| QM-1 | Kartasiz oddiy user login → **401** "lavozim kartasiga biriktirilmagansiz" | `curl POST /api/auth/login` (kartasiz user) → 401 + i18n xabar |
| QM-2 | super_admin/admin/director kartasiz ham login → **200** (regress: admin) | `curl POST /api/auth/login` admin → 200 + token |
| QM-3 | Kartali user login → **200**, token'da `cardId`/`rbacTier`/`positionId` claim | token decode (jwt payload) → claim'lar mavjud |
| QM-4 | Sessiya kartasini yo'qotgan user (karta unassign) → keyingi request **401** | jwt.strategy/jwt-auth.guard re-check (bproof) |
| QM-5 | RBAC tier **kartadan** (org_departments) o'qiladi, org_functions'dan EMAS | `findUserWithPosition` so'rovida `org_functions` YO'Q; bproof |
| QM-6 | rbac_tier NULL (egasi-data yo'q) → graceful (positionId-perms ishlaydi, fabrikatsiya yo'q) | `/auth/me/permissions` 200, rbacTier=null, modullar bor |
| QM-7 | Payroll kartasiz xodim qatorini SKIP qiladi (oylik yozilmaydi) | bproof: kartasiz emp qatori totals'ga kirmaydi |
| QM-8 | Karta o'zgarsa RBAC kesh invalidate → keyingi resolve yangi | bproof / jonli `/auth/me/permissions` kesh-miss |
| QM-9 | `tsc` o'z fayllarda 0 xato | `pnpm --filter @europrint/api exec tsc --noEmit` |
| QM-10 | Regress: joriy guardlar/login/perms ishlashda (admin + manager kiradi) | jonli login + `/auth/me/permissions` 2 rol |

---

## 9. SELF-VERIFY (tsc + rollback-tx DB-proof + jonli)

### 9.1 Typecheck
```bash
cd apps/api && pnpm exec tsc --noEmit 2>&1 | grep -E "auth|payroll|jwt|permission" || echo "O'z fayllarda 0 xato"
```

### 9.2 DB-proof: card-gate (rollback-tx — kirit→oqdi→ko'rindi→ROLLBACK)
Yangi fayl: `_audit/bproof-login-card-gate.cjs` (namuna — mavjud `bproof-*.cjs` uslubida, `pg` Pool + BEGIN/ROLLBACK):
```js
/* eslint-disable */
// EP-ORG-003 card-gate DB-proof: kartali=login OK, kartasiz=login bloklanadi, admin=bypass.
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host:'127.0.0.1', port:5432, user:'postgres', password:'postgres', database:'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    // 1) admin (id=1): kartasiz → gate-exempt (super_admin) → kiradi
    const admin = await c.query("SELECT role FROM users WHERE id=1");
    console.log('admin role =', admin.rows[0]?.role, '(kutiladi: super_admin → bypass)');
    // 2) gate-query (login.service resolveCardGate bilan bir xil mantiq) — kartali user
    const carded = await c.query(`
      SELECT u.id, u.username,
        (SELECT count(*) FROM employee_cards ec
          WHERE ec.employee_id=u.employee_id AND ec.is_active=true
            AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_cards
      FROM users u WHERE u.id=34`);
    console.log('kartali user (34) active_cards =', carded.rows[0]?.active_cards, '(kutiladi: ≥1 → login OK)');
    // 3) SIMULYATSIYA: bobur.k kartasini deaktiv qil (rollback bilan) → active_cards=0 → bloklanadi
    await c.query(`UPDATE employee_cards SET is_active=false WHERE employee_id=2`);
    const after = await c.query(`
      SELECT (SELECT count(*) FROM employee_cards ec
        WHERE ec.employee_id=2 AND ec.is_active=true
          AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_cards`);
    console.log('karta deaktivdan keyin (emp 2) active_cards =', after.rows[0]?.active_cards, '(kutiladi: 0 → login BLOK)');
    await c.query('ROLLBACK');   // hech narsa o'zgarmaydi (jonli data himoyalangan)
    console.log('ROLLBACK — jonli data o\'zgarmadi. PROOF OK.');
  } catch (e) { await c.query('ROLLBACK'); console.error('PROOF FAIL:', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
Ishga: `node _audit/bproof-login-card-gate.cjs`

### 9.3 DB-proof: payroll skip
Yangi fayl: `_audit/bproof-payroll-card-skip.cjs` (xuddi shu uslub) — bir period uchun `payroll_rows.employee_id` larni ol, `filterEmployeesWithActiveCard` so'rovini jonli ishlat, kartasizlarni topib SKIP'ga tushishini ko'rsat, ROLLBACK.

### 9.4 DB-proof: RBAC tier kartadan
`node _audit/q.cjs` bilan tasdiq:
```bash
node _audit/q.cjs "SELECT u.id, u.username, (SELECT od.rbac_tier FROM employee_cards ec JOIN org_departments od ON od.id=ec.card_id WHERE ec.employee_id=u.employee_id AND ec.is_active=true ORDER BY ec.is_primary DESC LIMIT 1) AS card_tier FROM users u WHERE u.id IN (34,37,40)"
```
Kutiladi: `card_tier=NULL` (egasi-data yo'q) — graceful, fabrikatsiya yo'q.

### 9.5 Jonli (server qaytgach — Q-44 nest-watch tushsa qayta ishga tushir)
```bash
# Admin login (bypass)
curl -s -X POST http://127.0.0.1:3030/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"<egasi>"}' | head -c 200
# Token decode → cardId/positionId/rbacTier claim bor-yo'qligini tekshir (kartali user)
# /auth/me permissions (manager token)
curl -s http://127.0.0.1:3030/api/auth/me/permissions -H "Authorization: Bearer <token>" | head -c 400
```

### 9.6 Static fallback (Q-32 — lokal/auth qulasa)
tsc GREEN + diff o'qish + pattern tasdiq + 9.2/9.3/9.4 rollback-tx proof. Jonli-HTTP server qaytgach.

---

## 10. EDGE-HOLATLAR

| Holat | Kutilgan xulq-atvor |
|---|---|
| admin (id=1, super_admin, kartasiz) | Login OK (bypass). `cardId/rbacTier=null`, permission.guard `isAdminRole`→FULL. |
| director kartasiz | Login OK (bypass — tizim-rol). |
| oddiy manager kartali | Login OK; cardId set; positionId set; rbacTier=null (egasi-data yo'q) → positionId-perms ishlaydi. |
| oddiy user **bir nechta** aktiv karta (FAZA 1 ko'p-karta) | Login OK; primary karta (is_primary, yo'q bo'lsa eng so'nggi assigned_at) cardId/tier manbai. |
| user faqat **i.o. (acting)** kartaga ega | activeCardCount ≥1 (acting ham hisoblanadi) → login OK. |
| karta `ended_at < NOW()` (muddati tugagan i.o.) | aktiv emas → hisoblanmaydi; boshqa karta yo'q bo'lsa → 401. |
| `resolveCardGate` DB-xatosi | empty (0 karta) → oddiy user 401 (xavfsiz), lekin admin bypass undan oldin → admin kiradi. |
| `rbac_tier` NULL (144/144) | graceful: tier-asosli ruxsat yo'q, module-perms (positionId) ishlaydi. FABRIKATSIYA YO'Q. |
| Redis o'chiq (cache yo'q) | `@Optional()` rbacCache null → DB fallback (mavjud xulq). Invalidate no-op. |
| Eski token (cardId claim'siz, FAZA 2 oldidan) | `jwt-auth.guard` `typeof !== 'number'` → `positionId=undefined`; jwt.strategy re-resolve qiladi; permission.guard positionId yo'q → admin emas → 403 (to'g'ri, refresh kerak). Tier graceful. |
| Payroll period'da kartasiz xodim qatori | SKIP + warn log; totals'ga kirmaydi; GL faqat kartalilar bo'yicha. |
| Payroll: bir xodim ko'p karta | employee_id bir marta — `filterEmployeesWithActiveCard` DISTINCT; oylik-yig'indi FAZA 4 ishi (bu faza faqat gate). |

---

## 11. OWNER-DATA (FABRIKATSIYA TAQIQ — egasi to'ldiradi)

| Data | Hozir | Bu faza talab |
|---|---|---|
| `org_departments.rbac_tier` (РД darajasi — РД-4/РД-5 ...) | **0/144 (NULL)** | Egasi har karta uchun "qaror beruvchi rol" (rbac_tier) qiymatini beradi. **Mexanizm bu fazada quriladi; qiymat egasidan.** Tier NULL bo'lsa → tier-asosli ruxsat yo'q (graceful, soxta qiymat YO'Q). |
| Aktiv karta-biriktirish (kim qaysi kartada) | FAZA 1 ham DATA kutadi (head_user_id 18/144, binding) | Login/payroll gate FAZA 1'ning binding-data'siga bog'liq. Egasi/HR biriktiradi. |

> **Eslatma:** Bu faza `position_permissions` (1380 qator, jonli) ga TEGMAYDI — module-darajasi ruxsat ishlashda qoladi. `rbac_tier` qo'shimcha qatlam (РД-asosli marshrut, EP-ORG-103), egasi to'ldirganda faollashadi.

---

## 12. COMMIT TARTIBI (jami 7 commit — har bosqich alohida)

1. `feat(auth): resolveCardGate — EP-ORG-003 aktiv-karta gate manbai` (Bosqich 1)
2. `feat(auth): login card-gate — kartasiz user 401, admin bypass (EP-ORG-003)` (Bosqich 2)
3. `feat(auth): jwt.strategy aktiv-karta re-check + karta-claim propagatsiya` (Bosqich 3)
4. `feat(auth): jwt-auth.guard karta-claim (positionId/cardId/rbacTier) request.user'ga` (Bosqich 4)
5. `feat(auth): RBAC tier manbasini KARTAga (org_departments) ko'chirish — EP-ORG-023` (Bosqich 5)
6. `feat(payroll): aktiv-kartasiz xodimni oylik-hisobdan skip (EP-ORG-003)` (Bosqich 6)
7. `feat(auth): karta o'zgarsa RBAC kesh invalidate — ruxsat re-resolve (EP-ORG-023)` (Bosqich 7)

Har commit: `git add <faqat-o'sha-bosqich-fayllari>` (HECH QACHON `-A`), `--no-verify`, oxirida:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## 13. YAKUNIY HOLAT HISOBOTI (Q-38 — egasiga)

Faza oxirida egasiga ko'rsatiladi:
- **DONE:** card-gate (login + jwt.strategy + payroll), RBAC tier kartadan, JWT karta-claim, cache invalidate.
- **DB-PROOF:** bproof-login-card-gate / bproof-payroll-card-skip / q.cjs tier-from-card — natijalar.
- **JONLI:** admin login 200 (bypass), kartasiz user 401, manager `/auth/me/permissions` 200.
- **DEFER (egasi-data):** rbac_tier qiymatlari (0/144) — egasi РД darajasini beradi; shunda tier-asosli marshrut (EP-ORG-103) faollashadi.
- **REGRESS:** admin + manager hamon kiradi; position_permissions (1380) o'zgarmadi; guardlar ishlashda.
- **COMMIT'lar:** 7 ta (yuqorida).

---

## 14. NIMA QILMASLIK (chegaralar — Q-33/scope)

- **Yangi login tizimi QURILMAYDI** (egasi istamaydi) — faqat mavjud JWT ustiga card-gate qatlam.
- `rbac_tier` ga **soxta qiymat YOZILMAYDI** (egasi-data).
- `position_permissions` (1380) **o'zgartirilmaydi** (module-perms ishlashda qoladi).
- JWT TTL **15 daqiqaga tushirilMAYDI** (Q17: egasi 24h qabul qilgan; refresh da yangilanadi).
- FAZA 1 (employee_cards M:N, stake_fraction) va FAZA 0 (org_functions retire, FK re-point) **bu fazada qayta qilinmaydi** — ular tugagan deb qabul qilinadi. Agar tugamagan bo'lsa → egasiga xabar ber, bu fazani boshlamaydi.
- Maxfiy-maydon projection (EP-ORG-042), 2-imzo (EP-ORG-126), i.o.-scoped RBAC (EP-ORG-062) — **alohida ish** (login-rbac qolgan qismi, keyingi to'lqin). Bu faza faqat **card-gate + tier-manbasi + JWT-claim**.

---

*FAZA 02 direktivasi — 2026-06-25. Bog'liqlik: FAZA 0 + FAZA 1 tugagan. Keyingi: FAZA 03 (razryad o'sish/pasayish execution).*
