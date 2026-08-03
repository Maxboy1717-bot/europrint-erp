# VIZYON-TASDIQ 2146 — MUSTAQIL QAYTA-TEKSHIRUV (MASTER HISOBOT)

> **Sana:** 2026-06-27/28
> **Manba:** `docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md` (egasi intervyu+rejalari, har band SAVOL + Isbot)
> **Usul:** 20 modul × mustaqil **adversarial verifier** agent. Har savolning "Isbot" da'vosi JONLI kod (apps/api/src, artifacts/erp-dashboard/src, lib/db) + JONLI DB (`psql europrint`) bilan tekshirildi. Standart — skeptik: da'vo faqat dalil haqiqatan topilsa va aytilganini bajarsagina "tasdiqlandi".
> **Qamrov:** 20/20 modul, **1965 savol** (doc tanasidagi barcha modul-savollari; sarlavha "2146" — qolgan ~181 kirish/umumiy bo'limlarda).

---

## 1. UMUMIY HUKM

| O'lchov | Qiymat |
|---|---|
| Tekshirilgan savol | **1965** (20 modul) |
| Doc da'vo qilgan o'rtacha vizyon% (savolga vaznlangan) | **~50%** |
| Mustaqil hisoblangan **HAQIQIY** vizyon% (egasi-data hisobdan tashqari) | **~39%** |
| ✅ bor (haqiqatan ishlaydi) | **297** |
| 🟡 qisman (mexanizm bor, to'liq emas / data yo'q) | **867** |
| ❌ yo'q (qurilmagan) | **723** |
| 🔑 egasi-data (sxema/mexanizm bor, qiymat egasidan) | **78** |
| Isbot **tasdiqlangan** (to'g'ri) | **1882** (~96%) |
| Isbot **rad etilgan** (xato/oshirilgan/kam baholangan) | **83** (~4%) |

**Asosiy xulosa:** Doc'ning per-savol Isbotlari ~96% to'g'ri — lekin **83 ta da'vo xato**, va ular ikki tomonga ketadi:
- Doc ko'p joyda **kam baholagan** (kod BOR, doc "yo'q" degan) — eski/noto'g'ri grep yoki noto'g'ri jadval nomi bilan qidirgan.
- Doc ba'zi joyda **oshirib baholagan** (data=0 emas, yoki VIEW'ni "jadval+CRUD" degan, yoki yozilmaydigan ustunni "feature" degan).

Umumiy modul-sarlavha %lari (50%) ham biroz **optimistik** — qat'iy per-savol qayta-hisobda ~39% chiqadi.

---

## 2. MODUL JADVALI (da'vo% vs HAQIQIY%)

| # | Modul | Doc% | **Haqiqiy%** | Farq | bor | qisman | yoq | egasi | Rad |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 19 | POS / Kassa-monitor | 72 | **81** | **+9** ⬆ | 48 | 27 | 1 | 6 | 16 |
| 10 | WMS / Ombor | 60 | **65** | **+5** ⬆ | 43 | 67 | 7 | 4 | 15 |
| 03 | Finance / GL / Kassir | 68 | **56** | −12 | 25 | 41 | 15 | 5 | 0 |
| 01 | Org / Kartalar | 63 | **54** | −9 | 39 | 68 | 28 | 8 | 2 |
| 02 | HR / Xodim-karta | 58 | **53** | −5 | 15 | 48 | 11 | 8 | 1 |
| 17 | AI / Aisha | 52 | **44** | −8 | 18 | 47 | 29 | 1 | 2 |
| 12 | LMS / Darslik | 52 | **40** | −12 | 9 | 43 | 25 | 8 | 2 |
| 07 | PP / Rejalashtirish | 46 | **39** | −7 | 15 | 79 | 44 | 4 | 6 |
| 09 | QC / Sifat | 65 | **39** | −26 | 8 | 59 | 28 | 2 | 4 |
| 05 | Director / Hisobot | 58 | **37** | −21 | 9 | 43 | 31 | 2 | 5 |
| 20 | CC / Hujjat-shartnoma | 62 | **37** | −25 | 17 | 28 | 39 | 0 | 2 |
| 06 | SD / Sotuv | 48 | **34** | −14 | 10 | 49 | 42 | 6 | 1 |
| 13 | CRM | 58 | **33** | −25 | 13 | 24 | 38 | 10 | 3 |
| 14 | Marketing | 48 | **32** | −16 | 9 | 45 | 43 | 2 | 2 |
| 16 | IoT / Telemetriya | 38 | **29** | −9 | 5 | 34 | 38 | 9 | 2 |
| 08 | MES / Ishlab chiqarish | 38 | **27** | −11 | 6 | 32 | 44 | 0 | 1 |
| 11 | MM / Ta'minot | 43 | **25** | −18 | 2 | 29 | 35 | 2 | 2 |
| 04 | Coordination / Council | 30 | **22** | −8 | 1 | 49 | 67 | 0 | 5 |
| 15 | Kanban / Vazifa | 31 | **15** | −16 | 3 | 34 | 100 | 0 | 1 |
| 18 | Bildirishnoma / Botlar | 27 | **15** | −12 | 2 | 21 | 58 | 1 | 11 |

