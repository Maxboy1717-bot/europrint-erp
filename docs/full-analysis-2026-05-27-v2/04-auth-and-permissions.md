# Report 04 — Auth & Permissions

**Date:** 2026-05-27 (round 2, fresh verification)
**Auditor:** forensic-agent (read-only)
**Scope:**
- `apps/api/src/modules/auth/`
- `apps/api/src/common/guards/`
- `apps/api/src/shared/db/schema-core.ts`
- `apps/api/src/shared/db/invariants/migrations-drift.ts`
- `apps/api/src/modules/general/controllers/admin-auth.controller.ts`
- `apps/api/src/modules/legacy/controllers/admin-auth.controller.ts`
- `artifacts/erp-dashboard/src/components/LoginForm.tsx`
- `_db_cols.txt` (live DB column inventory, snapshot 2026-05-25 15:45)

---

## Diff vs round 1

Round 1 made eight findings. Verification on 2026-05-27:

| Round-1 claim | Status after re-verify | Evidence |
|---|---|---|
| OTP routes `/api/auth/otp/request` + `/api/auth/otp/verify` return 404 (P0) | **OUTDATED** — frontend now calls `/api/auth/resend-otp` + `/api/auth/verify-otp`, both registered | `LoginForm.tsx:37,55`; `auth-account.controller.ts:60,71` |
| `jti`-based revocation broken — column missing in schema (P1) | **PARTIALLY FIXED** — Drizzle schema now has `jti` (schema-core.ts:69) and a boot-migration step exists; but `_db_cols.txt` (live DB) still lacks the column, AND the *blacklist writer* still inserts hashed token instead of jti | `schema-core.ts:69`, `migrations-drift.ts:3197`, `_db_cols.txt:11873-11878`, `drizzle-auth.repo.ts:113-124` |
| `username` column missing from Drizzle schema (P1) | **FIXED in schema** — added 2026-05-27 (schema-core.ts:37); live DB already had it (col 14042) | `schema-core.ts:37`, `_db_cols.txt:14042` |
| Single role per user (P2) | **STILL TRUE** — `users.role` is a single enum | `schema-core.ts:40`, `_db_cols.txt:14060` |
| Tenant filtering not applied (P2) | Out of scope for this report; deferred to tenant-isolation report |  |
| EmployeeId step has no server call (P2) | **STILL TRUE** — `handleEmployeeIdSubmit` only routes locally | `LoginForm.tsx:82-86` |
| Three duplicate guard implementations (P3) | **INACCURATE COUNT, BENIGN** — there are FIVE `jwt-auth.guard.ts` files, but four are pure re-export shims that point to `@common/guards/jwt-auth.guard` (the only implementation). Same pattern for `roles.guard.ts` | see §2 below |
| Two `public.decorator.ts` files but both keys aligned (P2) | **VERIFIED, BENIGN** — both files emit `'isPublic'` | `common/decorators/public.decorator.ts:8`, `auth/infrastructure/decorators/public.decorator.ts:18` |

NEW issues round 2 found:
- A *third* `POST auth/refresh` exists in `general/controllers/admin-auth.controller.ts` but is **dead** (not registered in any `@Module`).
- A *fourth* refresh-token controller `legacy/controllers/admin-auth.controller.ts` is registered at `POST /api/admin/auth/refresh` (no collision but second JWT issuance path with different claim shape).
- Blacklist *write* path (`DrizzleAuthRepo.blacklistToken`) inserts the SHA-256 hash of the raw token into `refresh_tokens.token`, **never populates `jti`**. The guard *read* path queries by `jti`. The two halves do not meet — even after the migration runs, blacklisting will not work.
- `LogoutService` decodes the token (`jwt.decode`, not `verify`) and passes the *raw access token* to `blacklistToken`. There is no jti extraction at all.

---

## 1. Controller inventory & route map

The auth module's `auth.module.ts:49` registers exactly three controllers:

```
controllers: [AuthController, AuthAccountController, MePermissionsController],
```

Global API prefix `api` is added by `apps/api/src/main-bootstrap.ts:161` (`app.setGlobalPrefix('api', {…})`), so every route below is reached at `/api/<path>` from the browser.

### 1.1 `AuthController` (`presentation/auth.controller.ts:69`)

`@Controller('auth')` + `@AuthThrottle()` + `@UseInterceptors(AuditInterceptor)` + `@ApiTags('Auth')`.

| Method | Path | Decorators | Handler | File:line |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `@Public`, `@HttpCode(200)` | `login()` | `auth.controller.ts:84-110` |
| `POST` | `/api/auth/logout` | `@HttpCode(200)`, `@ApiBearerAuth()` | `logout()` | `auth.controller.ts:115-138` |
| `POST` | `/api/auth/refresh` | `@Public`, `@HttpCode(200)` | `refresh()` | `auth.controller.ts:147-201` |

### 1.2 `AuthAccountController` (`presentation/auth-account.controller.ts:29`)

