# 16 — XAVFSIZLIK (Security)

> Har endpoint himoyasi · JWT · RBAC · SQL injection · audit log · secret boshqaruvi.
> Manba: 2026-06-01 pentest hisoboti + §15 SEC-1..SEC-9 qoidalari.

---

## 16.1 Majburiy Guards (har endpoint)

```ts
// Har controller da STANDART guards:
@Controller('api/hr/employees')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← IKKALASI majburiy
@ApiBearerAuth()
export class HrEmployeesController {
  @Get()
  @Roles('hr_manager', 'super_admin', 'director')  // ← MAJBURIY
  async getAll() { ... }

  @Post()
  @Roles('hr_manager', 'super_admin')
  async create() { ... }
}

// @Public() = FAQAT asoslangan bilan:
@Public() // PUBLIC: IoT sensor gateway — mTLS + IP whitelist bilan himoyalangan
@Post('iot/readings')
async receiveReading() { ... }
```

**Tekshiruv:**
```bash
grep -rn "@UseGuards" apps/api/src/ | grep -v "@Roles\|@Public\|\.spec"
# 0 bo'lishi kerak — har @UseGuards ni @Roles yoki @Public kuzatadi
```

---

## 16.2 JWT Konfiguratsiya

```ts
// auth.module.ts — to'g'ri konfiguratsiya:
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow('JWT_SECRET'),
    signOptions: {
      expiresIn: config.get('JWT_EXPIRES_IN', '15m'),
      algorithm: 'HS256',           // ← explicit algorithm pin
    },
    verifyOptions: {
      algorithms: ['HS256'],        // ← algorithm confusion hujumiga qarshi
    },
  }),
})

// Refresh token — ALOHIDA secret:
async refreshTokens(refreshToken: string) {
  const payload = this.jwtService.verify(refreshToken, {
    secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),  // ← alohida
    algorithms: ['HS256'],
  });
  // ...
}
```

---

## 16.3 SQL Injection oldini olish

```ts
// ✅ Drizzle ORM (parametrli, xavfsiz):
await db.select().from(users).where(eq(users.email, email));
await db.insert(orders).values({ customerId, total });

// ✅ Raw SQL — faqat literal string (hech qachon o'zgaruvchi):
await db.execute(sql`SELECT pg_advisory_lock(1)`);

// ❌ XATO — sql.raw bilan o'zgaruvchi:
await db.execute(sql.raw(`SELECT * FROM users WHERE email = '${email}'`));
// ❌ XATO — string concat:
await db.execute(`SELECT * FROM users WHERE id = ${userId}`);
```

**Tekshiruv:**
```bash
grep -rn "sql\.raw(" apps/api/src/ lib/db/src/
# Har natijani ko'zdan kechir — faqat literal DDL string bo'lishi kerak
```

---

## 16.4 RBAC rol modeli

| Rol | Huquqlar |
|-----|----------|
| `super_admin` | Hammasi |
| `director` | O'qish + tasdiqlar |
| `hr_manager` | HR modul + employees |
| `finance_manager` | FIN + GL + entries |
| `production_manager` | PP + MES + QC |
| `warehouse_manager` | WMS + MM |
| `sales_manager` | SD + CRM |
| `operator` | Faqat o'z smena/vazifasi |

```ts
// Rol tekshiruvi (DTO da emas, @Roles da):
@Roles('hr_manager', 'super_admin')  // ikki rol: IKKALAsidan biri yetarli (OR)

// Egasiga tegishli (masalan xodim o'z ma'lumotini ko'rishi):
@Get('profile')
@Roles('operator', 'hr_manager', 'super_admin')
async getProfile(@CurrentUser() user: User) {
  // Faqat o'z ma'lumotini qaytarish:
  return this.employeeService.findByUserId(user.id);
}
```

---

## 16.5 Audit Log

Har muhim o'zgarish `audit_log` jadvaliga yoziladi.

```ts
// audit_log: append-only (DELETE/UPDATE taqiq)
interface AuditLog {
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_DENIED';
  entity_type: string;   // 'hr_employee', 'sales_order', ...
  entity_id: string;
  old_value: JSONB;      // o'zgarishdan oldin
  new_value: JSONB;      // o'zgarishdan keyin
  ip_address: string;
  created_at: TIMESTAMPTZ;
}

// AuditInterceptor — har muhim endpoint da:
@UseInterceptors(AuditInterceptor)
@Patch(':id')
@Roles('hr_manager', 'super_admin')
async update(@Param('id') id: number, @Body() dto: UpdateEmployeeDto) { ... }
```

---

## 16.6 Rate Limiting

```ts
// main.ts — global rate limit:
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([{
  name: 'global',
  ttl: 60_000,   // 1 daqiqa
  limit: 100,    // 100 so'rov/daqiqa global
}])

// OTP endpoint — qattiq limit:
@Throttle({ otp: { ttl: 300_000, limit: 5 } })  // 5 ta 5 daqiqada
@Post('auth/otp/verify')
async verifyOtp() { ... }
```

---

## 16.7 CORS konfiguratsiya

```ts
// main.ts:
app.enableCors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
// ❌ XATO: origin: '*' — production da taqiq
```

---

## 16.8 Secret boshqaruvi

```bash
# ✅ TO'G'RI — env dan:
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Qaerda saqlash:
# Local: .env (gitignore da)
# Production: Docker secrets yoki vault
# CI: GitHub Actions secrets

# ❌ XATO:
# 1. Secret git da
# 2. Secret log da (console.log, this.logger.log)
# 3. Secret response da
# 4. Subagentga secret berish (Q-30)
```

**Tekshiruv:**
```bash
grep -rn "JWT_SECRET\|ADMIN_SEED\|API_KEY" apps/api/src/ | grep -v "getOrThrow\|config\.get\|// "
# Hardcoded secret topilmasligi kerak
```

---

## 16.9 Acceptance kriterlari

```
☐ Har endpoint: @UseGuards + @Roles YOKI @Public (izoh bilan)
☐ JWT: algorithm pin + alohida refresh secret
☐ sql.raw(): faqat literal DDL string
☐ Rate limit: global 100/min + OTP 5/5min
☐ audit_log: CREATE/UPDATE/DELETE voqealar yoziladi
☐ CORS: faqat FRONTEND_URL (wildcard emas)
☐ Secret: env dan, hech qachon git/log/response da
☐ Pentest probe: 401 unauthorized, 403 forbidden to'g'ri ishlaydi
```
