# EUROPRINT ERP — V2 GA O'TISH REJASI (TO'LIQ)

> **V1 dan V2 ga qanday o'tiladi. Har sprint nima o'zgaradi. Foydalanuvchi nima ko'radi.**
> Bu hujjat "V2 ga qanday o'tamiz?" savoliga to'liq javob beradi.
> ⚠️ V2 = yangi ilova EMAS — xuddi shu tizim, toza qayta qurilgan.
> Bog'liq: [KOCHIRISH_QOIDALARI.md](KOCHIRISH_QOIDALARI.md) · [SPRINT_REJA.md](SPRINT_REJA.md) · [SPRINT_DOD.md](SPRINT_DOD.md)

---

## 1. V2 NIMA? (Tushuntirish)

```
V1 = Hozirgi tizim (ishlaydi, lekin:)
  ❌ ~130 parazit endpoint
  ❌ Ikkita parallel dunyo (sales_orders ╳ orders)
  ❌ No-op event listener (oltin zanjir uzilgan)
  ❌ N+1 query → sekin
  ❌ Guard yo'q → xavfsizlik xavfi
  ❌ Test yo'q → regress aniqlashdan qiyin
  ❌ DDD yo'q → kod tushunarsiz

V2 = Xuddi shu tizim, toza DDD bilan qayta qurilgan:
  ✅ Har endpoint real DB
  ✅ Bitta kanonik jadval (sales_orders, warehouse_stock)
  ✅ Oltin zanjir to'liq ulangan
  ✅ Test bilan qoplangan
  ✅ Guard har yerda
  ✅ N+1 yo'q
  ✅ Bir xil DB, bir xil URL, bir xil Docker
```

```
MUHIM: Foydalanuvchi uchun URL XUDDI SHU:
  http://europrint.local → ishlaveradi
  Faqat backend "ichida" toza bo'ladi
  Har sprint: 1-2 modul almashadi (foydalanuvchi sezmaydi)
```

---

## 2. O'TISH STRATEGIYASI: STRANGLER FIG

```
"Strangler Fig" (bo'g'uvchi anjir) pattern:
  Eski daraxt (V1) → asta yangi novdalar (V2) o'sib bosadi
  Yangi novda tayyor → eski shox kesiladi
  Oxirida: faqat yangi daraxt qoladi

EuroPrint da qanday ko'rinadi:

Sprint 1 boshida:                  Sprint 10 oxirida:
┌─────────────────┐                ┌─────────────────┐
│   V1 tizim      │                │   V2 tizim      │
│  ┌────────────┐ │                │  ✅ auth         │
│  │ auth V1    │ │                │  ✅ org           │
│  │ hr V1      │ │                │  ✅ hr            │
│  │ sd V1      │ │                │  ✅ sd            │
│  │ pp V1      │ │  →  10 sprint  │  ✅ pp            │
│  │ mes V1     │ │                │  ✅ mes           │
│  │ qc V1      │ │                │  ✅ qc            │
│  │ wms V1     │ │                │  ✅ wms           │
│  │ fin V1     │ │                │  ✅ fin           │
│  │ crm V1     │ │                │  ✅ crm           │
│  └────────────┘ │                └─────────────────┘
└─────────────────┘                    V1 yo'q!
```

---

## 3. SPRINT BO'YICHA O'TISH JADVALI

### Sprint 0 — Poydevor ✅ TUGADI (2026-06-18)
```
Nima bo'ldi:     37 ta standart va hujjat yaratildi
V1 holati:       Ishlab turibdi (o'zgarishsiz)
V2 holati:       Faqat hujjat (kod yo'q hali)
Foydalanuvchi:   Hech narsa sezgani yo'q
Keyingi qadam:   Sprint 1 boshlash (Auth + Org + HR)
```

