# 04 — Auth & Permissions

**Date:** 2026-05-27
**Auditor:** forensic-agent (read-only)
**Scope:** `apps/api/src/modules/auth/`, `apps/api/src/common/guards/`, `artifacts/erp-dashboard/src/`

---

## 1. Module Overview

The auth module follows a clean-architecture layering:

```
Presentation  -> AuthController / AuthAccountController  (apps/api/src/modules/auth/presentation/)
Application   -> LoginService / LogoutService / VerifyOtpService / ResendOtpService / ChangePasswordService
Domain        -> AuthUserAggregate, Password VO, IAuthRepo port
Infrastructure-> DrizzleAuthRepo, JwtStrategy (passport), BcryptPasswordHasher, OtpSessionRepository
Guards        -> JwtAuthGuard (common/guards), RolesGuard (common/guards)
```

Token strategy: **httpOnly cookie** (preferred) + `Authorization: Bearer` fallback.
Refresh strategy: **separate JWT_REFRESH_SECRET**, 7-day lifetime, rotation on every `/auth/refresh` call.
OTP strategy: phone-based SMS OTP (3-step login via `LoginForm.tsx`).

---

## 2. Page/Screen Inventory

| Screen | File | Route |
|--------|------|-------|
| Login form (phone -> OTP -> employeeId) | `artifacts/erp-dashboard/src/components/LoginForm.tsx` | `/login` |
| Legacy design login | `artifacts/erp-dashboard/src/components/dizayn-new/Login.tsx` | (secondary) |
| Auth Context provider | `artifacts/erp-dashboard/src/hooks/useAuth.tsx` | global wrap |
| Protected route wrapper | `artifacts/erp-dashboard/src/components/PrivateRoute.tsx` | HOC |
| Role-gated inline renderer | `artifacts/erp-dashboard/src/components/RoleGate.tsx` | component |
| Role-gated route | `artifacts/erp-dashboard/src/components/RoleRoute.tsx` | HOC |

---

## 3. Data Flow Chains

### 3.1 Login — username/password backend path

```
POST /auth/login
  -> AuthController.login() [auth.controller.ts:85]
    -> LoginSchema.parse(dto)
    -> LoginService.execute(command) [login.service.ts:79]
      -> authRepo.findByUsername(username) [drizzle-auth.repo.ts:57]
         SELECT id,username,email,password_hash,role,is_active,
                last_login_at,failed_login_attempts,locked_until
         FROM users WHERE username=$1
      -> user.isAccountLocked() / isAccountActive() [auth-user.aggregate.ts]
      -> user.verifyPassword(plain, bcryptHasher)
      -> authRepo.incrementFailedAttempts(userId) [drizzle-auth.repo.ts:117]
         UPDATE users SET failed_login_attempts = failed_login_attempts+1,
           locked_until = CASE WHEN >=5 THEN NOW()+15min ELSE locked_until END
      -> authRepo.resetFailedAttempts / updateLastLogin
      -> jwtService.sign({ sub,username,email,role,jti }, { expiresIn:'24h' })
      -> jwtService.sign(payload, { secret:JWT_REFRESH_SECRET, expiresIn:'7d' })
      -> INSERT INTO audit_logs (user_id, action, ip_address, created_at)
    -> reply.setCookie('access_token', ..., { httpOnly:true, sameSite:'strict' })
    -> reply.setCookie('refresh_token', ..., { path:'/api/auth', httpOnly:true })
  <- { accessToken, refreshToken, user:{id,username,email,role} }
```

### 3.2 Login — phone/OTP frontend path (BROKEN)

