# Audit: 02 — Auth Oqimi Trace

**Sana:** 2026-05-25  
**Auditor:** Claude Sonnet 4.6 (avtomatik)  
**Metod:** Commit history'siz, faqat real kod tahlili

---

## 1. Frontend: Login Form → API Call

**Fayl:** `artifacts/erp-dashboard/src/pages/Login.tsx:54-82`

```ts
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  // Browser autofill DOM fallback
  const domUsername = (formEl.querySelector('#username') as HTMLInputElement | null)?.value ?? '';
  const username = domUsername || form.username;

  const data = await apiRequest<{ accessToken?: string; user?: {...} }>(
    'POST', "/api/auth/login",
    { username: username.trim().toLowerCase(), password }
  );
```

**Verdikt:** ISHLAYDI  
**Sabab:** Zod validatsiya, DOM-fallback autofill, `apiRequest` orqali standart POST. Username kichik harfga o'zgartiriladi (`.toLowerCase()`) — bu serverda ham shunday kutilishi kerak (tenglik bor: authRepo `findByUsername` — tekshirish talab qilinadi).

---

## 2. Token Saqlash (XSS xavfi tekshiruvi)

**Fayl:** `artifacts/erp-dashboard/src/pages/Login.tsx:84-92`

```ts
if (data.accessToken) {
  setAuthToken(data.accessToken, undefined); // <- NO-OP (cookie-based migratsiyadan keyin)
  if (data.user) safeStorage.setItem("admin", JSON.stringify(data.user));
  onLoginSuccess(data.user?.role);
}
```

**Fayl:** `artifacts/erp-dashboard/src/lib/auth-refresh.ts:76-78`

```ts
export function setAuthToken(_accessToken?: string, _refreshToken?: string) {
  // No-op — httpOnly cookies are set by the server.
}
```

**Verdikt:** QISMAN — token xavfsiz, lekin user obyekti xavfli  
**Sabab:**
- `accessToken` va `refreshToken` httpOnly cookie'da saqlanyapti — localStorage'ga yozilmaydi, XSS xavfi yo'q. Bu to'g'ri.
- Ammo `safeStorage.setItem("admin", JSON.stringify(data.user))` — `{ id, username, role }` ma'lumotlari **localStorage**'ga yozilmoqda. Bu token emas, lekin `role` da'vosi XSS orqali o'zgartirilishi mumkin. Agar frontend `localStorage.admin.role` ga ishonib routing qilsa — privilege escalation xavfi bor.

---

## 3. Backend: Login Handler (auth.controller.ts)

**Fayl:** `apps/api/src/modules/auth/presentation/auth.controller.ts:84-109`

```ts
@Post('login')
@Public()
@HttpCode(HttpStatus.OK)
async login(@Body() dto: LoginDto, @Req() req, @Res() reply) {
  const validated = LoginSchema.parse(dto);
  const result = await this.loginHandler.execute(command);
  const payload = unwrapOrThrow(result);

  if (typeof reply.setCookie === 'function') {
    reply.setCookie('access_token', payload.accessToken, accessCookieOpts(...));
    reply.setCookie('refresh_token', payload.refreshToken, refreshCookieOpts(...));
  }
  return payload; // Body da ham tokenlar qaytadi
}
```