`@Controller('auth')` — second controller on the same prefix (acceptable in NestJS so long as paths don't collide).

| Method | Path | Decorators | Handler | File:line |
|---|---|---|---|---|
| `PATCH` | `/api/auth/change-password` | `@HttpCode(200)`, `@ApiBearerAuth()` | `changePassword()` | `auth-account.controller.ts:44-58` |
| `POST` | `/api/auth/verify-otp` | `@Public`, `@HttpCode(200)` | `verifyOtp()` | `auth-account.controller.ts:60-69` |
| `POST` | `/api/auth/resend-otp` | `@Public`, `@HttpCode(200)` | `resendOtp()` | `auth-account.controller.ts:71-79` |
| `GET` | `/api/auth/me` | `@ApiBearerAuth()` | `me()` | `auth-account.controller.ts:81-86` |
| `GET` | `/api/auth/health` | `@Public`, `@SkipThrottle()` | `health()` | `auth-account.controller.ts:88-99` |

### 1.3 `MePermissionsController` (`presentation/me-permissions.controller.ts:31`)

`@Controller('auth/me')` + `@ApiThrottle()` + `@UseInterceptors(AuditInterceptor)`.

| Method | Path | Decorators | Handler | File:line |
|---|---|---|---|---|
| `GET` | `/api/auth/me/permissions` | `@HttpCode(200)`, `@ApiBearerAuth()` | `getMyPermissions()` | `me-permissions.controller.ts:36-48` |

### 1.4 Sibling auth controllers OUTSIDE the auth module

| Controller | Path prefix | Registered? | Notes |
|---|---|---|---|
| `AdminAuthController` (general/controllers/admin-auth.controller.ts:27) | `@Controller()` + `@Post('auth/refresh')` | **NO** — not present in `general/legacy.module.ts` controllers list (`legacy.module.ts:17`) | Dead code. If it were ever registered it would shadow `/api/auth/refresh`. |
| `AdminAuthController` (legacy/controllers/admin-auth.controller.ts:13) | `@Controller('admin/auth')` + `@Post('refresh')` | Yes (via `LegacyModule` chain — not re-verified here, but the file is wired through the same legacy import path) | Separate path `/api/admin/auth/refresh`; signs new access token with `id, username, role, name` claims (no `sub`, no `jti`). |
| `PosAuthController` (pos/presentation/pos-auth.controller.ts:27) | `@Controller('pos/auth')` | n/a here | `POST /api/pos/auth/login`, `POST /api/pos/auth/validate`, `GET /api/pos/auth/ping` — distinct surface for POS terminals; not in scope for this auth audit. |

### 1.5 OTP routes — verification of round 1's P0 claim

Round 1 asserted the frontend calls `/api/auth/otp/request` and `/api/auth/otp/verify`, neither of which exists in the backend, so the phone-login flow returns 404.

**This claim is now stale.** `LoginForm.tsx` was updated to call the routes that DO exist:

```ts
// LoginForm.tsx:32-42
const requestOtpMutation = useMutation({
  // POST /api/auth/resend-otp — creates an OTP session identified by the
  // caller's IP address and returns { sessionId, expiresIn }.
  mutationFn: () =>
    apiRequest<{ sessionId: string; expiresIn: number }>(
      "POST",
      "/api/auth/resend-otp",
      { phone },
    ),
  ...
});

// LoginForm.tsx:50-60
const verifyOtpMutation = useMutation({
  // POST /api/auth/verify-otp — validates { code, sessionId }.
  mutationFn: () =>
    apiRequest<{ success: boolean; message: string }>(
      "POST",
      "/api/auth/verify-otp",
      { code: otp, sessionId },
    ),
  ...
});
```

Both endpoints are registered (`auth-account.controller.ts:60` and `:71`). The phone→OTP UI flow is functionally connected.

`grep` for the old path confirms it is gone from the live `artifacts/erp-dashboard/src`:

```
Grep "/api/auth/otp/(request|verify)" artifacts/erp-dashboard/src → No matches found
```

The old path still appears in `audit/02-flow-auth.md`, `e2e/mock-backend.mjs`, and `e2e/auth-otp-verify.spec.ts` (stale references — the e2e specs and the mock backend are out of sync with the real frontend and the real API).

### 1.6 Residual UI problems

- `LoginForm.tsx:82-86` — the third step ("employeeId") still calls only `onLogin?.(phone, employeeId); setLocation("/")`. The `employeeId` is never sent to the server. The `verify-otp` response is `{ success, message }` only (no cookie binding to employee). This step is purely cosmetic.
- `verify-otp` does NOT set `access_token` cookie. Look at the service:

  ```ts
  // verify-otp.service.ts:43
  return Ok({ success: true, message: await this.i18n.t('auth.otpVerified') });
  ```

  And the controller (`auth-account.controller.ts:60-69`) just returns that result with no `setCookie` and no JWT issuance. **The "phone+OTP" path therefore does NOT log the user in.** The LoginForm comment at `:53-54` ("Server sets the httpOnly access_token cookie on success") is **false**. After "successful" OTP verification the user is still unauthenticated and any subsequent request to `/api/auth/me` will return 401.

---

## 2. Guard implementations

### 2.1 Inventory of `JwtAuthGuard`-named files

Five files exist:

```
apps/api/src/common/guards/jwt-auth.guard.ts                                # ←  the only real implementation
apps/api/src/modules/auth/guards/jwt-auth.guard.ts                          # shim
apps/api/src/modules/auth/infrastructure/guards/jwt-auth.guard.ts           # shim
apps/api/src/modules/shared/guards/jwt-auth.guard.ts                        # shim
apps/api/src/shared/guards/jwt-auth.guard.ts                                # shim
```

The four "shim" files all contain a single line:

```ts
export { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
```

(or in the last case, the relative-path equivalent: `export { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';`)

So round 1's "three duplicate JWT guard implementations" is wrong in count (five, not three) AND wrong in nature (re-exports, not duplicates). The runtime behavior is single-binding: `app.module.ts:194` registers the canonical class once as `APP_GUARD`.

### 2.2 Canonical implementation behaviour (`common/guards/jwt-auth.guard.ts`)

```ts
// common/guards/jwt-auth.guard.ts:66-123  (canActivate)
async canActivate(context: ExecutionContext): Promise<boolean> {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(), context.getClass(),
  ]);
  if (isPublic) return true;

  const request = context.switchToHttp().getRequest();
  const token = this.extractToken(request);                       // cookie 'access_token' OR Bearer header
  if (!token) throw new UnauthorizedException(...auth.tokenRequired);

  try {
    const decoded = this.jwtService.verify(token) as Record<string, unknown>;
    const userId = decoded['sub'] ?? decoded['id'] ?? decoded['userId'];
    if (!userId) throw new UnauthorizedException(...auth.tokenInvalid);

    const exp = decoded['exp'] as number | undefined;
    if (exp && exp * 1000 < Date.now()) throw new UnauthorizedException(...auth.tokenExpired);

    // Blacklist check — verify the access token has not been revoked via its jti claim.
    const jti = decoded['jti'] as string | undefined;
    if (jti) {
      try {
        const blacklistResult = await runQuery<{ is_revoked: boolean }>(sql`
          SELECT is_revoked FROM refresh_tokens
          WHERE jti = ${jti}
          LIMIT 1
        `);
        if (blacklistResult.rows[0]?.is_revoked === true) {
          throw new UnauthorizedException(...auth.tokenRevoked);
        }
      } catch (blacklistErr) {
        if (blacklistErr instanceof UnauthorizedException) throw blacklistErr;
        // DB unavailable — fail open to avoid outage; log but continue
      }
    }

    request.user = { ...decoded, id: userId };
    return true;
  } catch (err) {
    if (err instanceof UnauthorizedException) throw err;
    throw new UnauthorizedException(...auth.tokenInvalid);
  }
}
```

Notes:
- Reads `IS_PUBLIC_KEY` (= `'isPublic'`) — same key both `public.decorator.ts` files set.
- Prefers cookie, falls back to `Authorization: Bearer`.
- DB blacklist failure is **fail-open** by design (line 110-114). If the DB is down, every token is accepted.
- The `jti` blacklist check is **dead** (see §3 below).

### 2.3 `RolesGuard` and the rest of the global guard chain

Six files (`apps/api`) glob to `roles.guard.ts`:

```
apps/api/src/common/guards/roles.guard.ts                              # ← only real implementation
apps/api/src/modules/admin/infrastructure/guards/roles.guard.ts        # shim
apps/api/src/modules/auth/guards/roles.guard.ts                        # shim
apps/api/src/modules/auth/infrastructure/guards/roles.guard.ts         # shim
apps/api/src/modules/shared/guards/roles.guard.ts                      # shim
apps/api/src/shared/guards/roles.guard.ts                              # shim
```

Same pattern: shims re-export from `@common/guards/roles.guard`.

The full global guard chain (`app.module.ts:193-197`):

```ts
{ provide: APP_GUARD, useClass: FastifyThrottlerGuard },   // 1. rate limit
{ provide: APP_GUARD, useClass: JwtAuthGuard },             // 2. JWT verify
{ provide: APP_GUARD, useClass: RolesGuard },               // 3. @Roles enforcement
{ provide: APP_GUARD, useClass: SodGuard },                 // 4. separation of duties
{ provide: APP_GUARD, useClass: PermissionGuard },          // 5. fine-grained @RequirePermission
```

`SodGuard` (`common/guards/sod.guard.ts:26`) and `PermissionGuard` (`common/guards/permission.guard.ts:17`) are also bound here, in addition to the auth-related two.

---

## 3. Refresh-token blacklist status

This is the most consequential round-1 claim. It was partially fixed and partially still broken.

### 3.1 Drizzle schema (`apps/api/src/shared/db/schema-core.ts:58-79`)

```ts
export const refresh_tokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    // jti (JWT ID) — unique claim from the JWT payload. Enables O(1) blacklist
    // lookups by jti instead of scanning the full token column.
    // Added: 2026-05-27 — fixes silent fail-open in JwtAuthGuard.isTokenBlacklisted.
    jti: text('jti').unique(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    is_revoked: boolean('is_revoked').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('refresh_tokens_user_id_idx').on(table.user_id),
    index('refresh_tokens_expires_at_idx').on(table.expires_at),
    uniqueIndex('refresh_tokens_jti_idx').on(table.jti),
  ],
);
```

So the schema definition NOW has `jti text UNIQUE` (line 69). Round 1's claim about the missing schema column is partially obsolete.

### 3.2 Boot migration (`apps/api/src/shared/db/invariants/migrations-drift.ts:3192-3198`)

```ts
// ── 2026-05-27: auth fixes ──────────────────────────────────────────────────

// Task 2: jti column on refresh_tokens — required by JwtAuthGuard blacklist
// query `SELECT is_revoked FROM refresh_tokens WHERE jti=$jti`.
// Without this column the guard silently passes every token (fail-open).
{ name: 'refresh_tokens.jti ADD COLUMN', sql: `ALTER TABLE IF EXISTS refresh_tokens ADD COLUMN IF NOT EXISTS jti TEXT` },
{ name: 'refresh_tokens.jti UNIQUE INDEX', sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens (jti) WHERE jti IS NOT NULL` },
```

A boot-time `ALTER TABLE IF EXISTS … ADD COLUMN IF NOT EXISTS jti TEXT` is queued. So once the app boots against a live DB it will add the column.

### 3.3 Live DB columns (`_db_cols.txt`, snapshot 2026-05-25 15:45)

```
11873:refresh_tokens.id
11874:refresh_tokens.user_id
11875:refresh_tokens.token
11876:refresh_tokens.expires_at
11877:refresh_tokens.is_revoked
11878:refresh_tokens.created_at
```

`jti` is **NOT present**. The snapshot pre-dates the 2026-05-27 schema/migration change. So in the live DB *at snapshot time* the JwtAuthGuard's blacklist query
`SELECT is_revoked FROM refresh_tokens WHERE jti = $1` would fail with `column "jti" does not exist`, hit the catch on `common/guards/jwt-auth.guard.ts:110-114`, and **fail open**.

### 3.4 Guard READ path (`common/guards/jwt-auth.guard.ts:99-115`)

```ts
const jti = decoded['jti'] as string | undefined;
if (jti) {
  try {
    const blacklistResult = await runQuery<{ is_revoked: boolean }>(sql`
      SELECT is_revoked FROM refresh_tokens
      WHERE jti = ${jti}
      LIMIT 1
    `);
    if (blacklistResult.rows[0]?.is_revoked === true) {
      throw new UnauthorizedException(await this.i18n.t('auth.tokenRevoked'));
    }
  } catch (blacklistErr) {
    if (blacklistErr instanceof UnauthorizedException) throw blacklistErr;
    // DB unavailable — fail open to avoid outage; log but continue
  }
}
```

This reads `jti` from the JWT payload, joins on `refresh_tokens.jti`.

### 3.5 Token MINT path (`login.service.ts:182-196`)

```ts
private buildAuthResult(user: …): AuthResult {
  // SEC-3: jti (JWT ID) qo'shildi — logout blacklist JwtAuthGuard da ishlashi uchun
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
  …
}
```

`jti: randomUUID()` is added to both the access AND refresh tokens. Note: same jti shared between access & refresh — meaning if you blacklist by jti you would invalidate both, but the current writer never blacklists by jti.

Also note: refresh path (`auth.controller.ts:171-181`) re-signs WITHOUT a `jti` field — only `sub, username, role`. So after one refresh the new access token has no jti claim, and the blacklist branch in the guard is skipped entirely.

### 3.6 Blacklist WRITE path (`drizzle-auth.repo.ts:113-124`)

```ts
async blacklistToken(token: string, _expiresAt: Date): Promise<void> {
  try {
    const hash = this.hashToken(token);
    await runQuery(sql`
      INSERT INTO refresh_tokens (token, is_revoked, expires_at, created_at)
      VALUES (${hash}, true, NOW() + INTERVAL '25 hours', NOW())
      ON CONFLICT (token) DO UPDATE SET is_revoked = true
    `);
  } catch (error: unknown) {
    this.logger.error(`blacklistToken failed: ${error}`);
  }
}
```

`hashToken` is SHA-256 of the raw JWT string (line 57-59). The INSERT writes only `(token, is_revoked, expires_at, created_at)` — `jti` is left NULL. There is no INSERT that ever sets `jti`.

`LogoutService.execute` (`logout.service.ts:35-53`) decodes the token (`jwt.decode`, no verify), extracts `exp`, and calls `authRepo.blacklistToken(token, expiresAt)` — passing the raw access token, **not** the jti. So even after the migration is applied, logout writes a row with `jti = NULL` and the guard's `WHERE jti = $1` query will never find it.

### 3.7 Refresh path also has a different blacklist semantic

`auth.controller.ts:167-188`:

```ts
const isBlacklisted = await this.authRepo.isTokenBlacklisted(oldRefreshToken);
if (isBlacklisted) throw new UnauthorizedException(...auth.tokenRevoked);
…
await this.authRepo.blacklistToken(oldRefreshToken, oldExpiresAt);
```

`isTokenBlacklisted` (`drizzle-auth.repo.ts:126-138`) queries:

```sql
SELECT is_revoked FROM refresh_tokens
WHERE token = ${hash} AND expires_at > NOW() LIMIT 1
```

…i.e. read AND write of refresh-token blacklist both use `token = SHA256(rawToken)`. This branch is internally consistent. So refresh-token rotation IS guarded against replay, **but access-token revocation is not**.

### 3.8 Summary of the blacklist mess

| Surface | Reads by | Writes by | Net effect |
|---|---|---|---|
| Access-token blacklist (JwtAuthGuard) | `WHERE jti = $jti` | nobody writes `jti` (logout writes `token = SHA256(raw)`) | **Always misses → fail-open after every logout** |
| Refresh-token blacklist (`/auth/refresh`) | `WHERE token = SHA256(raw)` | same | **Works** — replay of old refresh is rejected |
| Access tokens issued by `/auth/refresh` | `WHERE jti = $jti` (in guard) | no jti claim in re-signed payload (`auth.controller.ts:172-174`) | **Blacklist branch skipped entirely for rotated tokens** |

Severity: P1 — logout is effectively a UI gesture. An exfiltrated access token is valid for its full 24-hour lifetime regardless of any `POST /auth/logout` call.

---

## 4. OTP flow

### 4.1 Backend endpoints (registered)

| Method | Path | Service | DTO |
|---|---|---|---|
| `POST` | `/api/auth/resend-otp` | `ResendOtpService.execute` | body unused; `ipAddress` from request |
| `POST` | `/api/auth/verify-otp` | `VerifyOtpService.execute` | `VerifyOtpSchema = z.object({ code: 6-digit string, sessionId: uuid })` |

### 4.2 `ResendOtpService` (`application/services/resend-otp.service.ts`)

```ts
// resend-otp.service.ts:38-46
async execute(command: ResendOtpCommand): Promise<Result<{ success, message, sessionId, expiresIn }>> {
  const code = generateOtp();                                       // randomInt(OTP_MIN, OTP_MAX_EXCLUSIVE)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * MS_PER_MINUTE);  // 5 min
  const invalidateResult = await this.otpRepo.invalidatePending(command.ipAddress);
  if (isErr(invalidateResult)) return Err(invalidateResult.error);
  const insertResult = await this.otpRepo.insert(command.ipAddress, code, expiresAt);
  if (isErr(insertResult)) return Err(insertResult.error);
  return Ok({ success: true, message, sessionId: insertResult.data, expiresIn: OTP_TTL_SECONDS });
}
```

Notes:
- The OTP identifier is the **request IP**, not the user's phone number. The phone in the LoginForm body is sent but ignored by the resend endpoint (`auth-account.controller.ts:75-79` builds the command from `req.ip` only).
- No SMS is sent anywhere in this code. The generated OTP is stored in DB and... that's it. There is no SMS gateway integration in the OTP flow. So an end-user can never receive the code.
- TTL is 5 minutes (constant `OTP_TTL_MINUTES = 5`).

### 4.3 `VerifyOtpService` (`application/services/verify-otp.service.ts`)

```ts
// verify-otp.service.ts:28-44
async execute(command: VerifyOtpCommand): Promise<Result<{ success: boolean; message: string }>> {
  const sessionResult = await this.otpRepo.findBySessionId(command.sessionId);
  if (isErr(sessionResult)) return Err(sessionResult.error);
  if (!sessionResult.data) {
    return Err(AppErr('NOT_FOUND', await this.i18n.t('auth.otpSessionNotFound')));
  }
  const session = sessionResult.data;
  if (session.expiresAt < _time.now()) {
    return Err(AppErr('BAD_REQUEST', await this.i18n.t('auth.otpExpired')));
  }
  if (session.code !== command.code) {
    return Err(AppErr('BAD_REQUEST', await this.i18n.t('auth.otpInvalid')));
  }
  const invalidateResult = await this.otpRepo.markUsed(session.id);
  if (isErr(invalidateResult)) return Err(invalidateResult.error);
  return Ok({ success: true, message: await this.i18n.t('auth.otpVerified') });
}
```

Verification only marks the OTP session row `used = true`. **It does NOT issue a JWT.** The user is not logged in. There is no link between the OTP session and any `users` row (the OTP session is identified by IP — not by user_id or phone). After "success" the frontend transitions to the employeeId step, where the third button click again does not call any server. So end-to-end the OTP login flow **cannot authenticate**.

### 4.4 OTP repo (`infrastructure/repositories/otp-session.repository.ts`)

Standard Drizzle CRUD with one cleanup method `deleteExpired()` called from the cron `infrastructure/cron/otp-session-cleanup.cron.ts`.

### 4.5 Frontend expectations vs reality

`LoginForm.tsx:50-64` types the verify response as `{ success: boolean; message: string }` — matching the backend, no token claimed. The misleading comment is on lines 52-54:

```tsx
// Server sets the httpOnly access_token cookie on success.
// Frontend doesn't store the token — `credentials: 'include'` in
// apiRequest sends the cookie back on every subsequent call.
```

This is **false** — verify-otp neither calls `setCookie` nor signs a JWT. The user remains unauthenticated.

---

## 5. RBAC and role guards

### 5.1 Decorator and metadata key

```ts
// modules/auth/decorators/roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

