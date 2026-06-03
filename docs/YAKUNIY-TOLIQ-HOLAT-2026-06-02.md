# EuroPrint ERP — YAKUNIY TO'LIQ HOLAT (Grand Synthesis) 2026-06-02

> **Rol:** 🔵 Yakuniy Grand-Synthesis tahlilchi — **QAT'IY READ-ONLY** (CLAUDE.md Qoida 23).
> Hech bir kod / DB / config / migration / commit o'zgartirilmadi; faqat shu bitta hisobot yozildi.
> **Metod:** 7 o'lchamli (zanjir / UI / mantiq / data / perf / mobil / gap) ~20 sub-hisobotning
> **yagona birlashtirilgan hukmi**. Har topilma manba hisobotdan iqtibos qilinadi (re-derivatsiya emas).
>
> **Birlashtirilgan manbalar:**
> - **Zanjir:** `zanjir1..4` + `YAKUNIY-ZANJIR-XARITASI-2026-06-02.md`
> - **UI:** `ui1..ui6` + `ui7-yakuniy-interfeys-2026-06-02.md`
> - **Gap:** `gap1-vizyon-moslik`, `gap2-ortiqcha` (2026-06-02)
> - **Mantiq:** `mantiq1-hisob-kitob`, `mantiq2-biznes-qoidalar` (2026-06-02)
> - **Data:** `data1-sifat-2026-06-02.md`
> - **Perf:** `perf1-tezlik-2026-06-02.md`
> - **Mobil:** `mobil1-tablet-2026-06-02.md`
> - **Backend asl-holat:** `YAKUNIY-ASL-HOLAT-2026-06-02.md` (agent1..15 sintezi) + `asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md`
> - **Vizyon manbai:** `ombor-pos-master-plan.md` (74+ savol intervyu)

---

## 1. EXECUTIVE — BUTUN TIZIM BIR ABZATSDA

EuroPrint ERP — **texnik jihatdan ulkan, mustahkam va asosan REAL qurilgan SKELET, lekin operatsion jihatdan deyarli BO'SH va modullar bir-biriga ULANMAGAN.** Backend boy va ishonchli (344 controller, ~2961 endpoint, ~91% kod-darajada real DB/servisga ulangan, BE+FE tsc 0 xato, 4-5 global guard bilan himoyalangan, 0 SQL-injection); frontend deyarli to'liq (441 route, ~280 sahifa, ~90% render, lazy-load ishlaydi); UI yadrolari (IoT planshet, CC, HR org-sxema/Portret) production-ready va mock'siz. LEKIN egasi vizyoni (ishlaydigan, ulangan, jonli oqim) bo'yicha tizim ~30-35% tayyor, sababi: **(a)** jonli `europrint` DB **97.6% bo'sh** (qurilish bosqichi — hech bir to'liq sikl haydalmagan); **(b)** modullararo **integratsiya oqimi uzilgan** (kod ~46%, jonli ~15-20%) — "ikki order olami", payroll/POS/avans→GL bo'shlig'i, 13+ event 0-listener, CC↔Kanban va Kanban↔Kassir ko'priklari umuman yo'q; **(c)** bir nechta **konseptual xato** (Kassir = chakana retail POS, Kanban 3-savat 100% mock, MES sexma-sex marshrut stub); **(d)** ~106 endpoint **DB drift** tufayli 503; **(e)** **14 ta fake-create** sukutda ma'lumot yutadi. Egasining "ballonsiz mashina" tashbihi HAQ: **dvigatel (modullar) bor va quvvatli, transmissiya (integratsiya oqimi) ulanmagan, bir nechta g'ildirak (kassir-hub, sexma-sex marshrut, CC oqimi) yo'q.**

---

## 2. SCORECARD — O'LCHAMMA-O'LCHAM

