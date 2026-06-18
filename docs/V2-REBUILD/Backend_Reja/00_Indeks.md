# EUROPRINT ERP — BACKEND BATAFSIL REJASI (Indeks)

> Ichki fundament + datalar almashuvi + barcha texnik ichki ishlar. Bosqichma-bosqich, to'liq, batafsil.
> Stack: **NestJS 11 + Fastify (DDD) · Drizzle ORM · PostgreSQL 16 · Result<T> · Redis + BullMQ · EventEmitter2 · Docker.**
> Standart: [LOYIHA_QOIDALARI.md](../../../LOYIHA_QOIDALARI.md) + [DIZAYN_QOIDALARI.md](../../../DIZAYN_QOIDALARI.md).
> Vizyon: [docs/audit/MASTER-SAVOL-JAVOB-2026-06-08.md](../../audit/MASTER-SAVOL-JAVOB-2026-06-08.md).
> EuroPrint profili: Poligrafiya korxonasi · B2B savdo · Gofra/Offset/Silkscreen · AI-native.
> Versiya: 2026-06-18 · Manbalar: eski EuroPrint kodi + Textil ERP pattern.

---

## Bosqichlar ro'yxati (qurish tartibi)

| № | Hujjat | Mavzu | Holat | Bog'liqlik |
|---|--------|-------|-------|-----------|
| 00 | `00_Indeks.md` | Shu indeks | ✅ | — |
| 01 | `01_Poydevor.md` | Monorepo, auth, RBAC, org, audit, i18n, CI | 🔲 | — |
| 02 | `02_Malumotlar_bazasi.md` | DB strategiya, nomlash, kanonik jadvallar, dedup | 🔲 | 01 |
| 03 | `03_Datalar_almashuvi.md` | Event-driven, outbox, BullMQ, API kontrakt | 🔲 | 01 |
| 04 | `04_Bosqich1_ORG_HR.md` | Org tuzilma (karta-markaz) + HR (xodim, razryad, LMS) | 🔲 | 01-02 |
| 05 | `05_Bosqich2_SD.md` | Savdo (buyurtma, mijoz, narxlash, faktura) | 🔲 | 01-02-04 |
| 06 | `06_Bosqich3_PP.md` | Ishlab chiqarish rejasi (tech-karta, CRP, MRP, AI 7-qadam) | 🔲 | 05 |
| 07 | `07_Bosqich4_MES.md` | Ishlab chiqarish bajarilishi (sex terminali, smena, brak) | 🔲 | 06 |
| 08 | `08_Bosqich5_QC.md` | Sifat nazorati (reklama, TBD chek-list, AI kamera) | 🔲 | 07 |
| 09 | `09_Bosqich6_WMS.md` | Ombor (kirim/chiqim, zaxira, POS, QR/barcode) | 🔲 | 04-07 |
| 10 | `10_Bosqich7_FIN.md` | Moliya (GL, AR/AP, kassa, oylik, e-faktura) | 🔲 | 05-09 |
| 11 | `11_Bosqich8_CRM.md` | CRM (lead, deal, mijoz, marketing) | 🔲 | 05 |
| 12 | `12_Bosqich9_AI_IOT.md` | AI (planner, kamera, prognoz) + IoT (OEE, sensor) | 🔲 | 07-08 |
| 13 | `13_Bosqich10_DIR.md` | Direktor (dashboard, analytics, andon, BI) | 🔲 | 07-10-12 |
| 14 | `14_Test_strategiyasi.md` | Unit/integ/e2e, CI gate, coverage | 🔲 | — |
| 15 | `15_DevOps_Infra.md` | Docker, CI/CD, migratsiya, monitoring, backup | 🔲 | — |
| 16 | `16_Xavfsizlik.md` | Auth, RBAC/ABAC, RLS, injection, maxfiylik | 🔲 | 01 |
| 17 | `17_Yol_xaritasi.md` | Sprint reja, bog'liqlik, person-week | 🔲 | — |
| 18 | `18_Code_Review.md` | To'liq audit: qoidalar + eski kod qayta tekshiruvi | 🔲 | — |

> Holat: ✅ Tayyor · 🔧 Qisman · 🔲 Yozilmagan