`infrastructure/decorators/roles.decorator.ts` is a re-export of the same. Single metadata key `'roles'`.

### 5.2 `Role` enum (`enums/role.enum.ts:6-23`)

```ts
export enum Role {
  SUPER_ADMIN, ADMIN, DIRECTOR, CEO, CFO,
  SALES_MANAGER, TECHNOLOGIST, FINANCE, FINANCE_MANAGER,
  HR_MANAGER, HR_HEAD, PRODUCTION_MANAGER, PROD_HEAD,
  WAREHOUSE, MANAGER, ACCOUNTANT,
}
```

16 enum values. There is no `EMPLOYEE` constant despite `schema-core.ts:40` defaulting `role` to `'employee'` via `userRoleEnum`. So the enum-vs-DB enum may drift; the DB column accepts any value from the PG enum `userRoleEnum` (defined in `schema-enums.ts`, not re-read here) but the TypeScript enum lists only 16 of them. Guards do not type-check against this enum at runtime — they string-compare.

### 5.3 `RolesGuard` semantics (`common/guards/roles.guard.ts:20-62`)

```ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
    context.getHandler(), context.getClass(),
  ]);
  if (!requiredRoles) return true;                                    // no @Roles → pass through

  const request = context.switchToHttp().getRequest();
  const user = request.user as { role?: string; permissionSet?: PermissionSet } | undefined;
  const userRole = user?.role;

  if (!userRole) throw new ForbiddenException(...);

  const userRoleLower = userRole.toLowerCase();
  if (userRoleLower === 'admin' || userRoleLower === 'super_admin') return true;   // bypass

  const normalizedRequired = (Array.isArray(requiredRoles) ? requiredRoles : []).map((r) => r.toLowerCase());
  if (!normalizedRequired.includes(userRoleLower)) {
    throw new ForbiddenException(...);
  }
  return true;
}
```

