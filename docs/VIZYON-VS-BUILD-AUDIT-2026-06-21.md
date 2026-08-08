# VIZYON ⟷ QURILGAN HOLAT — TO'LIQ MOSLIK AUDITI (2026-06-21)

> 40-agentli READ-ONLY audit. Har agent: egasining intervyu/vizyon javoblarini (docs/audit/MASTER-SAVOL-JAVOB, VISION-1000, OCHIQ-JAVOBLAR, OMBOR-KASSIR-INTERVYU, KARTALAR-JAVOBLAR, CHAT-TARIXI, MUSLIMBEK-PROMT-01..22, MASSIV-50) o'qib, JONLI build (DB + endpoint + kod) bilan solishtirdi. 22 modul + 18 vizyon-mavzu = 40 yo'nalish.

## QISQA XULOSA

**Umumiy moslik: ~55%.** Taqsimot: 2 to'liq mos · 12 asosan mos · 22 qisman · **4 zid**.

- ✅ **POYDEVOR BOR:** 20+ modul boot bo'ladi, ~750 endpoint, jadvallar yaratilgan, dizayn-tizim, 3-til, xavfsizlik (4 guard).
- ❌ **VIZYON-XULQ ko'p joyda yo'q yoki noto'g'ri.** Uchta naqsh takrorlanadi:
  1. **FAKE (yashil-lekin-noto'g'ri, Q-40):** endpoint 200 qaytaradi, lekin bo'sh/echo/hardcoded — AI-planning, karta-AI fit, 3-way match, company-state, golden-thread (seed bilan, event bilan emas).
  2. **NOTO'G'RI MODEL (egasi javobiga ZID):** POS ichida kassir bor; razryad koeffitsiyent (band emas) + u ham ishlamaydi; LMS darslik bo'limга (kartaga emas); ROI byudjet-asosli (foyda emas); CC direktorga emas boshliqqa; HR deadline 20:00 (16:00 emas).
  3. **MA'LUMOT-O'LIK / YO'Q:** Vysotskiy manager_id 100% NULL; workflow_rules 0 qator; oylik-band NULL; ai_fit_scores 0; company_state_log 0; PP 7-qadam planner yo'q.
- ⚠️ **IKKI-OLAM (canonical buzilishi)** hamon ko'p: pos-v2 dublikat modul, mm_materials╳material_cards, kanban_cards╳kanban_tasks, 3 ta director-state modeli, gl_lines yozish yo'li.

---

## EGASI ALOHIDA SO'RAGAN MODULLAR

