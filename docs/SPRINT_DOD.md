# EUROPRINT ERP — SPRINT DEFINITION OF DONE (DoD)

> **Sprint tugadi deyish uchun nima bo'lishi kerak. Har sprint uchun tekshiruv.**
> DoD = "sprint tugadi" da'vosini isbotlovchi checklisti.
> Hech qanday sprint DoD to'liq bo'lmay "tugadi" deb hisoblanmaydi.
> Bog'liq: [SPRINT_REJA.md](SPRINT_REJA.md) · [KOCHIRISH_QOIDALARI.md](KOCHIRISH_QOIDALARI.md) · [TEXNIK_QARZ.md](TEXNIK_QARZ.md)

---

## 1. GLOBAL DOD (Har Sprint Uchun)

```
TEXNIK:
□ tsc --noEmit → 0 xato (BE + FE)
□ pnpm test → 0 fail
□ node scripts/golden-thread-chain-proof.cjs → PASS
□ pre-commit hooklar → barchasi PASS
□ node scripts/check-fe-api-urls.mjs → 0 ta ghost endpoint (yangi)
□ pnpm audit --audit-level=critical → 0 critical

XAVFSIZLIK:
□ Har yangi endpoint uchun @Roles() yoki @Public() (kerakli)
□ Yangi @Public() bormi? Kerakligini tasdiqlash
□ Yangi env var → .env.example ga qo'shilgan

KOD SIFATI:
□ Yangi parazit yo'q (return {ok:true}, no-op listener, hardcoded)
□ Yangi N+1 yo'q
□ Yangi ghost endpoint yo'q
□ V1 legacy to'liq o'chirilgan (ko'chirilgan modul uchun)

HUJJAT:
□ EVENT_KATALOGI.md yangilangan (yangi event bo'lsa)
□ SPRINT_REJA.md holati yangilangan
□ TEXNIK_QARZ.md to'langan qarzlar belgilangan
□ XAVF_REESTRI.md yangi xavf yoki hal etilgan xavf

GIT:
□ Har o'zgarish commit qilingan (stash yo'q)
□ git add -A yoki git add . ishlatilmagan
□ Co-Authored-By: Claude Sonnet 4.6 commit da bor
□ Migration commit kod commitdan ALOHIDA
```

---

## 2. SPRINT 0 — Poydevor (✅ TUGADI)

```
Maqsad: V2 qurishdan oldin barcha standartlar va poydevor tayyor

□ LOYIHA_QOIDALARI.md ✅
□ DIZAYN_QOIDALARI.md ✅
□ STANDARTLAR.md (§15 = 72 xato) ✅
□ Backend_Reja/ (18/18 faz) ✅
□ EuroPrint_Master_Prompt.md ✅
□ docs/adr/ (ADR-001..006) ✅
□ FE_STANDARTLAR.md ✅
□ BOSHLASH.md ✅
□ docs/LUGAT.md ✅
□ docs/GIT_QOIDALARI.md ✅
□ docs/migration/seed/ (5 SQL) ✅
□ docs/EVENT_KATALOGI.md ✅
□ docs/API_SHARTNOMA.md ✅
□ docs/XATO_KODLARI.md ✅
□ docs/DB_ERD.md ✅
□ docs/SPRINT_REJA.md ✅
□ docs/migration/MIGRATION_TARTIB.md ✅
□ docs/V2_PAPKA_STRUKTURASI.md ✅
□ docs/PARAZIT_KOD_QOIDALARI.md ✅
□ docs/MASTER_DATA_STANDARTLARI.md ✅
□ docs/XAVFSIZLIK_STANDARTLARI.md ✅
□ docs/TEST_STANDARTLARI.md ✅
□ docs/PERFORMANCE_STANDARTLARI.md ✅
□ docs/MODUL_SHARTNOMASI.md ✅
□ docs/MUHIT_STANDARTLARI.md ✅
□ docs/MONITORING_STANDARTLARI.md ✅
□ docs/XAVF_REESTRI.md ✅
□ docs/KOCHIRISH_QOIDALARI.md ✅
□ docs/CODE_REVIEW_STANDARTLARI.md ✅
□ docs/DRIZZLE_STANDARTLARI.md ✅
□ docs/TEXNIK_QARZ.md ✅
□ docs/SPRINT_DOD.md ✅
□ docs/GOLDEN_THREAD_TEKSHIRUV.md ✅
□ docs/FUNDAMENT_STATUS.md ✅

Sprint 0 TUGADI: 2026-06-18 ✅
```

---

## 3. SPRINT 1 — Auth + Org + HR

