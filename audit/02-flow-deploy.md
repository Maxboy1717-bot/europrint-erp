# Audit: 02 — Build, Deploy, CI/CD

**Sana:** 2026-05-25

---

## 1. Build Script'lar

### Root `package.json` skriptlari

| Script | Buyruq |
|---|---|
| `build` | `pnpm --filter @europrint/api run build` |
| `build:erp` | `pnpm --filter @workspace/erp-dashboard run build` |
| `build:all` | API + ERP + Site barcha uchta ketma-ket |
| `dev:api` | `nest start --watch` (unsafe — type-check yo'q) |
| `typecheck` | API + ERP uchun `tsc --noEmit` |
| `lint` | ESLint max-warnings 100 |
| `test` | API + ERP testlari |
| `db:migrate` | `pnpm --filter @europrint/api run migrate` |
| `ci:check` | `typecheck && lint && test` (qisqa CI gate) |

### API `apps/api/package.json` skriptlari

| Script | Buyruq | Eslatma |
|---|---|---|
| `build` | `nest build` | SWC orqali tez |
| `dev` | `nest start --watch --type-check` | Type-check bilan |
| `dev:unsafe` | `nest start --watch` | **Root `dev:api` shu variant — type-check yo'q!** |
| `start` | `node dist/main` | Production ishga tushirish |
| `test` | Jest, `--passWithNoTests` | E2E yo'q |
| `test:ci` | Jest + `--forceExit` | CI uchun |
| `test:mutation` | Stryker | Mutation testing |

**Muammo:** Root `dev:api` → `dev:unsafe` variantini ishlatadi. Bu mahalliy ishlab chiqishda type xatolarni yashiradi.

---

## 2. TypeScript Xatolari

Sandbox cheklovlari sababli `tsc --noEmit` bevosita ishga tushirib tekshirilmadi. Biroq quyidagilar aniqlandi:

- `tsconfig.json` mavjud, `typecheck:api` skripti bor
- `dev:unsafe` nomi o'zi "xavfli" ekanini bildiradi — type-check o'chirilgan holatda ishlanmoqda
- Stryker mutation testing (`test:mutation`) mavjud — bu yuqori sifat belgisi

**Tavsiya:** CI pipelineda `pnpm typecheck:api` majburiy qilinishi kerak. `dev:unsafe` faqat maxsus holatlarda ishlatilsin.

---

## 3. Docker Holati

**Fayllar:** `Dockerfile` (asosiy), `Dockerfile.prod` (alternativ), `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.test.yml`, `contrib/monitoring/docker-compose.monitoring.yml`

### `Dockerfile` (asosiy, 3 bosqich)

| Mezon | Holat | Izoh |
|---|---|---|
| Multi-stage build | **HA** | `deps` → `build` → `runtime` |
| Non-root user | **HA** | `adduser nodejs (uid 1001)` |
| Health-check (Docker) | **YO'Q** | Dockerfile'da `HEALTHCHECK` yo'q |
| tini PID-1 | **HA** | `/sbin/tini` entrypoint |
| Alpine base | **HA** | `node:20-alpine` |
| pnpm store cache | **HA** | `--mount=type=cache` |
| pg_dump mavjud | **HA** | `postgresql-client` o'rnatilgan |

**Muammo:** Asosiy `Dockerfile`da `HEALTHCHECK` direktiv yo'q. Docker'ga konteyner sog'ligini tekshirish imkoni yo'q.

### `Dockerfile.prod` (alternativ, 2 bosqich)

| Mezon | Holat | Izoh |
|---|---|---|
| Multi-stage build | **HA** | `builder` → `runtime` |
| Non-root user | **HA** | `europrint (uid 1001)` |
| Health-check (Docker) | **HA** | `wget -qO- http://localhost:4000/api/health` |
| tini PID-1 | **HA** | `/sbin/tini` entrypoint |
| `.npmrc` ko'chirilmagan | **MUAMMO** | `pnpm install --frozen-lockfile` muvaffaqiyatsiz bo'lishi mumkin |

### `docker-compose.yml` (asosiy)

- PostgreSQL 15-alpine, Redis 7-alpine
- `depends_on` → `service_healthy` (to'g'ri)
- API health-check: `wget .../health` bor
- Port `127.0.0.1:3000:3000` — faqat localhost, xavfsiz
- Nginx hozircha comment qilingan (ishlatilmaydi)

### `docker-compose.prod.yml`

- PostgreSQL 16-alpine (asosiy compose bilan versiya farqi — 15 vs 16!)
- Nginx service faol, portlar 80 va 443 ochiq
- `backup` service ichki `while true; do sleep 86400` bilan — **antipattern** (Docker restart policy `"no"`)

**Kritik muammo:** `docker-compose.yml` PostgreSQL 15, `docker-compose.prod.yml` PostgreSQL 16 ishlatadi. Qaysi biri ishlatilishi noaniq.

---

## 4. Migrations

### Drizzle migrations (`apps/api/drizzle/`)

Fayllar `0000` dan `0016` gacha timestamp emas, tartib raqami bilan nomlanган:

```
0000_volatile_ender_wiggin.sql
0001_chat_messenger_tables.sql
...
0016_pos_inventory_passport.sql
```

Drizzle Kit o'z ichki jadvalida versiyani boshqaradi. Bu to'g'ri yondashuv.

### Drizzle migrations (`lib/db/drizzle/`)

```
0000_nice_kylun.sql
0001_add_indexes_only.sql
0002_recruitment_funnel_refs_offers.sql  (archive/ da ham eski versiya bor)
...
0050_migrate_departments_to_org.sql
```

**Muammo:** `lib/db/drizzle/` va `apps/api/drizzle/` — **ikki alohida migration zanjirlari** mavjud. Qaysi biri canonical ekanini tushunish qiyin. Bu schema divergence xavfini oshiradi.

### Manual SQL migrations (`apps/api/src/shared/db/migrations/`)

Bu papkada **30+ manual SQL fayli** bor, ular versiyalanmagan yoki tartibsiz:

```
search-fts-indexes.sql
materialized-views.sql
drift-fix-01-tenant-id.sql
drift-fix-02-missing-cols.sql
...
drift-fix-04c-real-table-cols.sql
```

`drift-fix-*` nomli fayllar mavjudligi schema va migratsiya o'rtasida **drift** (farq) bo'lganidan dalolat beradi. Bu jiddiy muammo — schema manba haqiqatidan ajralib ketgan.

**Xulosa:** Migratsiya strategiyasi uchta alohida yo'nalishga bo'linib ketgan: `lib/db/drizzle`, `apps/api/drizzle`, va manual SQL fayllar. Birlashtirilgan yagona pipeline yo'q.

---

## 5. Secrets / Xavfsizlik

### `.env` fayllar holati

| Fayl | Tarkib | Xavf |
|---|---|---|
| `.env` (root) | `JWT_SECRET`, `POSTGRES_PASSWORD`, `JWT_REFRESH_SECRET` ochiq yozilgan | **YUQORI** |
| `apps/api/.env` | `ANTHROPIC_API_KEY=sk-ant-api03-...` to'liq kalit | **KRITIK** |
| `apps/api/.env` | `YANDEX_API_KEY`, `JITSI_APP_ID` | O'rta xavf |

### `.gitignore` tekshiruvi

`.gitignore`da quyidagilar mavjud:
```
.env
.env.local
.env.*.local
.env.production
```

**Yaxshi:** Asosiy `.env` git-ignore qilingan. Biroq:

**Muammo 1:** `.env` fayli loyiha papkasida mavjud. Agar kimdir `git add -f .env` qilsa yoki `.gitignore` o'chirilsa — barcha maxfiy kalitlar git tarixiga tushadi.

**Muammo 2:** `apps/api/.env`da haqiqiy Anthropic API kaliti (`***ANTHROPIC-KEY-REMOVED***rojNLUYDGALNItZczoqFfTlnTAU4D_WmZ3V50AOYHTTZ9zw43afJ64x3Aw_ZfAZFHrJTj_lyPZKpyp_Rtw-...`) mavjud. Bu kalit darhol revoke qilinishi va production uchun secrets manager (Vault, AWS SM, GCP SM) ishlatilishi kerak.

**Muammo 3:** `JWT_SECRET` da "please-change-in-prod" matn bor (`local-dev-jwt-secret-please-change-in-prod...`) — bu development default'i production'ga tushsa xavfli.

---

## 6. CI/CD Pipeline

`.github/` papkasi **topilmadi** — GitHub Actions yoki boshqa CI/CD konfiguratsiyasi yo'q.

Root `package.json`da `ci:check` skripti bor:
```json
"ci:check": "pnpm run typecheck && pnpm run lint && pnpm run test"
```

Biroq bu skriptni avtomatik ishga tushuradigan pipeline yo'q.

**Muammolar:**
- GitHub Actions workflow yo'q
- Har qanday commit to'g'ridan-to'g'ri main branchga o'tishi mumkin
- E2E test gate yo'q
- Avtomatik deploy step yo'q
- PR review talabi yo'q (branch protection rules noma'lum)