**Eng kuchli modullar (haqiqiy):** POS 81%, WMS 65%, Finance 56%, Org 54%, HR 53%.
**Eng zaif modullar (haqiqiy):** Kanban 15%, Bildirishnoma 15%, Coordination 22%, MM 25%, MES 27%.

---

## 3. DOC XATOLARINING 4 TURI (83 rad etilgan da'vo)

### A) ⬆ KAM BAHOLANGAN — kod BOR, doc "yo'q" degan (eng muhim — ish allaqachon qilingan)
Sabab: doc noto'g'ri jadval nomi / eski grep bilan qidirgan.

- **POS (19):** 16 ta — anomaliya-detektor (`pos-anomaly.service.ts`), texkarta-gate (`pos-techcard-gate.service.ts`), 2-imzo smena topshirish (`pos_shift_handovers`), tara-aylanma (`pos_returnable_pallets`), tungi-katta-miqdor anomaliya, avto-tasdiq limiti, WASTE_IN/LAB_SAMPLE_OUT harakat turlari — **hammasi REAL**.
- **WMS (10):** 15 ta — hazard-class, ko'r-sanoq (blind count), zona-muzlatish (freeze-zone), ta'minotchi-reyting, poddon, material-o'rinbosar (`material_substitutes`), aging-alert, mijoz-mol (owner_type) — **hammasi qurilgan**.
- **PP (07):** frozen-window (`is_frozen`+`isWithinFrozenWindow()`), bottleneck-aniqlash (`markBottleneck`), no-preempt guard, `alt_machine_id`, `scrap_fixed`, `min_razryad` — **doc "yo'q" degan, kodda BOR**.
- **Coordination (04):** `workflowRules.resolve()` approval-handler'ga REAL ulangan (doc "ulanmagan" degan).
- **IoT (16):** IoT→Telegram eskalatsiya `record-sensor-reading.handler.ts` da REAL.

### B) ⬇ ESKI "data=0" da'vosi — DB endi to'lgan
- **Director (05):** doc "production_orders/sales_orders bo'sh" degan — jonli `production_orders=7`, `sales_orders=13`, `production_sessions=8`.
- **QC (09):** doc "0 qator" degan — `qc_inspections=4`, `qc_reclamations=1`.