```
LoginForm.tsx [step:"phone"]
  -> POST /api/auth/otp/request { phone }   [LoginForm.tsx:33]
     *** NO MATCHING BACKEND ROUTE ***

LoginForm.tsx [step:"otp"]
  -> POST /api/auth/otp/verify { phone, otp }  [LoginForm.tsx:40]
     *** NO MATCHING BACKEND ROUTE ***
     Backend has: POST /auth/verify-otp and POST /auth/resend-otp

LoginForm.tsx [step:"employeeId"]
  -> onLogin(phone, employeeId) -> setLocation("/")  [LoginForm.tsx:57]
     *** NO API CALL — employeeId never validated server-side ***
```

### 3.3 JWT Validation on Protected Requests

```
Any protected request
  -> JwtAuthGuard.canActivate() [common/guards/jwt-auth.guard.ts:63]
    -> reflector.getAllAndOverride(IS_PUBLIC_KEY) -- short-circuit if @Public()
    -> extractToken(): cookie 'access_token' first, then Authorization header
    -> jwtService.verify(token)
    -> extract userId from decoded.sub / decoded.id / decoded.userId
    -> if jti present:
         SELECT is_revoked FROM refresh_tokens WHERE jti=$jti  [jwt-auth.guard.ts:104]
         *** jti COLUMN DOES NOT EXIST in refresh_tokens schema ***
         (fail-open on DB error, so blacklist check silently no-ops)
    -> request.user = { ...decoded, id: userId }
```

### 3.4 Token Refresh

```
POST /auth/refresh  (@Public())
  -> read refresh_token from cookie or Authorization header
  -> jwtService.verify(token, { secret: JWT_REFRESH_SECRET })
  -> authRepo.isTokenBlacklisted(oldRefreshToken)
     SELECT is_revoked FROM refresh_tokens WHERE token=SHA256(oldToken) AND expires_at>NOW()
  -> sign new accessToken (JWT_EXPIRES_IN, default '24h')
  -> sign new refreshToken (JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, default '7d')
  -> authRepo.blacklistToken(oldRefreshToken)
     INSERT INTO refresh_tokens(token,is_revoked,expires_at) ON CONFLICT DO UPDATE
  -> setCookie both tokens
```

### 3.5 Role Check

```
@Roles('HR_MANAGER','DIRECTOR')  -- metadata key 'roles'
  -> RolesGuard.canActivate() [common/guards/roles.guard.ts:39]
    -> requiredRoles = reflector.getAllAndOverride('roles', ...)
    -> if !requiredRoles -> return true  (open to all authenticated)
    -> userRole = request.user.role (string, case-insensitive)
    -> if 'admin' || 'super_admin' -> bypass all role checks
    -> check normalizedRequired.includes(userRoleLower)
```

### 3.6 Granular Permission Check

```
GET /auth/me/permissions
  -> MePermissionsController
  -> DrizzleMyPermissionsRepository.findUserWithPosition(userId)
     SELECT u.*, p.id,p.code,p.name_uz,p.name_ru,p.rbac_tier, d.code,d.name_uz
     FROM users u
     LEFT JOIN positions p ON p.id = u.position_id
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id=$1
  -> findModulePermissions(positionId)
     SELECT module_code AS module, access_level AS level
     FROM position_permissions WHERE position_id=$1
  -> findFeatureFlags(positionId)
     SELECT feature_key, is_allowed FROM position_feature_flags WHERE position_id=$1
```

### 3.7 Frontend Auth Context

```
useAuth.tsx:AuthProvider
  -> fetchUser() on mount
    -> GET /api/auth/me { credentials:'include' }
    -> if 401:
         -> POST /api/auth/refresh { credentials:'include' }
         -> retry GET /api/auth/me
    -> setUser(data) or setUser(null)
  -> hasRole(...roles)
    -> ROLE_ALIASES: ceo->director, accountant->finance_manager, etc.
    -> super_admin bypasses all
    -> compare aliases list
  -> logout()
    -> POST /api/auth/logout
    -> localStorage.removeItem('access_token','refresh_token','token')
    -> window.location.href = '/login'
```

---

## 4. DB Tables & Columns Used

