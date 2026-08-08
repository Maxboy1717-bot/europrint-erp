# EUROPRINT ERP — TEXNIK QARZ REESTRI

> **Loyihada mavjud texnik qarzlar, prioriteti va to'lash rejasi.**
> Texnik qarz = ishlaydi, lekin to'g'ri emas. Kelajakda muammo bo'ladi.
> Har sprint oxirida yangilanadi. T1-T8 Backend_Reja/00_Indeks.md dan.
> Bog'liq: [XAVF_REESTRI.md](XAVF_REESTRI.md) · [SPRINT_REJA.md](SPRINT_REJA.md) · [SPRINT_DOD.md](SPRINT_DOD.md)

---

## TEXNIK QARZ BAHOLASH

```
Darajasi:
  P0 — Bloklovchi: Sprint davom etmaydi (xavfsizlik, data yo'qolish)
  P1 — Muhim: Kelgusi sprint ichida to'lanadi
  P2 — Normal: 1-3 sprint ichida
  P3 — Keyinroq: Imkoniyat bo'lganda

Kategoriya:
  ARCH  — Arxitektura muammosi
  PERF  — Performance muammosi
  SEC   — Xavfsizlik muammosi
  TEST  — Test yo'q yoki kam
  CODE  — Kod sifati
  DATA  — Ma'lumot muammosi
  INFRA — Infratuzilma muammosi
```

---

## P0 — BLOKLOVCHI (Darhol)

### T-01: Ikki-dunyo parallel jadvallar
```
Kategoriya: ARCH
Tavsif: sales_orders (kanonik) ╳ orders (eski, ba'zi kodlar hanuz ishlatadi)
        warehouse_stock (kanonik) ╳ stocks (eski, WMS ba'zi joylarda)
Ta'sir: Ikkiga yozilsa → mos kelmaydigan holat → buyurtma yo'qoladi
Sprint: Sprint 1-2 (SD ko'chirishda hal)
Xavf: R-01 (E:5 T:5 M:25)
Tekshiruv:
  grep -rn "from.*\borders\b\|into.*\borders\b" apps/api/src/ --include="*.ts"
  grep -rn "from.*\bstocks\b\|into.*\bstocks\b" apps/api/src/ --include="*.ts"
  → Har natija = to'g'rilash kerak
```

### T-02: Outbox relay ishlamasligi
```
Kategoriya: ARCH
Tavsif: domain_events jadvali bor, relay processor ishlaydi,
        LEKIN: domain_events = 0 qator (event yozilmayapti)
        13+ zero-listener event (emit qilinadi, hech kim tinglamaydi)
Ta'sir: Oltin zanjir SD→PP→MES→QC→WMS→FIN uziladi
Sprint: Sprint 1 (auth/org) dan boshlab har modul uchun
Xavf: R-04 (E:4 T:4 M:16)
Tekshiruv:
  SELECT COUNT(*) FROM domain_events WHERE status='PENDING'
    AND created_at < NOW() - INTERVAL '5 minutes';
  → 0 bo'lishi kerak
```

---

## P1 — MUHIM (Kelgusi Sprint)

### T-03: GL posting atomarligi (qisman)
```
Kategoriya: ARCH
Tavsif: FIX3 (6cae643e) GL journal atomic. LEKIN:
        PosMovementCompletedEvent → GL posting deferred (FIX4)
        Kassir tranzaksiyasi GL ga tushmasligi mumkin
Ta'sir: Moliya balansi noto'g'ri bo'lishi
Sprint: Sprint 7 (FIN) da to'liq hal
Xavf: R-02 bog'liq
```

### T-04: 339 DRIFT-NULL (NULL default yo'q)
```
Kategoriya: DATA
Tavsif: 104 ta DB default tiklangan (DRIFT-NN sprint, 159a411a).
        Hali 339 ta ustunda NULL default bo'lishi mumkin.
        Bu Drizzle ↔ DB nomuvofiqlik = runtime xato
Ta'sir: Yangi qator qo'shganda NULL bo'lmasligi kerak joyda NULL
Sprint: Sprint bo'yicha, har modul migratsiyasida tekshir
Tekshiruv: docs/default-loss-audit-2026-06-01.md
```