---

## 7. Monitoring

### Sentry

`@sentry/nestjs@^9.0.0` ulangan. `apps/api/src/common/monitoring/sentry.config.ts` fayli mavjud va yaxshi yozilgan:

- Graceful degradation: `SENTRY_DSN` bo'lmasa app ishlayveradi
- 401/403/404 xatolar Sentry'ga yuborilmaydi (quota tejash)
- `tracesSampleRate`: production 0.1, dev 1.0

**Muammo:** `docker-compose.prod.yml`da `SENTRY_DSN:-` (bo'sh default) — production'da Sentry aslida yoqilmagan bo'lishi mumkin.

### Pino logging

`nestjs-pino@^4.6.1` o'rnatilgan, 4 joyda ishlatiladi:
- `app.module.ts`
- `logger.provider.ts` (2 joy)
- `logger.util.ts`

Strukturali JSON logging mavjud — bu yaxshi.

### Health endpoint

`/health` endpoint mavjud:
```typescript
fastify.get('/health', (_req, reply) => reply.code(200).send({ status: 'ok' }));
```

`main-bootstrap.ts`da throttling va audit logdan ham o'chirilgan. `docker-compose.yml`da health-check shu endpointga qaraydi.

### Prometheus/Grafana

`contrib/monitoring/docker-compose.monitoring.yml` — to'liq monitoring stack:
- Prometheus + Grafana + Alertmanager
- node-exporter, postgres-exporter, redis-exporter
- `prom-client` API'da o'rnatilgan

**Muammo:** Bu monitoring stack ixtiyoriy (`contrib/`) va asosiy deploy bilan integratsiya qilinmagan.

---

## 8. Backup

### `scripts/backup.sh`

Yaxshi yozilgan skript:
- `set -euo pipefail` — xatoda to'xtaydi
- `pg_dump` + `gzip -9` — siqilgan dump
- `--no-owner --no-acl --clean --if-exists` — to'g'ri flaglar
- Retention policy: eski fayllarni `find -mtime +N -delete` bilan tozalash

### `scripts/backup-cron.txt`

Ikki variant tavsiya qilingan:
1. Cron (02:00 Asia/Tashkent)
2. Systemd timer (tavsiya etilgan, hardening bilan)

Off-site replication (Backblaze B2 via rclone) ham ko'rsatilgan.

### `docker-compose.prod.yml` backup service

```yaml
backup:
  restart: "no"
  entrypoint:
    - sh -c "while true; do pg_dump ...; sleep 86400; done"
```

**Muammo:** `restart: "no"` + `while true` kombinatsiyasi noto'g'ri. Konteyner birinchi muvaffaqiyatli ishlagach restart bo'lmaydi, lekin `while true` ichida qoladi. Agar konteyner crash bo'lsa backup to'xtaydi. Systemd timer yoki Kubernetes CronJob ishlatilishi kerak.

**Muammo:** Backup fayllarining off-site ko'chirilishi avtomatlashtirilmagan (faqat docs'da ko'rsatilgan).

---

## Xulosa

| Tekshiruv | Holat | Muammo |
|---|---|---|
| Build skriptlari | Yaxshi | `dev:unsafe` type-check o'chirib ishlatilmoqda |
| TypeScript | Noaniq | Sandbox cheklovlari, `dev:unsafe` xavfli |
| Dockerfile multi-stage | **HA** | To'g'ri |
| Docker non-root user | **HA** | To'g'ri |
| Docker health-check | Qisman | Asosiy `Dockerfile`da yo'q, `Dockerfile.prod`da bor |
| PostgreSQL versiya kelishuvi | **YO'Q** | Compose 15-alpine, compose.prod 16-alpine |
| Migration strategiyasi | **Muammo** | 3 alohida kanal: `lib/db/drizzle`, `apps/api/drizzle`, manual SQL |
| Schema drift | **HA** | `drift-fix-*` fayllari mavjud — schema va ORM o'rtasida farq bo'lgan |
| Secrets management | **KRITIK** | Haqiqiy API kalit `.env`da ochiq, git-ignore yordamida himoya |
| CI/CD pipeline | **YO'Q** | GitHub Actions yo'q, avtomatik test/deploy yo'q |
| Sentry monitoring | Qisman | O'rnatilgan, lekin production'da SENTRY_DSN bo'sh |
| Pino logging | **HA** | Strukturali logging yaxshi |
| Health endpoint | **HA** | `/health` mavjud |
| Prometheus/Grafana | Qisman | `contrib/` da ixtiyoriy, asosiy compose bilan bog'liq emas |
| Backup skripti | **HA** | Yaxshi yozilgan |
| Backup avtomatizatsiya | Qisman | Docker variant antipattern, systemd tavsiya etilgan |
| Off-site backup | **YO'Q** | Faqat docs'da ko'rsatilgan, avtomatlashtirilmagan |

### Kritik muammolar (darhol hal qilish kerak)

1. **`apps/api/.env`da haqiqiy Anthropic API kaliti ochiq** — darhol revoke qilish va secrets manager o'rnatish
2. **CI/CD pipeline yo'q** — har qanday kod test o'tmasdan production'ga tushishi mumkin
3. **3 migration kanali** — schema haqiqatini aniqlash va birlashtirish kerak

### O'rta muddatli muammolar

4. PostgreSQL versiya kelishuvi (15 vs 16) — bitta versiyaga o'tish
5. Asosiy `Dockerfile`ga `HEALTHCHECK` qo'shish
6. `docker-compose.prod.yml` backup service antipatternini tuzatish
7. Off-site backup avtomatizatsiyasi (rclone/S3)

---

## Sandbox Cheklovlari

- `mcp__workspace__bash` Bash tool bu audit davomida `RPC error -1: process already running` xatosini berdi — sandbox hali boshqa jarayon tomonidan band edi.
- Natijada `tsc --noEmit` bevosita ishga tushirib TypeScript xato soni aniqlanmadi — fayl tizimini to'g'ridan-to'g'ri o'qib tahlil qilindi.
- CI/CD holati `.github/` papkasini qidirib aniqlandi (papka topilmadi = GitHub Actions yo'q).