### `users` (schema-core.ts:28)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, cuid2 |
| email | text | UNIQUE NOT NULL |
| password_hash | text | NOT NULL |
| full_name | text | NOT NULL |
| role | userRoleEnum | default 'employee' |
| is_active | boolean | default true |
| phone | text | nullable |
| department | text | denormalized string, no FK |
| last_login_at | timestamp | nullable |
| failed_login_attempts | integer | default 0 |
| locked_until | timestamp | nullable |
| created_at | timestamp | NOT NULL |
| updated_at | timestamp | NOT NULL |

**Schema drift:** `drizzle-auth.repo.ts:57` queries `WHERE username = $1` but `schema-core.ts` defines no `username` column. The raw SQL bypasses Drizzle type safety — works only if DB physically has the column from a migration not reflected in Drizzle schema.

### `refresh_tokens` (schema-core.ts:52)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK -> users.id CASCADE DELETE |
| token | text | SHA-256 hash |
| expires_at | timestamp | NOT NULL |
| is_revoked | boolean | default false |
| created_at | timestamp | NOT NULL |

**Missing column:** No `jti` column. The blacklist check in `JwtAuthGuard` (`WHERE jti=$jti`) always finds 0 rows.

### `otp_sessions` (schema-business-a-1.ts:57)

| Column | Type |
|--------|------|
| id | serial PK |
| session_id | uuid |
| identifier | text |
| code | text |
| expires_at | timestamp |
| used | boolean |

### `audit_logs` (schema-core.ts:~75)

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK -> users |
| action | text |
| module | text |
| entity_id | text |
| before_value | text |
| after_value | text |
| ip_address | text |
| created_at | timestamp |

### `position_permissions` (schema-compat-2.ts:~65)

| Column | Type |
|--------|------|
| id | integer PK |
| positionId | integer |
| moduleCode | varchar(50) |
| accessLevel | varchar(20) |
| createdAt | timestamp |

**Not in schema:** `position_feature_flags` is queried in `drizzle-my-permissions.repo.ts` but has no Drizzle schema definition in any file read.

**Not present:** No `roles`, `user_roles`, or `sessions` tables. Roles are stored as a single text/enum column on `users`.

---

## 5. UI Elements & Handlers

### LoginForm.tsx — Phone step

| Element | Handler | Notes |
|---------|---------|-------|
| Phone `<Input>` | `setPhone()` | Validates `+998XXXXXXXXX` format |
| "SMS kod yuborish" `<Button>` | `requestOtpMutation.mutate()` -> `POST /api/auth/otp/request` | BROKEN: 404 |

### LoginForm.tsx — OTP step

| Element | Handler | Notes |
|---------|---------|-------|
| OTP `<Input>` maxLength=6 | `setOtp()` | numeric, inputMode=numeric |
| "Tasdiqlash" `<Button>` | `verifyOtpMutation.mutate()` -> `POST /api/auth/otp/verify` | BROKEN: 404 |
| "Orqaga" `<Button>` | `setStep("phone")` | |

### LoginForm.tsx — EmployeeId step

| Element | Handler | Notes |
|---------|---------|-------|
| EmployeeId `<Input>` | `setEmployeeId()` | EP-2024-001 format |
| Login `<Button>` | `handleEmployeeIdSubmit` -> `setLocation("/")` | No server call |

### PrivateRoute.tsx

| State | Behavior |
|-------|----------|
| `isLoading` | spinner overlay |
| `!isAuthenticated` | `<Redirect to="/login">` |
| authenticated | render children |

### RoleGate.tsx

| Prop | Effect |
|------|--------|
| `roles` empty/omitted | pass-through |
| `ownerUserId` match | always render |
| role not in list | render `fallback` ("•••••") |

---

## 6. What Is Missing or Broken

1. **Phone-OTP login path hits 404 (P0):** `LoginForm.tsx` calls `/api/auth/otp/request` and `/api/auth/otp/verify`. No such routes exist. Backend has `/auth/verify-otp` and `/auth/resend-otp` (different paths and semantics).