### T-05: 7 ta ghost endpoint (FE → BE yo'q)
```
Kategoriya: CODE
Tavsif: FE 7 ta apiRequest call → BE endpoint yo'q → 404
        /api/cameras/*, /api/crm/ai/extended/*
Ta'sir: Bu sahifalar ishlamaydi (foydalanuvchi xato ko'radi)
Sprint: Sprint 8 (CRM), Sprint 9 (IoT)
Tekshiruv: node scripts/check-fe-api-urls.mjs → 0 bo'lishi kerak
```

### T-06: FE ~2675 hardcoded matn (i18n)
```
Kategoriya: CODE
Tavsif: i18n sprint (2026-05-21) 18% kamaytirdi (3262→2675).
        Hali ~2675 ta hardcoded UZ/RU matn TSX da.
Ta'sir: Til almashtirish ishlamaydi (matn o'zgarishsiz)
Sprint: Har sprint, tegishli modul FE sahifalari uchun
```

### T-07: Manager nullability (CRM bug)
```
Kategoriya: CODE
Tavsif: CommunicationCenter MANAGER_OF_SENDER → manager_id 0/30 = NULL
        CC xato throw qiladi (manager_id null bo'lsa)
Ta'sir: CC moduli ishlamaydi (manager_id to'ldirilmagan)
Sprint: Sprint 8 (CRM) yoki backfill migration
Tekshiruv: SELECT COUNT(*) FROM users WHERE manager_id IS NULL;
```

### T-08: V1 da ~130 parazit endpoint
```
Kategoriya: CODE
Tavsif: return {ok:true} ~50, bo'sh array ~30, no-op listener 13,
        hardcoded raqam ~20, phantom controller 3, ghost endpoint 7.
Ta'sir: Tizim "ishlaydi" ko'rinadi lekin haqiqiy ish qilmaydi
Sprint: Har modul V2 ko'chirishda to'liq hal
Tekshiruv: PARAZIT_KOD_QOIDALARI.md §7
```

---

## P2 — NORMAL (1-3 Sprint Ichida)

### T-09: FE 462 topilma (40 HIGH)
```
Kategoriya: CODE
Tavsif: FE audit 2026-05-30 → 462 topilma (40 HIGH sifat muammo)
        EP komponent ishlatilmagan, old-school className, inline style
Ta'sir: UI mos kelmasligi, maintain qilish qiyin
Sprint: Har modul FE ko'chirishda tuzatish
Manba: Uzbek-Language-Module/artifacts/erp-dashboard/_fe_audit/
```

### T-10: BE testlar ~25% suite fail
```
Kategoriya: TEST
Tavsif: 2026-05-23 audit: BE ~25% test suite fail
        uuid ESM import xato, Result<T> mock muammo
Ta'sir: CI ishonchli emas, regress aniqlash qiyin
Sprint: Sprint 1 (TEST_STANDARTLARI.md bo'yicha yangi test yozish)
Tekshiruv: pnpm --filter @europrint/api run test
```

### T-11: R16/R17 qoidalar buzilishi (169/165 joy)
```
Kategoriya: CODE
Tavsif: ARCHITECTURE_RULES.md R16=169 joy, R17=165 joy buzilgan
        (2026-05-18 audit). Ehtimol qisman tuzatilgan.
Ta'sir: Arxitektura buzilishi katta kod bazasida
Sprint: Sprint bo'yicha, ko'chirish paytida tuzatish
```

### T-12: Drizzle schema ↔ DB 281 ta drift
```
Kategoriya: DATA
Tavsif: 295 dup pgTable, 281 live drift (2026-05-21 audit)
        Drizzle schema'da ustun bor → DB da yo'q (yoki aksincha)
Ta'sir: Runtime xato (ustun topilmaydi) — latent bug
Sprint: Har migration bilan asta-sekin to'ldirish
Manba: docs/master-duplicates-2026-05-22.md
```

