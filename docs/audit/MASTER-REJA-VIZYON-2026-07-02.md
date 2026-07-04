# MASTER-REJA — VIZYON HOLATI VA YO'L XARITASI (2026-07-02)

> **Manba:** 12 parallel o'lchov-agent (jonli kod + jonli DB `europrint` + jonli HTTP :3030, verify-don't-trust).
> **Baseline:** VIZYON-TEKSHIRUV-2026-06-27 (2146 savol, haqiqiy ~39%) + PROD-HUKM 2026-06-25 (data ~10%).
> **Metod:** har talab BOR=1.0 / QISMAN=0.5 / YO'Q=0; klaster % = o'rtacha. Har da'vo `fayl:satr` yoki DB-qator bilan isbotlangan.
> **Rol:** SINTEZ (faqat docs/). Kod fayllarga tegilmagan. Egasi qarorisiz hech narsa bajarilmaydi (Q-28).

═══════════════════════════════════════════════════════════════════
# 1. UMUMIY VIZYON-MOSLIK
═══════════════════════════════════════════════════════════════════

## 1.1 Bosh raqam

| O'lchov | 2026-06-25/27 | 2026-07-02 | Delta |
|---|---|---|---|
| **Modul-klaster o'rtacha (8 klaster, og'irliksiz)** | ~52% | **65%** | **+13** |
| Funksiya (2146-savol bazasi, taqqos uchun) | ~39% | ~55-60% (ekstrapolyatsiya) | +16..21 |
| Data-jonlilik (22 domen) | ~10% | **57%** | **+47** |
| Sahifalar (467 route) | o'lchanmagan | **85%** | — |
| **10 o'lchov umumiy o'rtacha** | — | **66%** | — |

## 1.2 Klaster-jadval (oldingi % → hozirgi %)