---

## Umumiy texnik konvensiyalar (hamma qismga taalluqli)

**Nomlash (DB-1..3):**
- snake_case, **ko'plik**, modul prefiksi (§3 [LOYIHA_QOIDALARI.md](../../../LOYIHA_QOIDALARI.md))
- FK = `<jadval>_id`; biznes kalit = `code` UNIQUE; sana = `*_at` timestamptz; pul = NUMERIC(18,2)
- Cheklov **to'liq nom**: `pk_/fk_/uq_/ck_/ix_<jadval>_...`

**Majburiy ustunlar:** baza `id, created_at, updated_at, deleted_at`; aggregate-root + `created_by, updated_by, version`.

**ORM:** faqat Drizzle; `lib/db/src/schema/` kanonik; `apps/api/src/shared/db/schema.ts` re-export.

**Xato:** service/repo → `Result<T>` (Ok/Err); `throw` faqat istisno (tx rollback/queue).

**API:** `GET/POST/PUT/DELETE /api/[module]/[resource]`; JSON; JWT httpOnly cookie; xato `{error:{code,message}}`.

**Tranzaksiya:** bog'liq yozuvlar bitta `db.transaction()` (ACID).

**Event:** outbox pattern (domain_events jadval + polling processor); zero-listener event = XAVF.

---

## Modul bog'liqligi (sikl yo'q, pastdan yuqoriga)

```
auth/IAM
    ↓
  org (karta-markaz, razryad)
    ↓
  hr (xodim, smena, oylik)     material_cards (master)
    ↓                                ↓
  sd (buyurtma, mijoz)  ←→  wms (kirim, zaxira)
    ↓                                ↓
  pp (reja, tech-karta)        qc (sifat)
    ↓
  mes (ijro, sex terminali)
    ↓
  fin (GL, kassa, e-faktura)
    ↓
  crm  |  ai_iot  |  dir (analytics)
```

---

## Eski koddan ko'chiriladigan qismlar

| Modul | Ko'chiriladigan (ishlaydi) | Yangi yozish kerak |
|-------|--------------------------|-------------------|
| Auth | JWT, argon2, RBAC guard zanjiri | — |
| Org | `org_functions` CRUD, razryad, karta | AI moslik baho |
| HR | `hr_employees`, smena, leave, payroll hisob | Razryad-oylik avtomatlash |
| SD | `sales_orders` CRUD + `sd_customers` VIEW | AI narxlash, CRM integration |
| PP | CQRS, BOM, work_orders, CRP, MPS | Tech-karta master (technology_cards), AI 7-qadam |
| MES | Smena, handover, job_card | AI anomaliya, real IoT |
| QC | `qc_checks`, reklama | AI kamera QC hook |
| WMS | `warehouse_stock`, ledger, POS | Lot/partiya kuzatuv |
| FIN | GL `entries`, kassa, payroll-compute | e-faktura (e-IMZO) |
| CRM | `crm_leads`, `crm_deals` | AI lead scoring |
| Director | KPI dashboard | Andon WebSocket |

---

## Texnik qarzlar (eski EuroPrint, ko'chira borib hal qilinadi)

| # | Muammo | Qaror |
|---|--------|-------|
| T1 | `sales_orders` vs `orders` (ikki-dunyo) | `sales_orders` kanonik; `orders`=VIEW/o'chir |
| T2 | `warehouse_stock` vs `stocks` (ikki stok jadval) | `warehouse_stock` kanonik; `current_stock`=VIEW |
| T3 | GL `entries` vs `gl_journal_entries` | `entries` kanonik; gl_* = SAP#76, tegma |
| T4 | `tech_cards` vs `technology_cards` | `technology_cards` kanonik master; `tech_cards`=order-bound |
| T5 | `manager_id` NULL (30+ xodim) | Org backfill → vertikal zanjir |
| T6 | 13+ zero-listener event | Har event → bitta listener |
| T7 | MES→QC stub | Haqiqiy QC check CREATE |
| T8 | POS→GL log (ledger emas) | GL posting real `entries` INSERT |

---

*Hujjat oxiri · [Backend_Reja/](.) papkasiga kirish · Bosqich 01 bilan boshlang*
