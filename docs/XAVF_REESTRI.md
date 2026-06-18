# EUROPRINT ERP — XAVF REESTRI

> **Loyihada aniqlangan barcha xavflar, ularning ehtimoli, ta'siri va oldini olish.**
> Tirik hujjat — har sprint oxirida yangilanadi.
> E = Ehtimollik (1=past, 5=yuqori) · T = Ta'sir (1=kichik, 5=kritik) · M = E×T
> Bog'liq: [PARAZIT_KOD_QOIDALARI.md](PARAZIT_KOD_QOIDALARI.md) · [XAVFSIZLIK_STANDARTLARI.md](XAVFSIZLIK_STANDARTLARI.md)

---

## KRITIK XAVFLAR (M ≥ 15)

### R-01: Ikki-dunyo ma'lumot yo'qolishi
```
Xavf:    Parallel jadvallar (sales_orders ╳ orders, warehouse_stock ╳ stocks)
         → ikkalasiga yoziladi → mos kelmaydigan holat → buyurtma yo'qoladi
E: 5  T: 5  M: 25  Holat: ⚠️ MAVJUD (qisman hal qilingan)

Oldini olish:
  ✅ ADR-002: sales_orders kanonik, orders — V2 da ko'p ko'rinmaydi
  ✅ ADR-004: warehouse_stock kanonik, stocks — eski
  ❌ Hali hal etilmagan: V2 da ikkalasiga yozuvchi kod bor

Nazorat:
  grep -rn "from.*orders\b\|into.*orders\b" apps/api/src/ | grep -v "sales_orders"
  → Har natiija = muammo

Egasi: Muslimbek (Sprint 1 da to'liq yechish)
```

### R-02: GL yozuvi atomarligi yo'q
```
Xavf:    GL posting (entries jadvalga) transaction ichida emas →
         Debet yoziladi, kredit yozilmaydi (server crash) → balans buziladi
E: 3  T: 5  M: 15  Holat: ✅ FIX4 hal etilgan (insertJournal + db.transaction)

Oldini olish:
  ✅ insertJournal → doim db.transaction() ichida
  ✅ SAP#76: gl_journal_entries/gl_lines → hech qachon to'g'ridan yozma
  ✅ entries jadvalga faqat insertJournal orqali

Nazorat (har sprint):
  grep -rn "insert.*entries\|insert.*gl_journal" apps/api/src/ --include="*.ts"
  → Har natija insertJournal orqalimi? Emas bo'lsa → STOP
```

### R-03: Secret gitga tushishi
```
Xavf:    .env yoki API key commit ga tushib GitHub ga push bo'lishi →
         secret o'g'irlanishi → DB/API buzilishi
E: 3  T: 5  M: 15  Holat: ⚠️ BIR MARTA BO'LDI (2c20cbf4, lekin push bloklanid)

Oldini olish:
  ✅ GitHub push protection faol (private repo)
  ✅ pre-commit: check-no-secret-print.mjs ishlaydi
  ✅ .gitignore: .env, *.log, backend.log*
  ⚠️ Xavf: yangi developer .env ni qo'shishi mumkin

Nazorat:
  git log --all --full-history -- .env  → hech narsa bo'lmasin
  gitleaks detect --no-git              → secret topilmasin
```

### R-04: Event yo'qolishi (Outbox xatosi)
```
Xavf:    domain_events PENDING holatda qoladi → relay ishlamaydi →
         QC tekshiruvi yaratilmaydi → ombor kirmaydi → GL yozilmaydi
E: 4  T: 4  M: 16  Holat: ⚠️ MAVJUD (domain_events=0 qator topilgan!)

Oldini olish:
  ✅ Outbox pattern: event + DB yozuvi bir tranzaksiyada
  ✅ Relay processor: 5 sekund interval
  ❌ Hali: relay PENDING eventlarni NECHTA? kuzatmaydi
  ❌ Dead-letter queue yo'q (>3 retry failed events)

Nazorat:
  SELECT COUNT(*) FROM domain_events WHERE status='PENDING'
    AND created_at < NOW() - INTERVAL '5 minutes';
  → 0 bo'lishi kerak. Agar > 0 → relay ishlamayapti!

Egasi: Sprint 3 da hal qilish (dead-letter + monitoring)
```

