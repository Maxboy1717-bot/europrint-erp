# EUROPRINT ERP — FUNDAMENT TO'LIQ HOLATI

> **Poydevorning barcha hujjatlari va ularning holati. Master checklisti.**
> Bu hujjatni "poydevor tugadimi?" degan savolga javob berish uchun o'qing.
> ✅ = tayyor · ⚠️ = qisman · ❌ = yo'q
> Oxirgi yangilanish: 2026-06-18 · Sprint 0 tugadi.

---

## 1. ARXITEKTURA VA STANDARTLAR

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| A1 | [LOYIHA_QOIDALARI.md](../LOYIHA_QOIDALARI.md) | 23 arxitektura qoidasi, stack, DDD | ✅ |
| A2 | [DIZAYN_QOIDALARI.md](../DIZAYN_QOIDALARI.md) | EP Design System, tokenlar, komponentlar | ✅ |
| A3 | [STANDARTLAR.md](../STANDARTLAR.md) §15 | 72 tarixiy xato qoidasi, nomlash | ✅ |
| A4 | [docs/adr/](adr/) | 6 ADR (org_functions/sales_orders/entries/...) | ✅ |
| A5 | [docs/DRIZZLE_STANDARTLARI.md](DRIZZLE_STANDARTLARI.md) | Drizzle schema, query, migration pattern | ✅ |
| A6 | [docs/API_SHARTNOMA.md](API_SHARTNOMA.md) | FE↔BE format, pagination, ID=int, data=ISO | ✅ |
| A7 | [docs/XATO_KODLARI.md](XATO_KODLARI.md) | Standart xato kodlari HR_*/SD_*/... | ✅ |

## 2. JARAYON VA METODOLOGIYA

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| P1 | [docs/GIT_QOIDALARI.md](GIT_QOIDALARI.md) | Branch, commit format, git add <fayl> | ✅ |
| P2 | [docs/CODE_REVIEW_STANDARTLARI.md](CODE_REVIEW_STANDARTLARI.md) | PR template, review checklisti, merge | ✅ |
| P3 | [docs/KOCHIRISH_QOIDALARI.md](KOCHIRISH_QOIDALARI.md) | V1→V2 ko'chirish 6-bosqich tartibi | ✅ |
| P4 | [docs/SPRINT_REJA.md](SPRINT_REJA.md) | Sprint 0-10 reja, bog'liqlik | ✅ |
| P5 | [docs/SPRINT_DOD.md](SPRINT_DOD.md) | Har sprint Definition of Done | ✅ |
| P6 | [EuroPrint_Master_Prompt.md](../EuroPrint_Master_Prompt.md) | Muslimbek sessiya boshida o'qiydi | ✅ |
| P7 | [BOSHLASH.md](../BOSHLASH.md) | Dev setup: clone→env→DB→run→smoke test | ✅ |

## 3. XAVFSIZLIK VA SIFAT

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| S1 | [docs/XAVFSIZLIK_STANDARTLARI.md](XAVFSIZLIK_STANDARTLARI.md) | Guard, RBAC, injection, JWT, OWASP | ✅ |
| S2 | [docs/TEST_STANDARTLARI.md](TEST_STANDARTLARI.md) | Real DB, unit/int/e2e, factory, coverage | ✅ |
| S3 | [docs/PERFORMANCE_STANDARTLARI.md](PERFORMANCE_STANDARTLARI.md) | N+1, pagination, index, response time | ✅ |
| S4 | [docs/MONITORING_STANDARTLARI.md](MONITORING_STANDARTLARI.md) | Log format, secret taqiq, health check | ✅ |
| S5 | [docs/PARAZIT_KOD_QOIDALARI.md](PARAZIT_KOD_QOIDALARI.md) | 8 tur parazit, aniqlash, o'chirish | ✅ |

## 4. MA'LUMOT VA ARXITEKTURA

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| D1 | [docs/MASTER_DATA_STANDARTLARI.md](MASTER_DATA_STANDARTLARI.md) | Master data egalari, M-1..M-6 qoidalar | ✅ |
| D2 | [docs/MODUL_SHARTNOMASI.md](MODUL_SHARTNOMASI.md) | Modul chegaralari, jadval egasi, event | ✅ |
| D3 | [docs/DB_ERD.md](DB_ERD.md) | Jadvallar munosabati, kanonik xarita | ✅ |
| D4 | [docs/migration/MIGRATION_TARTIB.md](migration/MIGRATION_TARTIB.md) | Migration tartib 1-9, idempotent | ✅ |
| D5 | [docs/migration/seed/](migration/seed/) | 5 seed SQL (roles/razryad/units/accounts/defects) | ✅ |
| D6 | [docs/LUGAT.md](LUGAT.md) | Domain lug'at, kanonik jadval nomlari | ✅ |