### C) ❌ NOTO'G'RI CITATION — ko'rsatilgan ustun/jadval umuman yo'q
- **Bildirishnoma (18):** `org_nodes` jadvali **umuman yo'q** (telegram_group_id `org_departments`da); `notification_schedules`, `kanban_column_sla`, `ntf_doc_views` jadvallari **mavjud emas** (doc "count=0" degan).
- **Org (01):** `org_departments.manager_id` ustuni **yo'q** (vertikal bog'lanish = `parent_id`, faqat o'qishda alias).
- **MES (08):** `production_operations` jadvali **umuman yo'q** → `detectBottleneck()` runtime'da ishlamaydi (doc "qisman" degan, aslida **yo'q**).

### D) ⬆ OSHIRIB BAHOLANGAN — "REAL" deganlari aslida ishlamaydi
- **LMS (12):** `lms_tests`/`lms_questions` aslida **VIEW** (jadval emas) — write-CRUD shubhali.
- **CC (20):** `cc_documents.parent_document_id` **hech qachon yozilmaydi** (faqat o'qish/deklaratsiya) → ishlamaydigan feature; rad-sabab "majburiy" degani aslida `.optional()`.
- **SD (06):** GL-posting "retry" deganda aslida faqat `logger.warn` — qayta-urinish yo'q.
- **CRM (13):** `sd_customers.segment` da CHECK constraint **yo'q**; jonli qiymat `NULL`/`B2B` ('vip/regular/new' emas).

---

## 4. HAQIQIY KOD-BO'SHLIQLARI (yuqori ustuvorlik — chinakam "yo'q")

Quyidagilar tekshiruvda haqiqatan qurilmagan deb tasdiqlandi (eng katta ta'sirli):

1. **Kanban (15):** 100/137 savol "yo'q" — RBAC ("faqat boshliq vazifa beradi"), urgent-limit, SLA-kolonna, ko'p workflow yo'q. Eng katta bo'shliq.
2. **Bildirishnoma (18):** 58/82 "yo'q" — markaziy `notification_schedules` matritsasi, 24h taymer, kanban SLA, hujjat-ko'rildi kuzatuvi yo'q (BullMQ kodbazada bor, NTF'ga ulanmagan).
3. **Coordination (04):** 67/117 "yo'q" — `rasporyajeniye` overdue-cron, kengash (council) oqimi, workflow_rules **data**si (jadval bo'sh).
4. **MM (11):** 35/68 "yo'q" — goods-receipt solishtirish (3-way match), vendor MFO/bank/inn maydonlari, EOQ amaliy.
5. **MES (08):** 44/82 "yo'q" — `production_operations` jadvali yo'q, OEE to'liq emas, real-vaqt smena oqimi.

> To'liq per-savol verdikt har modul faylida: `docs/audit/VIZYON-TEKSHIRUV-2026-06-27/NN-*.md`.

---

## 5. EGASIDAN KUTILAYOTGAN DATA (78 band — kod tayyor, qiymat yo'q)

Bular kod-bo'shliq EMAS — sxema/mexanizm bor, faqat egasi qiymat kiritishi kerak:
- Razryad qiymatlari (salary_min/max, exam_type, exam_pass_threshold, max_retakes) — `razryad_levels` 6 qator NULL.
- ЦКП normalari (`tskp_target`), workflow_rules qoidalari, karta-shablon boshlang'ich to'plami (10-15 lavozim), AI-kalitlar, kim-kimni-boshqaradi (head_user_id).

---

## 6. TAVSIYA — KEYINGI QADAMLAR

1. **Manba doc'ni tuzatish:** 83 rad etilgan da'voni `VIZYON-TASDIQ-2146` da to'g'rilash (ayniqsa A-tur: kam baholangan ~50 band — ish allaqachon qilingan, "yo'q"→"bor/qisman").
2. **Tez yutuq (data seed):** egasi-data 78 bandining seed-qilinadiganlarini to'ldirish → bir nechta modul% darhol oshadi.
3. **Chinakam build navbati:** Kanban → Bildirishnoma → Coordination (eng past haqiqiy%, eng katta ta'sir).
4. **Buzuq-kod tozalash (Q-46):** `production_operations` (yo'q jadval), `cc_documents.parent_document_id` (yozilmaydi), LMS VIEW write-yo'li — yo to'g'irlash, yo olib tashlash.

---

## 7. Q-46 BUZUQ-KOD TOZALASH — BAJARILDI (2026-06-30)

Egasi tanlovi bo'yicha buzuq/oshirib-baholangan kod tozalandi (har biri Q-29 jonli isbot bilan):

| # | Element | Tashxis | Amal | Isbot |
|---|---|---|---|---|
| 1 | **MES** `detectBottleneck()` (`production-agent.service.ts:125`) | `production_operations` jadvali YO'Q → `.catch` tufayli crash emas, lekin DOIM `null` qaytarardi (jim o'lik) | ✅ **TO'G'IRLANDI** — jonli `production_sessions` ga ulandi (mashina bo'yicha faol-sessiya navbati = bottleneck) | `/api/agents/production/bottleneck` → **200** `{"machineId":"11","queueSize":1}` (avval null) |
| 2 | **CC** `parent_document_id` (`cc-documents-read.repo.ts:81` + `types.ts:27`) | Hech qachon yozilmaydi, FE ishlatmaydi (grep=0), DTO yo'q → o'lik fantom o'qish+deklaratsiya | ✅ **OLIB TASHLANDI** — o'lik o'qish-alias + tip-maydoni; DB ustuni qoldi (Q-35 migration egasi-ruxsati), vizyon-bandi (CC 20.82) kelajak yozish-yo'li uchun saqlanadi | tsc 0 xato; boshqa import yo'q |
| 3 | **LMS** `lms_tests`/`lms_questions` write-CRUD | Audit "VIEW → write ishlamaydi" degan | ⚠️ **TUZATISH SHART EMAS (audit XATO)** — ikkala VIEW bitta jadval ustida → Postgres **avto-yangilanuvchi** (`is_insertable_into=YES`). Rollback-tx isboti: `INSERT INTO lms_tests` → baza `tests` jadvalida ko'rindi. Ishlaydigan kod (Q-46) tegilmadi | Jonli rollback-tx PASS |

**Xulosa:** 2 ta haqiqiy buzuq-kod hal qilindi (1 fix + 1 olib tashlash), 1 tasi audit-ning o'z false-positive'i bo'lib chiqdi. Backend typecheck 0 xato, health 200. SD "retry"/CRM "segment CHECK" kabi qolgan D-tur bandlar = doc-oshirilishi (kod ishlaydi), buzuq-kod emas — tegilmadi.