```
Maqsad: Login ishlaydi. Xodim yaratiladi. Razryad tizimi ishlaydi.

MODUL: auth
□ Login endpoint (username + parol → JWT access + refresh)
□ Refresh token endpoint
□ Logout (refresh token blacklist)
□ JWT algorimi: HS256 (pinned)
□ Rate limit: login = 5/daqiqa, OTP (agar bo'lsa)
□ Test: login OK, login FAIL, 401 unauthorized

MODUL: org
□ org_functions CRUD (super_admin, admin)
□ org_departments CRUD
□ razryad_levels CRUD (faqat GET, seed dan)
□ Karta-markazli: har karta ta'rif/razryad/talab/oylik
□ FK: org_functions ↔ razryad_levels ↔ hr_employees
□ Test: karta yaratish, xodimni kartaga bog'lash

MODUL: hr
□ hr_employees CRUD (HR manager)
□ Xodim → kartaga bog'lash (org_function_id)
□ Razryad bo'yicha maosh hisob: base × coefficient
□ Soft delete (deleted_at)
□ Test: xodim yaratish, o'chirish, razryad hisob
□ Event: HrEmployeeCreatedEvent emit

SPRINT 1 MAXSUS DOD:
□ /api/auth/login → JWT qaytaradi (real user)
□ /api/hr/employees → real DB (factory data)
□ /api/org/functions → real DB (seed data)
□ Razryad hisob to'g'ri: 3-razryad × 5M = 7.75M
□ T-10 (BE test fail) → 0 fail
□ T-04 (DRIFT-NULL) → yangi migration ustunlar to'g'ri
```

---

## 4. SPRINT 2 — Material + SD (Savdo)

```
Maqsad: Mahsulot yaratiladi. Buyurtma qabul qilinadi.

MODUL: mm (Material Master)
□ material_cards CRUD (texnolog)
□ technology_cards CRUD (versiyalash bilan)
□ work_centers CRUD
□ Material kod formati: GF-CARTO-B-001
□ Soft delete barcha master data

MODUL: sd (Sales Distribution)
□ sd_customers CRUD
□ sales_orders CRUD (KANONIK jadval — orders emas!)
□ sales_order_items CRUD
□ Holat oqimi: DRAFT→CONFIRMED→IN_PRODUCTION→SHIPPED→COMPLETED
□ Event: SalesOrderCreatedEvent emit → PP listener
□ T-01 (ikki-dunyo) → orders jadval ishlatilmaydi

SPRINT 2 MAXSUS DOD:
□ /api/sd/orders → real DB
□ Buyurtma yaratish → PP event yetib bordi
□ material_cards import Excel endpoint (ixtiyoriy)
□ T-05 ghost endpoint → kamera endpointlar hal
```

---

## 5. SPRINT 3 — PP (Ishlab Chiqarish Rejasi)

```
MODUL: pp
□ work_orders CRUD (PP manager)
□ SalesOrderCreatedEvent → WorkOrder avtomatik yaratish
□ technology_cards → work_order bog'lash
□ CRP (Capacity Requirements Planning) — qaysi work_center
□ Event: WorkOrderCreatedEvent emit → MES listener
□ Test: event zanjiri SD→PP ishlaydi

SPRINT 3 MAXSUS DOD:
□ Buyurtma yaratilganda → ishlanma avtomatik yaratildi
□ Golden thread: SD→PP connection ✅
□ T-02 (outbox) → domain_events > 0 qator
```

---

## 6. SPRINT 4–9 (Qisqacha)

```
SPRINT 4 — MES:
□ WorkOrderCreatedEvent → smena yaratilishi
□ Smena: boshlash/yakunlash → MesSessionCompletedEvent
□ IoT telemetriya (real device yoki simulator)

SPRINT 5 — QC:
□ MesSessionCompletedEvent → tekshiruv yaratilishi
□ Passed/Failed → WMS ga event

SPRINT 6 — WMS:
□ QcInspectionPassedEvent → ombor kirim
□ Warehouse_stock (kanonik, stocks emas!)
□ Outgoing movements

SPRINT 7 — FIN:
□ GL posting (entries jadval, SAP#76)
□ Maosh hisob-kitob (razryad × base)
□ Byudjet
□ T-03 (GL qisman) → to'liq hal

SPRINT 8 — CRM:
□ Leads → Deals (konversiya)
□ T-07 (manager_id NULL) → backfill migration
□ T-05 (CRM ghost) → to'liq hal

SPRINT 9 — AI + IoT + DIR:
□ Director dashboard (real agg queries)
□ IoT anomaly real handler
□ AI card moslik baholash

SPRINT 10 — Test + Stabilizatsiya:
□ T-10 → 0 test fail
□ T-16 → bundle analiz
□ Full E2E golden thread testi
```

---

## 7. SPRINT SIGN-OFF TARTIBI

```
Sprint oxirida (Muslimbek → Claude advisor):

1. Global DoD tekshiruvi (§1)
2. Sprint-maxsus DoD tekshiruvi (§3-6)
3. Texnik qarz yangilash (TEXNIK_QARZ.md)
4. Xavf reestri yangilash (XAVF_REESTRI.md)
5. Golden thread tekshiruv (GOLDEN_THREAD_TEKSHIRUV.md)
6. Demo: asosiy funksiya live ko'rsatish

Sign-off: owner "SPRINT N TUGADI" tasdiqlaydi
```

---

*EuroPrint ERP · Sprint Definition of Done · Versiya: 2026-06-18*