## 5. XAVF VA QARZ BOSHQARUVI

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| R1 | [docs/XAVF_REESTRI.md](XAVF_REESTRI.md) | 23 xavf E×T=M ball, tartixi | ✅ |
| R2 | [docs/TEXNIK_QARZ.md](TEXNIK_QARZ.md) | 18 texnik qarz T-01..T-18, sprint rejasi | ✅ |
| R3 | [docs/V2_PAPKA_STRUKTURASI.md](V2_PAPKA_STRUKTURASI.md) | V2 Strangler Fig, _legacy/, qaerda nima | ✅ |

## 6. INTEGRATSIYA VA ZANJIR

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| I1 | [docs/EVENT_KATALOGI.md](EVENT_KATALOGI.md) | 19 event, payload, emitter, listener, holat | ✅ |
| I2 | [docs/GOLDEN_THREAD_TEKSHIRUV.md](GOLDEN_THREAD_TEKSHIRUV.md) | SD→PP→MES→QC→WMS→FIN qanday test | ✅ |

## 7. MUHIT VA INFRATUZILMA

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| E1 | [docs/MUHIT_STANDARTLARI.md](MUHIT_STANDARTLARI.md) | Port, .env, Docker, secret rotation | ✅ |

## 8. REJA

| # | Hujjat | Maqsad | Holat |
|---|--------|--------|-------|
| L1 | [docs/V2-REBUILD/Backend_Reja/](V2-REBUILD/Backend_Reja/) | 18 fazali reja (00_Indeks → 18 faz) | ✅ |
| L2 | [FE_STANDARTLAR.md](../FE_STANDARTLAR.md) | useQuery/useMutation/form/table shablonlar | ✅ |

---

## XULOSA: POYDEVOR HOLATI

```
JAMI: 30 ta poydevor hujjat
✅ TAYYOR: 30 (100%)
⚠️ QISMAN: 0
❌ YO'Q:   0

Sprint 0 STATUS: ✅ TO'LIQ TUGADI (2026-06-18)
```

---

## SPRINT 1 GA TAYYOR — TEKSHIRUV

```bash
# Muslimbek Sprint 1 boshlashdan oldin:

# 1. Server ishlayaptimi?
curl http://127.0.0.1:3030/health
# → {"status":"ok"}

# 2. DB ulanish ishlayaptimi?
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
# → raqam qaytadi

# 3. Golden thread skript:
node scripts/golden-thread-chain-proof.cjs
# → PASS (hozircha 0 event ulangan, V1 holat)

# 4. Pre-commit hooklar:
git add scripts/dummy-check.txt && git commit --dry-run
# → hooklar ishga tushdi, xato yo'q

# 5. CLAUDE.md o'qilganmi?
# → Ha (auto-load)

# 6. Tegishli sprint hujjat:
# docs/V2-REBUILD/Backend_Reja/04_Bosqich1_ORG_HR.md
# docs/KOCHIRISH_QOIDALARI.md
# docs/SPRINT_DOD.md §3

# ✅ Barchasi tayyor → Sprint 1 BOSHLASH!
```

---

## NIMALAR HALI YO'Q (Sprint 1 da kerak)

```
1. apps/api/src/common/factories/ — real Drizzle schema kerak (Sprint 1 da)
   ❌ base.factory.ts, employee.factory.ts, sales-order.factory.ts
   → hr_employees pgTable schema yaratilgandan keyin qo'shiladi

2. Test muhiti DB (DATABASE_URL_TEST)
   ❌ europrint_test DB yaratilmagan
   → CREATE DATABASE europrint_test; (Sprint 1 setup da)

3. Swagger/OpenAPI (ixtiyoriy, dev uchun)
   ❌ @nestjs/swagger o'rnatilmagan
   → Sprint 1 da ixtiyoriy

4. FE API layeri (api/ papka)
   ❌ V2 FE uchun api/ funksiyalar yo'q hali
   → Sprint bo'yicha, har modul FE da
```

---

## ASOSIY HAVOLALAR (Muslimbek Uchun)

```
Har kuni o'qi:
  BOSHLASH.md           → server ishga tushirish
  EuroPrint_Master_Prompt.md → kontekst

Har sprint:
  SPRINT_DOD.md         → nimani bajarish kerak
  KOCHIRISH_QOIDALARI.md → qanday ko'chirish
  tegishli Backend_Reja faz → nima quriladi

Har commit:
  GIT_QOIDALARI.md      → git add <fayl>
  CODE_REVIEW_STANDARTLARI.md → checklisti

Muammo bo'lsa:
  XAVF_REESTRI.md       → bu xavf allaqachon aniqlangan?
  TEXNIK_QARZ.md        → bu qarz allaqachon qayd etilgan?
  PARAZIT_KOD_QOIDALARI.md → bu parazitmi?
```

---

*EuroPrint ERP · Fundament To'liq Holati · Sprint 0 ✅ TUGADI · 2026-06-18*