### Sprint 1 — Auth + Org + HR (~1 hafta)
```
Nima quriladi:
  ✅ auth V2: login, JWT, refresh, logout
  ✅ org V2: org_functions, razryad tizimi, karta-markaz
  ✅ hr V2: xodim CRUD, razryad × maosh hisob

Almashish tartibi:
  1. auth V2 test muhitda PASS → V1 → _legacy/ → V2 faol
  2. org V2 test PASS → V1 → _legacy/ → V2 faol
  3. hr V2 test PASS → V1 → _legacy/ → V2 faol

V1 holati Sprint 1 oxirida:
  ❌ auth V1 o'chirildi (V2 ishlaydi)
  ❌ org V1 o'chirildi
  ❌ hr V1 o'chirildi

Foydalanuvchi nima sezadi:
  - Login xuddi shu ishlaydi
  - Xodimlar ro'yxati xuddi shu
  - Razryad bo'yicha maosh formulasi yangi ✨

Xavf:
  ⚠️ auth almashganda: barcha foydalanuvchi logout bo'lishi mumkin
  ✅ Yechim: almashishdan oldin "5 daqiqadan keyin logout bo'lasiz" ogohlantiruv
```

### Sprint 2 — Material + SD (~1 hafta)
```
Nima quriladi:
  ✅ mm V2: material_cards, technology_cards, work_centers
  ✅ sd V2: buyurtmalar (KANONIK: sales_orders), mijozlar

Almashish:
  - mm V2 → material_cards asosiy manba (raw_materials eski alias)
  - sd V2 → sales_orders KANONIK (orders jadval → ishlatilmaydi)
  - T-01 (ikki-dunyo) → HAL QILINADI!

Foydalanuvchi nima sezadi:
  - Buyurtma yaratish xuddi shu
  - Material katalog yangi kod ✨
  - Texnik karta versiyalash yangi ✨

Xavf:
  ⚠️ sd almashganda: orders jadvalga yozuvchi eski V1 kod bo'lsa → xato
  ✅ Yechim: grep bilan tekshir, keyin almashtir
```

### Sprint 3 — PP (~1.5 hafta)
```
Nima quriladi:
  ✅ pp V2: work_orders, SalesOrderCreatedEvent → PP avtomatik
  ✅ Oltin zanjir: SD → PP ✅ ULANDI

Foydalanuvchi nima sezadi:
  - Buyurtma tasdiqlanganda → ishlanma AVTOMATIK yaratiladi ✨
  - V1 da: qo'lda yaratish kerak edi!
```

### Sprint 4 — MES (~1.5 hafta)
```
Nima quriladi:
  ✅ mes V2: smena, sesiya, IoT telemetriya
  ✅ Oltin zanjir: PP → MES ✅ ULANDI

Foydalanuvchi nima sezadi:
  - Ishlanma yaratilganda → smena avtomatik belgilanadi ✨
  - IoT sensori ma'lumot yuboradi → real monitoring ✨
```

### Sprint 5 — QC (~1 hafta)
```
Nima quriladi:
  ✅ qc V2: sifat tekshiruvi, nuqson katalogi
  ✅ Oltin zanjir: MES → QC ✅ ULANDI

Foydalanuvchi nima sezadi:
  - Smena tugaganda → QC tekshiruv avtomatik yaratiladi ✨
  - Nuqson katalogi (gofra/offset/silkscreen) ishlaydi ✨
```

### Sprint 6 — WMS (~1 hafta)
```
Nima quriladi:
  ✅ wms V2: ombor harakati, KANONIK: warehouse_stock
  ✅ Oltin zanjir: QC → WMS ✅ ULANDI
  ✅ T-01 (stocks ikki-dunyo) → HAL QILINADI

Foydalanuvchi nima sezadi:
  - QC o'tganda → ombor avtomatik kirim ✨
  - Zaxira hisobi real (stocks emas, warehouse_stock)
```

### Sprint 7 — FIN (~2 hafta)
```
Nima quriladi:
  ✅ fin V2: GL posting, byudjet, maosh hisob
  ✅ Oltin zanjir: WMS → FIN ✅ ULANDI
  ✅ BHMS 42 hisoblar bo'yicha to'g'ri yozuv

Foydalanuvchi nima sezadi:
  - Har harakat → GL yozuv avtomatik ✨
  - Balans har doim muvozanatda ✨
  - Maosh = razryad × base (formula ishlaydi) ✨
```

### Sprint 8 — CRM (~1 hafta)
```
Nima quriladi:
  ✅ crm V2: lead, deal, faoliyat
  ✅ T-07 (manager_id null) → HAL QILINADI

Foydalanuvchi nima sezadi:
  - Lead → Deal konversiya ishlaydi
  - Menejer belgilash to'g'ri
```

