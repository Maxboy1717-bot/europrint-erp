# 01 — POYDEVOR (Bosqich 0)

> EuroPrint ERP poydevori: auth, RBAC, org tuzilma, audit, i18n, CI/CD.
> Standart: [LOYIHA_QOIDALARI.md](../../../LOYIHA_QOIDALARI.md).
> **Holat: ✅ KATTA QISMI MAVJUD** — ko'chirish + tuzatish kerak (qayta yozish EMAS).
> Mavjud: `apps/api/src/modules/auth/` · `apps/api/src/modules/org/` · 5 guard.

---

## 0.1 Qurish tartibi

1. pnpm monorepo ✅ (mavjud)
2. NestJS 11 + Fastify bootstrap ✅
3. Drizzle + PostgreSQL ulanishi ✅
4. ConfigService (zod schema) ✅
5. IAM jadvallari (`users`, `roles`, `permissions`) ✅
6. Auth (argon2, JWT access+refresh, httpOnly cookie) ✅
7. Guard zanjiri (5 global guard) ✅
8. Audit interceptor 🔧 (mavjud, to'liq emas)
9. RLS (site_id) 🔲
10. ExceptionFilter, Logging, i18n, Idempotency 🔧
11. CI/CD + Docker ✅

---

## 0.2 Monorepo + DDD tuzilma (mavjud)

```
Uzbek-Language-Module/
├── apps/api/src/
│   ├── main.ts                    # Fastify + guards + pipes bootstrap
│   ├── app.module.ts              # barcha modul registratsiya
│   ├── common/                    # guards/ decorators/ result/ filters/
│   ├── modules/[MODULE]/          # DDD 4-layer (domain/app/infra/presentation)
│   └── shared/db/                 # schema.ts re-export + invariants
├── lib/db/src/schema/             # KANONIK Drizzle schema
├── artifacts/erp-dashboard/src/   # React FE
└── scripts/                       # check-design-tokens, check-sidebar-routes, i18n-status
```

---

## 0.3 Bootstrap (mavjud, tekshirish kerak)

```ts
// apps/api/src/main.ts (mavjud, tekshir):
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.setGlobalPrefix('api');
  await app.register(fastifyCookie);
  app.useGlobalGuards(                           // 5 global guard
    app.get(JwtAuthGuard), app.get(RolesGuard),
    app.get(SodGuard), app.get(PermissionsGuard)
  );
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter()); // Result Err → HTTP
  await app.listen(config.getOrThrow('PORT'), '0.0.0.0');
}
```

---

## 0.4 Config (ConfigService + Zod)

```ts
// apps/api/src/config/env.schema.ts
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development','staging','production']),
  PORT: z.coerce.number().default(3030),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('24h'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  CORS_ORIGINS: z.string().transform(s => s.split(',')),
  GEMINI_API_KEY: z.string().optional(),   // AI uchun
  YANDEX_API_KEY: z.string().optional(),   // tarjima uchun
});
```

---

## 0.5 IAM jadvallari (mavjud, kanonik tekshir)

```ts
// lib/db/src/schema/users.ts — mavjud, tekshir:
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('manager'),
  orgFunctionId: integer('org_function_id').references(() => orgFunctions.id), // karta bog'liq
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

---

## 0.6 Auth oqimi (mavjud, kanonik tekshir)

```
POST /api/auth/login →
  {username, password} →
  argon2.verify(hash) →
  Ok: { access_token (24h), refresh_token (7d, httpOnly cookie) }

POST /api/auth/refresh →
  cookie.refresh_token →
  verify (refresh secret) →
  Ok: yangi access_token

POST /api/auth/logout →
  cookie o'chirish + jti blacklist
```

---

## 0.7 Org tuzilma (poydevor uchun kritik)

Org poydevor (mavjud, Phase 1 DONE commit `78aefcef`):
```sql
-- razryad_levels (1-6)
-- org_functions (29 FK hub: lavozim karta)
-- org_departments (bo'limlar)
-- Xodim → karta → ruxsat zanjiri
```

Vertikal zanjir (Vysotskiy-7): `Operator → Smena → Bo'lim → Otdeleniye → CEO → Owner`.
`manager_id` = keyingi yuqori daraja (NOT `dept_head_id`).

---

## 0.8 Audit interceptor (to'ldirilishi kerak)

```ts
// apps/api/src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(async (data) => {
        if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
          await this.auditLog.record({
            action: `${req.method} ${req.url}`,
            userId: req.user?.sub,
            ip: req.ip,
            payload: { body: req.body },  // sensitive data EMAS
          });
        }
      })
    );
  }
}
```

---

## 0.9 i18n (3 til — mavjud)

```
artifacts/erp-dashboard/src/lib/i18n/
  uz/     # O'zbek lotin (asosiy)
  ru/     # Rus (Yandex pipeline)
  uz-cyr/ # O'zbek kirill (translit)
```

Yangi key → uchchalasiga birga qo'shiladi.
`scripts/i18n-status.mjs` — CI gate (0 missing).
`scripts/i18n-fill-from-fallbacks.mjs` — uz+uz-cyr auto-fill.

---

## 0.10 CI/CD (mavjud, `.github/workflows/ci.yml`)

```yaml
jobs:
  backend:         tsc:api + jest
  frontend:        tsc:fe + vitest
  architecture:    scripts/run-all-reviewers.sh
  design-tokens:   scripts/check-design-tokens.mjs
  i18n-check:      scripts/i18n-status.mjs
  schema-dup:      scripts/check-schema-dups.js
```

---

## Acceptance kriterlari (Bosqich 0)

- ✅ Ruxsatsiz so'rov → 401/403
- ✅ Login ishlaydi → JWT cookie
- ✅ 5 global guard faol
- ✅ DB migratsiya ishlaydi
- ✅ tsc 0 xato
- 🔲 Audit log har POST/PUT/DELETE → `audit_log` jadval
- 🔲 RLS: site_id filter (keyingi bosqich)
- ✅ i18n 3 til yuklaydi

---

## Ko'chiriladigan qismlar (eski EuroPrint → v2)

| Fayl | Holat | Harakat |
|------|-------|---------|
| `apps/api/src/modules/auth/` | ✅ | Ko'chir |
| `apps/api/src/common/guards/` | ✅ | Ko'chir |
| `apps/api/src/modules/org/` | ✅ | Ko'chir |
| `lib/db/src/schema/users.ts` | ✅ | Ko'chir, org_function_id tekshir |
| `lib/db/src/schema/org-*.ts` | ✅ | Ko'chir |
| `lib/db/src/schema/razryad*.ts` | ✅ | Ko'chir |
| `scripts/check-design-tokens.mjs` | ✅ | Ko'chir |
| `scripts/i18n-status.mjs` | ✅ | Ko'chir |
| `scripts/check-sidebar-routes.mjs` | ✅ | Ko'chir |
| `.github/workflows/ci.yml` | 🔧 | Ko'chir + tuzat |

---

*Keyingi: [02_Malumotlar_bazasi.md](02_Malumotlar_bazasi.md) — DB strategiya*