- Case-insensitive comparison.
- `admin` and `super_admin` always bypass.
- No support for multiple roles per user — `user.role` is a single string.

### 5.4 Granular permission layer (`PermissionGuard`)

`common/guards/permission.guard.ts:17-82` reads `@RequirePermission('module:LEVEL')` decorator metadata (`PERMISSION_KEY`) and resolves it through:

1. `rbacCache` (Redis-backed `RbacCacheService.getPositionPerms(positionId)`).
2. Fallback DB query: `SELECT … FROM positionPermissions WHERE positionId = ?`.

Skips check if no required permission, or if the user's role is `super_admin | admin | director` (line 31-34).

```ts
private isAdminRole(user: Record<string, unknown>): boolean {
  const role = String(user['role'] ?? '').toLowerCase();
  return role === 'super_admin' || role === 'admin' || role === 'director';
}
```

Note the `director` bypass — **`RolesGuard` does NOT bypass on `director`**, only `admin` / `super_admin`. So a director would be denied by a `@Roles('hr_manager')` annotation but allowed by `@RequirePermission('hr:WRITE')`. Inconsistent admin lists.

### 5.5 Frontend role aliases

(Per round 1, frontend `useAuth.tsx` ROLE_ALIASES translates `ceo→director, accountant→finance_manager`, etc., and `super_admin` bypasses. Round 1 quoted this and it remains true — not re-quoted here.)