### Sprint 9 — AI + IoT + DIR (~1.5 hafta)
```
Nima quriladi:
  ✅ iot V2: anomaly handler real
  ✅ ai V2: karta moslik baholash, AI planner
  ✅ dir V2: director dashboard (real aggregate)

Foydalanuvchi nima sezadi:
  - Direktor: real raqamlar (hardcoded emas) ✨
  - IoT anomaliya: ogohlantirish ishlaydi ✨
  - AI: xodim-karta moslik % ✨
```

### Sprint 10 — Test + Stabilizatsiya (~1 hafta)
```
Nima quriladi:
  ✅ To'liq E2E: SD→PP→MES→QC→WMS→FIN (bir buyurtma boshdan oxir)
  ✅ T-10 (25% test fail) → 0 fail
  ✅ T-16 (bundle > 2MB) → code splitting
  ✅ Performance test (50 concurrent user)

V1 holati Sprint 10 oxirida:
  ❌ V1 to'liq yo'q! apps/api/src/_legacy/ = bo'sh!
  ✅ V2 to'liq faol!

Foydalanuvchi nima sezadi:
  - Tizim tez ishlaydi (N+1 yo'q, index bor) ✨
  - Hech narsa to'xtamaydi (stable) ✨
```

---

## 4. SPRINT TIMELINE

```
2026-06-18  Sprint 0 ✅ TUGADI  — Poydevor (37 hujjat)
            │
            ▼
Sprint 1    1 hafta    — Auth + Org + HR
Sprint 2    1 hafta    — Material + SD (Ikki-dunyo hal)
Sprint 3    1.5 hafta  — PP (SD→PP ulandi)
Sprint 4    1.5 hafta  — MES (PP→MES ulandi)
Sprint 5    1 hafta    — QC (MES→QC ulandi)
Sprint 6    1 hafta    — WMS (QC→WMS ulandi, stocks hal)
Sprint 7    2 hafta    — FIN (WMS→FIN ulandi, GL to'liq)
Sprint 8    1 hafta    — CRM
Sprint 9    1.5 hafta  — AI + IoT + DIR
Sprint 10   1 hafta    — Test + Stabilizatsiya
            │
            ▼
~12-13 hafta = ~3 oy    V2 TO'LIQ TAYYOR
```

---

## 5. FOYDALANUVCHIGA TA'SIR

```
Sprint davomida:
  ✅ Tizim ishlaydi (zero-downtime)
  ✅ URL o'zgarmaydi
  ✅ Ma'lumot yo'qolmaydi
  ⚠️ Sprint 1: bir martalik logout (auth almashuvi)
  ⚠️ Sprint 2: buyurtmalar URL o'zgarishi mumkin (tekshirish kerak)

Sprint tugagandan keyin:
  ✨ Yangi funksiya (avtomatik oqim, real hisobot)
  ✨ Tezroq ishlaydi
  ✨ Xatolar kamayadi
```

---

## 6. XAVF VA OLDINI OLISH

| Xavf | Sprint | Yechim |
|------|--------|--------|
| Auth almashganda logout | S1 | Ogohlantiruv → off-hours almashtir |
| SD almashganda orders yo'q | S2 | Avval grep → xato yo'q → almashtir |
| GL formula xato | S7 | Staging da to'liq sinov |
| Data yo'qolishi | Har | pg_dump backup → keyin almashtir |
| V2 bug prod da | Har | ROLLBACK_PLAYBOOK.md → < 5 daqiqa |

---

## 7. V2 MUVAFFAQIYAT MEZONLARI

```
Sprint 10 tugaganda quyidagilar to'g'ri bo'lishi kerak:

TEXNIK:
✅ 0 V1 kod (apps/api/src/_legacy/ bo'sh)
✅ 0 parazit endpoint
✅ Test 0 fail
✅ tsc 0 xato
✅ pnpm audit 0 critical

BIZNES:
✅ Buyurtmadan buxgalteriagacha avtomatik (SD→PP→MES→QC→WMS→FIN)
✅ Razryad × base = to'g'ri maosh
✅ GL balans = 0 (debet = kredit)
✅ Ombor zaxirasi real
✅ Direktor dashboard real raqam

PERFORMANCE:
✅ P95 < 200ms (ro'yxat so'rovlari)
✅ 50 concurrent user → timeout yo'q
✅ Bundle < 2MB
```

---

*EuroPrint ERP · V2 Ga O'tish Rejasi · Versiya: 2026-06-18*