**Verdikt:** ISHLAYDI, lekin 1 xavf bor  
**Sabab:**
- `@Public()` dekorator bilan himoyasiz — to'g'ri.
- `AuthThrottle()` (5 req/min) — brute-force himoyasi bor.
- `AuditInterceptor` ulangan — hamma amallar loglanadi.
- **Xavf:** `reply.setCookie` faqat `@fastify/cookie` ulanganda ishlaydi. Agar plugin yuklanmasa — controller JSON body qaytaradi (token ko'rinadi), cookie o'rnatilmaydi. Guard bu holatni bilmaydi.

---

## 4. JWT Issuance (login.service.ts)

**Fayl:** `apps/api/src/modules/auth/application/services/login.service.ts:182-202`

```ts
private buildAuthResult(user): AuthResult {
  const payload = { sub: user.getId(), username: ..., email: ..., role: ... };
  const accessToken  = this.jwtService.sign(payload, { expiresIn: '8h' });
  const refreshToken = this.jwtService.sign(payload, {
    expiresIn: '30d',
    secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
  });
```

**Verdikt:** QISMAN — ikki joyda muddati farqli  
**Sabab:**
1. **`jti` claim yo'q:** `payload` da `jti` field yo'q. Lekin `JwtAuthGuard` `jti` mavjud bo'lsa blacklist tekshiradi (99-satr). Blacklist ko'p holatlarda *ishlamaydi* — chunki token `jti`siz imzolangan.
2. **Muddat farqi:** `login.service` `expiresIn: '8h'` deydi, `auth.controller` dagi `ACCESS_COOKIE_MAX_AGE_SEC = 24 * 60 * 60` (24 soat). JWT muddati 8 soat, cookie muddati 24 soat — cookie eskirgandan keyin ham brauzer uni yuborishi mumkin (JWT o'zi reject qiladi, ammo chalkashlik yaratadi).
3. **Refresh token muddati:** `login.service` `'30d'` deydi, `auth.controller` `REFRESH_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60` (7 kun). JWT 30 kun amal qiladi, cookie 7 kun — cookie o'chirilgach token yaroqli qoladi, agar token chiqib ketgan bo'lsa foydalanib bo'lmaydi.

---

## 5. Guard va RBAC

### 5a. JwtAuthGuard

**Fayl:** `apps/api/src/common/guards/jwt-auth.guard.ts:66-123`

```ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  if (isPublic) return true;
  const token = this.extractToken(request); // cookie yoki Bearer header
  if (!token) throw new UnauthorizedException(...);
  const decoded = this.jwtService.verify(token);
  // jti blacklist tekshiruvi (jti mavjud bo'lsa)
  request.user = { ...decoded, id: userId };
  return true;
}
```

**Verdikt:** ISHLAYDI  
**Sabab:** Cookie-first, Bearer fallback — to'g'ri. `@Public()` short-circuit ishlamoqda. DB xatosida fail-open (blacklist check) — bu conscious trade-off, log yoziladi.

### 5b. RolesGuard

**Fayl:** `apps/api/src/common/guards/roles.guard.ts:32-62`

```ts
const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [...]);
if (!requiredRoles) return true; // @Roles yo'q bo'lsa — ochiq!
const userRoleLower = userRole.toLowerCase();
if (userRoleLower === 'admin' || userRoleLower === 'super_admin') return true; // bypass
```

**Verdikt:** QISMAN  
**Sabab:** `@Roles()` dekoratorsiz endpointlar himoyasiz (faqat JWT tekshiriladi). Ko'p controllerlarda `@Roles` ishlatilmagan. `admin`/`super_admin` bypass — to'g'ri, lekin `director` PermissionGuard'da bypass qilinadi, RolesGuard'da emas. Ikkala guard'da superadmin logikasi farqli.

### 5c. PermissionGuard

**Fayl:** `apps/api/src/common/guards/permission.guard.ts:63-82`

```ts
const required = this.getRequiredPermission(context);
if (!required) return true; // @RequirePermission yo'q — ochiq
if (this.isAdminRole(user)) return true; // admin/super_admin/director bypass
// positionId orqali DB/Redis dan ruxsat tekshiruvi
```

**Verdikt:** ISHLAYDI  
**Sabab:** Redis cache bilan DB fallback — to'g'ri arxitektura. Lekin `@RequirePermission` kamligi katta muammo — faqat WMS, AI, Finance modullari uchun qo'llanilgan (~15-20 endpoint). Qolgan yuzlab endpoint lar faqat JWT tekshiruviga tayanadi.

### 5d. SodGuard (Separation of Duties)

**Fayl:** `apps/api/src/common/guards/sod.guard.ts:51-119`

```ts
// path-based tekshiruv:
if (path.includes('/purchase-order') && method === 'POST') {
  if (permissions.includes('po:create') && permissions.includes('po:approve')) ...
}
```

**Verdikt:** QISMAN  
**Sabab:** `user.permissionSet.actions` bo'lmasa `user.permissions` ga tushadi — lekin JWT payload'da `permissions` array yo'q (faqat `role` bor). Demak SodGuard ko'p hollarda **permissions = []** bilan ishlaydi va hech qachon violation topilmaydi. Bu logika real ishlamaydi.

---

## 6. Refresh Token

**Fayl:** `artifacts/erp-dashboard/src/lib/auth-refresh.ts:112-138`

```ts
async function tryRefreshToken(): Promise<boolean> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include", // refresh_token cookie avtomatik boradi
  });
  if (!res.ok) return false;
  return true; // yangi access_token cookie server tomonidan o'rnatiladi
}

export async function refreshTokenOnce(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise; // deduplication
  ...
}
```

**Backend:** `apps/api/src/modules/auth/presentation/auth.controller.ts:147-201`

```ts
@Post('refresh')
@Public()
async refresh(@Headers('authorization') auth, @Req() req, @Res() reply) {
  // JWT_REFRESH_SECRET bilan verify
  // Blacklist tekshiruvi
  // Yangi juft token (rotation)
  // Eski refresh token blacklistga
}
```

**Verdikt:** ISHLAYDI  
**Sabab:**
- Frontend deduplication (bir vaqtda ko'p 401 → bitta refresh) — to'g'ri.
- Backend token rotation + blacklisting — to'g'ri arxitektura.
- `JWT_REFRESH_SECRET` alohida — to'g'ri (access token bilan refresh token aralashtirib bo'lmaydi).
- Refresh token muddati: JWT 30d, cookie 7d — **UYUMSIZLIK** (4-bo'lim).

---

## 7. Ikkinchi Login Sahifasi (LoginForm.tsx)

**Fayl:** `artifacts/erp-dashboard/src/components/LoginForm.tsx:30-44`

```ts
const requestOtpMutation = useMutation({
  mutationFn: () => apiRequest("POST", "/api/auth/otp/request", { phone }),
});
const verifyOtpMutation = useMutation({
  mutationFn: () => apiRequest<{ token?: string }>("POST", "/api/auth/otp/verify", { phone, otp }),
  onSuccess: () => setStep("employeeId"),
});
```

**Verdikt:** STUB / YETIM  
**Sabab:** OTP-based login komponenti (LoginForm.tsx) mavjud, lekin:
1. `handleEmployeeIdSubmit` (64-67-satr) — `onLogin?.(phone, employeeId); setLocation("/")` — server ga hech narsa yubormasin, faqat redirect qiladi. **OTP verifikatsiyadan keyin haqiqiy auth yo'q.**
2. Bu komponent `Login.tsx` (asosiy sahifa) bilan bog'liq emas — router'da qaysi biri ishlatilishi noaniq.
3. Backend'da `/api/auth/otp/*` endpointlari bormi — tekshirilmagan.

---

## Oqim Xulosasi

| Qadam | Holat | Muammo |
|---|---|---|
| Login form POST | ✓ | — |
| Token saqlash (cookie) | ✓ | — |
| User info localStorage | ⚠ | `role` XSS orqali o'zgartirilishi mumkin (routing uchun ishlatilsa) |
| Backend login handler | ⚠ | `@fastify/cookie` yuklansalik cookie o'rnatilmaydi |
| JWT issuance — `jti` | ✗ | Token `jti`siz imzolanadi → blacklist ishlamaydi |
| JWT muddat (access) | ⚠ | login.service: 8h, cookie: 24h — uyumsizlik |
| JWT muddat (refresh) | ⚠ | login.service: 30d, cookie: 7d — uyumsizlik |
| JwtAuthGuard | ✓ | — |
| RolesGuard | ⚠ | `@Roles` bo'lmasa endpoint ochiq (faqat JWT) |
| PermissionGuard | ⚠ | Faqat ~15-20 endpoint qo'llangan |
| SodGuard | ✗ | JWT'da `permissions` array yo'q → violations hech qachon topilmaydi |
| Refresh token rotation | ✓ | — |
| Refresh deduplication | ✓ | — |
| OTP login (LoginForm.tsx) | ✗ | employeeId submit'da server call yo'q — auth tugallanmaydi |

---

## Kritik Muammolar (P0)

**P0-1: `jti` yo'q → logout/revocation ishlamaydi**  
`login.service.ts:182-190` — JWT payload'da `jti` yo'q. `JwtAuthGuard:99` `jti` bo'lganda tekshiradi — ya'ni hech qachon tekshirmaydi. Foydalanuvchi logout qilgandan keyin token muddati tugaguncha ishlayveradi.

**P0-2: SodGuard real ishlamaydi**  
`sod.guard.ts:53-56` — `permSet?.actions ?? userData.permissions` — JWT'da ikkalasi ham yo'q. Separation of Duties logikasi null permissions bilan tekshiriladi.

**P0-3: OTP login stub**  
`LoginForm.tsx:63-67` — `handleEmployeeIdSubmit` server'ga hech narsa yubormasdan redirect qiladi. Agar bu flow ishlatilsa — autentifikatsiyasiz kirish imkoniyati.

## O'rta Muammolar (P1)

**P1-1: JWT va cookie muddati uyumsizligi**  
Access: JWT 8h, cookie 24h. Refresh: JWT 30d, cookie 7d. Muddatlar muvofiqlashtirilib yagona config'dan o'qilishi kerak.

**P1-2: `@Roles` / `@RequirePermission` qamrovi past**  
Ko'p controller endpointlar faqat `JwtAuthGuard` bilan himoyalangan — bu autentifikatsiya, avtorizatsiya emas. Istalgan tizimga kirgan foydalanuvchi barcha endpointlarga murojaat qilishi mumkin.

**P1-3: `localStorage.admin` routing uchun ishlatilsa — privilege escalation**  
`Login.tsx:92` `{ id, username, role }` localStorage'ga yoziladi. Agar `onLoginSuccess(data.user?.role)` dan keyin routing `role` ga asoslansa — bu XSS orqali o'zgartirilishi mumkin.

---

## Sandbox Cheklovlari

- Backend real ishga tushirilmadi — `@fastify/cookie` holati runtime'da tekshirilmadi.
- `authRepo.findByUsername` implementatsiyasi tekshirilmadi (username case-sensitivity).
- OTP endpointlari backend'da mavjudligi tekshirilmadi.
- Guards `APP_MODULE`'da qanday ro'yxatga olinganini tekshirilmadi (global vs per-controller).