---

## 6. Session & token management

### 6.1 Cookie configuration (`auth.controller.ts:38-52`)

```ts
const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_MAX_AGE_SEC = 24 * 60 * 60;          // 24h
const REFRESH_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;     // 7d

function cookieOpts(nodeEnv, path, maxAge): CookieOpts {
  return { httpOnly: true, secure: nodeEnv === 'production', sameSite: 'strict', path, maxAge };
}
const accessCookieOpts  = (env) => cookieOpts(env, '/',        ACCESS_COOKIE_MAX_AGE_SEC);
const refreshCookieOpts = (env) => cookieOpts(env, '/api/auth', REFRESH_COOKIE_MAX_AGE_SEC);
```

- `httpOnly: true` — JS cannot read.
- `secure: production-only` — dev HTTP works.
- `sameSite: 'strict'` — cross-site requests do not include the cookie.
- Refresh cookie path-scoped to `/api/auth` (defence-in-depth).

### 6.2 JWT lifetimes

| Token | Issuer | Lifetime | Secret |
|---|---|---|---|
| access | `LoginService.buildAuthResult` (`login.service.ts:192`) | `'24h'` (hard-coded) | `JWT_SECRET` (`auth.module.ts:41`) |
| refresh | same (`login.service.ts:193-196`) | `'7d'` (hard-coded) | `JWT_REFRESH_SECRET` (`getOrThrow`) |
| access (rotated) | `auth.controller.ts:171-174` | `cfg.get('JWT_EXPIRES_IN') ?? '24h'` | `JWT_SECRET` |
| refresh (rotated) | `auth.controller.ts:178-181` | `cfg.get('JWT_REFRESH_EXPIRES_IN') ?? '7d'` | `JWT_REFRESH_SECRET` |
| access (admin/legacy) | `legacy/.../admin-auth.controller.ts:39` | `'24h'` | `JWT_SECRET` |

