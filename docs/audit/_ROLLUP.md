# EuroPrint ERP — 180-PUNKT SAP-AUDIT · YAKUNIY ROLL-UP

> Sana: 2026-06-06 · Rol: 🔵 BIRLASHTIRUVCHI (QAT'IY READ-ONLY) · Metod: VERIFY-DON'T-TRUST
> Manba: 60 agent × 12 paket-fayl (`docs/audit/parts/001..166.md`) + mustaqil jonli kod/DB qayta-tekshiruv (`_audit/q.cjs`).
> Jonli DB = `europrint` (qurilish bosqichi — operatsion jadvallar deyarli bo'sh; "0 qator" = oqim jonli hech qachon ishlamagan = dalil).
>
> **Birlashtiruvchi izohi:** men 10+ asosiy hukmni kod va DB bilan mustaqil qayta-tekshirdim — **hammasi tasdiqlandi**.
> Faqat bitta nuans qo'shildi (pastda): CC `MANAGER_OF_SENDER` — org-daraxt fallback'i BOR (lekin `head_user_id` 124/142 NULL bo'lgani uchun deyarli har doim baribir tushadi).

---

## 1. JAMI HISOB (12 paket bo'yicha yig'indi)

| Kategoriya | Soni | Izoh |
|---|---:|---|
| ✅ REAL (haqiqiy INSERT/UPDATE/SELECT) | **479** | Kod yo'li haqiqatda ishlaydi |
| 🔴 501-STUB (ataylab NOT_IMPLEMENTED) | **57** | Halol "tayyor emas" |
| 🟡 GREEN-LIE (200 qaytaradi, yozmaydi) | **60** | Eng xavfli — "yashil yolg'on" |
| ♊ DUPLICATE (parallel jadval/route/olam) | **56** | Ikki-olam sindromi |
| 👻 ORPHAN (o'lik — yozuvchi/chaqiruvchi yo'q) | **55** | Qurilgan-u ulanmagan |
| 🎭 FAKE-DATA (hardcoded son/matn) | **40** | Math.random, 0.92/0.85/0.97 va h.k. |

> Eslatma: bir feature bir nechta belgini olishi mumkin (masalan GREEN-LIE + DUPLICATE), shuning uchun summa qattiq "jami feature" emas — bu **belgi-sanog'i** (signal count).

---

## 2. SAP-DARAJA — BUTUN TIZIM

| O'lcham | SAP % | Dalil (jonli) |
|---|---:|---|
| Backend ichki qurilish (DDD/CQRS/Result/4 global guard) | **~85%** | Professional, xavfsiz — **nodir** |
| Ekranlar (har modul alohida) | ~57% | 132+ FE sahifa, ko'rinishda tayyor |
| **Modullararo integratsiya** | **~15%** | 10 backbone bog'lanishdan ~1 ishlaydi |
| Operatsion data | ~0-2% | Deyarli hamma jadval 0 qator |
| **Egasi vizyoni (aqlli zavod ERP)** | **~25-30%** | "Tana bor, asab/qon ulanmagan" |

**Umumiy hukm: tizim SAP funksionalligining ~25-30% darajasida.** Poydevor B (🟢), ishlaydigan ERP D+ (🔴). **Production-ready EMAS.**

### Modul-modul SAP-daraja (60 punkt yig'masi)

| ✅ SAP-darajaga yaqin | 🟡 Yarim | 🔴 Yo'q / juda past |
|---|---|---|
| QC SPC/control-charts (Shewhart/Cp/Cpk) | CRM core / SD orders / SD customers | CRM-AI-extended (fake+green-lie) |
| WMS warehouses (eng sog'lom) | Marketing core/PR/exhibitions | Design AI (Math.random) |
| POS movements (atomik FEFO/balance-guard) | Design core | WMS inventory-materials (jadval YO'Q) |
| POS printer-config | PP routing / Technology cards | WMS material-kits (jadval YO'Q) |
| IoT-tablet sessions (vizyon#10) | MES sessions/OEE | Finance GL 3-olam |
| Director approvals / KPI | POS GL log/dead-letter | Tax (orphan+hardcoded+zid) |
| Admin/SaaS | Finance payments/budgets | Payroll GL posting (debit==credit bug) |
| Kanban boards/cards/reports | HR employees/vacancies/360 | Golden thread (1-bo'g'in uzilgan) |
| Chat core | Org-history / MM dashboard | Modullararo integratsiya |
| Org-structure core (142 dept) | Croston/TSB, layer-formula (ORPHAN gavhar) | Sex-tur (flekso/gofra/tigel) |
| Material-balance | Coordination/CC backend | kg↔list / kashirovka formula |
| TanStack Query / shared-lib / i18n yadrosi | Reports / Loans | SMM-AI / lead-gen |
| ErrorBoundary+Sentry / RU tarjima | Director dashboard | a11y (aria 4.3%) |
| Governance (CLAUDE.md+22 reviewer) | Format/i18n sidebar | Test qoplami (vizyon modul) |

---

## 3. TARJIMA QAMROVI

| Til | Holat | Izoh |
|---|---|---|
| **uz-lat (asos)** | ✅ ~100% baza | ~38 inglizcha auto-gen leak (`fullName='Full name'`, `dueDate='Due date'`) |
| **uz-cyr** | 🟡 drift | 1211 EXTRA kalit + 95 yetishmagan (key-parity majburlanmagan) |
| **ru** | ✅ eng yaxshi | 0 extra, 15 missing (orphan ns) |

- 81% TSX da `t()` ishlatilgan, lekin **jonli ERP sidebar (`ModuleSidebar`) 410 sarlavha QATTIQ o'zbekcha** (`titleKey:`=0) → til almashtirilganda menyu o'zgarmaydi (GREEN-LIE).
- `format.ts` locale qotgan: `formatDate/Currency/Number` har doim `uz-UZ` (RU/krill ham UZ-format ko'radi).
- i18n yadrosi (3 til/56 ns/static loader/3-fallback) SAP-darajasi; sidebar + format qatlami buzuq.

## TEST QAMROVI

| O'lcham | Holat |
|---|---|
| BE coverage | 🔴 ~25% (threshold 25%, codecov yiqitmaydi) |
| FE coverage | 🔴 ~10-15% (vitest "intentionally low baseline 5%") |
| Domen-math (Money/GL/sigma/EOQ/Johnson) | ✅ REAL — eng kuchli test qatlami |
| Golden-thread E2E | 🔴 mock-unit, real uchma-uch YO'Q |
| Real DB integ (supertest/testcontainer) | 🔴 YO'Q (testcontainer o'lik, supertest=0) |
| Sayoz testlar | 149 stub + 262 smoke + 42 tavtologik ≈ **453 fayl biznes-mantiq tasdiqlamaydi** |
| Playwright E2E | 🔴 34 spec `expect([200,401,403,404])` (404 ham yashil) + 21 `expect(true).toBe(true)`; CI'da 1 mock-test |
| Stryker mutation | config bor, **CI'da hech qachon ishlamaydi** |
| Kritik pul/stok yo'li | 🔴 himoyasiz (jonli `entries`=0, 2-stok-jadval testsiz) |

---

## 4. 22 VIZYON SAP-DARAJASI

| Holat | Soni | Vizyonlar |
|---|---:|---|
| ✅ qurilgan / kuchli | **~3** | V1 POS/Ombor (atomik stok), V19 org-tree+RBAC, V10 material-rezerv/fan-out (qisman) |
| 🟡 yarim | **~7** | V14 menejer-panel, V15 web-lead, V16 marketing-spend, V11 payroll-hisob, V13 CC backend, V20 Portret konstruktor, V5 routing-o'qish |
| 🔴 yo'q / stub / fake | **~12** | V2 kassir-hub, V3 karantin-QC, V4 sex-tur, V7 kg↔list formula, V8 kashirovka, V9 tigel, V12 oshxona, V17 SMM-AI, V18 lead-gen, V21 golden-thread, V22 integratsiya, V6 MES-oqim |

**Yig'ma:** 22 vizyondan faqat ~3 tasi ishonchli ishlaydi, ~7 yarim, ~12 deyarli yo'q. **Egasining "aqlli zavod miyasi" yadrolari (kg↔list, gofra, kashirovka, sex-tur) umuman qurilmagan** — faqat bugungi `LAYER-FORMULA-REJA-2026-06-06` reja.

---

## 5. ⭐ TOP-15 MUAMMO (5-tomonlama tasdiqlangan, ustuvorlik bilan)

| # | Muammo | Verdikt | Dalil (jonli tasdiqlangan) |
|---|---|---|---|
| **1** | **SD order → Production UZILGAN** (golden thread 1-bo'g'in) | 🔴 P0 | `orders` jadval DROP (to_regclass=NULL); `pp.module.ts` da `OrderCreatedEvent` listener YO'Q → MES/QC/Ombor/Yetkazish jonli hech qachon ishlamaydi |
| **2** | **GL avto-posting yo'q** (pul orol) | 🔴 P0 | Faqat `record-payment.handler.ts:91`→`entries` (qo'lda); MM/invoice/avans/POS/payroll UZUQ; `entries`=0, `gl_entries`=0 |
| **3** | **`employees.manager_id` 30/30 NULL** | 🔴 P0 | Jonli SELECT: 30/30 NULL; CC `MANAGER_OF_SENDER` org-walk fallback'i BOR lekin `head_user_id` 124/142 NULL → baribir tushadi |
| **4** | **Kassir = retail POS** (noto'g'ri konsept) | 🟡 GREEN-LIE | `cash-register.repository.ts:30` retail savat yozadi; `cash_sessions`=0, `retail_pos_transactions`=0 — naqd-hub yo'q |
| **5** | **Ikki-olam: 2 order / 7 GL / 2 stock** | ♊ DUP | `sales_orders`=BASE ╳ `sd_sales_orders`=VIEW; `entries`+`gl_entries`+5 pos/stock GL; `warehouse_stock`(25) ╳ `stocks`(0) |
| **6** | **QC → Ombor noto'g'ri jadval** | 🟡 GREEN-LIE | `drizzle-wms.repo.ts:51` `insert(stocks)` — `stocks`=0 ≠ kanonik `warehouse_stock`=25 → tayyor mahsulot ko'rinmaydi |
| **7** | **MES → QC no-op stub** | 👻 UZUQ | `mes-completed.listener.ts` no-op; `qc_inspections`=0 — partiya tekshirilmaydi |
| **8** | **O'lik jadvalga yozuv/o'qish** (yashirin drift) | 🟡 GREEN-LIE | `mm_materials`/`wms_stock`/`wms_stock_levels`/`mm_material_kits`/`tax_rate_config`/`sd_leads` = to_regclass NULL, lekin kod o'qiydi → try/catch yutadi → 200 bo'sh |
| **9** | **OEE FAKE 0.92/0.85/0.97** | 🎭 FAKE | `production-agent.service.ts:34` hardcoded (halol TODO izoh, lekin Director dashboardga soxta raqam) |
| **10** | **Routing-create + handover stub** | 🔴 501 | `pp-routing.controller.ts:77` 501; `work_centers`=0; tablet/handover 501 — sex-marshrut yaratilmaydi |
| **11** | **kg↔list / gofra / kashirovka formula YO'Q** | 🔴 YO'Q | `LAYER-FORMULA-REJA-2026-06-06` faqat reja; konvertatsiya servisi hech qaerda yo'q — "ishlab chiqarish miyasi" yo'q |
| **12** | **SMM-AI + lead-gen stub/yo'q** | 🔴 501/YO'Q | `content/ai-generate`, `ai-assistant`, `inbox/ai-reply`, `recalculate-scores` = stub; LinkedIn/HH scrape kodi yo'q |
| **13** | **RBAC matritsa ishlatilmaydi** | 🟡 GREEN-LIE | `position_permissions`=1380 qurilgan, lekin `@RequirePermission` faqat 32/339 route → 90% coarse 3-rol guard'ga tayanadi |
| **14** | **13+ event 0-listener + outbox bo'sh** | 👻 ORPHAN | `iot.anomaly`/`stock.critical`/`payroll.period.closed` publisher bor, listener yo'q; outbox mukammal lekin `domain_events`=0 |
| **15** | **Test qoplami yo'q (vizyon modul) + golden-lie E2E** | 🔴 (sifat) | pos/cc/mes/iot/marketing ~0 spec; 34 Playwright `expect([200,401,403,404])`; Semgrep config fayli REPODA YO'Q |

**Xulosa:** 3 ta P0 o'zak (SD→Production, GL-posting, manager_id) — qolgani ulanish/konsept/stub/fake. Eng xavfli "yashil yolg'on"lar: kassir-retail, QC→stocks, o'lik-jadval-o'qish, OEE-hardcoded, RBAC-ishlatilmaydi. **Hammasi ulash + master-data + stub-to'ldirish — qayta-yozish EMAS.**

---

## 6. ⭐ GOLDEN-THREAD UZILISH NUQTASI

**Buyurtma → I.Chiqarish → Ombor → Moliya zanjiri BIRINCHI bo'g'inda uziladi:**

```
CRM lead→deal  ──►  SD order INSERT  ──X──►  Production  ──►  MES  ──►  QC  ──►  Ombor  ──►  Yetkazish  ──►  Moliya/GL
  (kod ulangan,      (sales_orders=12,    ⛔ UZILGAN        (no-op   (qc_insp  (stocks≠  (orderId      (entries=0,
   crm_deals=0)       REAL INSERT)        FK=0 +            stub)    =0)       warehouse  undefined     qo'lda only)
                                          listener YO'Q)                       _stock)    →skip)
```

**Aniq uzilish:** `sales_orders` (12 qator, REAL) dan keyin **SD→Production ko'prig'i yo'q**:
1. `orders` jadval 2026-06-06 DROP qilingan (`to_regclass('orders')`=NULL) → ikki-buyurtma-dunyo "soddalashdi" lekin ko'prik ham yo'qoldi.
2. `pp.module.ts` listenerlar orasida `OrderCreatedEvent` YO'Q (faqat 5: Advance/MroStop/Design/LabTest/WmsGoodsIssued).
3. Natija: undan keyingi hamma bo'g'in (MES no-op, QC=0, QC→Ombor noto'g'ri `stocks` jadval, Ombor→Yetkazish orderId=undefined→skip) **jonli hech qachon ishlamaydi**.

**Yagona REAL modullararo bog'lanish = avans→5 bo'lim fan-out** (`advance-approved-fanout.listener.ts`, lekin `sd_order_departments`=0 — kod real, jonli tsetiklanmagan).

**10 zanjir bo'g'inidan ~1 ishlaydi. SAP-darajasi: 🔴.**

---

## 7. ⭐ BUGUN FOYDALANUVCHI NIMA REAL QILA OLADI (halol javob)

### ✅ REAL ishlaydi (bugun, jonli):
- **Login + RBAC** — 4 global guard, server-enforce, `position_permissions`=1380, `users`=31.
- **SD ko'rish** — `sales_orders`=12, `sd_customers`=9 ko'rinadi (VIEW orqali).
- **Ombor skan (kirim/chiqim)** — POS Monitor atomik stok o'zgartiradi (`warehouse_stock`=25, FEFO/balance-guard).
- **Material ko'rish** — `material_cards`=21 Excel-grid.
- **Kunlik hisobot** — `daily_reports`=**3150 jonli qator** (eng to'la operatsion jadval, audit bilan).
- **Org-sxema + Portret** — `org_departments`=142 interaktiv tree, export.
- **Chat** — jonli xonalar/xabarlar, WS.
- **Audit** — `audit_logs`=9342 (haqiqatan ishlaydigan).
- **Kanban / LMS / avans hisoblash** — CRUD real.

### 🔴 BUGUN YO'Q (yoki yolg'on):
- **Pul/kassa** — `cash_sessions`=0, `retail_pos_transactions`=0, kassir-hub yo'q.
- **GL/moliya yozuvi** — `entries`=0, `gl_entries`=0 (pul oqimi orol).
- **Ishlab chiqarish rejasi** — `work_centers`=0, routing-create stub, MES sessiya 0.
- **Oylik to'lov** — shartnoma/payroll_calc=0; payroll→GL UZUQ.
- **Uchma-uch buyurtma** — SD→Production uzilgan, hech qachon zavodga tushmaydi.
- **CC hujjat oqimi** — `manager_id` 30/30 NULL → 1-inboxga yetmaydi.

**Bir gapda:** Foydalanuvchi bugun **kira oladi, ko'ra oladi, ombor skanlay oladi, material va kunlik hisobot bilan ishlay oladi** — lekin **pul, ishlab chiqarish rejasi, oylik, GL, uchma-uch buyurtma oqimi YO'Q**. Bu **demo emas — to'ldirilmagan/ulanmagan real** (kod bor, data va ko'prik yo'q).

---

## 8. SAP BO'LISH UCHUN NIMA KERAK (TOP yetishmaydigan — tartib bilan)

1. **O'zak (P0):**
   - `employees.manager_id` backfill (org FK'dan) → CC/eskalatsiya tiriladi.
   - Kanonik order jadval tanlash (`sales_orders`) + `OrderCreatedEvent` listener → SD→Production ko'prik.
   - GL avto-posting listener (har iqtisodiy hodisa → `entries`).
2. **Bitta oltin ip:** Buyurtma→Avans→I.Chiq→Ombor→Yetkazish→Moliya — boshdan-oxir bitta real buyurtma jonli o'tkazish.
3. **Master-data birlashtirish:** 2 order / 7 GL / 2 stock / 9 attendance / 2 lead → bitta haqiqat manbai (SAP Universal Journal tamoyili).
4. **Stub-to'ldirish:** kg↔list/gofra/kashirovka formula, sex-tur taksonomiyasi, routing-create, MES→QC, IoT-tablet, SMM-AI.
5. **Master data: 952 jadvalda 193 FK (20%)** → referential integrity; `head_user_id` 124/142 NULL to'ldirish.
6. **Data + test:** tor bir bo'lakda jonli ishga tushirish + vizyon-modul spec'lar + real DB integ (testcontainer) + Semgrep config.
7. **i18n/UI:** sidebar `titleKey` migratsiya, `format.ts` locale parametrlash, a11y (aria/WCAG), DataTableRedesign'ni 175 jadvalga ulash.

---

## 9. BIRLASHTIRUVCHI SPOT-CHECK NATIJALARI (verify-don't-trust)

| # | Hukm | Manba | Mustaqil tekshiruv | Natija |
|---|---|---|---|---|
| 1 | Core counts (12 jadval) | barcha | jonli SELECT | ✅ AYNAN mos |
| 2 | `manager_id` 30/30 NULL | [076][084][170] | jonli SELECT | ✅ tasdiq |
| 3 | `head_user_id` 124/142 NULL | [060][083] | jonli SELECT | ✅ tasdiq |
| 4 | `entries`/`gl_entries`=0 (GL olam) | [028][076] | jonli SELECT + to_regclass | ✅ tasdiq (ikkalasi mavjud, 0) |
| 5 | `stocks` ╳ `warehouse_stock` (QC→noto'g'ri) | [021][174] | to_regclass + count + `drizzle-wms.repo.ts:51` | ✅ tasdiq (stocks=0, ws=25) |
| 6 | O'lik jadvallar (mm_materials va h.k.) | [019][074][131] | to_regclass = NULL | ✅ tasdiq (6/6 yo'q) |
| 7 | `domain_events`=0 (outbox bo'sh) | [081] | jonli SELECT | ✅ tasdiq |
| 8 | `sd_sales_orders`=VIEW, `sales_orders`=BASE | [003][073] | information_schema | ✅ tasdiq |
| 9 | `daily_reports`=3150 (eng to'la) | [035] | jonli SELECT | ✅ tasdiq |
| 10 | createNbaTask green-lie (`taskId:Date.now()`) | [002] | `crm-ai-extended.controller.ts:140` | ✅ tasdiq |
| 11 | Design AI Math.random | [010] | `design-extended.repository.ts:99` | ✅ tasdiq |
| 12 | OEE hardcoded 0.92/0.85/0.97 | [050][179] | `production-agent.service.ts:34` | ✅ tasdiq |
| 13 | `orders` DROP | [073][174] | to_regclass = NULL | ✅ tasdiq |
| 14 | CC `MANAGER_OF_SENDER` | [076][170] | `cc-org-resolver.service.ts:54-87` | 🟡 **NUANS**: org-walk fallback BOR, lekin head_user_id 124/142 NULL → baribir tushadi |

**Xulosa:** 14 spot-check'dan 13 tasi AYNAN tasdiqlandi; 1 tasiga foydali nuans qo'shildi (CC fallback mavjud, lekin data-och). **Audit ishonchli** — agentlar `fayl:satr` + `SELECT` dalillarini halol keltirgan.

---

*Roll-up tugadi — 2026-06-06. Birlashtiruvchi roli (read-only). Hech narsa o'zgartirilmadi (faqat `_ROLLUP.md` + yakuniy `cat` yig'ish).*
*Quyida 60 part tartib bilan keltiriladi.*

---
