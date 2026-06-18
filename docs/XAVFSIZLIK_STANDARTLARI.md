# EUROPRINT ERP — XAVFSIZLIK STANDARTLARI

> **Har kod qatori yozilishidan oldin xavfsizlik talablari.**
> Backend_Reja/16_Xavfsizlik.md = nima quriladi. Bu = QANDAY to'g'ri quriladi.
> Buzilsa → P0 bug. Darhol to'xtat + tuzat.
> Bog'liq: [LOYIHA_QOIDALARI.md](../LOYIHA_QOIDALARI.md) §7 · [XAVF_REESTRI.md](XAVF_REESTRI.md) R-01..R-06

---

## 1. GUARD TIZIMI (4 GLOBAL GUARD)

EuroPrint 4 ta global guard bor — BARCHA endpoint uchun avtomatik:

```typescript
// main.ts (mavjud, o'zgartirma):
app.useGlobalGuards(
  jwtGuard,       // 1. JWT tekshirish
  rolesGuard,     // 2. @Roles() tekshirish
  sodGuard,       // 3. Vazifalar ajratish (Separation of Duties)
  permissionGuard // 4. Maxsus ruxsatlar
);
```

### Guard qoidalari:

```typescript
// ✅ Ochiq endpoint (faqat tashqi integratsiya uchun):
@Public()
@Get('health')
async health() { ... }

// ✅ Autentifikatsiya kerak, rol tekshirilmaydi:
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) { ... }
// (JwtAuthGuard avtomatik → token aniqlandi → ishlaydi)

// ✅ Rol tekshirish:
@Roles('super_admin', 'director')
@Get('reports/salary')
async getSalaryReport() { ... }

// ✅ Bir nechta rol:
@Roles('hr_manager', 'super_admin')
@Post('employees')
async createEmployee() { ... }

// ❌ TAQIQ — guard olib tashlash:
@SkipAuth()       // HECH QACHON ishlatma
@UseGuards()      // global guardni bekor qilish
```

### @Public() qoidasi:
```
@Public() faqat quyidagilar uchun:
✅ /health — server monitoring
✅ /auth/login — kirish (JWT kerak emas)
✅ /auth/refresh — token yangilash
✅ /storage/files/:key — fayllar (agar auth kerak bo'lsa → olib tashlash)

❌ HECH QACHON @Public() quyidagilar uchun:
- Ma'lumot ko'rish endpointlari
- Yaratish/yangilash/o'chirish
- Admin funksiyalar
```

---

## 2. ROL MATRISI (Kim Nimaga Kirishi Mumkin)

```
super_admin  → HAMMA narsa
director     → O'qish: barcha; Yozish: moliya, HR tasdiqlash
hr_manager   → HR modul (employees/leaves/payroll)
hr_staff     → O'z bo'limidagi xodimlar
sales_manager → SD modul (customers/orders/invoices)
sales_rep    → Faqat o'ziga biriktirilgan mijozlar
pp_manager   → PP modul (work_orders/schedules)
mes_operator → MES modul (shifts/sessions) — o'z smenasi
qc_inspector → QC modul (inspections)
wms_keeper   → WMS modul (stock/movements)
accountant   → FIN modul (FAQAT O'QISH gl_journal_entries)
cashier      → POS modul
crm_manager  → CRM modul
manager      → Platforma bo'yicha o'z bo'limi
employee     → Faqat o'z profili + LMS
```

### Qoida SEC-1: Ko'rish ham ruxsat kerak
```typescript
// ❌ XATO — hamma ko'rishi mumkin deb o'ylash
@Get('employees/:id')
async getEmployee(@Param('id') id: number) { ... }
// → manager boshqa bo'lim xodimini ko'rishi mumkin!

// ✅ TO'G'RI — rol + ob'ekt darajasida tekshir
@Roles('hr_manager', 'hr_staff', 'super_admin')
@Get('employees/:id')
async getEmployee(
  @Param('id') id: number,
  @CurrentUser() user: JwtPayload
) {
  // Agar hr_staff bo'lsa — faqat o'z bo'limini ko'rsin
  if (user.role === 'hr_staff') {
    return this.service.getEmployeeIfSameDepartment(id, user.departmentId);
  }
  return this.service.getEmployee(id);
}
```

---

## 3. INPUT VALIDATSIYA QOIDALARI

```typescript
// apps/api/src/main.ts da (mavjud):
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // ❗ MAJBURIY: noma'lum maydonlar silj
  forbidNonWhitelisted: true,// ❗ MAJBURIY: noma'lum maydon → 400
  transform: true,           // id: string → number auto
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

### DTO da validatsiya:
```typescript
// ✅ TO'G'RI DTO:
export class CreateEmployeeDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => String(value).trim())
  full_name: string;

  @IsInt()
  @Min(1)
  @Max(9999)
  org_function_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value ? String(value).trim() : null)
  notes?: string;
}

// ❌ TAQIQ — validatsiyasiz qabul qilish:
async create(@Body() body: any) { ... }    // any = xavfli
async create(@Body() body: unknown) { ... } // validatsiya yo'q
```

### XSS oldini olish:
```typescript
// Foydalanuvchi kiritgan matn DB ga ketishdan oldin:
@Transform(({ value }) => sanitizeHtml(String(value).trim(), {
  allowedTags: [],     // HTML tag yo'q
  allowedAttributes: {} // attribute yo'q
}))
description: string;
```

---

## 4. SQL INJECTION OLDINI OLISH

```typescript
// ✅ TO'G'RI — Drizzle ORM (parametrized):
const employees = await db.select()
  .from(hr_employees)
  .where(eq(hr_employees.full_name, name)); // parametrized ✅

// ✅ TO'G'RI — LIKE qidiruv:
.where(like(hr_employees.full_name, `%${name.replace(/[%_]/g, '\\$&')}%`))