2. **jti-based token revocation is non-functional (P1):** `JwtAuthGuard` queries `refresh_tokens WHERE jti=?` but that column does not exist in the Drizzle schema. All revocation checks fail open — a logged-out token remains valid until it expires naturally.

3. **`username` column missing from Drizzle schema (P1):** `drizzle-auth.repo.ts` queries by `username` column but `schema-core.ts` does not define it. Works only if a raw DB migration added it outside the Drizzle schema.

4. **No RBAC join table (P2):** Role is a single enum on `users`. Cannot assign multiple roles. All 17 `Role` enum values are stored in one column.

5. **Tenant isolation is cosmetic (P2):** `TenantContextInterceptor` is registered globally but auth and HR repos do not apply `WHERE tenant_id = ?` filters. Every query returns all-org data.

6. **Third login step (employeeId) has no server call (P2):** After OTP verify, the employeeId step is purely local. The server never validates the employee ID binding to the authenticated phone number.

7. **Duplicate guard implementations (P3):** Three copies of guard files across `auth/infrastructure/guards/`, `common/guards/`, and `shared/guards/`.

8. **`@Public()` key potential mismatch (P2):** Two `public.decorator.ts` files exist — one in `auth/infrastructure/decorators/` and one in `@common/decorators/`. Both set `'isPublic'` currently, but this is fragile.

---

## Summary

The credential-based login path (POST /auth/login) is fully implemented and secure: bcrypt verification, lockout after 5 failures, httpOnly cookies, refresh rotation, and audit logging. The phone/OTP login path visible in the frontend is completely disconnected — the frontend calls non-existent API routes. Token revocation via jti is architecturally planned but structurally broken (missing DB column). The permission system has a solid granular layer (position_permissions + position_feature_flags) but tenant isolation is not enforced in any query.

---

## Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested Fix |
|-------|----------|--------------------|--------|---------------|
| OTP routes 404 | P0 | `LoginForm.tsx:33,40`; no `/otp/request` route in any controller | Phone login completely broken | Add `POST /auth/otp/request` + `POST /auth/otp/verify` routes OR update LoginForm to call existing `/auth/verify-otp` |
| jti blacklist no-ops | P1 | `jwt-auth.guard.ts:104`; `schema-core.ts:52` has no jti column | Logout does not revoke access tokens | Add `jti text UNIQUE` to refresh_tokens schema and migration |
| username not in schema | P1 | `drizzle-auth.repo.ts:57`; `schema-core.ts:28` | Login by username may break on fresh DB | Add username column to schema or switch to email-based lookup |
| No user_roles table | P2 | `schema-core.ts`, `role.enum.ts` | Single role per user only | Accept constraint or add user_roles join table |
| Tenant filtering not applied | P2 | `app.module.ts:210`; no WHERE tenant_id in any auth/hr repo | All queries return cross-tenant data | Apply tenant_id filter in all repo query methods |
| employeeId step not validated | P2 | `LoginForm.tsx:50-55` | Unauthenticated employeeId accepted | Add POST /auth/bind-employee-id call |
| position_feature_flags no schema | P2 | `drizzle-my-permissions.repo.ts:~55`; no matching pgTable definition | Schema drift, migration risk | Add Drizzle schema definition |
| Duplicate guard files | P3 | `auth/infrastructure/guards/`, `common/guards/`, `shared/guards/` | Maintenance confusion | Consolidate to common/guards only |

---

## Open Questions / UNVERIFIED

- Does `@workspace/db` lib define a `username` column on the users table?
- Does any migration file add `jti text` to `refresh_tokens`?
- What does `general/controllers/admin-auth.controller.ts` expose? It uses `@Public()`.
- `RoleRoute.tsx` contents not read — unknown difference from `PrivateRoute.tsx`.
- Is `position_feature_flags` a view or a legacy table managed outside Drizzle?