### T-13: Redis cache yo'q
```
Kategoriya: INFRA
Tavsif: Redis docker-compose da bor, lekin app ishlatmaydi.
        Tez-tez o'qiladigan ma'lumotlar (material_cards, org_functions)
        har so'rovda DB ga boradi.
Ta'sir: Yuqori yuklamada DB bottleneck
Sprint: Sprint 6-7 (WMS/FIN katta jadval)
```

### T-14: OTP rate limit yo'q
```
Kategoriya: SEC
Tavsif: Login OTP uchun throttle bor, LEKIN
        OTP hali to'liq implementatsiya qilinmagan
Ta'sir: Brute-force attack mumkin
Sprint: Sprint 1 (Auth)
Xavf: R-20 (E:2 T:3 M:6)
```

---

## P3 — KEYINROQ

### T-15: pnpm audit 0 ga keltirish
```
Kategoriya: INFRA
Tavsif: pnpm audit → high/critical vulnerabilities bo'lishi mumkin
Ta'sir: Known CVE (exploit toollar ishlatadi)
Sprint: Har 3 oyda audit sprint
Tekshiruv: pnpm audit --audit-level=high
```

### T-16: Bundle analiz va code splitting
```
Kategoriya: PERF
Tavsif: FE bundle hajmi o'lchanmagan. Ehtimol > 2MB
Ta'sir: Birinchi yuklash sekin (zavod Internet tez emas)
Sprint: Sprint 10 (stabilizatsiya)
Tekshiruv: pnpm --filter erp-dashboard build -- --analyze
```

### T-17: Logging disk to'lishi
```
Kategoriya: INFRA
Tavsif: Winston rotation yo'q → log fayl cheksiz o'sadi
Ta'sir: Disk to'lishi → app crash
Sprint: Sprint 9 (DevOps)
Xavf: R-22
```

### T-18: JWT secret 3 oyda rotation qilinmagan
```
Kategoriya: SEC
Tavsif: Joriy JWT_SECRET o'rnatilganidan beri o'zgartirilmagan
Ta'sir: Secret buzilsa barcha session xavf ostida
Sprint: Har 3 oyda owner tomonidan
Tekshiruv: .env yozilgan sana
```

---

## TEXNIK QARZ JADVALI (Xulosa)

| # | Tavsif | Kat | Prior | Sprint |
|---|--------|-----|-------|--------|
| T-01 | Ikki-dunyo parallel jadvallar | ARCH | P0 | S1-S2 |
| T-02 | Outbox relay ishlamasligi | ARCH | P0 | S1+ |
| T-03 | GL posting qisman | ARCH | P1 | S7 |
| T-04 | 339 DRIFT-NULL | DATA | P1 | S1+ |
| T-05 | 7 ghost endpoint | CODE | P1 | S8-9 |
| T-06 | 2675 hardcoded matn | CODE | P1 | S1+ |
| T-07 | manager_id NULL | CODE | P1 | S8 |
| T-08 | ~130 parazit | CODE | P1 | S1+ |
| T-09 | FE 462 topilma | CODE | P2 | S1+ |
| T-10 | BE 25% test fail | TEST | P2 | S1 |
| T-11 | R16/R17 169/165 | CODE | P2 | S1+ |
| T-12 | 281 Drizzle drift | DATA | P2 | S1+ |
| T-13 | Redis cache yo'q | INFRA | P2 | S6 |
| T-14 | OTP rate limit | SEC | P2 | S1 |
| T-15 | pnpm audit | INFRA | P3 | Q |
| T-16 | Bundle hajm | PERF | P3 | S10 |
| T-17 | Log rotation | INFRA | P3 | S9 |
| T-18 | JWT rotation | SEC | P3 | 3 oyda |

---

## TO'LASH TARTIXI

| Sprint | T# | Holat | Commit |
|--------|-----|-------|--------|
| S0 | GL atomic | ✅ | 6cae643e |
| S0 | PIP/eNPS guard | ✅ | a2dae99d |
| S0 | IPv6 health | ✅ | 1cb4631c |
| S0 | 104 DB default | ✅ | 159a411a |

---

*EuroPrint ERP · Texnik Qarz Reestri · Versiya: 2026-06-18 · Keyingi yangilash: Sprint 1 oxiri*