// ❌ TAQIQ — raw SQL string interpolation:
const result = await db.execute(
  sql`SELECT * FROM hr_employees WHERE full_name = '${name}'`
  //                                              ^^^^^^^^ SQL INJECTION!
);

// ✅ TO'G'RI — raw SQL kerak bo'lsa:
const result = await db.execute(
  sql`SELECT * FROM hr_employees WHERE full_name = ${name}`
  //                                               ^^^^^^ placeholder ✅
);
```

---

## 5. JWT STANDARTLARI

```
Algoritm:  HS256 (symmetric) — algorithm pinning shart
Access token:  15 daqiqa (JWT_EXPIRES_IN=15m)
Refresh token: 7 kun (JWT_REFRESH_EXPIRES_IN=7d)
Secret:    min 32 karakter, cryptographic random
```

```typescript
// ✅ TO'G'RI — token tekshirish (mavjud guard):
JwtModule.registerAsync({
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: {
      expiresIn: config.get('JWT_EXPIRES_IN'),
      algorithm: 'HS256', // MAJBURIY pin!
    },
  }),
});

// ❌ TAQIQ:
// - JWT_SECRET hardcode ('my-secret')
// - algorithm belgilamaslik (default HS256 → RS256 switchable = xavf)
// - token ni log ga yozish
// - token ni DB ga saqlash (faqat refresh token blacklist)
```

### Qoida SEC-2: Token hech qachon logga tushmasin
```typescript
// ❌ TAQIQ:
this.logger.log(`User ${userId} token: ${token}`);
console.log('Authorization:', headers.authorization);

// ✅ TO'G'RI:
this.logger.log(`User ${userId} logged in from IP ${ip}`);
```

---

## 6. RUXSAT SIYOSATI (Permission Policy)

Sozlangan HTTP header (mavjud, tekshir):
```
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

CORS qoidasi:
```typescript
// ✅ TO'G'RI — faqat ma'lum origin:
app.enableCors({
  origin: process.env.FRONTEND_URL,  // '*' TAQIQ
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});
```

---

## 7. PAROL VA SECRET SAQLASH

```
❌ HECH QACHON:
- Parol ochiq saqlash (plain text)
- API key ni kodga yozish
- .env faylni commitga qo'shish
- Secret ni loglash

✅ MAJBURIY:
- Parol: bcrypt, rounds ≥ 12
- Secret: faqat .env (process.env dan o'qi)
- .env: .gitignore da bo'lishi shart
- Key rotation: har 3 oyda (yoki buzilganda darhol)
```

```typescript
// ✅ TO'G'RI — parol hash:
import * as bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
const isMatch = await bcrypt.compare(inputPassword, hashedPassword);

// ❌ TAQIQ:
const hashedPassword = md5(password);    // MD5 xavfsiz emas
const isMatch = password === storedPass; // plain text solishtirish
```

---

## 8. RATE LIMITING (DoS oldini olish)

```typescript
// Auth endpoint uchun (mavjud bo'lishi kerak):
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 urinish / 60 sekund
@Post('login')
async login(@Body() loginDto: LoginDto) { ... }

// Umumiy endpoint:
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req / daqiqa
@Get('employees')
async list() { ... }
```

---

## 9. SENSITIVE MA'LUMOT HIMOYASI

```typescript
// DTO dan maxfiy maydonlarni chiqarish:
export class EmployeeResponseDto {
  id: number;
  full_name: string;
  org_function_id: number;
  // ❌ password, pin_code, bank_account — hech qachon response da

  // @Exclude() decorator ishlatish:
  @Exclude()
  password_hash: string;
}

// Transformer ishlatish:
return plainToClass(EmployeeResponseDto, employee, {
  excludeExtraneousValues: true
});
```

---

## 10. OWASP TOP 10 — EuroPrint Uchun

| # | Xavf | Holat | Yechim |
|---|------|-------|--------|
| A01 | Broken Access Control | ⚠️ | 4 global guard + ob'ekt darajasi tekshir |
| A02 | Cryptographic Failures | ✅ | bcrypt×12 + HS256 + HTTPS |
| A03 | Injection | ✅ | Drizzle ORM parametrized |
| A04 | Insecure Design | ⚠️ | DDD pattern + sodGuard |
| A05 | Security Misconfiguration | ✅ | ValidationPipe whitelist + CORS |
| A06 | Vulnerable Components | ⚠️ | `npm audit` har sprint |
| A07 | Auth Failures | ✅ | JWT + refresh + throttle |
| A08 | Software Integrity | ⚠️ | pnpm lockfile + CI check |
| A09 | Logging Failures | ⚠️ | Structured log, secret filter |
| A10 | SSRF | ✅ | External HTTP → allowlist |

---

## 11. XAVFSIZLIK TEKSHIRUV (Har Sprint)

```bash
# 1. Dependency vulnerability:
pnpm audit --audit-level=high

# 2. Yangi @Public() endpointlar:
grep -rn "@Public()" apps/api/src/ --include="*.ts"
# → Har biri kerakmi? Tekshir!

# 3. Raw SQL (injection xavfi):
grep -rn "template literal.*sql\|\.execute(" apps/api/src/ --include="*.ts"

# 4. Console.log (secret chiqishi):
grep -rn "console\.log.*token\|console\.log.*password\|console\.log.*secret" apps/api/src/

# 5. Yangi endpoint guard bormi:
grep -rn "@Get\|@Post\|@Patch\|@Delete" apps/api/src/modules/ --include="*.controller.ts" -A 1
# → Har biri uchun @Roles() yoki @Public() bormi?
```

---

*EuroPrint ERP · Xavfsizlik Standartlari · Versiya: 2026-06-18*