### R-05: N+1 query (Katta yuklamada timeout)
```
Xavf:    100+ buyurtma ro'yxati → har biri uchun alohida SQL →
         5-10 sekund javob → timeout → foydalanuvchi ishlay olmaydi
E: 5  T: 3  M: 15  Holat: ⚠️ V1 da ko'p joy (hali V2 da oldini olish kerak)

Oldini olish:
  ✅ PERFORMANCE_STANDARTLARI.md §2: N+1 qoidasi
  ✅ Har ro'yxat = 1 SQL (JOIN bilan)
  ✅ Pagination: max 100 limit

Nazorat:
  NODE_ENV=development pnpm dev  → log da "Executing: SELECT" sanash
  Agar bir request = 20+ SQL → N+1 bor!
```

---

## YUQORI XAVFLAR (M 10-14)

### R-06: Avtorizatsiya o'tkazib yuborish (Fail-open)
```
Xavf:    Guard noto'g'ri → hamma kirishi mumkin →
         manager boshqa bo'lim maosh ma'lumotini o'qiydi
E: 3  T: 4  M: 12  Holat: ✅ TUZATILGAN (FIX1: PIP/eNPS @Roles qo'shildi)

Oldini olish:
  ✅ 4 global guard (Jwt+Roles+Sod+Permission) avtomatik
  ✅ Yangi endpoint uchun @Roles() MAJBURIY
  ⚠️ Xavf: @Public() noto'g'ri ishlatilishi

Nazorat:
  grep -rn "@Public()" apps/api/src/ --include="*.ts"
  → Har biri kerakmi? /health, /auth/login, /auth/refresh — boshqasi TEKSHIR
```

### R-07: Circular dependency (NestJS crash)
```
Xavf:    Modul A → B import, Modul B → A import →
         NestJS "Circular dependency detected" xatosi → app start bo'lmaydi
E: 3  T: 4  M: 12  Holat: ⚠️ V1 da 3 ta bor (dedup-safety-rules.md §3)

Oldini olish:
  ✅ MODUL_SHARTNOMASI.md: modul chegaralari
  ✅ forwardRef() faqat oxirgi vosita sifatida
  ✅ EVENT orqali muloqot (import emas)

Nazorat:
  npx madge --circular apps/api/src/modules/
  → Bo'sh bo'lishi kerak (circular yo'q)
```

### R-08: View ga yozish urinishi (Runtime crash)
```
Xavf:    current_stock, mes_shift_handovers = VIEW →
         INSERT/UPDATE → "cannot insert into view" → 500 xato
E: 4  T: 3  M: 12  Holat: ⚠️ V1 da 2 ta joy (FIX4 deferred)

Oldini olish:
  ✅ ADR-004: warehouse_stock kanonik (VIEW emas)
  ✅ LUGAT.md §6: VIEW jadvallar ro'yxati
  ❌ Hali: V2 kod VIEW ga yozmasligini tekshiruvchi script yo'q

Nazorat:
  grep -rn "current_stock\|mes_shift_handovers" apps/api/src/ --include="*.ts"
  → INSERT/UPDATE bo'lsa → darhol o'zgar
```

### R-09: FE-BE drift (Ghost endpoint)
```
Xavf:    FE endpoint chaqiradi → BE da yo'q → 404 →
         foydalanuvchi sahifasi ishlamaydi → ma'lumot ko'rinmaydi
E: 4  T: 3  M: 12  Holat: ⚠️ 7 ta mavjud (cameras, crm/ai/...)

Oldini olish:
  ✅ API_SHARTNOMA.md: endpoint format qoidasi
  ✅ Pre-commit: check-fe-api-urls.mjs (7 ta topildi)
  ❌ Hali: 7 ta ghost endpoint tuzatilmagan

Nazorat:
  node scripts/check-fe-api-urls.mjs → 0 ta bo'lishi kerak
```

### R-10: Migration muvaffaqiyatsizligi (Prod da)
```
Xavf:    Migration ishga tushiriladi → xato → DB yarim o'zgartirilgan →
         app ishlamaydi → rollback qiyin
E: 3  T: 4  M: 12  Holat: ⚠️ Rollback procedure yo'q

Oldini olish:
  ✅ MIGRATION_TARTIB.md: tartib va idempotent pattern
  ✅ Har migration IF NOT EXISTS (idempotent)
  ✅ Down migration yozish (rollback uchun)
  ❌ Hali: prod da migration oldidan backup tartibi yo'q

Nazorat (prod migration oldidan):
  1. pg_dump europrint > backup_$(date +%Y%m%d_%H%M%S).sql
  2. Staging da test
  3. Keyin prod
```

---

## O'RTACHA XAVFLAR (M 6-9)