| O'lcham | % | Baho | Asosiy dalil (manba) |
|---|---:|:---:|---|
| **Backend / texnik** | ~85% | **A−** | 344 controller, 2961 endpoint, 90.6% real, 5 global guard, 0 xavfli raw SQL, BE tsc 0; lekin 274 stub + 14 fake-create + 106×503 (YAKUNIY-ASL-HOLAT §1) |
| **Vizyon qamrovi (operatsion oqim)** | ~30-35% | **D+** | 11 bog'lanishdan 5.05/11; tana bor, yuragi (integratsiya+kassir+sex-marshrut) yo'q (gap1; zanjir-xaritasi §6) |
| **UI / UX** | ~70% | **C+/B−** | IoT/CC/HR org-sxema = A; Kassir UI = F (yo'q); Kanban maxfiylik yolg'on signal; 3 avlod UI yonma-yon; a11y past, ~2675 hardcoded TSX (ui7) |
| **Biznes-mantiq to'g'riligi** | ~60% | **C+** | Amortizatsiya/VAT/variance/ink/spoilage to'g'ri; FIFO COGS qo'llanilmaydi; rulon kg→m² + 3/5 qatlam YO'Q; ombor balansi atomik emas + fail-open guard; summa-threshold tasdiq ulanmagan (dead) (mantiq1, mantiq2) |
| **Data sifati** | ~55% | **C** | CoA 42 + vendors 15 = TO'G'RI seed; lekin 97.6% bo'sh; sales_orders≡sd_sales_orders dubl (12/12); org_departments dubl-seed; manager_id 30/30 NULL; daily_reports 1890 bo'sh skelet; gl_* 0 (data1) |
| **Perf-tayyorlik** | ~65% | **C+** | Hozir hech narsa sekin emas (DB bo'sh); lekin 383/529 FK indekssiz (72%), 3 real N+1 (MRP/chat/KPI), 3.3 MB eager bundle (manualChunks yo'q) — kelajak-risk (perf1) |
| **Mobil / offline** | ~70% | **B−** | Scanner (kamera/HID/serial) + big-button UX = a'lo; PWA+bg-sync+IndexedDB bor; lekin 3 parallel offline tizim, Dexie POS-Kassa qatlami DEAD/ulanmagan, Capacitor yo'q (mobil1) |
| **Xavfsizlik** | ~88% | **A−** | 4-5 global guard, 1273 @Roles, 0 SQL-inj, 0 hardcoded secret, 2 eski teshik yopiq; faqat hardening (OTP cap, JWT alg-pin) (agent13) |

### YAGONA UMUMIY %

| Raqam | % | Ma'no |
|---|---:|---|
| **Texnik / skelet tayyorligi** | **~78%** | Ulkan, mustahkam, tsc-toza qurilma (BE A−, FE B, xavfsizlik A−) |
| **Egasi vizyoni (jonli operatsion oqim)** | **~32%** | Modullar alohida ishlaydi, integratsiya uzilgan, DB bo'sh, kassir/sex-marshrut/CC-oqim yo'q yoki soxta |
| **🎯 MASTER YAGONA BAHO** | **~45%** | Texnik (78%) va vizyon (32%) o'rtasidagi vaznli o'rta — "kuchli asos, ulanmagan oqim" |

---

## 3. MODUL BO'YICHA HOLAT

| Modul | Wired % (kod) | Vizyon % | Eng katta bo'shliq | Manba |
|---|---:|---:|---|---|
| **Ombor / WMS / POS Monitor** | ~85% | **~62%** | Karantin→QC 5-bosqich pipeline haydalmagan (2 movement pending'da qotgan); 3+ parallel stok jadval; 94 sahifa dublikat; PDF akt + AI kamera yo'q | agent6, gap1, ui2 |
| **Kassir / Pul** | ~55% | **~13%** | KONSEPT XATO: retail POS qilingan; vizyon kassir-hub (smena/naqd/oylik/avans/podotchet) UI umuman yo'q; cash_* 0 yozuvchi | agent7, ui3, gap1 |
| **Kanban** | ~75% | **~55%** | Maxfiylik filtri kosmetik (yolg'on signal); 3-Savat 100% mock; tasdiq zanjiri primitiv; test-axlat ("Salom"/"Nima") | agent8, ui4, data1 |
| **Kommunikatsiya Markazi (CC)** | ~75% | **~40%** | Backend chuqur; lekin manager_id=0 → 1-qadam bloker; 0 PIN; 0 hujjat; 2 parallel tizim; autoSend bloked | agent9, ui4, gap1 |
| **MES / Ishlab chiqarish** | ~70% | **~30-35%** | 0 sex/0 marshrut; routing yaratish `return 0`; sexma-sex handover 501; 4 drift bug; 3 parallel session | agent10, ui6, gap1 |
| **IoT / Sensor / Tablet** | ~65% | **~25-30%** | Sensor YOZISH DB'ga yozmaydi (stub); tablet 13/18 endpoint 501; WebSocket o'lik; 0 operator akkaunt (login imkonsiz) | agent11, ui6, gap1 |
| **HR / Org-sxema** | ~75% | **~55-60%** | Org-tree+RBAC(1380) REAL; lekin "kerakli jihozlar" model yo'q; HR→oshxona yo'q; manager_id NULL; HistoryTab 501 | agent12, ui5, gap1 |
| **Sales / CRM / SD** | ~95% | **~70%** | Eng sog'lom oqim (CRM→SD→Kanban+Logistics fan REAL); lekin DealWonListener STUB (SO qo'lda); lid/RFM/AI-CRM = vizyondan tashqari | agent1/4/5, zanjir-xaritasi §2 |
| **Finance / GL** | ~55% | **~25%** | gl_*/gl_journal_entries 0 qator; payroll→GL faqat service-yo'li (event 0-listener); avans→GL yo'q; POS→GL yo'q (jadval+publisher yo'q); amortizatsiya hech qayerga yozmaydi | agent7, zanjir-xaritasi §3, mantiq1 |

---

## 4. TOP-20 MUAMMO (barcha o'lcham, ustuvorlik tartibida)

| # | Muammo | Teg | Dalil | FE/BE |
|---|---|---|---|---|
| **1** | **IKKI ORDER OLAMI** — `sd_sales_orders`(12) ╳ `sales_orders`(12), FK yo'q, JOIN yo'q. SD-buyurtma hech qachon PP/MES/QC ga o'tmaydi | `[chain][data]` | zanjir Z1/Z4 §4.3; data1 D1 (12/12 order_number mos) | BE+DB |
| **2** | **Kassir konsepti butunlay noto'g'ri** — `/accounting/cash-register`=chakana savat/QQS/chek; vizyon naqd-nazorat+oylik/avans hub; cash_* 0 yozuvchi | `[gap][ui]` | ui3 §1; gap1 Modul 2; gap2 D10 | FE+BE |
| **3** | **106 endpoint DB drift → 503** — 12 jadval yo'q (mes_work_centers, qc_approvals...) + ustun drift + FK uuid↔int; employee-kpi/employee-files 100% buzuq | `[chain][data]` | YAKUNIY-ASL-HOLAT B2/§2 P3; agent5 §3 | BE+DB |
| **4** | **MONEY/GL ulanmagan** — gl_*/gl_journal_entries 0; avans→GL yo'q; POS chiqim→GL yo'q (gl_posting_log jadval+publisher yo'q); payroll event 0-listener | `[chain][logic]` | zanjir Z1 §3/§6, Z3 §4; data1; mantiq1 §6 | BE+DB |
| **5** | **14 STUB-FAKE-CREATE** — POST qabul qiladi, DB'ga yozmaydi (`{id:Date.now(),created:true}`): payments/materials/vacancies/design-orders/routing | `[logic][data]` | YAKUNIY-ASL-HOLAT B1; agent1 §4.2 | BE |
| **6** | **employees.manager_id 30/30 NULL** — CC `MANAGER_OF_SENDER` (14 shablonning 1-qadami) har doim xato → hujjat hech qachon 1-inboxga yetmaydi | `[data][chain]` | data1 B1; mantiq2 §4; gap1 #3 | BE+DB |
| **7** | **MES sexma-sex marshrut + transfer YO'Q** — routing yaratish `return 0`; `tablet/handover` 501; buyurtma Flekso→Ofset kuzatilmaydi | `[chain][gap]` | gap1 Modul 5; agent10 §4/§7 | BE |
| **8** | **Sensor ingest DB'ga yozmaydi (stub)** + anomaliya persist yo'q + IoT WebSocket o'lik → sensor yo'li jonsiz | `[chain][gap]` | agent11 §3.4/§3.5; gap1 Modul 6 | BE |
| **9** | **0 operator/mexanik akkaunt** — employees.user_id NULL effekti + 96 lavozimda operator yo'q → planshetga hech kim kira olmaydi | `[data][gap]` | gap1 #6; agent11 §8 | BE+DB |
| **10** | **Kanban maxfiylik filtri kosmetik (yolg'on signal)** — `roleFilter` `filteredCards` useMemo'da ishlatilmaydi; getBoards scoping yo'q → har kim hammasini ko'radi | `[ui][gap]` | ui7 §3.2; ui4 §1.4 | FE (yoki BE board-membership) |
| **11** | **Kanban 3-Savat 100% MOCK** — `ThreeBasketsPanel.tsx:50` hardcoded 5 karta useState, useQuery yo'q + xom hex inline | `[ui][data]` | ui4 §1.6; gap2 §4 J1; data1 | FE (CC API mavjud) |
| **12** | **Ombor balansi atomik EMAS + fail-open guard** — `upsertWarehouseStock`+`warehouse_transactions` bitta tx emas; race-condition oversell; DB xatosida ruxsat beradi | `[logic]` | mantiq1 §8; mantiq2 §1 | BE |
| **13** | **Summa-threshold tasdiq darvozasi ulanmagan (dead)** — `isHitlRequired`(PO≥50mln...)/`needsApproval` 0 chaqiruvchi → yirik to'lov avto-eskalatsiya yo'q (moliyaviy teshik) | `[logic][chain]` | mantiq2 §4; `approval-request.aggregate.ts:59` | BE |
| **14** | **GL leglari atomik jurnal emas** — har leg alohida `entryNumber` (Date.now+random), tx yo'q → yarim provodka; payroll closure piece/allowance bo'lganda balans buziladi | `[logic]` | mantiq1 §6.1/§6.2 | BE |
| **15** | **Material yaratish bo'lingan** — `POST /mm/materials`→`materials`(0); ombor oqimi `material_cards`(21) o'qiydi → yangi material omborda ko'rinmaydi; `/inventory/materials` "topilmadi" | `[data][chain]` | agent6 §5; data1; gap1 #19 | BE+FE |
| **16** | **CC autoSend bloked + boshqa modul→CC spawn ishlamaydi** — listener draft'da qoladi (PIN sababi) → P2P/Savdo CC'ga real hujjat yubora olmaydi | `[chain]` | agent9 §3.12; zanjir Z1 §4 | BE |
| **17** | **13+ AI-agent event 0-listener** (`stock.critical`, `iot.anomaly`, `crm.hot_leads_found`...) → faqat logger.debug; outbox STRING↔listener CQRS class nomuvofiq | `[chain]` | zanjir Z3 §4.1/§6 | BE |
| **18** | **383/529 FK indekssiz (72%) + 3.3 MB eager bundle** — DB to'lganda full-scan; `daily_reports` 1890 indekssiz; vite `manualChunks` yo'q | `[perf]` | perf1 §2/§4 | BE+DB+FE |
| **19** | **Dexie POS-Kassa offline qatlami DEAD** — `lib/pos-db.ts`+`pos-sync.ts` yozilgan, CashRegister ulamaydi; 3 parallel offline tizim konflikt xavfi; manifest "offline POS" yolg'on | `[mobile]` | mobil1 §2 | FE |
| **20** | **Rulon kg→m² + 3/5 qatlam/kesim formulasi YO'Q + FIFO COGS qo'llanilmaydi** — vizyon hisob-kitob yadrosi; `pos_batches.current_qty` hech qachon kamaymaydi | `[logic][gap]` | mantiq1 §1/§2/§3; ui2 §2 | BE |

> **Qo'shimcha (21+):** sales_orders/org_departments/Coca-Cola dubl-seed (data1 D1-D3); 80% sidebar vizyondan tashqari (gap2); KPI `targetQuantity=0` nolga bo'lish guardsiz (mantiq1); ijara cron faqat izohda (`processed=0`); karantin omboridan chiqim qat'iy bloklanmaydi (mantiq2 §6); HR→oshxona/kerakli-jihozlar/shtrix-badge yo'q (gap1 Modul 7).

---

## 5. TAKRORLANGAN KROSS-HISOBOT MAVZULAR (eng yuqori ishonch)

Quyidagilar **bir nechta mustaqil agent/o'lchamda** topilgani uchun eng ishonchli — bular tizimning **tizimli (sistematik) nuqsonlari**, alohida bug emas:

1. **IKKI ORDER OLAMI** (`sd_sales_orders` ╳ `sales_orders`) — zanjir Z1/Z2/Z4 + data1 D1 (12/12 to'liq dubl) + gap2 D... uchta mustaqil tahlilda. **OLAM A (SD/Phase-4, jonli)** va **OLAM B (legacy PP/MES/QC/WMS, izolyatsiya)** o'rtasida FK/JOIN yo'q → SD-buyurtma ishlab chiqarishga o'tmaydi. **Eng ko'p zanjirni ochadigan yagona tuzatish.**

2. **PUL/GL ulanmagan** — zanjir Z1/Z3 + mantiq1 §6 + data1 + agent7. **(a)** Kassir kodda umuman yo'q (0 grep); **(b)** avans→GL yo'q; **(c)** POS chiqim→GL yo'q (gl_posting_log jadval+publisher yo'q); **(d)** payroll faqat service-yo'lida GL'ga tushadi, event 0-listener; **(e)** gl_*/gl_journal_entries 0 qator; **(f)** amortizatsiya hech qayerga yozmaydi. Moliya = eng uzuq domen.

3. **3 AVLOD UI/POS yonma-yon** — ui1/ui2/gap2/mobil1. **(a)** YANGI kanonik (`Warehouse*`+`PosMonitorPage`+`warehouse.api.ts`); **(b)** O'RTA (`WMS*/MM*/Material*/Stock*`); **(c)** ESKI POS SPA 25 sahifa (raw-kalit i18n+xom hex, sidebar'da yo'q, deep-link tirik). + 6 BE endpoint prefiks + 4-5 sahifa-sarlavha shabloni + pos vs pos-v2 backend.

4. **FAIL-OPEN / ULANMAGAN GUARDLAR** — mantiq1 + mantiq2. Balance-guard DB xatosida ruxsat beradi (fail-open); summa-threshold HITL dead-code (0 chaqiruvchi); karantin omboridan chiqim qat'iy bloklanmaydi; WMS aggregate bron-yo'li buzuq. Pul/stok himoyasidagi teshiklar.

5. **manager_id 30/30 NULL** — data1 B1 + mantiq2 §4 + agent9/12 + memory. CC org-resolverning 1-qadami buziladi; MANAGER_OF_SENDER ishlamaydi (DEPT_HEAD yo'liga tushadi).

6. **MOCK / TEST / JUNK data** — data1 + ui4 + gap2. ThreeBasketsPanel hardcoded 5 karta; kanban_cards 100% axlat ("Salom"/"Nima"); 3 test mijoz; chat junk; daily_reports 1890 bo'sh skelet (plan/fact NULL); material_cards 21/21 bir xil supplier.

> **Eng yuqori ishonchli to'rt-lik:** (1) ikki order olami, (2) pul/GL uzuq, (3) 3 avlod UI, (4) fail-open guard — bular **dizayn-darajadagi** bo'linishlar, ularni yopmasdan vizyon "bir oqim" bo'lmaydi.

---

## 6. TO'LIQ IJRO YO'L XARITASI (P0→P3)

> ⚠️ Hammasi **TAVSIYA** (Qoida 23) — bajarish faqat egasi aniq "ha, bajar" deganda.
> Har faza **backend + UI + mantiq + data birga** (egasining "har bosqich vizyon-100%" tamoyili).
> **QUICK-WIN** = sof-FE yolg'on-signal olib tashlash; **DEEP** = strukturaviy/yangi modul.

### FAZA P0 — Asos tozalash + order olamini yagonlash (eng ko'p zanjir ochiladi)
| Ish | Tur | Manba |
|---|---|---|
| **Order olamlarini birlashtirish** (`sd_sales_orders` vs `sales_orders` — bittasi VIEW/o'chirish; 12/12 dubl) | DEEP (DDL+repo) | zanjir P0.1; data1 D1 |
| **order_id uuid→int repoint** qolgan ~12 `ow_*`/order_costings/sales_invoices → integer PK; QC→FG lookup tuzatish | DEEP (DDL) | zanjir P0.2 |
| **106 drift migratsiya** — 12 jadval CREATE + ustun ADD + FK tur birlashtirish (DDL — bu STRUKTURA, DATA emas) | DEEP (DDL) | YAKUNIY-ASL-HOLAT P3 |
| **14 fake-create tuzatish** — real insert yoki 501 (payments/materials/vacancies eng kritik) | DEEP (BE) | YAKUNIY-ASL-HOLAT B1 |
| **employees.manager_id to'ldirish** + FK → CC resolver tiriladi | QUICK (data) | data1 B1; mantiq2 §4 |
| **fail-open guard → fail-closed** + balance-guard tx-ga o'rash | DEEP (BE+logic) | mantiq2 §1 |

### FAZA P1 — Kassir-hub + Money/GL (vizyon eng katta yetishmovchiligi)
| Ish | Tur | Manba |
|---|---|---|
| **"Kassa" sahifasini kassir-hub'ga aylantirish** — smena ochish/yopish, naqd kirim/chiqim, oylik/avans tarqatish, podotchet/qarz; `payroll_advances`+`employee_inventory_ledger`+`cash_*` ulash | DEEP (FE asosiy + BE) | ui3 §2; gap1 Modul 2 |
| **Retail POS → alohida "Retail" modul** (kassirdan ajratish) yoki delete-nomzod | QUICK (FE) | gap2 D10 |
| **Avans→GL** (`confirm-advance-payment` GL posting) | DEEP (BE) | zanjir P2.5; mantiq1 §6 |
| **POS chiqim→GL** — gl_posting_log jadval + `PosMovementCompletedEvent` typed publish | DEEP (BE+DDL) | zanjir P2.6 |
| **Xodim qarzi→moliya** (`createCashAdvance`/`createFine` → GL/kassa) | DEEP (BE) | zanjir P2.7 |
| **Summa-threshold HITL ulash** (`isHitlRequired` chaqirilsin) + GL leglarini atomik jurnal qilish | DEEP (BE+logic) | mantiq2 §4; mantiq1 §6 |
| **Avans FE sahifa** (backend `finance/advances/*` tayyor, orphan API) | QUICK (FE) | gap1 #17 |

### FAZA P2 — Ishlab chiqarish zanjiri + integratsiya oqimini ulash (vizyon yuragi)
| Ish | Tur | Manba |
|---|---|---|
| **MES→QC trigger** — `MesCompletedListener` no-op → real QC inspeksiya ochish | DEEP (BE) | zanjir P1.3 |
| **MES sexma-sex** — Flekso/Ofset sex seed + routing `return 0` tuzatib seed + handover endpoint real | DEEP (BE+data) | gap1 Modul 5 |
| **Jonli stok yo'li `StockUpdatedEvent` chiqarsin** (warehouse-config.service) → ROP+GL jonlanadi | DEEP (BE) | YAKUNIY-ASL-HOLAT §4C |
| **CC→Kanban ko'prigi** (CcDocument tasdiqlangach Kanban karta, OrderCreatedEvent naqshi) + autoSend tuzatish | DEEP (BE) | ui7 D2; agent9 §3.12 |
| **Outbox↔listener nomuvofiqligini tuzatish** (CQRS class nomi yoki @OnEvent adapter) → Design/Sample triggerlari | DEEP (BE) | zanjir P3.8 |
| **Sensor ingest yozish** (`saveReading` ulash) + anomaliya persist + WebSocket + operator akkaunt | DEEP (BE+data) | agent11 §3 |
| **Ombor 5-bosqich pipeline'ni 1 EXTERNAL_IN bilan oxirigacha haydash** (isbot) | QUICK-DEEP (data) | YAKUNIY-ASL-HOLAT §4B |

### FAZA P2.5 — QUICK-WIN yolg'on-signal olib tashlash (sof-FE, darhol)
| Ish | Tur | Manba |
|---|---|---|
| **Kanban maxfiylik filtrini ulash** (`roleFilter`→`filteredCards` useMemo) yoki BE board-membership | QUICK (FE) | ui7 D1; ui4 §1.4 |
| **Kanban 3-Savat MOCK→real CC** (`GET /api/cc/baskets/*`) yoki `/coordination?tab=baskets` link | QUICK (FE) | ui7 D1; ui4 §1.6 |
| **Test/junk data o'chirish** — kanban "Salom"/"Nima", 3 test mijoz, chat junk, daily_reports bo'sh skelet | QUICK (data) | data1 §2 |
| **Dexie POS-Kassa offline: ulash YOKI o'chirish** + 3 offline tizimni 1 kanonikga | QUICK-DEEP (FE) | mobil1 P0 |

### FAZA P3 — Vizyon-100% to'ldirish + sifat/konvergensiya
| Ish | Tur | Manba |
|---|---|---|
| **Rulon kg→m² + 3/5 qatlam/kesim formulasi** (egasi formula bergach) + FIFO COGS ulash | DEEP (BE+logic) | mantiq1 §1/§2/§3 |
| **Karantin→QC 5-bosqich EXTERNAL_IN** + QC 3-qaror oqimi + PDF akt/faktura | DEEP (BE+FE) | gap1 #12/#13 |
| **Lavozim "kerakli jihozlar" model** (`position_equipment`) + jihoz 3-joy sinxron zanjiri | DEEP (BE+FE) | ui7 D2; gap1 #14 |
| **Material chiqim 2 yo'lini birlashtirish** (POS issueStock + production productionAction → 1 servis) | DEEP (BE) | zanjir P4.10 |
| **Perf hardening** — 383 FK indeks (avval daily_reports/audit_logs), MRP N+1 JOIN, vite manualChunks | DEEP (BE+DB+FE) | perf1 §6 |
| **13+ AI-agent event'ga listener** (Notification/Director dashboard) | DEEP (BE) | zanjir P5.14 |
| **KONVERGENSIYA** — 3 avlod UI→1, eski POS SPA 25 sahifa redirect/o'chirish, pos vs pos-v2, sahifa-sarlavha 5→1, a11y, ~2675 hardcoded TSX, 2 schema olami | DEEP (FE+BE) | ui7 §6; gap2 |
| **Vizyondan tashqari modullarni keep/cut** (egasi qaroridan keyin) — LMS/Marketing/SaaS/ecommerce/Direktor/14-agent | DEEP (qaror) | gap2 §5 |

---

## 7. EGASI HAL QILISHI KERAK BO'LGAN OCHIQ SAVOLLAR

| # | Savol | Variantlar | Ta'sir |
|---|---|---|---|
| **Q1** | **Kanonik order jadvali qaysi?** `sd_sales_orders` (OLAM A, jonli, Phase-4 fan-out, CRM ulangan) vs `sales_orders` (OLAM B, legacy PP/MES/QC ulangan) | (a) sd_* kanonik + sales_orders→VIEW; (b) aksincha; (c) birlashtirish | OLAM A↔B ko'prigi; **butun SD→PP→MES→QC oqimi shunga bog'liq** (eng muhim qaror) |
| **Q2** | **Kassir scope qanday?** | (a) faqat moliya naqd-nazorat hub (smena/oylik/avans/podotchet); (b) + retail POS saqlash; (c) retail to'liq olib tashlash (make-to-order) | Faza P1 hajmi; retail POS keep/cut |
| **Q3** | **Vizyondan tashqari qaysi modul saqlanadi / kesiladi?** ~80% sidebar vizyon yadrosidan tashqari | keep: HR/CRM/MES/Design (real ishlatiladi); delete-nomzod: LMS, Marketing, SaaS/tenant, ecommerce, Direktor 20-band+14 agent, eski POS SPA 25, compatibility 40+ | Maintenance yuki; gap2 ~80-110 fayl sof-o'lik |
| **Q4** | **Payroll soliq qayerda?** Hozir ERP gross-only, INPS/JSHD/income-tax "1C da" | (a) shu holatda qoldirish (memory eskirgan — endi gross-only); (b) ERP'ga soliq qaytarish | `netPay` "sof maosh" emas — chalkashlik xavfi (mantiq1 §4) |
| **Q5** | **Kanonik master-data jadvali?** mijoz: `sd_customers` vs `customers`(AI kutadi) vs `crm_*`; material: `material_cards`(faol) vs `materials`/`mm_materials`/`raw_materials` | konvergensiya yo'nalishi | AI `customers` kutadi (bo'linish); material yaratish bo'lingan |
| **Q6** | **POS backend avlodi?** `modules/pos` (161 fayl, kanonik) vs `modules/pos-v2` (26 fayl, toza DDD, yarim) | konvergensiya tanlovi | gap2 §2.3 |
| **Q7** | **Offline strategiya?** 3 parallel tizim (Workbox bg-sync / xom-IndexedDB / IoT localStorage) + DEAD Dexie | 1 kanonik (Dexie tabiiy nomzod) | manifest "offline POS" hozir yolg'on; konflikt xavfi |
| **Q8** | **Native ilova kerakmi?** Hozir faqat PWA + Telegram Mini-App | Capacitor qobig'i (manifest+SW tayyor) yoki PWA yetarli | mobil1 §5 |

---

## 8. YAKUNIY HUKM

**Sizning ERP'ingiz — juda yaxshi qurilgan, lekin hali yo'lga tushmagan zavod.** Binolar (modullar) qad rostlagan, sifatli mashinalar (Ombor, CRM, AI-planner Johnson/CPM/EOQ, org-sxema, IoT planshet, CC) o'rnatilgan. LEKIN: **(1)** konveyer lentalari (modullararo oqim — order olami, GL, CC↔Kanban) ulanmagan; **(2)** bitta muhim sex (kassir-hub) noto'g'ri qurilgan (do'kon kassasi qilingan); **(3)** zavod hali ishlab chiqarishni boshlamagan (DB 97.6% bo'sh — hech bir to'liq sikl haydalmagan); **(4)** ba'zi mashinalarda nosozlik (106×503, 14 fake-create, fail-open guard, atomik bo'lmagan balans).

**Yaxshi xabar:** vizyonning **~70%i allaqachon kod-darajada mavjud**. Asosiy ish **noldan qurish EMAS**, balki: **ULASH** (order olami, GL, integratsiya) + **TUZATISH** (drift, fake-create, guard, manager_id) + **TO'LDIRISH** (kassir-hub UI, sex-marshrut, seed/jonli haydash) + **KONSEPT TO'G'RILASH** (kassir).

**Master yagona baho: texnik ~78%, vizyon ~32%, vaznli o'rta ~45%.** Eng ko'p zanjirni ochadigan bitta qaror = **Q1 (kanonik order jadvali)** + Faza P0.

---

*Grand-synthesis 2026-06-02 · 🔵 Read-only · ~20 sub-hisobot (zanjir/UI/mantiq/data/perf/mobil/gap + agent1-15) birlashtirildi.*
*Har topilma manba bilan iqtibos qilindi; ziddiyatlar ikkala raqam bilan saqlandi (verify-don't-trust). Faqat shu `.md` yozildi — kod/DB/commit o'zgartirilmadi (Qoida 23).*