Inconsistency: login service hard-codes `'24h'` / `'7d'`, while the refresh controller reads `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` env vars with the same default. Config drift if the env vars are set to something other than the defaults.

### 6.3 JWT signing key registration (`auth.module.ts:37-46`)

```ts
JwtModule.registerAsync({
  global: true,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    secret: cfg.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: (cfg.get<string>('JWT_ACCESS_TOKEN_TTL') ?? cfg.get<string>('JWT_EXPIRES_IN') ?? '24h') as SignOptions['expiresIn'],
    },
  }),
}),
```

`getOrThrow` ensures the app fails to boot if `JWT_SECRET` is unset. `JWT_REFRESH_SECRET` is only `getOrThrow`'d at sign time (not at boot), so a missing refresh secret manifests as a 500 at first login rather than a startup error.

### 6.4 Logout (`auth.controller.ts:115-138`, `logout.service.ts`)

```ts
// auth.controller.ts:124-128
const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
const authHeader = req.headers['authorization'] as string | undefined;
const headerToken = authHeader?.replace(/^Bearer\s+/i, '') || '';
const token = cookieToken || headerToken;
const command: LogoutCommand = { token, userId: user.id };
const result = await this.logoutHandler.execute(command);
```

The controller passes the raw access token and the userId to the logout service.

```ts
// logout.service.ts:35-52
async execute(command: LogoutCommand): Promise<LogoutCommandResult> {
  const decoded = this.jwtService.decode(command.token);
  if (!decoded || typeof decoded === 'string') { … invalid format … }
  if (!decoded.exp) { … invalid format … }

  const expiresAt = new Date(decoded.exp * MS_PER_SECOND);
  await this.authRepo.blacklistToken(command.token, expiresAt);
  …
}
```

`jwt.decode` is NOT signature-verified. Anyone with a valid-shaped JWT (no signature check) can write a blacklist row. Low impact because the writer doesn't actually populate jti and the access-token guard reads by jti.

After this, the controller clears both cookies (`auth.controller.ts:132-135`).

### 6.5 Refresh flow rotation (`auth.controller.ts:147-201`)

- Read refresh from cookie (preferred) or `Authorization: Bearer`.
- Verify with `JWT_REFRESH_SECRET`.
- Check `authRepo.isTokenBlacklisted(oldRefreshToken)` — this read path **works** (token-hash based).
- Mint new access + refresh.
- `authRepo.blacklistToken(oldRefreshToken, oldExpiresAt)` — also token-hash based, also works.
- Set both cookies.