### POS Monitor — 72% (asosan mos, lekin ZID bor)
- ✅ To'g'ri: POS = zavod ombori tableti (pos_movements real EXTERNAL_IN, 7 harakat turi, warehouse_stock 37 qator, sidebar yagona `pos-monitor`, kassir Moliyaga ko'chirilgan).
- ❌ **ZID:** `CashRegisterController` HALI `@Controller('pos')` da jonli — /api/pos/products (sotuv), /transactions, /refund, /dashboard (kassa metrikalari). Egasi: "POS kassir EMAS". `pos_movements`'da `cash_amount/cash_paid` ustunlari. Orphan kassir-FE (CartPanel/PaymentDialog) qolgan.
- ❌ Bo'shliq: GL ko'prik ishlatilmagan (pos_gl_postings=0); **pos-v2 dublikat modul** jonli; pos_movements_legacy/_archive qoldiq.

### Omborlar (WMS) — 58% (qisman)
- ✅ To'g'ri: 12 ombor, 9 tur, FIFO/FEFO batch issue REAL, karantin→QC kirim wizard, ABC/dead-stock, ijara.
- ❌ **Bo'shliq:** `rulon_cards` jadval YO'Q → /api/wms/rulon-cards **503** (egasining "eng qimmat" rulon qog'oz ombori qurilmagan); overflow logikasi (+2kg dept / -2 main) YO'Q; WMS→GL avto-post (EP-WMS-109) YO'Q; locator (Zona-Qator-Javon) jadval YO'Q.
- ❌ HARD-GATE'lar yo'q: tech-card material-mos BLOK (EP-WMS-084) va gofra-sloy BLOK (EP-WMS-085) qurilmagan.
- ⚠️ Ikki-olam: wms_inventory_counts╳inventory_counts (real 6 qator boshqasida); /api/wms/inventory-counts green-lekin-bo'sh (ic.deleted_at yo'q → swallow).

### Kassa (Cashier) — 68% (asosan mos)
- ✅ To'g'ri: cashier-hub smenalar, harakatlar, PIN, salary-payout ko'p-bosqich tasdiq, avans+podotchet, employee_debt.
- ❌ **ZID:** ko'p-TOMON tasdiq emas, ko'p-BOSQICH — bitta finance_manager hamma bosqichni o'tkaza oladi (per-bosqich rol tekshiruvi yo'q).
- ❌ Bo'shliq: kunlik PDF→Telegram (A7) YO'Q; Chek-AI (OCR/Gemini o'qish) YO'Q — faqat receiptRef matn; kassa-limit/inkassatsiya alert YO'Q; reyting-navbat YO'Q.

### HR — 68% (asosan mos)
- ✅ To'g'ri: xodimlar, davomat/check-in, leave, payroll, intizom (kech-kelganlik), recruitment, KPI, face-recognition.
- ❌ **ZID:** kundalik hisobot deadline **20:00** (egasi: 16:00); recruitment **12-bosqich** ATS (egasi: 7-bosqich HC); employee_ratings jadval 5-faktor (vizyon: 7-faktor).
- ❌ Bo'shliq: rating-og'irliklari hardcoded (sozlanmaydi, EP-HR-012); rating→bonus tavsiya ulanmagan; **multi-karta** (employee_card_assignments) YO'Q — 1 xodim=1 karta; onboarding/mentor/karyera/vakansiya bo'sh.

---

## ENG JIDDIY ZIDLIKLAR (build egasi javobiga TESKARI)

| # | Soha | Egasi nima dedi | Build nima qiladi |
|---|------|-----------------|-------------------|
| 1 | **AI-PLANNING (10%)** | 7-qadam, har qadam real DB holat yozadi, AI bron qiladi, MRP/CRP orkestratsiya | `generate()` 201 lekin BO'SH fake-plan; `blockMaterial()` echo (DB tegmaydi); batch-groups hardcoded massiv; PP enginelarга UMUMAN ulanmagan |
| 2 | **LMS (22%)** | darslik **KARTAGA** biriktiriladi; tugamasa o'sha karta **oyligi YO'Q** (hard-gate) | lms_courses department_id'ga bog'langan (card_id yo'q); PayrollService'da LMS hook 0; LmsCompletionService o'lik kod (0 chaqiruvchi); 16 vizyon-jadval yo'q |
| 3 | **RAZRYAD→OYLIK (35%)** | razryad → oylik (band/koeff) → o'sish | `razryad_levels.coefficient` ustuni native DB'da YO'Q → so'rov xato → 1.0 qaytadi → **razryad-6 xodim razryad-1 bilan bir xil oylik (1M, 2.8M emas)** — JONLI ISBOT |
| 4 | **EVENT-CATALOG (35%)** | 19 domen-event, har biri ≥1 listener, oltin-ip event-driven | 19 katalog-nomidan HECH BIRI jonli emas; 7 event na emitter na listener; payroll.period_closed = 0-listener orphan; domain_events=0 |
| 5 | **POS (72%)** | kassir EMAS | kassir POS ichida jonli (yuqorida) |
| 6 | **CC (75%)** | hammasi oxiri **DIREKTORGA** | yo'llar boshliqда tugaydi (MANAGER_OF_SENDER); resolver'da DIRECTOR kodi yo'q |
| 7 | **VYSOTSKIY-7 (35%)** | yagona daraxt (Owner ildiz), manager_id=keyingi daraja | 20 ildizli O'RMON; manager_id 100% NULL; 2 dublikat otdeleniye to'plami; test-axlat nodelar (P04 Unit Test) jonli |
| 8 | **MARKETING (48%)** | ROI = foyda-asosli; 8 kanal (Instagram/Telegram/...) | ROI byudjet-asosli; kanallar social_media/search/email |

---

## ENG KATTA FAKE (yashil-lekin-noto'g'ri — Q-40 buzilishi)

- **AI-planning** — bo'sh plan, echo reservation, hardcoded batch.
- **Karta-AI fit (35%)** — POST /api/ai/fit/evaluate → fitScore=50, provider=NULL, report={error} (AI yo'q → jim fallback). "Har karta o'z AI'si" vizyoni JONLI nol natija.
- **3-way match (MM)** — summalarni solishtirmaydi, faqat 2 boolean; har doim "matched".
- **Company-state (DIR)** — /api/company-state/current state:'xavf' qaytaradi lekin profit=0/revenue=0 (GL bo'sh) → matematik ma'nosiz; egasi 5-metrik formulasi emas.
- **Golden-thread** — yagona zanjir seed-SQL bilan kiritilgan (event bilan oqmagan); domain_events=0.
- **IoT** — egasi "sensorlar O'RNATILMAGAN, honest 501 ber" degan; build seed-qilingan soxta telemetriya qaytaradi (576 reading).

## IKKI-OLAM / CANONICAL BUZILISHLARI (E6 "bitta haqiqat" qoidasi)

- **pos-v2** dublikat modul (@Controller('pos-v2/*')) — feedback_no_v2 buzilishi.
- **material_cards ╳ mm_materials** — WMS hamon mm_materials yozadi (deprecated bo'lishi kerak edi).
- **kanban_cards (2 qator) ╳ kanban_tasks (0, o'lik)** — ikki schema.
- **Director-state — 3 model:** DirectorHolatService (to'g'ri, 5-metrik, ulanMAGAN) ╳ company-state.service (3-metrik, jonli) ╳ director-state.service (company_state_history yo'q → hardcoded 'NORMAL').
- **vendors ╳ mm_vendors**, **purchase_orders ╳ mm_purchase_orders** — nomuvofiq JOINlar.
- **gl_lines** yozish yo'li bor (ADR-003/SAP#76: HECH QACHON INSERT qilinmasin) + dead gl_journal_entries o'qishlari.

## KARTA-MARKAZLI MODEL (vizyonning yuragi) — KO'P JOYDA REALIZE QILINMAGAN

- manager_id 97/97 NULL → daraxt parent-bog'lanishsiz.
- ai_fit_scores=0, org_node_portret=0 → karta-AI hech narsa ishlab chiqarmagan.
- LMS darslik kartaga emas; diary author_card_id=user.id (karta emas); kanban employee-markazli; council a'zoligi shaxsga (kartaga emas).
- multi-karta (1 xodim N karta) yo'q; oylik-band/CKP kartalarda bo'sh (tskp 19/97, salary_type 0/97).

---

## PER-SOHA JADVAL (40 yo'nalish, mos% bo'yicha)

| % | Soha | Verdict |
|---|------|---------|
| 10 | AI-planning 7-qadam | ZID |
| 22 | LMS (darslik→karta→oylik) | ZID |
| 28 | COR (koordinatsiya) | qisman |
| 35 | PP / Card-AI / Vysotskiy-7 / Razryad→oylik / Event-catalog | qisman/ZID |
| 38 | KAN / NTF / Project-done-claims | qisman |
| 42 | IoT | qisman |
| 45 | QC / AI-markaziy | qisman |
| 48 | Marketing | qisman |
| 52 | MES / MM / DIR / Diary-OKR-state | qisman |
| 55 | SD / Golden-thread / Master-data / Workflow-routing | qisman |
| 58 | WMS / Design-system | qisman |
| 62 | Reyting-7faktor / i18n | qisman/asosan |
| 68 | Kassa / HR / CRM | asosan |
| 72 | POS / ORG / Foundation-docs | asosan |
| 75 | CC | asosan |
| 78 | FIN/GL | asosan |
| 80 | GL-money-model | asosan |
| 82 | AISHA-JARVIS | asosan |
| 85 | Security | asosan |
| 88 | GOFRA 3-formula | to'liq |
| 90 | Two-order-worlds | to'liq |

---

## QO'SHIMCHA MUHIM TOPILMALAR

- **i18n REGRESS 67→119** — yangi sahifalar t() siz qurilgan, jumladan SHU SESSIYANING ishlari: CashierHub (22 leak), WorkflowRules (19), AIFitScores (6), CashRegister (5). CI ratchet (MAX 64) buziladi.
- **Foundation-docs:** CLAUDE.md "hamma reviewer PASS" deydi, lekin arxitektura-gate'da 7 FAIL (Rule 2,3,4,9,10,18,22). STANDARTLAR `hr_employees` kanonik deydi — u DB'da YO'Q (real = `employees`). 42 ta notImplemented() 501 qolgan.
- **Security:** JWT alg-pin YO'Q; access-token 24soat (vizyon: 15daqiqa).
- **Project-done-claims (LOYIHA-BITGAN-XOLAT) ko'p da'voni OSHIRGAN:** "vertikal manager_id bog'landi" — manager_id ustuni umuman YO'Q; "oltin-ip to'liq (DB-proof)" — domain_events=0, entries 6 qator (biri NULL debit+credit); "karta-model ishlaydi" — tskp 19/97 bo'sh.

## USTUVOR TUZATISHLAR (vizyonга yetish uchun)

1. **Razryad coefficient migratsiyasini native DB'ga qo'llash** (hozir razryad oylikка ta'sir qilmaydi — jonli buzuq) + oylik-band/koeff ma'lumotini kiritish.
2. **POS'dan kassirni butunlay olib tashlash** (CashRegisterController + cash_* ustunlar + orphan FE) — egasi qoidasi.
3. **Ikki-olam tozalash:** pos-v2, mm_materials writes, kanban_tasks, 3 director-state model → bittaga.
4. **Vysotskiy vertikal:** head_user_id ma'lumotini kiritish (126/144 NULL) → manager_id backfill (egasi qarori kutadi).
5. **Karta-markazli model:** LMS darslik→card_id, diary author=card, multi-karta junction, ai_fit real ma'lumot-manbalari.
6. **FAKE'larni real qilish:** AI-planning 7-qadam (PP enginelarга ulash), 3-way match summa-solishtirish, company-state 5-metrik formulaга o'tkazish.
7. **Event-driven golden-thread:** outbox publisher + 19 event nomini katalogga moslash + 0-listener orphanlarni ulash.
8. **i18n regress qaytarish** (119→≤64): yangi sahifalarни t() ga o'tkazish.
9. **WMS hard-gate'lar** (EP-WMS-084/085) + rulon_cards (503) + overflow + WMS→GL.

> Eslatma: bu audit READ-ONLY — hech narsa o'zgartirilmadi. Manba: 40-agent verdiktlari (`tasks/wvisgck1f.output`, 5M token).