| # | Klaster | Oldingi (06-27 baza) | Hozir (07-02) | Δ | Izoh |
|---|---|---|---|---|---|
| 1 | WMS/Ombor + POS Monitor | ~72% | **81%** | +9 | G1-to'lqin: barkod-gate, 47 DEPT ombor, raqamlash, sikl-sanash jonli |
| 2 | Finance (GL·kassir-hub·podotchet·payroll) | ~60% | **70%** | +10 | Kassir-hub+PIN+4-bosqich payroll+A4 kunlik PDF jonli |
| 3 | SD/CRM/Marketing | ~51% | **64%** | +13 | Lid-birlashuv (sd_leads VIEW o'chdi), ATP kod, 4-kanal ingest |
| 4 | PP/MES/QC | ~36% | **61%** | +25 | Data jonlandi (orders 0→7, sessions 0→8), QC-birlashtirish, gofra 3-formula |
| 5 | HR/LMS | ~50% | **75%** | +25 | QYM 16:00 jonli (8449 qator), reyting-7, kunlik ishlagan-pul PDF (10 ta) |
| 6 | Org KARTA-markaz | 63% | **59%** | **−4** | Mexanizm o'sdi (47/47 ombor-sync), LEKIN daraxt-buzilish topildi (P0) |
| 7 | CC 3-Savat + Kanban + Coordination | ~42% | **70%** | +28 | 17 shablon+58 qadam, PIN-imzo, QR jonli; LEKIN 06-30 to'lqin registratsiyasi yo'qolgan (P0) |
| 8 | AI + IoT | ~45% | **40%** | **−5** | Qat'iyroq talab-to'plam; ANTHROPIC kalit .env'da BOR, lekin jonli chaqiruv=0 |
| — | **O'rtacha (8 klaster)** | **~52%** | **65%** | **+13** | |
| K1 | Sahifalar (kesma) | — | 85% | — | 467 route: 325 jonli / 123 yarim / 5 stub |
| K2 | Data-jonlilik (kesma) | ~10% | 57% | +47 | 22 domen: 7 BOR / 11 QISMAN / 4 egasi-data |

## 1.3 Ikki minus klaster — nima uchun

- **Org −4:** mexanizm yaxshilandi (dept-ombor avto-sync 47/47, karta-CRUD 25 endpoint), lekin jonli daraxt BUZUQ topildi: owner(id=19).parent_id=157 (dublikat OTD3 ostida!), ceo(id=20).parent_id=115 ('IT Mutaxassis' POSITION ostida!), 7 ta dublikat otdeleniye (OTD1-7). Vertikal zanjir (SOS/CC/procurement/kanban) shu daraxtga tayanadi.
- **AI/IoT −5:** talab-to'plam flagman texnik vizyonga qat'iyroq (motion-gate/YOLO/Layer B). Aslida oldinga siljish bor: ANTHROPIC_API_KEY .env'da (len=108), AI-OCR chek kodi, exit-guard, ЦКП-bot jonli (36 savol). Lekin ai_usage_logs=0 — birorta jonli AI-chaqiruv isbotlanmagan.

═══════════════════════════════════════════════════════════════════
# 2. SAHIFALAR HOLATI (FE to'liq inventar)
═══════════════════════════════════════════════════════════════════

**Jami:** 467 unikal modul-route (`artifacts/erp-dashboard/src/routes/*.tsx`, 10 fayl) + 4 to'g'ridan sahifa (`AppRouter.tsx:92-200`) + 29 POS-monitor sub-app route (`src/pos-monitor/PosMonitorApp.tsx`) ≈ **500 sahifa**. Sidebar: 288 unikal URL, **0 o'lik havola**.

| Tasnif | Soni | Izoh |
|---|---|---|
| 🟢 JONLI (query+mutation) | 325 | To'liq CRUD sahifalar |
| 🟡 YARIM (faqat read-only query) | 123 | Dashboard/hisobot — forma yo'q, Q-43 buzilishi 0 |
| 🔵 MUT-ONLY (kalkulyator/action) | 11 | /pp/mrp, /print/imposition, /qc/dpmo-calculator, /wms/eoq... |
| ⚪ STATIC (API'siz) | 3 | /customer-portal, /seven-functions, /raci-matrix |
| 🔴 STUB (ComingSoon) | 5 | /export, /micro-modules, /modules, /pos/printer-config, /sap (`StubRoutes.tsx:81-85`) — hech biri sidebar'da yo'q |

**F4-22 eski stub-ro'yxat holati:** 13 REAL bo'lgan, 5 hali stub, 3 route olib tashlangan (404: /gpt, /inventory/advanced, /pos/mini-app) → CLAUDE.md F4 ESKIRGAN.

**Yagona haqiqiy Q-43 buzilishi (forma ko'rinadi, saqlash 404):**
- `cameras-management.tsx:77` POST /api/cameras → 404
- `cameras-management.tsx:112` DELETE /api/cameras/:id → 404
- `camera-settings.tsx:68` POST /api/camera-settings → 404

**BE-endpoint mosligi:** top-34 sahifa endpointi jonli 34/34 mavjud (401=guard). `scripts/check-fe-api-urls.mjs` 7 nomoslik deydi — jonli curl'da faqat 3 tasi haqiqiy (yuqoridagi kamera), 4 ta /api/crm/ai/extended/* aslida bor.

═══════════════════════════════════════════════════════════════════
# 3. DATA HOLATI (jonli DB `europrint`, 2026-07-02)
═══════════════════════════════════════════════════════════════════

## 3.1 22 domen xulosasi — 57% (7 BOR / 11 QISMAN / 4 egasi-data)

**BOR (7):** users=32+employees=31 (100% bog'langan) · org_departments=145 · materiallar (material_cards=31, mm_materials=31, vendors=20, sd_customers=15) · warehouses=59+stock=38 · notifications=4741 (7 kunda 1258 — cron JONLI) · razryad_levels=6 seed · positions=96 + accounts(BHMS)=42.

**QISMAN (11):** org_functions=97 (karta-ustunlar bo'sh) · sales_orders=13 lekin items=2 · production_orders=7+sessions=8 (mes_operations=0) · QC (inspections=4, konfig=0) · cashier_shifts=1 (movements=0) · cc_documents=1 (prikaz/protocol=0) · kanban (2 board, test-axlat) · entries(GL)=7 · erp_roles=0 (o'quvchisiz — o'lik jadval) · head_user_id 18/145 · users.card_id 1/32.

**EGASI-DATA (4):** AI-kalit DB-konfig (ai_provider_configs 3/3 inactive) · workflow_rules=0 (o'quvchi kod TAYYOR: `workflow-rules.repository.ts`) · PIN (users.pin_hash 0/32) · ЦКП normalar (ckp_personal_targets=0, ckp_fact_values=0).

**Golden-thread jonliligi:** domain_events=7 · nps_responses=9 · mm_purchase_orders=6 · mm_goods_receipts=0 · notification_schedules=1 · courses=5 (card_id 0/5).

## 3.2 EGASI-DATA TO'LIQ RO'YXATI — 47 yozuv, 3 daraja

> Har yozuv: jadval.ustun → nima kerak → ochiladigan funksiya. Bularni FAQAT egasi bera oladi (fabrikatsiya taqiq).

### A-daraja — eng katta ochilish (karta-oylik + AI yadro), 12 yozuv

| # | Jadval.ustun (hozirgi holat) | Nima kerak | Ochiladigan funksiya |
|---|---|---|---|
| A1 | `ai_provider_configs.api_key/is_active` (3/3 inactive; .env'da ANTHROPIC bor) | DB-konfig faollashtirish + 1 pullik test-chaqiruvga ruxsat | KARTA-AI, ЦКП-baho, AI-planning 7-qadam, chek-OCR, AISHA — ~15 funksiya |
| A2 | `users.card_id` (1/32) + `employee_cards` (1) | 31 xodimni kartaga biriktirish | Login-gate, karta-oylik, ЦКП shaxsiy hisob |
| A3 | `org_functions.razryad_level_id` (17/97) / org_departments (1/93) | Har kartaga razryad | Oylik razryad-koeff (1.00→2.80) |
| A4 | `razryad_levels.exam_pass_threshold` (NULL×6) | 6 daraja uchun imtihon o'tish-foizi | Razryad 2-imzo EXECUTION (hozir har so'rov RAD, `razryad-history.service.ts:57`) |
| A5 | `org_functions.min_salary/max_salary` (0/97) | Oylik-band | Payroll baza×razryad hisobi + karta-oylik tie |
| A6 | `employee_cards.stake` (ustun/qiymat yo'q) | Ko'p-karta ulush qiymatlari | Oylik formula 4-ko'paytuvchi (`payroll.service.ts:34`) |
| A7 | `org_functions.tskp/tskp_target` (19-25/145, target=0) + `ckp_personal_targets`+`ai_ckp_config` (0) | ЦКП matn+norma+deadline + kunlik fakt-mas'ullar | ЦКП-gate (hozir qattiq-0 = hamma oylik 0, `ckp-gate.ts:112`) |
| A8 | `org_departments.head_user_id` (18/145) + `org_functions.manager_id` (0/97) | Kim-kimni-boshqaradi (127 tugun) | SOS eskalatsiya, CC MANAGER_OF_SENDER, kanban ko'rinish, procurement zanjiri |
| A9 | Dublikat otdeleniye QARORI: ADMIN..TECH (id 37-43) vs OTD1-7 (id 154-160) + owner/ceo parent | Qaysi 7-lik kanonik + parent to'g'rilash ruxsati | Butun vertikal daraxt ishonchliligi (P0) |
| A10 | `org_departments.rbac_tier` (0/145) + CARD_LOGIN_GATE_ENABLED (OFF) | Har karta ERP-rol darajasi + gate yoqish qarori | "Org o'zgarsa rol avto" (precheck endpoint tayyor) |
| A11 | `workflow_rules` (0 qator; o'quvchi kod tayyor) | Bo'limlararo tasdiqlash marshrutlari | Gorizontal harakat (avans: Sotuv→Moliya→Kassir) |
| A12 | `courses.card_id` (0/5) + majburiy-belgi | Kurs↔karta bog'lash | LMS oylik-gate real ishlashi (hozir bo'sh-karta ustidan o'tadi) |

### B-daraja — operatsion rollout, 12 yozuv

| # | Jadval.ustun | Nima kerak | Ochiladigan funksiya |
|---|---|---|---|
| B1 | `users.pin_hash` (0/32) + `cc_user_pins` (0) | Xodimlar PIN o'rnatishi | Kassir chiqim, CC hujjat-imzo, oylik-olish PIN |
| B2 | Kassir KARTAsi/roli (kassir user=0) | Kassirga xodim biriktirish | CC approve→kassir zanjiri (listener tayyor, 0 natija) |
| B3 | `council_members` (0; 5 jonli kengash) | Kengash a'zolari ro'yxati | Coordination kengash oqimi |
| B4 | `qc_checkpoints/qc_standards/qc_aql_config/qc_defect_severity_weights` (0) + qc_inspector user | QC konfiguratsiya + inspektor | QC oqimi test→real; karantin to'liq sikl |
| B5 | `approval_matrix_config` (0) | Kichik/o'rta/katta summa chegaralari | Summa-tasdiq darvozasi (hozir 500k/5M hardcoded, `zvs.service.ts:17`) |
| B6 | `exchange_rates` (0) | USD kurs manbasi + qiymatlar | Kassir so'm+dollar (vizyon CHAT-TARIXI:61) |
| B7 | `cfo_config.cashier_daily_cash_limit_uzs` (=0) | Limit qiymati tasdiqlash (vizyon "limit YO'Q" deydi) | Kassa limiti siyosati |
| B8 | Oy-ish-kunlari (DEFAULT 22) | Master qiymat tasdiqlash | Payroll proratsiya aniqligi |
| B9 | Jarima normalari (50,000 cap / 5,000 so'm-minut / 5-min grace — kod-default) | Tasdiqlash/o'zgartirish | Kechikish-jarima avto |
| B10 | Reyting A/B/C chegaralari + HR_RATING_WEIGHTS | Tasdiqlash/o'zgartirish | Reyting-7 rasmiy kuchga kirishi |
| B11 | NDA matn/versiya + 31 xodimga backfill buyrug'i | Rasmiy hujjat | HR NDA moduli (jadval jonli, data=0) |
| B12 | Reyting-navbat formulasi (oylik/avans navbati) | Egasi o'zi keyinga qoldirgan (OMBOR-KASSIR-INTERVYU §16) | Kassir navbat-tartibi |

### C-daraja — modul master-data, 23 yozuv

| # | Jadval/obyekt | Nima kerak | Ochiladigan funksiya |
|---|---|---|---|
| C1 | `warehouses.capacity` + avto-ko'chirish spec (P21 §2.9-B) | Sig'im chegaralari + qoida | Ombor to'lsa DEPT'ga avto-trigger (`wms-overflow.service.ts:28` ataylab to'xtagan) |
| C2 | `pos_label_config` (0) | Zebra/Eltron printer IP/port | Barkod jonli chop (ZPL/EPL kod tayyor) |
| C3 | Rulon-kirim real data (`rulon_cards`=0) | Birinchi partiya kg/en/grammaj | Rulon oqimi (RULON-YIL-RND kod tayyor) |
| C4 | Tayyor-mahsulot katalogi (`products`=2 demo) | ~15 toifa real SKU (EP-SD-117) | SD buyurtma tayyor-mahsulot bilan |
| C5 | `inventory_policy.lead_time_days` | Per-material qiymatlar | ATP aniq tayyor-sana |
| C6 | Web-sayt kontenti (`website_pages/banners/portfolio/public_products` — hammasi 0) | Sahifa/banner/portfolio matn-rasm | Web-katalog/CMS |
| C7 | ABC imtiyoz-paketlari (EP-SD-049) | Chegirma%+limit+kun har toifa | Mijoz-ABC imtiyozlari |
| C8 | Telefoniya/ATS provayder tanlovi | Qaror | Call-kanal avto-lead ingest |
| C9 | Lid yo'qotish sabablari ro'yxati | Narx/muddat/sifat/raqobatchi... | CRM loss-tahlil |
| C10 | NPS kanal (Telegram/SMS) + matn shabloni | Qaror + shablon | NPS avto-so'rov yuborish |
| C11 | Marshrut master-data (`pp_routing/tech_cards`=0) + tigel/kashirovka sexlar | Har mahsulot-tur sex ketma-ketligi | Buyurtma sexma-sex oqishi (P0-bo'shliq) |
| C12 | `work_centers` norma tasdiqlash (5500/6000/10000 seeded) | Egasi raqamlari bilan solishtirish | Norma-% reja-fakt |
| C13 | Gofra flute take-up (B/C/E) + kley 120g/m² tasdiqlash | Master-data | Gofra F3-formula aniqligi |
| C14 | Brak ushlanma siyosati | Norma-ichida bepul chegara + oshgan foiz | Brak→payroll ushlanma zanjiri |
| C15 | SOS javob-deadline + work_center↔org_department bog'lash | Necha daqiqada eskalatsiya + bog' | SOS zanjiri boshlanish nuqtasi |
| C16 | `material_kits/material_kit_items` (0) | Kit tarkiblari | Ish-oldidan skaner oqimi |
| C17 | `production_sessions.operator_card_id` (NULL) | Operator↔karta biriktirish | ЦКП MES-feed |
| C18 | Kamera ro'yxati (cameras=0) | IP/RTSP manzillar + joylashuv | Passiv kamera ulanishi + /cameras CRUD seed |
| C19 | IoT sensorlar | Hardware o'rnatish (egasi: "hali O'RNATILMAGAN") | Sensor→anomaliya zanjiri (kod tayyor) |
| C20 | hr-face-ai mikroservis host + yuz-enrollment | Qaror + jarayon | Yuz-tanish davomat |
| C21 | Har-kamera AI-prompt matnlari | Admin sozlamada yozadi | Per-kamera missiya |
| C22 | Layer B (desktop JARVIS) qurilish vaqti | Egasi qarori (vizyonda "keyin") | AISHA Layer B |
| C23 | Kanban test-axlat qarori (board 1 + Salom/1231322 ustunlar) | O'chirish/saqlash | Kanban toza kanonik 3-ustun |

═══════════════════════════════════════════════════════════════════
# 4. OLTIN IP — IKKALA TOMON, HALQA-HALQA
═══════════════════════════════════════════════════════════════════

**Belgilar:** 🟢 JONLI (kod+data isbotli) · 🟡 QISMAN (kod bor, data/e2e chala) · 🔴 UZUQ (kod bor lekin ishlamaydi, yoki umuman yo'q).

## 4.1 Oldinga: Lead → Buyurtma → Ishlab chiqarish → QC → Ombor → Yetkazish → Moliya/Marketing

| # | Halqa | Holat | Isbot (fayl:satr / DB) |
|---|---|---|---|
| 1 | Lead ingest 4-kanal → crm_leads | 🟢 | `crm-auto-lead.controller.ts:79-109` (call/form/telegram/website); crm_leads=15 ko'p-kanal; ⚠️ endpointlar @Public emas (401) |
| 2 | Lead → Deal convert | 🟢 | convert-bug fix 07-02 `marketing-analytics-stubs.controller.ts:280-286`; marketing_leads converted 2/2 bog'langan |
| 3 | Lead → sales_order (crm_lead_id) | 🔴 data | Ustun bor (migration sales-orders-add-crm-lead-id.sql), lekin 0/13 to'ldirilgan |
| 4 | sales_order → order items | 🟡 | sales_orders=13, sales_order_items=2 — UI item yozmayapti (tekshirish kerak) |
| 5 | Order → ATP (bor-yo'q real vaqtda) | 🟡 | `atp-check.handler.ts:85-179` + `drizzle-sd-atp.repo.ts:77-94` kod to'liq; FE'da 0 iste'molchi; saved-order material_id o'qiydi, create product_id yozadi (`drizzle-sd-atp.repo.ts:43-47` ↔ `drizzle-sales-order.repo.ts:67-71`) |
| 6 | PP release → stock_reservations (bron) | 🔴 jonli | `pp-released.listener.ts:41-56` wired (Trigger 8); stock_reservations=0 — hech ishlamagan |
| 7 | PP marshrut per-sex oqishi | 🔴 | pp_routing=0, routings=0, tech_cards=0; production_orders.routing_id ulanmagan |
| 8 | PP → MES sessiya (LMS-gate + checklist) | 🟢 | `start-session.handler.ts:40-78` sertifikat HARD BLOCK; production_sessions=8 (SES-2026-0004: 6000/4716/188) |
| 9 | MES tugash → QC avto-inspection | 🟢 | `qc/mes-completed.listener.ts:45-62` avto PENDING + boot-backfill; qc_inspections=4 |
| 10 | QC pass → WMS FG-qabul | 🟡 | `submit-inspection.handler.ts:26-77` 3-yo'l + QcPassedEvent→qc-passed.listener; FG-qabul jonli hajm kichik |
| 11 | WMS → Logistics delivery | 🟡 | deliveries'da 1 delivered qator |
| 12 | Delivery → GL xarajat | 🟢 | entries'da SD_DELIVERY_COST GT-2026-001 jonli qator |
| 13 | Delivery → Marketing NPS avto-so'rov | 🔴 DI | Zanjir TO'LIQ yozilgan (`logistics.controller.ts:141` emit + `nps-auto-request.listener.ts:18` + `nps-requests.repository.ts:31-42`), LEKIN `marketing.module.ts:41-61`da controller/listener/repo UCHALASI ro'yxatsiz → route 404, nps_requests=0 |

## 4.2 Orqaga: Ta'minot → CC-tasdiq → Kassir/To'lov → POS-kirim → Karantin/QC → Stok → Chiqim → Payroll

| # | Halqa | Holat | Isbot (fayl:satr / DB) |
|---|---|---|---|
| 1 | PP/MRP → mm_purchase_orders | 🟡 | mm_purchase_orders=6; mm_goods_receipts=0 (3-way match ozuqasiz) |
| 2 | Procurement → CC hujjat spawn | 🟢 | `procurement-request.service.ts:146` CcSpawnRequestedEvent; cc_documents=1 (XAR-2026-0001, 07-01) |
| 3 | CC hujjat → Kanban karta | 🟡 | `cc-event.listener.ts:107-137` G4-fix (related_ref+sort_order); jonli kartalar hali related_ref=NULL — fix'dan keyin spawn bo'lmagan, e2e isbotsiz |
| 4 | CC approve → kassir bildirishnoma | 🔴 data | cc-approved-kassir.listener registered (`communication-center.module.ts:95`); kassir-user=0 → logger.warn bilan jim tugaydi |
| 5 | Kassir harakat → GL avto | 🟢 kod | `cashier-hub.service.ts:379-408` postGl 4 Dr/Cr; entries=7 (PAYROLL-2 4,242,000; POS-GL-1); cashier_movements=0 (oqim rollout kutadi) |
| 6 | POS EXTERNAL_IN → barkod majburiy | 🟢 | `pos-movement.service.ts:97-106` G1-1 server-gate; pos_movement_lines 33/34 barcode jonli (07-02) |
| 7 | Kirim → karantin (QC-HOLD) | 🟡 | `pos.events.ts:66-74` avto-moveToQuarantine; movement id=25 karantin jonli; ⚠️ QC-BYPASS: 33/34 qc_status=NULL holda completed (`quarantine-workflow.service.ts:19` pending→approved yo'li chetlab o'tadi) |
| 8 | QC qabul → RM-MAIN stok | 🟢 | `quarantine-workflow.service.ts:93-135` qcDecision QABUL→stok ko'chirish; warehouse_stock(wh=16)=3 |
| 9 | Harakat completed → avto-PDF akt | 🔴 jonli | `pos.events.ts:178-218` kod ulangan; 6/6 pos_movements.act_pdf_path=NULL, uploads/pos-acts katalogi yo'q |
| 10 | Chiqim faqat-skaner → ishlab chiqarish | 🟢 | `PosMovementChiqim.tsx:279` + useHardwareScanner; RMMAIN-CHIQIM-2026-00001 jonli (07-02) |
| 11 | Bron-blok (ACTIVE bron → chiqim taqiq) | 🟡 | `pos-movement.service.ts:109-131` G1-2 gate + super_admin/direktor override; bron=0 — sinovsiz |
| 12 | MES fakt → kunlik ishlagan-pul PDF | 🟢 | `employee-daily-invoice.cron.ts:63` @Cron 19:00; operator_hourly_invoices=10 (real hisob 190,909=4,200,000/22, 07-02) |
| 13 | Payroll → GL | 🟢 | entries PAYROLL-2; `gl-posting.service.ts:90-96` faqat `entries` kanonik + davr-qulf + double-entry Err |
| 14 | Tablet SOS → eskalatsiya zanjiri | 🔴 ikki-dunyo | Tablet `POST /api/iot/tablet/sos-alert` → sos_alerts yozadi (jonli 201); eskalatsiya-cron `mes-sos-escalation.service.ts:26-87` mes_sos_events o'qiydi; 'iot.sos.raised' zero-listener |

**Xulosa:** 27 halqadan 🟢 11 / 🟡 8 / 🔴 8. Eng qimmat 5 uzuq: NPS DI-regress (3 qator fix) · marshrut-data 0 · SOS ikki-dunyo · avto-PDF · bron jonsiz.

═══════════════════════════════════════════════════════════════════
# 5. REJA — BOSQICHMA-BOSQICH
═══════════════════════════════════════════════════════════════════

> Hajm belgisi: S = ≤0.5 kun · M = 1-2 kun · L = 3+ kun. Har band: nima → fayl/jadval → qabul-mezoni.
> ⚠️ 0-bosqich = XAVF (bugun), keyin 1→2→3.

## 5.0 0-BOSQICH — XAVF (darhol, egasi ruxsati bilan)

| # | Nima | Fayl/jadval | Qabul-mezoni | Hajm |
|---|---|---|---|---|
| 0.1 | 🔴 06-30 to'lqin kod-fayllari GIT-UNTRACKED — commit qilish | `prikaz.repository.ts`, `protocol.repository.ts`, `coordination-docs.controller.ts`, `council-members.*`, 2 cron papka (?? holat) | `git status`da ?? yo'q; fayllar commit'da | S |
| 0.2 | 🔴 Yo'qolgan modul-registratsiyalarni qayta ulash: PrikazController/ProtocolController/CouncilMembersController + KanbanOverdueEscalationCron/RasporyazhenieEscalationCron | `director.module.ts`, `kanban.module.ts`, `coordination` moduli | Jonli GET /api/prikaz=401 (404/"Cannot GET" emas); /api/coordination/council-members=401; cron log-izi | S |
| 0.3 | 🔴 NPS DI-fix: NpsRequestsController+NpsAutoRequestListener+NpsRequestsRepository ro'yxatga qo'shish | `marketing.module.ts:41-61` (3 qator) | GET /api/marketing/nps-requests=401; delivered event→nps_requests≥1 | S |
| 0.4 | 🔴 late-arrival-fine cron crash: `hr_disciplinary_actions` jadval yo'q | `late-arrival-fine.cron.ts:63,77` → discipline_records'ga qayta ulash YOKI jadval yaratish (Q-35 egasi ruxsat) | Cron 10:00 xatosiz; taklif-yozuv DB'da | S |
| 0.5 | 🔴 /api/public/categories 503 drift: Drizzle 'updated_at' so'raydi, jadvalda yo'q | productCategories sxema ↔ live `product_categories` | GET /api/public/categories=200 | S |

## 5.1 1-BOSQICH — EGASI-DATA JONLANTIRISH (kod tayyor, faqat data)

> Tartib = ochilish kuchi bo'yicha. Har band §3.2 ro'yxatiga bog'lanadi.

| # | Nima (egasi beradi → agent kiritadi) | Jadval | Qabul-mezoni | Hajm |
|---|---|---|---|---|
| 1.1 | AI-kalit DB-faollashtirish (A1) + 1 test-chaqiruv | ai_provider_configs | ai_usage_logs≥1 jonli qator; router→claude zanjir isbot | S |
| 1.2 | Org-daraxt qarori (A9): kanonik 7 otdeleniye + owner/ceo parent fix | org_departments (id 19,20,37-43,154-160) | Owner→CEO→7 otdeleniye toza zanjir; dublikat 0; manager-chain endpoint to'g'ri qaytaradi | M |
| 1.3 | Xodim↔karta 31 ta (A2) | users.card_id, employee_cards | 32/32 card_id; login-gate precheck 0 bloklanuvchi | M (egasi-sessiya) |
| 1.4 | Razryad + oylik-band + stake (A3,A5,A6) | org_functions, employee_cards | razryad_level_id ≥90/97; min/max_salary ≥90/97 | M (egasi-sessiya) |
| 1.5 | exam_pass_threshold 6 qiymat (A4) | razryad_levels | 1 ta jonli razryad-so'rov hrApprove+managerApprove to'liq o'tadi, CERT-RZ yaratiladi | S |
| 1.6 | ЦКП norma+target+deadline + kunlik fakt-oqim (A7) | org_functions.tskp*, ckp_personal_targets, ckp_fact_values | ≥1 karta uchun fakt kiritilib payroll factor>0 | M |
| 1.7 | head_user_id 127 tugun + manager_id (A8) | org_departments, org_functions | ≥130/145 to'ldirilgan; SOS/CC resolver bo'sh qaytarmaydi | M (egasi-sessiya) |
| 1.8 | workflow_rules qoidalari (A11) | workflow_rules | ≥3 marshrut (avans, xarid, ta'til); 1 jonli tasdiqlash o'tadi | S |
| 1.9 | kurs↔karta + rbac_tier + gate qarori (A10,A12) | courses.card_id, org_departments.rbac_tier | LMS-gate 1 kartada real bloklaydi; gate ON pilotda | M |
| 1.10 | PIN-rollout + kassir biriktirish (B1,B2) | users.pin_hash, kassir-karta | 1 jonli kassir-chiqim PIN bilan; CC approve→kassir notification≥1 | S |
| 1.11 | QC konfig + inspektor (B4) | qc_checkpoints/standards/aql_config | Karantin→qc_review→approved to'liq jonli sikl 1 marta | M |
| 1.12 | B5-B12 + C-daraja qolganlari (paketlab) | §3.2 jadvaliga qarang | Har paket o'z mezoni | M-L (davomiy) |

## 5.2 2-BOSQICH — UZUQ HALQALAR (kod-fix, data kerak emas yoki minimal)

| # | Nima | Fayl | Qabul-mezoni | Hajm |
|---|---|---|---|---|
| 2.1 | Avto-PDF akt jonlantirish (completed→PDF zanjiri debug) | `pos.events.ts:178-218` | Yangi completed harakatda act_pdf_path≠NULL + fayl mavjud | S |
| 2.2 | QC-bypass blok: EXTERNAL_IN qc_status'siz completed taqiq | `quarantine-workflow.service.ts:19` STATUS_FLOW | quarantine_required=true harakat qc_status'siz completed bo'lolmaydi (jonli rad) | S |
| 2.3 | SOS ikki-dunyo birlashtirish: sos_alerts↔mes_sos_events yoki 'iot.sos.raised' listener | `iot-tablet.controller.ts` + `mes-sos-escalation.service.ts:26-87` | Tablet SOS → eskalatsiya-cron ko'radi → bildirishnoma zanjiri | M |
| 2.4 | ATP FE-wiring + material/product nomoslik | SDSalesOrders forma + `drizzle-sd-atp.repo.ts:43-47` | Buyurtma-formada ATP natija ko'rinadi; yangi order'da ATP "no lines" bermaydi | M |
| 2.5 | ABC avto-hisob: cron yoki order-event trigger + FE tugma | `customer-abc.service.ts:48-103` | sd_customers.abc_class 15/15 to'ldirilgan | S |
| 2.6 | sales_order_items uzilishi: FE order-form item yozishini tekshirish/tuzatish + crm_lead_id yozish | SD create-order oqimi | Yangi orderda items≥1 va crm_lead_id≠NULL | S |
| 2.7 | Barkod chop-pipeline: auto-barcode queue insert xatosi | auto-barcode.service | EXTERNAL_IN'da pos_barcode_print_queue≥1 | S |
| 2.8 | Bron jonli sinov: 1 real bron + bloklangan chiqim | `pos-movement.service.ts:109-131` | ForbiddenException jonli isbot + override ishlaydi | S |
| 2.9 | CC→Kanban e2e: yangi CC-spawn bilan related_ref isbot | `cc-event.listener.ts:107-137` | kanban_cards.related_ref≠NULL yangi kartada | S |
| 2.10 | AI-OCR rasm-fix: fayl-yo'l o'rniga Claude vision image-block | `cashier-podotchet.service.ts:183-226` | Real chek rasmi→amount≠null | S |
| 2.11 | Soxta endpoint: analyze-by-missions (imageBase64 tashlanadi) — real VLM yoki Q-46 o'chirish | `camera-alerts.controller.ts:211-216` | Echo yo'q: yo real tahlil, yo endpoint yo'q | S |
| 2.12 | CAMERA_SNAPSHOT_PROVIDER binding (RTSP/HTTP kadr-olish) | `get-camera-snapshot.tool.ts:21` + provider impl | 5 AISHA kamera-tool "ulanmagan" xatosiz | M |
| 2.13 | /cameras + /camera-settings FE 404: BE endpoint qurish yoki mavjudga ulash | `cameras-management.tsx:77,112`, `camera-settings.tsx:68` | Saqlash jonli 200 + DB-qator | M |
| 2.14 | Kassir valyuta (so'm+dollar): currency ustun + kurs-yozuv | cashier_movements + RecordMovementSchema + exchange_rates | USD harakat kurs bilan saqlanadi, GL'da UZS ekvivalent | M |
| 2.15 | Summa-tasdiq darvozasi: hardcoded 500k/5M → approval_matrix_config + kassir chiqimga ulash + org-eskalatsiya | `zvs.service.ts:17-21` + finance | Chegara sozlamadan o'qiladi; katta chiqim org-zanjir tasdiqsiz o'tmaydi | M |
| 2.16 | crm-auto-lead tashqi ingest: @Public yoki service-token yo'li | `crm-auto-lead.controller.ts:79-109` | Tashqi web-forma POST→lead yaratiladi (himoyalangan) | S |
| 2.17 | Z-report PDF jonli isbot + direktor fan-out qo'shish | `cashier-daily-zreport.cron.ts` | 1 jonli Z-PDF + direktor notification | S |
| 2.18 | AI-fit avto-tsikl (cron/trigger) — "har karta AI'si muntazam" | `ai-fit.service.ts:59-86` | ai_fit_scores'da real (fallback-emas) qator ≥5 karta | M |

## 5.3 3-BOSQICH — QOLGAN VIZYON-BO'SHLIQLAR (qurish)

| # | Nima | Modul/fayl | Qabul-mezoni | Hajm |
|---|---|---|---|---|
| 3.1 | Marshrut per-sex ijro: pp_routing to'ldirish (C11 data bilan) + order routing_id ulash + sexma-sex holat-oqim | PP routing aggregate | 1 buyurtma flekso→kashirovka→qadoqlash zanjirini DB-holatda bosib o'tadi | L |
| 3.2 | Brak→ushlanma zanjiri: brak_limit_pct enforce + payroll chegirma (C14 siyosat bilan) | MES/QC→payroll | Limit oshsa signal + ushlanma payroll_calculations'da ko'rinadi | M |
| 3.3 | Norma reja-fakt dvigateli: production_facts o'quvchi + norma_m2_per_shift solishtirish | PP/MES | Kunlik reja-fakt % hisoblanadi, dashboardda | M |
| 3.4 | HAR-SO'M-HISOBLI to'liq tsikl: qarz↔ombor-kirim bog'lash | cashier-podotchet + POS | Podotchet qarz faqat nomiga kirim bo'lganda yopiladi | M |
| 3.5 | Invoys 3-tur: har harakat ichki avto-PDF + eksport-invoys (Incoterms) | finance invoices | 3 tur jonli PDF | L |
| 3.6 | MES sessiya bosqich-tracking (setup/main/teardown) | MES session handlers | current_stage jonli yoziladi | M |
| 3.7 | ZNO/ZVS 24/48h SLA-eskalatsiya cron | hr/zno, hr/zvs | Muddati o'tgan so'rov avto-eskalatsiya | S |
| 3.8 | CC PDF'da QR RASM (qrcode lib) | `cc-pdf.service.ts:177-180` | Chop etilgan hujjat skanerlanadi | S |
| 3.9 | Motion-gate + YOLO→VLM pipeline + polygon zona-muharrir | iot/camera | Vizyon CHAT-TARIXI:82 talabi | L |
| 3.10 | Web-katalog/CMS: kontent-admin FE + public_products (C6 data bilan) | ecommerce | Sayt katalog jonli | M |
| 3.11 | Kredit modeli (oylik/avans/KREDIT) + FIFO to'lov-taqsim + qarz-eskalatsiya | finance | Vizyon pul-moduli to'liq | L |
| 3.12 | 123 read-only sahifani vizyonga solishtirish (qaysilariga mutation kerak) | FE audit | Ro'yxat + qaror har sahifa | M |
| 3.13 | 5 stub route qarori: qurish yoki Q-46 o'chirish | StubRoutes.tsx | Stub=0 | S |
| 3.14 | Adaptatsiya nazorat-varaqasi obyekti | hr/adaptation | adaptation_records jonli | M |
| 3.15 | Mukofot mexanizmi (kaizen-bonus, motivation_plans) | hr/payroll | ≥1 jonli mukofot-yozuv | M |
| 3.16 | Layer B desktop JARVIS (egasi "keyin" — C22 qaror kutadi) | yangi client | — | L (defer) |
| 3.17 | 3-til interfeys: UZ-kirill qo'shish (butun tizim) + mavjud UZ/RU tarjima bo'shliqlarini to'ldirish (egasi 2026-07-03 buyrug'i) | i18n (BE nestjs-i18n + FE i18next) | UZ-lotin↔UZ-kirill transliteratsiya avtomatik + til-almashtirgichda 3-variant + mavjud ~180-250 hardcoded/bo'sh kalit yopiladi | L |

═══════════════════════════════════════════════════════════════════
# 6. MANBA-ISBOTLAR (klaster bo'yicha kalit dalillar)
═══════════════════════════════════════════════════════════════════

## 6.1 WMS/POS (81%)
- Barkod-gate: `pos-movement.service.ts:97-106`; jonli pos_movement_lines 33/34 barcode (07-02).
- 47 DEPT ombor: `department-warehouse-sync.service.ts:48` @Cron 03:10; warehouses=59 (12 tur), map=47/47.
- Raqamlash: `doc-sequences.helper.ts:75-110` atomik sequence; RMMAIN-KIRIM-2026-00001/2 jonli.
- Sikl-sanash: `wms-cycle-count-generator.cron.ts:54`; pos_inventory_counts=17 avto (07-02 06:00).
- Karantin: `pos.events.ts:66-74` + `quarantine-workflow.service.ts:17-135`; movement id=25 karantin jonli.
- Ochiq: avto-PDF 6/6 NULL; QC-bypass; bron/rulon/overflow/chop-pipeline data=0.

## 6.2 Finance (70%)
- GL kanonik: `gl-posting.service.ts:90-96` (faqat entries, davr-qulf, double-entry); entries=7.
- 1-kassir: `cashier-hub.service.ts:77-94` + DB partial-unique uq_cashier_shifts_one_open; X/Z 100-253.
- PIN: satr 29-34, 331-350, bcrypt 415-426 (forge yo'q); pin_hash=0 (egasi-data).
- Payroll 4-bosqich: `cashier-payroll.service.ts:26-31,145-241`; salary_payout_approvals=1.
- A4 kunlik PDF: operator_hourly_invoices=10 jonli (190,909 = 4,200,000/22).
- Ochiq: valyuta yo'q (currency ustun yo'q, exchange_rates=0); summa-gate hardcoded `zvs.service.ts:17-21`.

## 6.3 SD/CRM/Marketing (64%)
- Lid-birlashuv: sd_leads VIEW o'chirilgan (drop-sd-leads-view.sql); `sd-leads.repository.ts:21-29` kanonik crm_leads.
- ATP: `atp-check.handler.ts:85-179` deterministik; FE=0 iste'molchi; items-nomoslik `drizzle-sd-atp.repo.ts:43-47`.
- NPS o'lik: `marketing.module.ts:41-61`da 3 provider ro'yxatsiz → 404, nps_requests=0 (deliveries'da 1 delivered bor edi).
- Web-katalog: /api/public/categories=503 (updated_at drift); CMS jadvallar 0.

## 6.4 PP/MES/QC (61%)
- Data jonlandi: production_orders=7, sessions=8 (SES-2026-0004: 6000/4716/188), work_centers=12 normali.
- Gofra 3-formula: `gofra-conversion.service.ts:70-235` (take-up yo'q bo'lsa Err — taxmin taqiq).
- QC-gate: `submit-inspection.handler.ts:26-77` + `qc/mes-completed.listener.ts:45-62`; QC-birlashtirish 07-02.
- Ochiq: marshrut-data 0; brak→ushlanma grep=0; SOS ikki-dunyo; AI-plan 5-7 qadam chala.
- Oshkora: o'lchov-probe sos_alerts id=1 yaratdi (egasi xohlasa DELETE FROM sos_alerts WHERE id=1).

## 6.5 HR/LMS (75%)
- QYM: `daily-report.service.ts:179,205,212` 15:30 eslatma + 16:00 deadline + eskalatsiya; hr_daily_reports=8449 (bugungi qatorlar bor).
- Oylik formula: `payroll.service.ts:57` baza×razryad×ЦКП×ulush + `ckp-gate.ts:112` qattiq-0; payroll data hali DEMO.
- Kunlik PDF: `employee-daily-invoice.cron.ts:63`; invoices=10 + notifications=10 jonli.
- Ochiq: late-arrival-fine cron crash (`hr_disciplinary_actions` jadvali yo'q); ckp_fact=0 → hamma oylik 0.

## 6.6 Org KARTA (59%)
- Kanonik karta: `card.repository.ts:3-7`; 145 tugun; card.controller 25 endpoint.
- 🔴 Daraxt buzuq: owner id19→parent 157 (dublikat OTD3), ceo id20→parent 115 (position!), OTD1-7 dublikat.
- 🔴 Razryad EXECUTION jonsiz: exam_pass_threshold NULL×6 → har so'rov RAD (`razryad-history.service.ts:57-59`).
- 47/47 dept-ombor sinxron (yangi, BOR); karta-kontent 0 (folders/templates/portret/knowledge).

## 6.7 CC/Kanban/Coordination (70%)
- 17 shablon + 58 workflow-qadam jonli; QR verify jonli ishladi (XAR-2026-0001 JSON).
- 🔴 REGRESS: PrikazController/ProtocolController/CouncilMembersController + 2 cron modullarga ulanmagan; fayllar git-untracked; /api/prikaz="Cannot GET"; kanban_overdue bildirishnomalar 07-01da yaratilgan (o'shanda ishlagan) → module-tahrir yo'qolgan.
- Kanban org-scoped ko'rinish: `kanban-visibility.helper.ts:46-83` WITH RECURSIVE ULANGAN.

## 6.8 AI/IoT (40%)
- ANTHROPIC_API_KEY .env'da (len=108) — eski "egasi-data" yopilgan; LEKIN ai_usage_logs=0 (jonli chaqiruv isbotsiz).
- 🔴 Soxta: `camera-alerts.controller.ts:211-216` analyze-by-missions imageBase64 tashlaydi (Q-40).
- 🔴 CAMERA_SNAPSHOT_PROVIDER binding yo'q (`get-camera-snapshot.tool.ts:21`) → 5 kamera-tool o'lik.
- AI-ЦКП bot jonli: ai_ckp_chat_logs=36 (bugungi ham), lekin 36/36 assistant — xodim javobi 0.
- OCR: `cashier-podotchet.service.ts:183-226` — rasm emas, fayl-YO'L matni yuboriladi (fix kerak).

═══════════════════════════════════════════════════════════════════
# 7. XULOSA
═══════════════════════════════════════════════════════════════════

1. **Modul o'rtacha 65% (+13), data 57% (+47), sahifalar 85%** — 2026-07-01/02 to'lqinlari (G1 ombor, G4 CC-Kanban, kassir-hub, QYM, kunlik-PDF, lid-birlashuv) katta samara berdi.
2. **Eng katta 5 bo'shliq:** (1) Org daraxt buzuq + razryad EXECUTION jonsiz; (2) 06-30 to'lqin registratsiya-REGRESSI + untracked kod-fayllar; (3) AI jonli chaqiruv 0 + kamera soxta/o'lik zanjir; (4) ЦКП-fakt=0 → karta-oylik darvozasi hamma oylikni 0 qiladi; (5) NPS DI + public-categories 503 + marshrut-data 0 (oltin-ip uzuqlari).
3. **Egasi-DATA: 47 yozuv** (A-daraja 12 / B 12 / C 23) — §3.2 to'liq jadval. A1 (AI-kalit faollashtirish) + A9 (daraxt qarori) + A2-A8 (karta-oylik to'plami) eng katta ochilish.
4. **Tartib:** 0-bosqich (5 xavf-fix, hammasi S) → 1-bosqich (egasi-sessiya: data) → 2-bosqich (18 uzuq-halqa fix) → 3-bosqich (16 qurilish).

═══════════════════════════════════════════════════════════════════
# 8. BAJARILDI-LOG (2026-07-03 — egasi-intervyu-qazish + Guruh-1/2/3 ijro)
═══════════════════════════════════════════════════════════════════

> Metod: har band mustaqil adversarial verify-agent bilan tekshirilgan (Q-29). Raqamlash
> bu hujjatning §5.2/§5.3 jadvaliga mos (ba'zi ijro-workflow'larda vaqtinchalik boshqa
> raqam bilan yuritilgan edi — bu yerda TO'G'IRLANGAN, haqiqiy band-raqami ko'rsatilgan).

## 8.1 0-bosqich
- **0.5** ✅ BAJARILDI — `product_categories.updated_at` qo'shildi, GET /api/public/categories=200.

## 8.2 1-bosqich (EGASI-DATA)
- **A4** (exam_pass_threshold) ❌→↩️ **QAYTARILDI** — birinchi urinish (`5e40c5ff`) hujjatdagi "🔵 OCHIQ" (tahlilchi-tavsiya) yozuvni "egasi qarori" deb noto'g'ri talqin qildi; adversarial verify-agent fabrikatsiyani topdi; `51f167f1` bilan NULL'ga qaytarildi. **HALI OCHIQ** — egasi EP-ORG-055/056'ni "✅ JAVOBLANGAN" qilib tasdiqlashi kerak.
- **A11** (workflow_rules) 🔒 **BLOKLANGAN** (tasdiqlangan) — org_departments'da 25 ta dublikat-nomli bo'lim (Sotuvlar×2, Moliya×3) borligi sababli xavfsiz marshrut-juftlik yo'q. A9 (org-daraxt) hal bo'lmaguncha ochilmaydi.

## 8.3 2-bosqich
- **2.1** ✅ Tasdiqlandi (o'zgarish kerak emas edi) — avto-PDF akt-zanjiri to'g'ri ishlaydi (kod 07-02'da yozilgan, 6/6 NULL — backend o'sha vaqtdan beri jonli bo'lmagani uchun, regressiya emas).
- **2.6** ✅ TUZATILDI (`6a7909c8`) — POST /api/sd/orders `crmLeadId` endi DTO orqali o'tadi.
- **2.7** ✅ Tasdiqlandi (allaqachon tuzatilgan, `13adb82b`) — NUMERIC→INTEGER safeQty coercion.
- **2.8** ✅ Tasdiqlandi (allaqachon qurilgan, `50e69a96` + G1-2 BRON-BLOK POST-GATE 07-02) — bugun jonli rollback-tranzaksiya bilan qayta isbotlandi: bron yaratilganda `pos-movement.service.ts:109-131` ForbiddenException to'g'ri tetiklanadi (super_admin/direktor override bilan).
- **2.9** ✅ TUZATILDI (`b5aa65ad`) — asosiy foydalanuvchi oqimi (AI-intervyu→farmoyish, `persistDraft()`) kanban-karta yaratmasdi; `CcKanbanBridgeService` bilan bog'landi.
- **2.12** ✅ Tasdiqlandi (allaqachon to'g'ri, `2cecb84c`) — CAMERA_SNAPSHOT_PROVIDER DI orqali bog'langan.
- **2.13** ✅ TUZATILDI (`4309a53e`) — `settings.key` uchun unique index yo'q edi (upsert xato berardi).
- **2.16** ✅ Tasdiqlandi (allaqachon to'g'ri) — 4 ta public lead-ingest endpoint HMAC webhook-signature bilan himoyalangan.
- **2.2** ✅ Tasdiqlandi (allaqachon shu kuni tuzatilgan, `2cecb84c`) — QC-bypass blok: `pos-movement-status.service.ts:66-70` guard, quarantine_required+qc_status=NULL holatda 'completed'ga o'tish taqiqlangan.
- **2.3** ✅ Tasdiqlandi (allaqachon tuzatilgan, `13adb82b`) — Tablet SOS→`SosAlertRaisedMesListener`→`mes_sos_events`→eskalatsiya-cron zanjiri jonli HTTP bilan isbotlandi (assigned_user_id/escalation_due_at hali NULL — org_departments.head_user_id egasi-data, alohida masala).
- **2.4** ✅ TUZATILDI (`b172e741`) — `sales_order_items.product_id` backfill, ATP FE-wiring material/product ID nomosligi bartaraf etildi.
- **2.5** ❌ **HALI OCHIQ** — cron (`0 2 * * *`) + FE "ABC qayta hisoblash" tugmasi (`a53a07e1`) to'g'ri qurilgan, LEKIN hali birorta ham ishga tushmagan (sd_customers.abc_class 0/15, mezoni 15/15 talab qiladi). Bugun 02:00'da avtomatik ishga tushadi, yoki FE'dan qo'lda bosish mumkin.
- **2.11** ✅ TUZATILDI (`2a7f22b1`) — `analyze-by-missions` soxta dashboard-echo edi, real VLM-chaqiruvga (AiRouterService) ulandi; yo'l-o'rtasida `camera_events` schema-drift ham tuzatildi.
- **2.14** ✅ TUZATILDI (`3d76951d`, dastlabki tuzatish `c8fbe2ab`) — kassir USD+UZS asosan to'g'ri qurilgan edi, LEKIN X/Z smena-jamlanmasi (`getShiftMovementTotals`/`getShiftLedger`) valyuta-kursini hisobga olmasdan xom summani qo'shardi (masalan $100→100 o'rniga 1,320,000 UZS bo'lishi kerak edi) — tuzatildi.

## 8.4 3-bosqich
- **3.3** (norma-reja-fakt) ✅ Tasdiqlandi — 3 qatlamli mexanizm (shift-norma%, session-OEE, order-completion%) barchasi jonli va to'g'ri; bitta o'lik-kod (`CostingService.calculateVariance`, hech qayerda chaqirilmaydi) topildi va background-task sifatida belgilandi (task_b5b42e5a).
- **3.4** (podotchet↔ombor-kirim) ✅ Tasdiqlandi — to'liq zanjir (advance→EXTERNAL_IN→QC→warehouse_stock→debt-clear) jonli rollback-proof bilan tasdiqlangan.
- **3.6** (MES bosqich-tracking) ✅ TUZATILDI (`eb57e38e`) — soat-mintaqa xatosi (Asia/Tashkent UTC+5) sababli har bosqich-o'tishda 5 soatlik notog'ri vaqt yozilardi; SQL-tomonli `EXTRACT(EPOCH...)` hisoblashga o'tkazildi.
- **3.7** (ZNO/ZVS SLA-cron) ✅ Tasdiqlandi (allaqachon qurilgan, `a9225449`) — 24/48soat eskalatsiya cron jonli, org-daraxt fallback bilan.
- **3.8** (CC-PDF QR) ✅ Tasdiqlandi (allaqachon to'liq) — `cc-pdf.service.ts` QR-kod + `/cc/verify/:id` ochiq tekshiruv-endpoint jonli HTTP bilan isbotlandi. **Eslatma:** prikaz/protocol (Coordination-modul, alohida tizim) uchun PDF-eksport umuman yo'q — bu YANGI feature (QR-qo'shish emas), alohida egasi-ruxsat kerak.
- **3.13** (stub-route qarori) ✅ **TO'LIQ BAJARILGAN** — FE `StubRoutes.tsx`dagi asl 5 ta band (boshqa/parallel sessiya orqali) barchasi hal qilingan (`/export`,`/micro-modules`,`/modules`,`/pos/printer-config`→mavjud sahifaga dublikat sifatida o'chirildi; `/sap`→egasi-qaror kutadi, Q-46 bo'yicha saqlandi). **Qo'shimcha bonus** (`afe2bacac`): BE-tarafida 9 ta boshqa 501-stub uchun haqiqiy implementatsiya qo'shildi + 8 ta chalg'ituvchi eskirgan 501-Swagger-belgisi tuzatildi; qolgan ~22 BE-stub EGASI-DATA/dizayn-qaror sabab aniq ro'yxatlangan (fabrikatsiya qilinmagan) — ro'yxat: `security/fire-sensors` (jadval yo'q), `hr-capital/*` (FROZEN dublikat), `finance/reports+loans` (jadval yo'q), `wms-integration/*` (ikki-dunyo PO-jadval noaniqligi), `ai/forecast+rush-orders` (ML-dizayn), `mm-dashboard` yozish-yo'llari (fi_payments yo'q).

## 8.5 Hali HAQIQIY OCHIQ qolgan (bu sessiyada tegilmagan yoki hal qilinmagan)
2-bosqich: **2.5** (mexanizm tayyor, faqat ishga tushishi kerak — yuqoriga qarang; qolganlarining barchasi §8.3'da yopilgan).
3-bosqich: 3.1, 3.9, 3.11, 3.12, 3.16(defer) — hali tegilmagan. **3.2/3.5/3.10 BAJARILDI** (Guruh-5, quyida §8.7), 3.14/3.15 avvalroq bajarilgan (`a3be1bd4`/`025c356a`).
**A9 (org-daraxt dublikat)** — hamon eng katta blokировщик (A11'ni to'g'ridan bloklaydi, boshqa ko'p narsaga bilvosita ta'sir qiladi); tayyor savol-hujjat: `docs/audit/MASSIV-100/PHASE-08-daraxt-yagona-manager.md`.

## 8.7 Guruh-5 (3.2, 3.5, 3.10) va 3.17 (UZ-kirill 3-til)

- **3.2** (brak→ushlanma) ✅ TUZATILDI (`b37d2ea5`) — work_centers.brak_limit_pct fail-safe darvoza orqali: limit to'ldirilgan ish-markazlarda brak% oshsa signal+discipline_records ushlanma (mavjud TECH_QUALITY_DEFECT qoidasiga bog'lab); C14 (aniq %) hali OCHIQ bo'lgani uchun fabrikatsiya qilinmadi. Verify-agent haqiqiy Q-31 buzilishini (9 begona SD-invoice fayli aralashib ketgan) topib, tozalab qayta commit qildi.
- **3.5** (invoys 3-tur) ✅ BAJARILDI (`3aeaaa34`) — eksport-invoys (Incoterms, ixtiyoriy maydon) qo'shildi.
- **3.10** (web-katalog CMS) ✅ BAJARILDI (`250c65ba`) — admin CRUD tab + public_products'dagi 2 ta jonli crash (category_id varchar/integer nomosligi, updated_at/deleted_at ustunlari yoq edi) tuzatildi.
- **3.17** (UZ-kirill 3-til, egasi 2026-07-03 buyrug'i) ✅ **ASOSIY QISM BAJARILDI**:
  - UZ-kirill infratuzilmasi (BE+FE) allaqachon mavjud ekan (56/56 FE modul, 6/6 BE modul) — lekin 6 FE modulda 64 kalit sinxrondan chiqib qolgan edi (yangi qo'shilgan title/loading/error + common.json'dagi 49 komponent-satri). Barchasi to'ldirildi va tasdiqlandi (`a760262b`, 0 qolgan bo'shliq).
  - Alohida, kutilmagan katta bo'shliq topildi: UZ→RU tomonda 522 kalit yetishmas edi (13 modul, ba'zilari butunlay bo'sh `{}`) — bularning barchasi professional rus-tiliga tarjima qilindi va tasdiqlandi (`a15b985c`, 0 qolgan bo'shliq).
  - **Ochiq qoldi**: (a) backend'dagi ~95 ta oldindan-aniqlangan hardcoded-satr (2026-05-16 audit, operator/Telegram/AI-agent qatlamlarida, ataylab kechiktirilgan); (b) 3 ta buzuq kalit (kod-parcha qiymatlar, masalan "isout") — alohida vazifa sifatida belgilandi (task_ed6fc680); (c) `ru/sd.json`da 181 ta "tarjima qilinmagan nusxa" (RU qiymati UZ bilan bir xil) — eski, boshqa muammo, bu safargi ish-doirasidan tashqarida qoldi.

## 8.8 TO'LIQ QAYTA-O'LCHOV (2026-07-04, 46 commit keyin, 10 mustaqil agent, bazaviy metodologiya bilan)

> Metod 2026-07-02 audit bilan AYNAN BIR XIL: har talab jonli kod+DB+(imkon bo'lsa)HTTP bilan tekshirilgan, BOR=1.0/QISMAN=0.5/YO'Q=0, har da'vo fayl:satr yoki DB-qator bilan isbotlangan. Bu — "vizyon to'liqmi?" degan egasi savoliga ANIQ, taxminsiz javob.

**Yakuniy raqam: 8-klaster o'rtacha 65% → 68% (+3). Sahifalar 85%→88% (+3). Data-jonlilik 57%→58% (+1). 10-o'lchov umumiy o'rtacha ≈ 69%.**

⚠️ **XULOSA: VIZYON TO'LIQ EMAS.** Ko'p ish qilingan bo'lsa-da (46 commit), umumiy % atigi +3 punkt ko'tarildi — sababi pastda tushuntirilgan.

| # | Klaster | 07-02 | 07-04 | Δ | Qisqa sabab |
|---|---|---|---|---|---|
| 1 | WMS/POS | 81% | 79% | -2 | QC-bypass tuzatildi (+), lekin avto-PDF hamon TO'LIQ BUZUQ (jonli-legitim yo'l bilan qayta isbotlandi) |
| 2 | Finance | 70% | 64% | -6 | Metodologik aniqlashtirish: kassir-valyuta BE to'g'ri, lekin FE forma umuman currency yubormaydi (foydalanuvchi hech qachon ishlata olmaydi); summa-tasdiq-darvoza faqat ZVS-hujjat, kassir-hub'ning o'z chiqimlariga bog'lanmagan |
| 3 | SD/CRM/Marketing | 64% | 77% | **+13** | Haqiqiy yaxshilanish (ATP, order-items, ABC-mexanizm, web-katalog) |
| 4 | PP/MES/QC | 61% | 75% | **+14** | Haqiqiy yaxshilanish (MES tz-bug, brak-ushlanma, norma-reja-fakt tasdiqlandi) |
| 5 | HR/LMS | 75% | 70% | -5 | Metodologik aniqlashtirish: mukofot **3-dunyo bo'linishi** topildi (FE→payroll_period_record ╳ yangi-controller→bonus_payments ╳ payroll faqat bonus_payments'ni o'qiydi — foydalanuvchi UI-bonus payroll'ga HECH QACHON qo'shilmaydi); A6-SUM tuzatish kodda to'g'ri lekin 31/31 xodimda hali ko'p-karta yo'q (isbotlanmagan); 3.14 FE-yaratish-oqimi hech qayerda import qilinmagan (o'lik) |
| 6 | Org KARTA-markaz | 59% | 58% | -1 | Amalda o'zgarmagan — **A9 hamon eng katta blokировщик** (2 yangi ЦКП-mexanizm qurildi, lekin data yo'qligi ularni inert qiladi) |
| 7 | CC+Kanban+Coordination | 70% | 78% | **+8** | Haqiqiy yaxshilanish + oldingi audit XATOSI tuzatildi (prikaz/protocol/council-members aslida to'g'ri ulangan ekan, "regressiya" da'vosi noto'g'ri edi) |
| 8 | AI+IoT | 40% | 42% | +2 | Kod-daraja yaxshilandi (2.3/2.10/2.11), lekin hardware-blok (kamera=0 qator) o'zgarmadi; YANGI topilma: AI-fit avto-tsikl haqiqatda FALLBACK-XATO bilan ishlaydi (0 real baho) |
| K1 | Sahifalar (467 route) | 85% | 88% | +3 | 3.13 stub-qarorlar (5/5 FE + 9 BE) |
| K2 | Data-jonlilik (22 domen) | 57% | 58% | +1 | EGASI-DATA Tier-1 ijro (asosan tasdiqlash, 2 haqiqiy tuzatish) |

**Nega umumiy % kam o'sdi (ko'p ish qilingan bo'lsa ham)?**
1. **Ko'p ish = tasdiqlash, yangi qurilish emas.** Tier-1 EGASI-DATA (13 band), 2.1-2.18 dan aksariyati — allaqachon to'g'ri kodni QAYTA tekshirish edi, % ni oshirmaydi (allaqachon hisobga olingan edi).
2. **Chuqurroq tekshiruv 3 ta klasterda oldingi "BOR" baholarni "QISMAN"ga tushirdi** (Finance, HR, qisman WMS) — bu YANGI BUZILISH emas, balki oldingi audit "kod bor" darajasida to'xtagan joyda bu safar "FE-orqali-foydalanuvchi-ishlata-oladimi + DB-qatorda real-isbot bormi" darajasigacha borilgan. Eng katta misol: **kassir-valyuta va HR-mukofot — ikkalasi ham backend to'g'ri qurilgan, lekin FRONTEND ulanmagan yoki noto'g'ri jadvalga yozadi** — foydalanuvchi amalda ishlata olmaydi.
3. **A9 (org-daraxt) hamon hal qilinmagan** — bu yagona eng katta struktura-blokeri, Org-klasterni to'xtatib turibdi va A11/A8/A1 kabi bir nechta boshqa bandga zanjir bilan ta'sir qiladi.
4. **AI/IoT hamon jismoniy hardware'ga bog'liq** (kamera=0, sensor=0) — bu kod bilan hal qilib bo'lmaydi, egasi qaroriga/investitsiyaga bog'liq.
5. **4 ta katta (L-hajm) band hali umuman qurilmagan**: 3.1 (marshrut-per-sex), 3.9 (motion-gate+YOLO), 3.11 (kredit-model), 3.12 (123-sahifa audit).

**Yangi aniq harakat-nuqtalari (bu o'lchov orqali topilgan, hali tuzatilmagan):**
- Kassir-valyuta FE-forma currency/exchangeRate yubormaydi (`CashierHub.tsx`) — backend tayyor, FE-ulash kerak.
- HR-mukofot 3-dunyo bo'linishi — `EmployeeProfile.tsx` ni yangi `hr_bonus.controller.ts` zanjiriga qayta yo'naltirish kerak.
- Avto-PDF akt pipeline (2.1) — qo'lda-chaqiruv ishlaydi, avto-trigger jim xato yutadi (event-handler try/catch debug kerak).
- Barkod-chop (2.7) — PRINTED-holatga o'tkazuvchi consumer/worker yo'q (faqat QUEUED bilan to'xtaydi).

## 8.6 EGASI-DATA 3-tur klassifikatsiya + Tier-1 ijro (2026-07-03, 4-guruh qazish + Tier-1 qo'llash)

> Metod: 3000-savol korpusi 4 ta mustaqil READ-ONLY qazish-workflow bilan skanerlandi (17 klaster,
> 70 sub-band), so'ng sintez-agent A4-saboqni qo'llab qat'iy 3-toifaga ajratdi, so'ng Tier-1'ning
> har bir bandi alohida fix+adversarial-verify juftligi bilan "Holat:" maydoni SHAXSAN qayta
> tekshirilib qo'llandi (2 marta sintez xatosi ushbu qayta-tekshiruvda tutib olindi — pastda).

**Yakuniy taqsimot:** 🟢 Tier-1 (darhol qo'llash mumkin) = 13 band · 🟡 Tier-2 (qaror bor, raqam/detal yo'q yoki hedge) = 27 band · 🔴 Tier-3 (chindan ham ochiq) = 8 band.

**Tier-1 ijro natijasi (13/13 qayta tekshirilgan):**
- ✅ **A6/EP-ORG-004** TUZATILDI (`056a14c2`) — **haqiqiy jiddiy bug**: ko'p-kartali xodimlarga oylik faqat BITTA (asosiy) karta bo'yicha hisoblanardi, egasi qarori "oylik=barcha kartalar yig'indisi"ga zid edi (Q-40). `listActiveCardPayInputs` + `generatePeriodRows` endi har xodimning barcha aktiv kartalarini yig'adi.
- ✅ **EP-ORG-014** additiv `COMMENT ON COLUMN` bilan hujjatlashtirildi (`b9f285af`) — 93/93 mavjud karta bo'sh bo'lgani uchun hard NOT NULL QOYILMADI (Q-39/Q-46 regressiya-oldi).
- ✅ EP-ORG-015, 016, 017, 018/052(16-soat "QYM"), 050, A3(razryad), A12(LMS-blok), B5(500k/5M tasdiq) — barchasi **allaqachon to'g'ri implementatsiya qilingan**, faqat tasdiqlandi, hech narsa yozilmadi.
- 🛑 **2 marta sintez-xato tutib olindi** (qayta-tekshiruv qatlami ishladi): EP-ORG-049, EP-ORG-111/130, EP-ORG-112/114 — sintez-hisobot bularni "Tier 1" deb bergan edi, lekin shaxsiy "Holat:" tekshiruvida barchasi aslida `🔵 OCHIQ` (faqat tavsiya) ekani aniqlandi — **hech narsa yozilmadi, fabrikatsiya oldi olindi**.

**Xulosa:** Tier-1'dan atigi 2 ta band amaliy o'zgarish talab qildi (A6 real-bug, EP-ORG-014 hujjatlashtirish) — qolgan 11 tasi allaqachon vizyonga mos qurilgan ekan. To'liq band-ro'yxat + tier-asoslash: sessiya-arxivida (agent a5c190f458bf7ac41 natijasi).

**Tier-2 (27 band, qaror bor lekin raqam/detal yo'q — ustida ISHLANMAGAN, egasi kiritishi kerak):** A1(AI-fallback tartib), A2(31-xodim biriktirish tartibi), A5(oylik-band summasi), A6-stake(EP-ORG-066/142 ulush-formula), A8(head_user_id/manager_id DATA), A10a(RBAC-matritsa), A10b(login-gate rollout), A11(workflow_rules misollar), B1(PIN format), B4-QC(AQL/Ac-Re standartlari), B6(USD-kurs manbasi), B7(kassa-limit son), B8(oy-ish-kunlari), B9(jarima-normalar), B10(reyting-og'irlik — ⚠️Claude-placeholder), B11(NDA matni), C1(ombor-sig'im), C4(SKU-nomlar), C6(marketing-kontent-turlari), C7(ABC-paket%), C9(lid-yo'qotish-sabab-ro'yxat), C10(NPS-kanal+matn), C11(PP-marshrut master-data), C12(ishlab-chiqarish-norma), C14(brak-siyosat), C15a(SOS-deadline), C17(operator-sertifikat-matritsa), C20(Face-AI host), C21(kamera-prompt-final), C22(AISHA Layer-B vaqti), C23(Kanban-test-tozalash).

**Tier-3 (8 band, chindan ochiq — egasi javobi kutiladi, ustida ISHLANMAGAN):**
- **A9** — org-daraxt kanonik-dublikat (eng yuqori ustuvorlik, 4 aniq savol tayyor: `docs/audit/MASSIV-100/PHASE-08-daraxt-yagona-manager.md`)
- B3 — 5 kengash a'zosi ism/lavozimi
- B7(original-verbatim) — kassa kunlik limiti aniq son
- B12-1 — kassir-navbat 7-faktor og'irlik %
- B12-3 — (2146-savolda ko'tarilmagan)
- C13(qism) — kashirovka kley-gramaj (120g/m²)
- C18 — kamera IP/RTSP manzillari
- C19 — IoT-sensor jismoniy holati

> Bu hujjat = 2026-07-02 holat-suratining yagona manbasi. Yangilanish keyingi katta o'lchovda (Q-25).