Rotation is correctly atomic: new pair minted before old is blacklisted (comment at line 183-184: "so a transient DB error doesn't leave the user locked out").

**However:** the new access token issued by refresh **does not carry a `jti` claim** (`auth.controller.ts:171-174` payload is `{ sub, username, role }` — no `jti`). So the access-token jti blacklist never applies to refresh-rotated tokens at all.

### 6.6 Session table

There is no `sessions` table in `_db_cols.txt`. State lives entirely in JWTs + the `refresh_tokens` row written on logout/refresh.

---

## 7. Password storage

### 7.1 Hash & verify (`infrastructure/security/bcrypt-password-hasher.ts:18-26`)

```ts
@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }
  async verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
```

Bound to `PASSWORD_HASHER` token in `auth.module.ts:67-70`.

### 7.2 Cost factor (`common/constants/security.constants.ts:21`)

```ts
export const BCRYPT_ROUNDS = 12;
```

12 rounds — within the 12-14 industry-standard window for 2026. Same constant imported by admin seeder and runtime hasher (the file header notes this was deliberately unified — was previously 10 in hasher vs 12 in seeder).

### 7.3 Complexity (`domain/value-objects/password.vo.ts:57-79`)

Plain-text complexity check enforced at change-password time:
- Length ≥ 8
- ≥ 1 uppercase
- ≥ 1 lowercase
- ≥ 1 digit
- ≥ 1 special from `!@#$%^&*(),.?":{}|<>`

`PasswordValueObject` no longer calls bcrypt directly (refactor noted in the file header) — pure validation + storage of an already-hashed value. Hashing is delegated to the `IPasswordHasher` port.

### 7.4 Login verification (`login.service.ts:160-170`)

```ts
private async verifyCredentials(user, command): Promise<AuthErrorCode | null> {
  const isPasswordValid = await user.verifyPassword(command.password, this.passwordHasher);
  if (isPasswordValid) return null;
  await this.authRepo.incrementFailedAttempts(user.getId());
  user.incrementFailedAttempts();
  if (user.getFailedLoginAttempts() >= 5) {
    this.logger.warn({ userId: user.getId() }, 'Account locked due to failed attempts');
  }
  await this.auditFailure(user.getId(), command, AuthErrorCode.INVALID_CREDENTIALS);
  return AuthErrorCode.INVALID_CREDENTIALS;
}
```

Lockout actually happens in the DB via the atomic SQL UPDATE in `drizzle-auth.repo.ts:140-155`:

```ts
async incrementFailedAttempts(userId: number): Promise<void> {
  await runQuery(sql`
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE
          WHEN failed_login_attempts + 1 >= 5
          THEN NOW() + INTERVAL '15 minutes'
          ELSE locked_until
        END
    WHERE id = ${userId}
  `);
}
```

5 failures → 15-minute lock. Reset on successful login (`drizzle-auth.repo.ts:169-177`).

### 7.5 Hash format guard (`password.vo.ts:32-37`)

```ts
static fromHash(hash: string): PasswordValueObject {
  if (!hash.startsWith('$2')) {
    throw new DomainError('INVALID_PASSWORD_HASH', 'Invalid password hash format');
  }
  return new PasswordValueObject(hash);
}
```

Defensive check that the stored hash is bcrypt-shaped (`$2a$…`, `$2b$…`, `$2y$…`).

---

## 8. Findings summary

Numbered, severity-tagged, with evidence.

### F1 — P1 — `jti`-based access-token revocation is end-to-end broken (regression of round 1 #2)

**Schema** finally has `jti` (`schema-core.ts:69`) and a boot migration was added (`migrations-drift.ts:3197-3198`), but the **writer never populates it**:
- `LogoutService.execute` (`logout.service.ts:48`) calls `authRepo.blacklistToken(rawToken, expiresAt)` — passes the raw access token.
- `DrizzleAuthRepo.blacklistToken` (`drizzle-auth.repo.ts:113-124`) hashes the token and INSERTs `(token, is_revoked, expires_at, created_at)` — no jti column ever set.
- `JwtAuthGuard.canActivate` (`common/guards/jwt-auth.guard.ts:99-115`) reads `WHERE jti = $jti`. Always returns 0 rows → token treated as valid.
- Also the refresh path (`auth.controller.ts:171-174`) signs the new access token WITHOUT a `jti` claim, so the guard's `if (jti) { … }` branch is skipped entirely for rotated tokens.

Net result: logout is cosmetic. An exfiltrated access token remains valid for its full 24h lifetime.

### F2 — P0 — OTP "login" cannot authenticate the user

The phone+OTP flow visible in `LoginForm.tsx`:
- Round-1 P0 (wrong URL paths) is **fixed** — frontend now calls the correct `/api/auth/resend-otp` + `/api/auth/verify-otp`.
- But the flow is **functionally dead**:
  1. `ResendOtpService` generates a random 6-digit code, stores it in DB. **There is no SMS gateway**, so no end-user can ever receive the code.
  2. `VerifyOtpService` marks `used = true` and returns `{ success, message }` — **no JWT, no cookie set**. Frontend remains anonymous. The comment in `LoginForm.tsx:52-54` claiming the server sets `access_token` is false.
  3. The third "employeeId" step never calls the server (`LoginForm.tsx:82-86`).

So `/login` via the phone flow visible in the UI cannot produce an authenticated session. Only the credential-based `POST /api/auth/login` (not exposed by this LoginForm component) actually authenticates.

### F3 — P1 — Live DB missing `jti` column at snapshot time

