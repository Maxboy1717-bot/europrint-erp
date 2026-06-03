# GAP-1 — VIZYON vs HOZIRGI HOLAT (modulma-modul) — 2026-06-02

> **FAQAT TAHLIL (Tahlilchi roli — read-only).** Hech narsa o'zgartirilmadi; faqat shu hujjat yozildi.
> Manba: `docs/ombor-pos-master-plan.md` (PRIMARY §0–§17) + `docs/asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md`
> + `docs/POS_OMBOR_TAHLIL_2026-06-01.md` + agent6–12 (`docs/agent{6,7,8,9,10,11,12}-*.md`) + ui1–6 codescan.
> Bu hujjat ularni **kross-referens qiladi** (qayta-derivatsiya emas) va egasi vizyonига qarshi % beradi.
> Belgilar: ✅ bor · ⚠️ qisman · ❌ yo'q.

---

## MODUL 1 — OMBOR / WAREHOUSE (master-plan §1–§14)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| 13 ombor turi (config-driven `warehouse_types`) | 9 tur jonli (raw_material, paper_rolls, household_mro, finished_goods, production, defective, waste_paper, tools_equipment, department_warehouse) | ⚠️ qisman | 9/13; karantin=holat (alohida ombor emas, §3.10 ataylab); yangi tur=1 qator config |
| Material = Excel jadval (kartochka emas) | `/wms/warehouse-stock/:id` Excel jadval (MATERIAL/KOD/QOLDIQ/REZERV/MAVJUD) | ✅ bor | View-only (kirim/chiqim faqat POS Monitor'da) |
| Barcode/QR har inventarga (EAN-13+Code-128+QR), termal print | Skan 2-usul real (USB HID/Serial/wedge + kamera BarcodeDetector); P2P qabulda AUTO-kod | ⚠️ qisman | ZPL/EPL termal etiket print YO'Q; tur-maxsus shablon yo'q (Faza B ochiq) |
| Inventory-360 (Material 360 profili) | `WarehouseMaterial360.tsx` sahifa bor | ⚠️ qisman | To'liqligi tasdiqlanmagan; qoldiq+tarix+narx+QC to'liq emas (Faza G) |
| Invoice/akt PDF (kirim akti + hisob-faktura) | — | ❌ yo'q | PDF generatsiya umuman yo'q (Faza D) |
| Reservation/bron (available_quantity) | `available_quantity` ustun + atomik `>= qty` shart | ✅ bor | Minus saldo BLOK (§9.4) ishlaydi; rezervatsiya UI yetuk emas |
| KPP / 5-bosqich EXTERNAL_IN (DRAFT→KARANTIN→QC→MENEJER→AI_GL) | Faqat 1-bosqich (to'g'ridan prixod), QC 3-qaror oqimi yo'q | ❌ yo'q | Karantin/QC bosqichi yo'q; §4–§5 yadrosi ochiq (Faza C) |
| AI kamera (ombor nazorati) | HR davomat kamerasi + iot-agent bor, ombor uchun emas | ❌ yo'q | "AI ombor ko'radi" qismi yo'q |
| Single source of truth stok | 3+ parallel jadval: `warehouse_stock` (canonical, yangi) + `pos_stock_ledger`/`current_stock` (eski) | ⚠️ qisman | Yangi pos/operations atomik ishlaydi; eski oqim parallel (P0-1) |
| P2P xarid zanjiri (§7) | `ProcurementRequestService` + org-sxema approval chain + chek qabul + podotchet | ✅ bor (xom UI) | Spine jonli; UI raw ID formasi ("user ID 35") — ishlatib bo'lmaydi |
| Moliya dashboard (real-time, §14.3) | `/wms/overview` — KPI + qiymat (248,710,000) + kam-qoldiq + so'nggi harakatlar | ✅ bor | Real data bilan ishlaydi |
| Auto-GL (har harakatda Dr/Cr, §9.6) | `AutoGlPostingService` POS event'ga ulangan, lekin `gl_account_mappings` o'qilmaydi (hardcode), 0 qator | ⚠️ qisman | Mapping config jadval ishlatilmaydi (Faza I) |

**OMBOR % vision-coverage: ~60–65%** (eng kuchli modul: yadro POS↔Ombor bog'lanish ishlaydi + real data + Excel; lekin Karantin/QC 5-bosqich, PDF akt, AI kamera, 13→9 tur, eski jadval tozalash ochiq).

---

## MODUL 2 — KASSIR (master-plan §7.10, §10; egasi vizyoni #2)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| Kassir = naqd-nazorat markazi (kirim/chiqim) | "Kassa" = **chakana do'kon POS** (barkod skaner, savat, Naqd/Karta, QQS 12%, qaytim) | ❌ yo'q | NOTO'G'RI KONSEPT; `cash_*` jadvallariga 0 backend yozuvchi |
| Oylik tarqatish (payroll → kassir) | `FinanceExtendedPayrollService` real (calculate/runPayroll/approve), lekin kassirga ulanmagan | ⚠️ qisman | 0 shartnoma/0 hisob; payroll **ataylab soliqsiz** ("INPS/JSHD 1C'da") |
| Avans (podotchet pul) | `check-advance.handler` real (baseSalary×% + override + pending) → `payroll_advances` | ⚠️ qisman | **FE sahifa YO'Q** (orphan API); 0 qator |
| Qarz / podotchet (xodimga) | Material-podotchet (`employee_inventory_ledger`) real+ulangan (DEBIT/CREDIT, dismissal-block) | ⚠️ qisman | Bu MATERIAL podotchet; **pul-podotchet yo'q**; 0 qator |
| PIN (kassir operatsiya tasdiq) | — | ❌ yo'q | Kassir uchun PIN oqimi yo'q (CC'da PIN bor, kassirda emas) |
| Qoldiq (kassa balansi/smena) | `cash_sessions`/`cash_registers` jadval bor, **0 backend yozuvchi** | ❌ yo'q | Smena ochish/yopish + naqd qoldiq oqimi yo'q |
| PDF (kunlik kassa hisoboti) | — | ❌ yo'q | Kunlik kassir PDF hisoboti yo'q |
| Order payments (buyurtma to'lovi) | Phase-4 buyurtma 70% avans (`AdvanceApprovedEvent`) bor, lekin kassirga emas | ⚠️ qisman | Avans fan-out boshqa konsept (sd→ow_*), kassir-naqd emas |
| Kanban → kassir oqimi | — | ❌ yo'q | Ulanmagan |
| Reyting navbati (kassir oldida) | — | ❌ yo'q | Yo'q |

**KASSIR % vision-coverage: ~12–15%** (texnik dvigatel qismlari bor — payroll/avans/podotchet/FIFO/auto-GL real kod — lekin (a) "Kassa" noto'g'ri konsept (retail POS), (b) kassir-hub UI umuman yo'q, (c) hammasi 0 qator va ulanmagan).

---

## MODUL 3 — KANBAN (egasi vizyoni #3; Bitrix24-uslub)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| Bitrix24-uslub doska (ustun + karta CRUD) | Real DB CRUD; 8 ko'rinish (kanban/list/deadline/myPlan/calendar/gantt/dashboard/allocation); drag-drop | ✅ bor | Eng to'liq qurilgan modullardan; checklist/izoh/fayl/natija/vaqt/teg/kuzatuvchi/hamijrochi real |
| Maxfiylik (rol-asosli/org-sxema; xodim faqat o'zinikini ko'radi) | `getBoards()` user/rol scoping qabul qilmaydi; FE `roleFilter` Select = dead UI; `kanban_boards`'da `department_id` ustuni yo'q | ❌ yo'q | Har kim hamma doskani ko'radi; maxfiylik 0% |
| Board columns + approval chain (rahbar tasdiq/rad) | Primitiv 2-bosqich (accept→complete + egaga notif) | ⚠️ qisman | Reviewer/rad/qayta-yuborish yo'q; `approved_by`/`rejected_at` ustun yo'q |
| 3-Savat (CC→karta oqimi) | `ThreeBasketsPanel` = **100% MOCK** (hardcoded 5 karta, useState, API yo'q) | ❌ yo'q | Soxta demo (haqiqiy CC `cc_documents=0`) |
| Kommunikatsiya → karta | SD buyurtma→avto-karta ✅; chat xabaridan→bola-karta ✅; **CC→kanban YO'Q** | ⚠️ qisman | Faqat SD kanali; CC ko'prigi yo'q |
| Super_admin sozlaydi (faqat) | `POST /kanban/boards` deyarli har rolga ochiq | ⚠️ qisman | super_admin-cheklov yo'q |
| Robot/Flow/Shablon avtomatlashtirish | Kod bor (real), 0 ishlatilgan | ⚠️ qisman | Karkas qurilgan, sozlanmagan |
| Hisobot/Export (Excel/PDF/analytics) | Real (ExcelJS + pdfmake, kanban_cards agregatsiya) | ✅ bor | — |
| Data tozaligi | Test-axlat to'la ("Salom/savol/1231322/ghghgh"); 4 o'lik dublikat jadval | ❌ yo'q | "Tugallanmagandek" ko'rinadi |

**KANBAN % vision-coverage: ~55%** (dvigatel sifatida ishlaydi; lekin 3 yadro-talabdan ikkitasi (maxfiylik + 3-savat/CC oqimi) yo'q va biri (tasdiq zanjiri) primitiv + test-axlat).

---

## MODUL 4 — KOMMUNIKATSIYA / CC (egasi vizyoni #4; alohida sahifa, AI, 3 savat, PIN, 14 doc)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| Alohida CC sahifa (yagona markaz) | `/coordination` ichida tab; **2 parallel tizim** (`/api/cc/*` `cc_documents` + `/api/coordination/*` `dokla`) ulanmagan | ⚠️ qisman | Foydalanuvchi ikkisini bitta deb o'ylaydi; aralash |
| AI hujjat yozish (Claude intervyu) | `cc-ai-interview.service` real callClaude (start/answer/finalize) | ✅ bor (kod) | `cc_ai_sessions=3` test; real draft yaratilmagan (data 0) |
| 3 Savat (Kiruvchi/Kutish/Chiquvchi) | `CommunicationCenter.tsx` real, `/api/cc/baskets/*` ulangan | ⚠️ qisman | `cc_documents=0` → hammasi "Savat bo'sh" |
| PIN imzo (bcrypt + sha256) | `cc-pin.service` real | ⚠️ qisman | `cc_user_pins=0` → hech kim PIN qo'ymagan → send/approve bloked |
| 14 doc turi (shablon + workflow) | DB: 14 shablon + 34 qadam + 84 rad sababi seed | ✅ bor | Seed tasdiqlangan |
| Org-sxema oqimi (tasdiq zanjiri) | `cc-org-resolver` real (4 kod), lekin 14 shablonning 1-qadami `MANAGER_OF_SENDER` + `employees.manager_id=0` | ❌ yo'q | Hujjat hech qachon 1-inboxga yetmaydi (eng kritik bloker) |
| Telegram bot (web bilan teng) | `cc-bot.service` real (telegraf, komandlar, inline PIN) | ⚠️ qisman | Token kerak; AI intake Telegram'da yo'q (web'ga yo'naltiradi) |
| 24h SLA / 48h auto-reject | `cc-sla.cron` real (24h/48h/escalation) | ⚠️ qisman | cc_documents=0 → hech nimaga ta'sir yo'q |
| Boshqa modul → CC avto-spawn | `cc-event.listener` draft yaratadi, **autoSend bloked** (PIN sababi) | ❌ yo'q | P2P/Savdo CC'ga real hujjat yubora olmaydi |
| QR public verify + Webhook (HMAC) | `cc-public` + `cc-webhook` real | ✅ bor | Tekshiradigan hujjat yo'q; webhook audit placeholder |

**CC % vision-coverage: ~40%** (backend chuqur va sifatli ~75%, lekin (a) org-sxema 1-qadam bloker (manager_id=0), (b) 0 PIN, (c) 0 hujjat, (d) 2 parallel tizim, (e) autoSend ishlamaydi → "ishga tushirilmagan + ulanmagan qobiq").

---

## MODUL 5 — MES / SEX (egasi vizyoni: Flekso/Ofset, routing, IoT scan, brak/qoldiq/kamomad)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| Flekso/Ofset sexlar (work_centers) | CRUD + DDD aggregate + repo real; **0 sex** (work_centers=0) | ⚠️ qisman | type'da Flekso/Ofset yo'q (generic); seed masalasi |
| Routing (sexma-sex marshrut) | `RoutingsService` o'qish/tahrir real; **YARATISH stub** (`pp-routing.controller.ts:78 return 0`); 0 marshrut | ❌ yo'q | Yaratish ishlamagani uchun sexma-sex yo'l mavjud emas |
| Sexma-sex transfer (yarim tayyor → keyingi sex) | `tablet/handover` = **501 STUB**; boshqa joyda yo'q | ❌ yo'q | Haqiqiy MES handover yo'q (mes/shifts/handover = SMENA topshirish, buzuq) |
| IoT scan (skaner → buyurtma sarfi) | `material-kit-items/:id/scan` = **501 STUB** | ❌ yo'q | Material-kit YARATISH real (WMS), per-item SKAN stub |
| Production session start/stop | 3-4 parallel surface (`mes_sessions` vs `production_sessions` vs IoT); ba'zi yo'l real, ulanmagan | ⚠️ qisman | 1 sessiyani bir surface'da boshlab boshqasida ko'rib bo'lmaydi; 0 data |
| Brak (defekt) hisobi | Schema 100% (`defect_qty`/`defective_qty`); `/quantity` yozadi ✅; IoT `defect` 501; shift-report yozmaydi | ⚠️ qisman | `defect_rate` hisob real; yozuv oqimi qisman/buzuq; 0 data |
| Qoldiq (makulatura/waste) | Ombor `warehouse_types` 'waste_paper' turi bor | ⚠️ qisman | Ombor tomonda bor; MES→waste oqimi alohida |
| Kamomad (material yetishmovchilik) | `mes_material_consumption` jadval **YO'Q** → consumption yozuvi 500 | ❌ yo'q | Drift bug |
| AI rejalashtirish (BOM + rezerv + reja) | `AiPlannerService` real (Johnson/CPM/EOQ) + MRP/MPS/CRP + boy FE | ✅ bor (kod) | Eng kuchli qism; lekin 0 reja/0 buyurtma; CRP 503 (efficiency_rate ustun yo'q) |
| OEE / downtime / maintenance | `mes-shifts-stats` + `mes-maintenance` real (brauzer 200); gamification 48 qator | ✅ bor | Read real; data 0 |

**MES % vision-coverage: ~30–35%** (struktura ~70%, jonli yadro ~15–20%: skelet boy (45+80 fayl, CQRS, scheduling algoritm, 50 FE sahifa), lekin sex-marshrut+transfer+IoT skaner yadrosi yo'q/stub + 4 drift bug + 3 parallel session + hammasi 0 data).

---

## MODUL 6 — IoT (egasi vizyoni: tablet, 3 sensor, mexaniklar sahifasi, equipment-360)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| Tablet operatsion (session/scan→sarf/handover/QC) | 5/18 endpoint real (login+o'qish+SOS); qolgan 13 = **501 STUB** | ❌ yo'q | Asosiy ishchi amallari (skan→sarf, start/stop, brak, handover) stub; FE 90% yozilgan |
| 3 sensor (issiqlik/bosim/vibratsiya) O'QISH + threshold | Endpoint real (`iot/temperature|pressure|vibration` + LATERAL alert_level CASE); schema TAYYOR (type/unit/min-max) | ✅ bor (yo'l) | Lekin **0 sensor** (iot_sensors=0); seed yo'q |
| Sensor YOZISH (ingest) | `POST devices/:id/readings` aggregate-only, **DB'ga YOZMAYDI**; real `saveReading` o'lik | ❌ yo'q | Soxta success (Qoida 10); device REGISTRATSIYA real, reading yozish stub |
| Real-time push (mexanikga jonli) | `IotGateway` WebSocket — provider emas + chaqiruvchi yo'q → o'lik | ❌ yo'q | 0% real-time; faqat FE poll (5–60s) |
| Mexaniklar sahifasi | Alohida sahifa yo'q; mexanik = IoT Planshet PWA o'zi | ⚠️ qisman | FE rol-menyu'da operator roli bor; DB'da operator akkaunt/lavozim yo'q |
| Operator/mexanik akkaunt (planshetga kirish) | `employees.user_id=30/30 NULL` → password_hash NULL → **hech kim kira olmaydi**; 96 positions'da operator/mexanik lavozim yo'q | ❌ yo'q | Ildiz sabab: 0 employee↔user; 0 operator lavozim |
| Predictive maintenance (anomaliya) | z-score engine real (auto-stop), lekin `mes_telemetry`'dan (bo'sh) o'qiydi, 3 sensorga ulanmagan; FE 501 | ⚠️ qisman | Dvigatel bor, ulanmagan + data yo'q |
| Equipment-360 | `equipment` jadval 0 qator; tablet/equipment o'qish real | ⚠️ qisman | Struktura bor, data yo'q |
| AI kamera (CV inference) | config/analytics real (prompt/zona/trigger saqlaydi); real CV/LLM inference YO'Q | ⚠️ qisman | Tashqi vizyon tizimini kutadi; cameras=0 |
| Anomaliya persist | `AnomalyDetectedHandler` faqat log; `iot_alerts` INSERT yo'q | ❌ yo'q | Alert o'qish so'rovlari hech qachon qator topmaydi |

**IoT % vision-coverage: ~25–30%** (struktura ~65%; sensor O'QISH yo'li + threshold real (~85%), lekin ingest yozmaydi (~10%), tablet operatsion 5/18, WebSocket o'lik (0%), operator akkaunt yo'q (0%), 8 IoT jadval 0 qator).

---

## MODUL 7 — HR / ORG-CHART (egasi vizyoni: position cards, my-equipment, PIN)

| Vizyon feature | Current state | Belgi | Izoh |
|---|---|---|---|
| Org-sxema sahifasi (ierarxiya, KPI, drag-move, export) | `OrgStructureHierarchy.tsx` to'liq interaktiv; 142 node real EuroPrint; zoom/pan/filter/export PDF+Excel | ✅ bor | ~90%; real data |
| Org-sxema = tasdiq zanjiri skeleti | P2P + CC resolver + delegatsiya + Phase-4 fan-out (kod real) | ✅ bor | Data-gap: faqat 18/141 node'da head; `employees.user_id` NULL → CC employee-resolverlar uziladi |
| Org-sxema = ruxsat skeleti (position-RBAC) | `position_permissions=1380` (92 lavozim×15 modul) + `permission.guard` server-enforce (177 route) | ✅ bor | Modul-darajali (granular action emas) |
| Lavozim kartochkasi (Portret wizard) | UI boy (7 bosqich); backend MEMORY bo'yicha REAL (commit 2f353637, `org_node_portret` JSONB upsert) | ✅ bor | ⚠️ agent12 STUB degandi, lekin keyin tuzatilgan (live HTTP round-trip PASS) |
| Lavozim → kerakli jihozlar (my-equipment model) | `positions`/`org_departments`'da equipment ustuni YO'Q; `position_equipment` jadval YO'Q | ❌ yo'q | "Kerakli jihozlar" modeli umuman yo'q |
| Xodim profili (20+ tab CRUD) | `EmployeeProfile.tsx` 20+ tab + ~15 mutation; backend 9 route real | ✅ bor | Data bo'sh (0 passport/contract/asset) — qurilish bosqichi |
| "Mening jihozlarim/inventarim" | `pos/employees/me/inventory` real (POS modulida) + offboarding block (`hr-check`) | ⚠️ qisman | Backend to'liq+guard; data 0; 2 manba (assets vs ledger) |
| Xodim kodi (shtrix) | `employee_code` 30/30 unikal matn (EP-2025-005); shtrix/QR/badge YO'Q | ⚠️ qisman | POS scanner infra qayta ishlatish mumkin |
| HR → kassir (oylik) | payroll servis bor, 0 shartnoma/hisob, kassirga ulanmagan | ⚠️ qisman | — |
| HR → oshxona | `mro_canteen_logs` MRO'da (aggregate), xodim FK yo'q | ❌ yo'q | HR↔oshxona bog'lanish umuman yo'q |
| PIN (HR/xodim) | — | ❌ yo'q | CC'da PIN bor, HR profilida emas |
| `employees ↔ users` data-yaxlitlik | 30/30 user_id NULL, id≠id (MEMORY: keyin backfill qilingan) | ⚠️ qisman | MEMORY `project_employees_users_link_fix`: backfilled; lekin `manager_id` hali 0 |

**HR/ORG-CHART % vision-coverage: ~55–60%** (vizyon "tana" — org-tree + tasdiq zanjiri + position-RBAC — HAQIQATAN qurilgan; lekin "kerakli jihozlar" modeli yo'q, HR→oshxona yo'q, xodim kodi shtrix emas, PIN yo'q, hamma operatsion data bo'sh).

---

## PER-MODULE % COVERAGE (jamlama)

| # | Modul | % vision-coverage | Bir-jumla holat |
|---|---|---|---|
| 1 | Ombor / Warehouse | **~60–65%** | Eng kuchli; yadro POS↔Ombor ishlaydi + real data + Excel; Karantin/QC/PDF/AI-kamera ochiq |
| 2 | Kassir | **~12–15%** | Noto'g'ri konsept (retail POS); dvigatel qismlar bor, hub UI yo'q, 0 data |
| 3 | Kanban | **~55%** | Dvigatel ishlaydi; maxfiylik yo'q, 3-savat mock, tasdiq primitiv, test-axlat |
| 4 | Kommunikatsiya / CC | **~40%** | Backend chuqur, lekin manager_id=0 bloker + 0 PIN + 0 hujjat + 2 parallel tizim |
| 5 | MES / sex | **~30–35%** | Skelet boy; sex-marshrut+transfer+IoT skaner yadrosi yo'q/stub; 0 data |
| 6 | IoT | **~25–30%** | Sensor O'QISH real, ingest yozmaydi, tablet 5/18, WebSocket o'lik, operator akkaunt yo'q |
| 7 | HR / org-chart | **~55–60%** | Org-tree+tasdiq+RBAC qurilgan; kerakli-jihozlar/oshxona/shtrix/PIN yo'q |
| — | Integratsiya zanjiri (modullararo) | **~15%** | Ombor ichi ulangan; P2P→CC→Kanban→Kassir→Ombor end-to-end UZILGAN |

---

## TOP-20 MISSING FEATURES (vizyon yadrosi bo'yicha, ustuvorlik tartibida)

1. **Kassir-hub konsepti** — "Kassa" = retail POS (noto'g'ri); naqd-nazorat + oylik/avans tarqatish markazi YO'Q. (Modul 2)
2. **Integratsiya zanjiri** — Savdo→AI→Ombor→Ta'minotchi→CC→Kanban→Kassir→Ombor end-to-end uzilgan. (vizyon yuragi)
3. **CC org-sxema 1-qadam bloker** — `employees.manager_id=0` → 14 shablonning `MANAGER_OF_SENDER` 1-qadami har doim xato → hujjat hech qachon yubora olmaydi. (Modul 4)
4. **MES sexma-sex marshrut + transfer** — routing yaratish stub (`return 0`) + `tablet/handover` 501 → buyurtma Flekso/Ofset kuzatilmaydi. (Modul 5)
5. **IoT tablet operatsion** — skan→sarf, start/stop, brak, inline-QC, handover (13 endpoint) 501 stub. (Modul 6)
6. **Operator/mexanik akkaunt** — 0 employee↔user (login NULL) + 0 operator lavozim → planshetga hech kim kira olmaydi. (Modul 6)
7. **Kanban maxfiylik (rol/org-sxema)** — `getBoards` scoping yo'q; har kim hamma doskani ko'radi. (Modul 3)
8. **Kanban 3-Savat / CC→karta** — 100% hardcoded mock. (Modul 3 + 4)
9. **CC autoSend / modul→CC spawn** — listener draft'da qoladi (PIN sababi) → P2P/Savdo CC'ga real yubora olmaydi. (Modul 4)
10. **Sensor ingest (yozish)** — `POST readings` DB'ga yozmaydi; real `saveReading` o'lik. (Modul 6)
11. **IoT WebSocket real-time** — `IotGateway` o'lik (provider emas) → mexanikga jonli push 0%. (Modul 6)
12. **Karantin → QC 5-bosqich (EXTERNAL_IN)** + QC 3-qaror oqimi yo'q. (Modul 1)
13. **PDF akt / hisob-faktura** — ombor harakat akti + chiqim fakturasi generatsiya yo'q. (Modul 1)
14. **Lavozim → kerakli jihozlar** modeli yo'q (`position_equipment` jadval yo'q). (Modul 7)
15. **HR → oshxona** — xodim ovqat allokatsiya/talon umuman yo'q. (Modul 7)
16. **Auto-GL `gl_account_mappings`** — config jadval o'qilmaydi (hardcode); moliya→GL avtomatik emas. (Modul 1+2)
17. **Avans FE sahifa** — backend tayyor (`finance/advances/*`), UI yo'q (orphan). (Modul 2)
18. **Xodim shtrix/QR badge** — matn kod bor, skanlanadigan badge yo'q. (Modul 7)
19. **Single source of truth stok** — 3+ parallel stok jadval (warehouse_stock vs pos_stock_ledger vs current_stock). (Modul 1)
20. **Kanban tasdiq zanjiri (Bitrix24-uslub)** — reviewer/rad/qayta-yuborish yo'q (primitiv accept→complete). (Modul 3)

> Qo'shimcha (21+): test-axlat data (Kanban "1231322/Salom"), download-cheklash siyosati yo'q (#5), har-modul sozlama faqat 3 modul (sd/marketing/qc), MES 4 drift bug (mavjud bo'lmagan jadval/ustun→500), CRP 503 (efficiency_rate ustun), 13→9 ombor turi, predictive maintenance 3 sensorga ulanmagan, AI kamera CV inference yo'q.

---

## OVERALL VISION %

**Umumiy vizyon bajarilishi: ~30–35%.**

- **Asosiy "tana" BOR va ishlaydi:** Ombor (yadro POS↔Ombor) + Kanban dvigatel + HR org-sxema/tasdiq/RBAC + MES/CC backend skeleti + IoT sensor-o'qish yo'li + AI rejalashtirish algoritmlari — bular **haqiqiy kod**, taxmin emas.
- **Vizyonning "yuragi" YO'Q:** (1) modullararo **integratsiya zanjiri** (Savdo→...→Ombor) uzilgan; (2) **kassir-hub** noto'g'ri konsept; (3) CC/MES/IoT operatsion yadrolar **stub yoki bloker** (manager_id=0, routing return 0, tablet 13×501, operator akkaunt yo'q); (4) deyarli **hamma operatsion data 0 qator** (qurilish bosqichi).
- Shuning uchun alohida sahifa "ishlaydi" bo'lsa-da, egasi butun tizimni **bir oqim** sifatida kutgani uchun "ballonsiz mashina" — dvigatel (Ombor/Kanban/AI-planner) bor, g'ildirak (bog'lanish + kassir + sex-marshrut + tablet) yo'q.

**Diapazon:** modul-skeletini hisobga olsak ~35%, faqat jonli-ishlaydigan oqimni hisobga olsak ~20–25%. Markaziy baho **~30%**.

---

*GAP-1 tahlil 2026-06-02. Tahlilchi roli — read-only. Manba: ombor-pos-master-plan.md + asl-holat + POS_OMBOR_TAHLIL + agent6–12 + ui1–6 codescan (kross-referens). Hech narsa o'zgartirilmadi.*