### R-11: i18n kalit yo'q (Console xato)
```
Xavf:    FE kalitni topsa → "{key}" ko'rsatadi → UI noqulay
E: 5  T: 2  M: 10  Holat: ⚠️ ~180 hardcoded TSX hali

Oldini olish: FE_STANDARTLAR.md §14 i18n qoidasi
Egasi: Sprint bo'yicha har modul uchun yangi kalitlar
```

### R-12: Katta attachment memory out
```
Xavf:    Katta fayl upload → Node.js bufferga yuklaydi → heap out →
         app crash
E: 3  T: 3  M: 9  Holat: ⚠️ Limit konfiguratsiya tekshirilmagan

Oldini olish:
  fastify fileSize limit: 10MB (apps/api/src/main.ts)
  Katta fayl → streaming upload (S3/local disk, buffer emas)
```

### R-13: Test suite sekin (CI > 10 daqiqa)
```
Xavf:    Har commit → CI 10+ daqiqa → developer kutadi → sekin iteratsiya
E: 4  T: 2  M: 8  Holat: ⚠️ Mavjud test suitelari tezligi o'lchanmagan

Oldini olish: TEST_STANDARTLARI.md §8 parallel jest config
```

### R-14: Health check false negative
```
Xavf:    Health check IPv6 muammo → "unhealthy" (aslida sog'lom) →
         monitoring yolg'on ogohlantiradi
E: 4  T: 2  M: 8  Holat: ✅ TUZATILGAN (127.0.0.1, IPv6 emas)

Nazorat: curl http://127.0.0.1:3030/health → "status":"ok"
```

### R-15: pnpm lock file konflikti
```
Xavf:    Ikki developer paket qo'shadi → lockfile konflikti →
         build xato → CI fail
E: 3  T: 2  M: 6  Holat: ⚠️ Bir developer (Muslimbek) = kam xavf

Oldini olish: GIT_QOIDALARI.md §7 — har paket qo'shimchasida alohida commit
```

---

## PAST XAVFLAR (M ≤ 5) — Qayd qilingan, kuzatiladi

| # | Xavf | E | T | M | Holat |
|---|------|---|---|---|-------|
| R-16 | Drizzle schema ↔ DB drift | 3 | 2 | 6 | ⚠️ Ongoing audit |
| R-17 | Redis cache stale data | 2 | 2 | 4 | 🔲 Redis hali yo'q |
| R-18 | Test factory type mismatch | 3 | 1 | 3 | ⚠️ Sprint 1 da hal |
| R-19 | FE bundle > 2MB | 2 | 2 | 4 | ⚠️ O'lchanmagan |
| R-20 | OTP brute force | 2 | 3 | 6 | ⚠️ Rate limit kerak |
| R-21 | Parol complexity yo'q | 2 | 2 | 4 | ⚠️ Faqat min 8 belgi |
| R-22 | Log disk to'lishi | 2 | 2 | 4 | ⚠️ Rotation kerak |
| R-23 | Docker volume backup yo'q | 2 | 3 | 6 | ⚠️ 15_DevOps.md |

---

## XAVF BOSHQARUV JARAYONI

```
Har sprint oxirida:
1. Yangi xavflar aniqlanding? → qo'sh, E/T baho, egasi belgilash
2. Hal etilgan xavflar? → "✅ TUZATILGAN" + commit ID yoz
3. Holati o'zgardi? → E/T yangilash
4. M ≥ 15 bo'lgan yangi xavf → darhol (sprint ichida) hal qilish
5. M 10-14 → keyingi sprint da hal qilish

Egasi: [Sprint rahbari]
Yangilash tartixi: sprint_id, sana, kim, nima o'zgardi
```

---

## TUZATILGAN XAVFLAR TARIXI

| Xavf | Sprint | Commit | Holat |
|------|--------|--------|-------|
| IPv6 healthcheck false | S0 | 1cb4631c | ✅ |
| PIP/eNPS fail-open guard | S0 | a2dae99d | ✅ |
| pos-wms-sync crash | S0 | 497a731c | ✅ |
| GL journal atomarity | S0 | 6cae643e | ✅ |
| Secret GitHub push | S0 | blocked | ✅ (rotate kerak) |
| mas_telemetry cron flood | S0 | 1cb4631c | ✅ |
| 104 DB default yo'q | S0 | 159a411a | ✅ |

---

*EuroPrint ERP · Xavf Reestri · Versiya: 2026-06-18 · Keyingi yangilash: Sprint 1 oxiri*