`_db_cols.txt:11873-11878` lists `refresh_tokens.{id,user_id,token,expires_at,is_revoked,created_at}` — no `jti`. The boot migration in `migrations-drift.ts:3197` would add it on next deploy, but until then any `SELECT … WHERE jti = $1` from the guard would throw and hit the fail-open branch.

The snapshot is dated 2026-05-25 15:45; the migration entry is dated 2026-05-27. Migration drift exists right now.

### F4 — P1 — `LogoutService` accepts unverified tokens

`logout.service.ts:36` calls `this.jwtService.decode(command.token)`, not `verify`. Anyone with a JWT-shaped string (no signature check) can write a blacklist row. Combined with F1 this is largely inert today, but a future fix to F1 must also switch to `verify` here.

### F5 — P2 — Admin bypass list is inconsistent between guards

- `RolesGuard` (`common/guards/roles.guard.ts:51`) bypasses on `admin | super_admin`.
- `PermissionGuard` (`common/guards/permission.guard.ts:31-34`) bypasses on `admin | super_admin | director`.

A director can be denied a `@Roles('hr_manager')` route but granted access to `@RequirePermission('hr:WRITE')` — opposite semantics. Pick one list and apply everywhere.

### F6 — P2 — `verify-otp` semantics: identifier is request IP

`ResendOtpService` writes `otp_sessions.identifier = req.ip`. The `phone` from the body is ignored. Two users sharing an outbound NAT (typical for an office) would invalidate each other's pending OTPs (`OtpSessionRepository.invalidatePending` keys off `identifier`). Also makes IPv4-rotating mobile users unable to reuse a `sessionId` across IP changes.

### F7 — P2 — OTP session has no link to a `users` row

The OTP session has `identifier (= IP), code, expires_at, used` — nothing tying it to a user account. Even if the OTP route DID issue a JWT, there is no record of *whose* OTP this was. To make phone-OTP login work, the OTP session needs `user_id` (or at minimum `phone`) and the verify step needs to mint a JWT for that user.

### F8 — P2 — Single role per user

`users.role` is a single `userRoleEnum` column. Cannot grant multiple roles. The 16-value TypeScript `Role` enum (`role.enum.ts`) does not include `EMPLOYEE` even though the DB default is `'employee'` (`schema-core.ts:40`). Enum/DB drift risk.

### F9 — P2 — Dead route `POST /auth/refresh` in `general/admin-auth.controller.ts`

`apps/api/src/modules/general/controllers/admin-auth.controller.ts:26-60` declares `@Controller()` + `@Post('auth/refresh')` — would collide with the real `AuthController.refresh()`. Currently inert because `general/legacy.module.ts:17` does NOT list it in `controllers`. The file is dead code; delete or comment out before someone accidentally registers it.

### F10 — P3 — Five `jwt-auth.guard.ts` files, four are shims

Round 1 called this "three duplicate implementations". In fact there are five `.ts` files matching `**/jwt-auth.guard.ts` under `apps/api/src`, but four are single-line re-exports of `@common/guards/jwt-auth.guard`. The runtime is safe (single class, single binding), but the file sprawl is confusing. Same pattern for `roles.guard.ts` (six files, five shims). Consolidating to one path per guard would simplify navigation.

### F11 — P3 — Token-lifetime config inconsistency

- `login.service.ts:192-196` hard-codes `'24h'` and `'7d'`.
- `auth.controller.ts:173,177` reads `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` env vars with the same default.
- `auth.module.ts:43` reads `JWT_ACCESS_TOKEN_TTL ?? JWT_EXPIRES_IN ?? '24h'`.

If an operator sets a non-default `JWT_EXPIRES_IN`, the refreshed access token will obey it but the login-issued access token will not. Pick one source of truth.

### F12 — P3 — `general/admin-auth.controller.ts` and `legacy/admin-auth.controller.ts` issue tokens with different claim shapes

The legacy controller (`legacy/controllers/admin-auth.controller.ts:33-39`) signs with `{ id, username, role, name }` (no `sub`, no `jti`). `JwtAuthGuard` reads `decoded['sub'] ?? decoded['id'] ?? decoded['userId']` so the user id resolves, but the missing `jti` means even after F1/F3 are fully fixed, legacy-issued tokens would skip the blacklist check.

### F13 — P3 — `verify-otp.service.ts` returns generic success without anti-enumeration

```ts
if (!sessionResult.data) {
  return Err(AppErr('NOT_FOUND', await this.i18n.t('auth.otpSessionNotFound')));
}
…
if (session.code !== command.code) {
  return Err(AppErr('BAD_REQUEST', await this.i18n.t('auth.otpInvalid')));
}
```

Distinct error messages for "session not found" vs "invalid OTP" let an attacker probe `sessionId` UUIDs cheaply. Low severity given UUIDs are 122-bit. Worth normalizing to a single `auth.otpInvalid` response.

---

## Open questions / unverified

- Live DB column inventory is from a 2026-05-25 snapshot. After the boot migration runs against the production DB, F3 becomes obsolete. There is no way from the snapshot alone to know whether the app has booted against the live DB since 2026-05-27.
- `LegacyModule` chain wasn't fully traced from `app.module.ts` to confirm `legacy/admin-auth.controller.ts` is reachable from production routes; the file's `@Controller('admin/auth')` shape and presence in a module-path consistent with the project would suggest it is.
- `position_feature_flags` queried by `drizzle-my-permissions.repo.ts` — round 1 noted it has no Drizzle schema. Not re-verified here; deferred to RBAC report.
- `SodGuard` rule set (`common/guards/sod.guard.ts:51-`) not exhaustively reviewed.
