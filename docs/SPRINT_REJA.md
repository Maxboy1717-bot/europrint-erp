# EUROPRINT ERP — SPRINT REJASI (V2 Build)

> **Modullarni qaysi tartibda quramiz. Har sprint 1-2 hafta.**
> Tartib: bog'liqlik zanjiri bo'yicha (pastdan yuqoriga).
> Sprint 0 = poydevor; Sprint 1+ = modullar.
> Holat: 🔲 Boshlanmagan · 🔧 Davom etmoqda · ✅ Tugallangan

---

## SPRINT 0 — POYDEVOR (BAJARILDI ✅)

**Maqsad:** Loyihani boshlash uchun barcha hujjatlar tayyor.

| Artefakt | Holat |
|----------|-------|
| `LOYIHA_QOIDALARI.md` + `DIZAYN_QOIDALARI.md` | ✅ |
| `STANDARTLAR.md` §15 (72 tarixiy xato) | ✅ |
| `Backend_Reja/` 18/18 faz | ✅ |
| `EuroPrint_Master_Prompt.md` | ✅ |
| `docs/adr/` ADR-001..006 | ✅ |
| `FE_STANDARTLAR.md` | ✅ |
| `BOSHLASH.md` | ✅ |
| `docs/LUGAT.md` + `docs/GIT_QOIDALARI.md` | ✅ |
| `docs/EVENT_KATALOGI.md` + `docs/API_SHARTNOMA.md` | ✅ |
| `docs/XATO_KODLARI.md` + `docs/SPRINT_REJA.md` | ✅ |
| `docs/migration/seed/` 5 SQL fayl | ✅ |
| `.env.example` + `.husky/` + `scripts/` | ✅ |

---

## SPRINT 1 — AUTH + ORG + HR POYDEVORI (1 hafta)

**Maqsad:** Xodimlar tizimga kirib, org tuzilma va razryad ishlashi.

### BE Vazifalar:
- [ ] Auth: login/refresh/logout (JWT HS256 pin, alg: ['HS256'])
- [ ] RBAC: 14 rol to'g'ri ishlashi (`@Roles()` guard)
- [ ] Org: `org_functions` CRUD (kanonik karta — 29 FK hub)
- [ ] Org: `razryad_levels` seed + koeffitsient hisoblash
- [ ] HR: `hr_employees` CRUD + org_function_id majburiy
- [ ] HR: `hr_employees.base_salary` × razryad koeffitsient = faktik maosh

### FE Vazifalar:
- [ ] Login sahifasi (JWT, redirect)
- [ ] Org tuzilma daraxti (Vysotskiy 7: L0-L5)
- [ ] Xodimlar ro'yxati (pagination, search, filter bo'lim bo'yicha)
- [ ] Xodim yaratish dialogi (org_function_id majburiy)

### Tekshiruv Mezoni:
```bash
curl -X POST /api/auth/login -d '{"email":"...","password":"..."}'
# → accessToken qaytadi
curl /api/org/functions -H "Authorization: Bearer TOKEN"
# → 29+ function ro'yxati
curl /api/hr/employees -H "Authorization: Bearer TOKEN"
# → data + meta pagination
```

---

## SPRINT 2 — MATERIAL MASTER + SD (SAVDO) (1 hafta)

**Maqsad:** Mijozlar kiritilsin, buyurtma yaratish ishlashi.

**Bog'liqlik:** Sprint 1 tugallangan bo'lishi kerak.

### BE Vazifalar:
- [ ] `material_cards` CRUD (modul prefiks: mm_)
- [ ] `sd_customers` CRUD (VIEW emas, real jadval)
- [ ] `sales_orders` CREATE + LIST + GET (kanonik — orders emas!)
- [ ] `sales_order_items` CREATE (material_cards.id bog'liq)
- [ ] Buyurtma holati FSM: `DRAFT → CONFIRMED → IN_PRODUCTION → COMPLETED`
- [ ] `sales_order.created` event emit (EventEmitter2)

### FE Vazifalar:
- [ ] Mijozlar sahifasi (CRUD)
- [ ] Materiallar katalogi (search, filter yo'nalish bo'yicha)
- [ ] Buyurtma yaratish sahifasi (mijoz + material qo'shish)
- [ ] Buyurtmalar ro'yxati (holat bo'yicha filter)

### Tekshiruv Mezoni:
```
1. Mijoz yaratish → DB da ko'rinadi
2. Buyurtma yaratish → sales_orders + sales_order_items INSERT
3. Tasdiqlash → holat CONFIRMED, event emitlangan
```

---

## SPRINT 3 — PP (ISHLAB CHIQARISH REJASI) (1.5 hafta)

**Maqsad:** Buyurtmadan ish buyurtmasi (work_order) yaratish ishlashi.

**Bog'liqlik:** Sprint 2 tugallangan bo'lishi kerak.

### BE Vazifalar:
- [ ] `technology_cards` CRUD (MASTER spec — tech_cards emas!)
- [ ] `technology_card_items` (BOM — material talablari)
- [ ] `work_orders` CREATE on `sales_order.confirmed` event
- [ ] `work_centers` CRUD + quvvat hisoblash
- [ ] CRP (Capacity Requirements Planning): og'irlashtirilgan hisob
- [ ] MPS (Master Production Schedule): material zaxira tekshiruvi
- [ ] `work_order.created` event emit

### FE Vazifalar:
- [ ] Texnologik kartalar ro'yxati va yaratish
- [ ] Ish buyurtmalari (Gantt yoki jadval ko'rinish)
- [ ] Quvvat rejalashtirish jadvali

### Texnik Qarz Hal:
- [ ] T4: `technology_cards` → MASTER; `tech_cards` → order-bound snapshot

---

## SPRINT 4 — MES (ISHLAB CHIQARISH IJROSI) (1.5 hafta)

**Maqsad:** Operator smenada ish buyurtmasini ijro qilishi.

**Bog'liqlik:** Sprint 3 tugallangan bo'lishi kerak.

### BE Vazifalar:
- [ ] `shift_schedules` CRUD + smena holati FSM
- [ ] `production_sessions` CREATE/START/COMPLETE
- [ ] `shift_handovers` CREATE (KANONIK — mes_shift_handovers VIEW dan farq)
- [ ] OEE hisoblash (availability × performance × quality)
- [ ] Operator tablet API (`/api/mes/tablet/*`)
- [ ] `production_session.completed` event → QC trigger

### FE Vazifalar:
- [ ] Operator tablet interfeysi (minimalist, touch-friendly)
- [ ] Smena boshqaruvi
- [ ] OEE dashboard (real-time)

---

## SPRINT 5 — QC (SIFAT NAZORATI) (1 hafta)

**Maqsad:** Ishlab chiqarilgan mahsulot tekshirilishi va natija qayd etilishi.

**Bog'liqlik:** Sprint 4 tugallangan bo'lishi kerak.

### BE Vazifalar:
- [ ] `quality_checks` CREATE on `work_order.completed` event (T7 texnik qarz)
- [ ] QC natija: PASS/FAIL + nuqson katalogi
- [ ] `qc.inspection_passed` event → WMS trigger
- [ ] `qc.inspection_failed` event → MES rework trigger
- [ ] AI kamera endpoint (append-only defect log)

### FE Vazifalar:
- [ ] QC inspektor interfeysi (yaroqli/brak kiritish)
- [ ] Defekt katalogi (gofra/offset/silkscreen/flexi)
- [ ] QC hisobotlar (defect rate trend)

---

## SPRINT 6 — WMS (OMBOR) (1 hafta)

**Maqsad:** Tayyor mahsulot omborga tushishi, kirim/chiqim.

**Bog'liqlik:** Sprint 5 tugallangan bo'lishi kerak.

### BE Vazifalar:
- [ ] `warehouse_stock` UPSERT on `qc.inspection_passed` event
- [ ] `warehouse_transactions` LOG
- [ ] POS sync: `TYPE_MAP` bilan (hardcoded 'kirim' emas — FIX2)
- [ ] Lot/partiya kuzatuv
- [ ] Min stock ogohlantirish (NtfNotificationService)

### FE Vazifalar:
- [ ] POS Monitor: zavod ombori (kirim/chiqim) tablet
- [ ] Ombor holati (warehouse_stock balance)
- [ ] Harakatlar tarixi (warehouse_transactions)

### Texnik Qarz Hal:
- [ ] T2: `warehouse_stock` → KANONIK; `current_stock` = VIEW (INSERT TAQIQ)

---

## SPRINT 7 — FIN (MOLIYA) (2 hafta)

**Maqsad:** GL entries real yozilishi, maosh GL posting.

**Bog'liqlik:** Sprint 6 tugallangan bo'lishi kerak.

### BE Vazifalar:
- [ ] GL `entries` POST on biznes voqealar (BHMS kodlar bilan)
- [ ] `db.transaction()` MAJBURIY (debet = kredit tekshiruv)
- [ ] Kassa (naqd/bank) kirim/chiqim
- [ ] Byudjet vs faktik taqqoslash
- [ ] Maosh GL posting on `payroll.period_closed` event
- [ ] ⚠️ `gl_journal_entries` TEGMA — SAP#76, ADR-003

### FE Vazifalar:
- [ ] GL jurnal ko'rish sahifasi
- [ ] Kassa operatsiyalar sahifasi
- [ ] Byudjet hisoboti (plan vs fakt)

---

## SPRINT 8 — CRM (1 hafta)

**Maqsad:** Leaddan buyurtmagacha to'liq zanjir.

### BE Vazifalar:
- [ ] `crm_leads` CRUD + pipeline bosqichlari
- [ ] `crm_deals` CREATE (assigned_by_id NOT NULL — fallback zanjir)
- [ ] `deal.won` event → SD `sales_order` avtomatik CREATE
- [ ] AI lead scoring (0-100, HOT/WARM/COLD)

---

## SPRINT 9 — AI + IoT + DIREKTOR (1.5 hafta)

**Maqsad:** Real-time monitoring va AI yordamchi.

### BE Vazifalar:
- [ ] IoT anomaliya handler REAL (T8 — no-op stub emas)
- [ ] AI 7-qadam ishlab chiqarish planner
- [ ] Direktor dashboard: 12 KPI (real `entries` + `work_orders` + `warehouse_stock`)
- [ ] Andon WebSocket gateway (5-sekunda interval)

---

## SPRINT 10 — TEST VA STABILIZATSIYA (1 hafta)

**Maqsad:** Oltin zanjir to'liq ishlashi, coverage ≥70%.

- [ ] Integration test suites (real DB, factory pattern)
- [ ] Golden thread E2E test
- [ ] Coverage ≥70% statements, ≥60% branches
- [ ] Pre-commit hooks barcha tekshiruvlar PASS
- [ ] Security audit (§16 Xavfsizlik checklist)

---

## Sprint Dependensiya Xaritasi

```
Sprint 0 (Poydevor)
    ↓
Sprint 1 (Auth/Org/HR)
    ↓
Sprint 2 (Material/SD)
    ↓
Sprint 3 (PP)
    ↓
Sprint 4 (MES)
    ↓
Sprint 5 (QC)
    ↓
Sprint 6 (WMS)
    ↓
Sprint 7 (FIN) ←── parallel: Sprint 8 (CRM, Sprint 2 dan keyin)
    ↓
Sprint 9 (AI/IoT/DIR)
    ↓
Sprint 10 (Test)
```

---

## Muvaffaqiyat Mezonlari (Demo uchun)

Sprint 5 tugagandan keyin demo mumkin:
```
1. SD: Mijoz kiritish + buyurtma yaratish
2. PP: Texkarta → ish buyurtmasi + CRP
3. MES: Operator tablet → sessiya boshlash/tugatish
4. QC: Tekshiruv → PASS/FAIL + nuqson
5. WMS: Omborga qabul qilish
```

Sprint 7 tugagandan keyin to'liq demo:
```
1-5 yuqorida + GL posting + maosh
```

---

*EuroPrint ERP · Sprint Rejasi · Versiya: 2026-06-18*
