# HR + Org-struktura (Karta) — Vizyon va Chala Ishlar — Konsolidatsiya (2026-07-13)

> **Maqsad:** HR (Xodimlar) moduli va Org-struktura/"Karta" (tashkiliy karta) modeliga oid
> **barcha vizyon qarorlari** va **barcha chala/ochiq ishlar** bitta faylda.
> Manba: `docs/vision/_parts/01-org-kartalar.md` + `02-hr.md` (2026-06-08, 50+50 qaror),
> `docs/audit/VIZYON-TEKSHIRUV-2026-06-27/01-org-kartalar.md` + `02-hr.md` (143+82 savolli
> mustaqil adversarial-verify, jonli kod+DB bilan tekshirilgan), `docs/audit/OPEN-OWNER-QUESTIONS-CONSOLIDATED-2026-07-11.md`
> (eng so'nggi holat), + memory (`project_org_card_centric_model`, `project_org_structure_vysotskiy7`,
> `project_karta_vizyon_spec_2026_06_25`, `project_massiv_100_complete_2026_06_25`,
> `project_ijro_reja_99_agent_2026_06_25`, `project_hr_massive_build_2026_06_18`).
>
> **Belgilar:** ✅ bor (qurilgan+jonli) · 🟡 qisman (mexanizm bor, data/ulanish yo'q) · ❌ yo'q (qurilmagan) ·
> 🔑 egasi-data (kod tayyor, faqat qiymat kerak) · 🔴 eng katta leverage.

---

## 1. Org-struktura / Karta — VIZYON (asosiy tamoyillar)

### 1.1 Karta-markazli model (fundament)
- **"Karta asosiy, xodim ikkilamchi"** — har KARTA (org-birlik = lavozim+bo'lim+razryad) o'z holida
  mavjud: talab, razryad, darslik, oylik, ЦКП, AI — hammasi KARTAGA bog'lanadi, xodimga emas.
  Xodim kartaga *biriktiriladi* (`employee_cards`, M:N — bir xodim bir nechta kartada, bitta karta
  bir nechta xodimda bo'lishi mumkin: asosiy + i.o.).
- **Vysotskiy-7 org daraxti:** L0 Root → L1 Owner/CEO → L2 yetti Otdeleniye → L3 Otdel →
  L4 Sektsiya → L5 Sektor. `manager_id`/`head_user_id` = **keyingi yuqori daraja** (parent_id
  zanjiri), "bo'lim boshlig'i" degan tor ma'noda emas. Gorizontal hujjat marshruti = `workflow_rules`.
- **Karta lifecycle — 5 holat:** `active → frozen → vacant → archived` + `is_acting` (i.o.) qatlami.
  Har o'tish audit-log bilan.
- **Karta yaratish atomik bo'lishi kerak** (cards→RBAC→LMS→onboarding Kanban bitta tranzaksiyada,
  fail→to'liq rollback) — vizyon talabi #1.
- **AI har kartada** — moslik (`fit_score`), imtihon savol-banki, ЦКП-trend tahlili — kartaning
  o'z sun'iy intellekti bor tamoyili.

### 1.2 ЦКП (KPI/samaradorlik) kaskadi
- Har karta o'z ЦКП formulasiga ega (`BOOLEAN`/`FOIZ`/`VAQT`/`QUANTITY_PCT` — 4 tur),
  manba avtomatik (`MANUAL`/`AI_CHAT`/`MES_AUTO`/`IOT`).
- **Kaskad event-driven:** quyi karta ЦКП hisobot beradi (`CkpReportedEvent`) → yuqori kartaga
  `SUM`/`AVG` bilan **FOR UPDATE** atomik agregatlanadi (ota→otdeleniye→CEO), race-condition yo'q.
- ЦКП deadline sozlanadigan (`ckp_report_deadline_hours`, per-karta) — hisobot muddatidan
  o'tsa "hisobot bermadi" holati.
- I.o. (acting) karta ЦКП **o'z smenasiga** — asosiy va i.o. ball alohida agregatlanadi (aralashtirilmaydi).

### 1.3 Razryad (malaka darajasi) tsikli
- Razryad o'sishi: min-3-oy interval, imtihon (savol-banki + AI baholash, HR tasdig'i shart — E1
  tamoyili: **avtomatik pasaytirish YO'Q, faqat inson tasdig'i bilan**), e'tiroz oynasi (5 ish kuni,
  jarayonda razryad muzlatiladi).
- AI razryad-pasayish signali: 3+ marta xato, 30 kun ichida, bir kategoriyada — lekin qaror doim
  odam (HR/rahbar) tasdig'i bilan.
- "Xavfli/texnik" karta turlari uchun 2-yillik attestatsiya tsikli; o'tmasa avto-freeze taklif
  (odam tasdig'i bilan).

### 1.4 Onboarding / oylik gate
- LMS darslik tugamaguncha karta oyligi **to'lanmaydi** (`lmsGate.isCardTrainingComplete` —
  fail-closed prinsip).
- Bosqichli stavka koeffitsienti: o'qish 0.7 → imtihon 0.85 → xulosa 0.90 → faol 1.0.
- 2-karta (parallel lavozim) uchun ham to'liq alohida onboarding — darslik kartaga bog'lanadi,
  xodimga emas (karta-markazli tamoyilning to'g'ridan-to'g'ri natijasi).

### 1.5 Xavfsizlik / RBAC / maxfiylik
- Karta o'zgarganda JWT **darhol** invalidatsiya emas — keyingi refresh (max TTL, sozlanadigan).
- Maxfiy maydonlar (oylik, shaxsiy ma'lumot) **BE Drizzle projection darajasida** filtrlanadi
  (FE darajasida emas) — field-level RBAC.
- Karta arxivlanganda profil-tarix (LMS/attestatsiya/moslik) saqlanadi, lekin yangi xodim
  eskisining shaxsiy ma'lumotini ko'rmaydi (field-RBAC bilan ajratilgan).

### 1.6 E1 tamoyili (butun modulda takrorlanadi)
"Avtomatik salbiy qaror YO'Q — AI/tizim faqat ogohlantiradi/taklif qiladi, yakuniy qaror har doim
odam (rahbar/HR/direktor) tasdig'i bilan." Bu tamoyil razryad-pasayish, davomat-jarima, tanbeh,
travel-cancel-qarz, va boshqa deyarli har bir "jazolovchi" oqimda takrorlanadi.

---

## 2. Org-struktura / Karta — CHALA / OCHIQ ISHLAR

### 2.1 🔴 ENG KATTA LEVERAGE — `head_user_id` / `manager_id` zanjiri to'ldirilmagan
- **Holat (2026-07-11 hisobotiga ko'ra):** `org_departments.head_user_id` atigi **~13%** to'ldirilgan
  (34/35/37... qatorlarda bor, qolgani NULL). `org_functions.manager_id` **0/97 — HAMMA NULL**
  (`docs/audit/VIZYON-TEKSHIRUV-2026-06-27/02-hr.md:22`).
- **Nega eng katta leverage:** BU BITTA MAYDON to'ldirilmasa — quyidagilar HAMMASI ishlamaydi:
  eskalatsiya zanjiri (rahbar javob bermasa keyingi darajaga), tasdiq-marshruti, HR digest,
  "bo'ysunuvchilar" dashboardi, avto-delegatsiya (smenaboshi yo'q bo'lsa rahbarga), Coordination
  approval-chain, notification routing — deyarli barcha modul aro (cross-module) oqim shu bitta
  ustunga tayanadi.
- **Blocklaydigan narsalar (memory: BLOCKED-52 + rol/scoping + Finance-SoD + ЦКП/LMS oylik-gate + 205+ item):**
  `docs/audit/OPEN-OWNER-QUESTIONS-CONSOLIDATED-2026-07-11.md:75`.
- **Amal:** `CARD-ATTRIBUTES-REQUEST.md` — 93-lavozim × (razryad/rbac_tier/oylik/otdeleniye) bo'sh
  varaq egasidan kutmoqda (memory: reference `S10`). Mexanizm (`backfillManagerIds`) allaqachon
  qurilgan — faqat DATA yo'q (`dryRun` default, hech qachon jonli ishga tushirilmagan).

### 2.2 Ikki-olam / kanonik jadval muammosi hali yopilmagan
- `org_departments` + `org_functions` + `departments` — **3 parallel bazaviy jadval** hamon jonli
  ishlaydi. RBAC/Payroll eski `org_functions`ga, FE yangi `org_departments`ga keyed —
  YAGONA-DDL emas (`vision/_parts/01-org-kartalar.md:69`).
- `org_functions.manager_id` ustuni umuman YO'Q — `org_departments`da bor lekin bo'sh.

### 2.3 Karta lifecycle — mavjud, lekin yarim ulangan
| Qism | Holat | Manba |
|---|---|---|
| 5-holat state-machine (`active/frozen/vacant/archived/io`) | ✅ bor, real endpoint (freeze/thaw/vacant/restore) | VIZYON-TEKSHIRUV 01.41-44 |
| Muzlatilganda oylik pro-rata to'xtashi (`CardStatusChangedEvent`→Payroll) | ❌ yo'q | vision/01:7 |
| Qayta-tasdiq muddati (`reconfirm_days` sozlanadigan) + Kanban-ogohlantirish | 🟡 `last_reviewed_at`+`markReviewed` bor, sozlanadigan muddat/oqim yo'q | vision/01:10, VIZYON-TEKSHIRUV 01.137 |
| `CardExpiredEvent` (1 yil, tungi cron) → Kanban+Telegram | ❌ yo'q (faqat stale-expr, cron/FE eslatma yo'q) | vision/01:15 |
| Merge/Split karta | ❌ endpoint umuman yo'q | VIZYON-TEKSHIRUV 01.22, 01.23, 01.64, 01.65 |
| Arxiv FK strategiyasi (SET NULL/RESTRICT) + restore | 🟡 restore bor, FK-strategiya dizayni yo'q | vision/01:53 |
| Import (Excel, partial-commit, idempotent UPSERT) | ❌ karta-maxsus import yo'q (faqat org-node import) | VIZYON-TEKSHIRUV 01.33, 01.75, 01.76 |
| Avto-raqamlash (bo'lim-ichi seq, immutable) | ❌ yo'q | vision/01:31 |

### 2.4 Stavka-ulush (multi-card) — konsepsiya deyarli qurilmagan
- Bitta xodim bir nechta kartada ishlaganda ulush (`stake_fraction`) jami ≤1.0 bo'lishi kerak —
  `employee_org_departments.stake_fraction` + `checkStakeCap()` mexanizmi **bor**, lekin
  **`assignEmployeeToCard`ga ulanmagan** — hech qachon amalda tekshirilmaydi
  (VIZYON-TEKSHIRUV 01.24, 01.66).
- Stavka 1.0ga yetganda avto-blok + owner-tasdiqli bir martalik oshirish — ❌ yo'q.
- Payroll slip karta-bo'yicha satr + pro-rata (`razryad` o'rtada o'zgarsa) — 🟡 formula-preview bor
  (`prorateCardPay`), lekin `closePeriod`ga ulanmagan.

### 2.5 ЦКП — mexanizm bor, DATA yo'q (eng ko'p uchraydigan naqsh)
- Kaskad-listener (`ckp-cascade.listener.ts`) **real** ishlaydi (rollup, FOR UPDATE, double-count
  yo'q) — lekin `ckp_card_products`=0 qator, `ckp_personal_targets`=0 qator, `org_departments.tskp_target`
  aksariyati bo'sh → mexanizm ishlagani bilan **hisoblanadigan narsa yo'q**.
- `ai_ckp_scores`/`ai_ckp_config` jadvallari bor, **WRITER yo'q** — AI-moslik formulasi
  (ЦКП40%+sifat30%+muddat20%+10%) karkas darajasida, hisoblovchi kod yo'q.
- Per-employee ЦКП norma tuzatish (audit-sabab bilan) — ❌ yo'q.
- Uch-smenali dastgoh uchun karta↔smena (`shift_id`) bog'lanishi — ❌ yo'q, `work_schedules` bo'sh.

### 2.6 Razryad — exam/attestatsiya zanjiri qisman
- `razryad_levels` jadvali to'liq struktura (6 qator: 1-6 razryad), lekin **hammasi**
  `salary_min/max`, `exam_type`, `exam_pass_threshold`, `max_retakes` — NULL (🔑 egasi-data).
- Savol-bank (`hr_question_bank`) real jadval, lekin **arxivlash + AI→HR tasdiq gate** qurilmagan
  — AI savol tasdiqsiz ishlatilishi mumkin (E1 buzilishi xavfi).
- E'tiroz oynasi (5 ish kuni, razryad muzlatish, 2-tomon ko'rib chiqish) — ❌ yo'q.
- Sertifikat 30-kun oldin ogohlantirish (HR+xodim+rahbar) — ❌ yo'q.
- Exam-eligibility completeness-gate (≥70%) — 🟡 exam-config maydonlari bor, 70%-chegara ulanishi
  aniq emas.

### 2.7 Mentor-karta bog'lanishi qurilmagan
- `mentors`/`lms_card_mentors`/`hr_mentorship_pairings` jadvallari bor, lekin **`card_id`
  ustuni yo'q** (yoki 0 qator) — mentor scoped-read grant/revoke, 3-marta-rad-limit + HR-alert —
  ❌ hech biri (VIZYON-TEKSHIRUV 01.116, vision/01:39).

### 2.8 Field-level RBAC / maxfiylik — asosiy vizyon printsipi hali qurilmagan
- BE Drizzle projection darajasida maxfiy-maydon filtri — ❌ topilmadi (`findOne` to'liq node
  qaytaradi, rol-filtr yo'q). Bu vizyonning markaziy xavfsizlik-tamoyili (§1.5), amalda YO'Q
  (VIZYON-TEKSHIRUV 01, `Q45` — SB0197 STILL-OPEN).

### 2.9 Boshqa aniq gaplar (org-struktura, qisqa ro'yxat)
- Vakansiya aging→rang o'zgarganda `VacancyAgingChangedEvent` + digest (5+ qizil, 1/soat) — ❌ yo'q.
- Shtat-reja (`штат`) bog'lanish + limit-ogohlantirish — ❌ jadval/ustun umuman yo'q.
- Karta-daraxt `WITH RECURSIVE` CTE — ✅ bor, lekin <300ms/materialized-view performance isboti yo'q
  (142 node hajmda test qilinmagan).
- "Majburiy tizim-qaydlari" (`card_activity_logs`) — ataylab IoT fazasiga **defer qilingan**
  (egasi qarori, hozircha qurilmasin).
- Race-himoya: `card_employees` uchun partial-unique index (`card_id, employee_id, is_primary`)
  + `SELECT FOR UPDATE` — ❌ DB-darajada yo'q (faqat oddiy `ON CONFLICT`).
- Glossary/lug'at jadvali — **umuman yo'q** (information_schema bo'sh).
- Jihoz/vosita↔karta bog'lanishi (`card_equipment`) — ❌ yo'q.
- Ikki-imzo (`card_signatures`) rasmiylashtirish — ❌ yo'q.

---

## 3. HR Moduli — VIZYON (asosiy tamoyillar)

### 3.1 Onboarding (ishga kirish)
- 90-kunlik, 3-bosqichli reja (`hr_onboarding_plans`+`milestones`) — ✅ real qurilgan.
- Har kuni 09:00 eslatma cron + 3-bosqichli eskalatsiya (rahbar→smenaboshi→HR→direktor,
  Vysotskiy-7 zanjiri bo'yicha).
- Biriktirilmagan (karta-siz) xodim login qila olmaydi — `JwtAuthGuard`+`RolesGuard` darajasida
  blok (card-login-gate) + ERP modal + HR uchun 24 soatlik Telegram xabari.
- 30-kunlik sinov muddati — majburiy hujjatlar to'liq bo'lguncha Payroll blok, hujjat to'liq
  bo'lganda avto-ochiladi.

### 3.2 Davomat / ЦКП / AI-kamera
- ЦКП avto-statistika MES/WMS/Tabeldan **event-driven real-time** yig'iladi; sensor o'chsa
  oxirgi qiymat saqlanadi (fail-safe).
- AI-kamera 2 sessiya (kunduz/tun); tabel har smena uchun alohida norma; 2-smena ustama
  koeffitsienti `business.constants.ts`da (yoki master-data — pastda ziddiyat qarang).
- Rahbar 30 daqiqa javob bermasa "ruxsatsiz chiqish" avto tabelga yoziladi (timeout — sozlanadigan,
  **master-data jadvalida**, kod-konstanta EMAS — ataylab).
- Davomat e'tirozi: xodim forma to'ldiradi, HR ko'radi (IT faqat sensor ma'lumotini ko'radi),
  24 soat, tasdiqlanguncha "nizoli" holat — Payroll'ga o'tmaydi.

### 3.3 Reyting / KPI formulasi
- 4-faktorli: **Tabel 40% + ЦКП 35% + 360° 15% + AI-kamera 10%** — vaznlar master-data DB'da
  (kod-konstanta emas), HR admin sozlaydi, shaffof.
- KPI real-time event-driven (`KpiUpdatedEvent`, cron EMAS); MES tushsa outbox orqali tiklanadi.
- "E'tibor talab qiluvchi xodim" mezoni: reyting 7 kunda 10%+ pasayish, 3+ marta kech hisobot,
  ta'til<3 kun — bo'sh bo'lsa "muammo yo'q" ko'rsatiladi (soxta signal bermaslik).

### 3.4 Intizom / jarima (E1 tamoyili bilan)
- Avto-tushirish YO'Q — AI faqat belgilaydi, salbiy ball **faqat rahbar tasdig'i bilan** kuchga
  kiradi; 24 soat izoh muddati.
- Tanbeh 6 oydan keyin avto "arxivlangan" (soft), lekin qayta buzilish kumulyativ hisoblanadi.
- Tabel yopilishida tasdiqlanmagan kechikish → "tasdiqlanmagan" holat; HR hal qilmaguncha jarima
  **hisoblanmaydi** (E1).

### 3.5 Multi-karta (2-lavozim) ishi
- 2-kartadagi ish **davom etadi** (blok emas); har karta o'z tabel qatoriga ega; ta'til balansi
  faqat 1-kartadan hisoblanadi.
- I.o. (acting) muddati tugashiga 1 kun qolganda eslatma; bo'lim rahbari+HR tasdig'i;
  `ActingRoleStarted/EndedEvent` → payroll ustama komponenti.

### 3.6 Recruitment / mentorlik / offboarding
- Vakansiya ochilganda AI moslik: 80%+ "taklif qiling", 50%< "rad" — lekin yakuniy qaror **HR**
  (E1). Rad etilgan nomzod qayta ariza bera oladi, oldingi rad AI-baholashda faqat pasaytiruvchi
  faktor (blok emas).
- `ProbationCompletedEvent` → referral bonusi to'lanadi, hatto tavsiya qilgan xodim ketgan
  bo'lsa ham (shartni bajargan xodim hisobda edi — E6 tamoyili).
- Mentor rad etsa 3 ish kuni ichida, maksimal 3 marta rad — 3-marta rad bo'lsa HR majburiy
  xabar oladi (Telegram+ERP).
- Offboarding: inventar qaytarish rad/kechikkanda oxirgi to'lov **avtomatik** bloklanadi (WMS
  trigger), HR qo'lda ocha olmaydi (faqat WMS-holat o'zgarsa ochiladi).

### 3.7 Sertifikat / hujjat / xavfsizlik nazorati
- Shartnoma muddati tugashiga 30 kun qolganda HR alert; 7 kun qolganda **selektiv** ERP-blok
  (faqat vazifaviy modul, butun ERP emas — vizyon talabi).
- Sanitar hujjat muddati o'tsa ish bloklanadi (Auth/RBAC darajasida), HR yangi hujjat bilan ochadi.
- TB (texnika xavfsizligi) chek-list IoT tabletda tasdiqlanmasa smena boshlanmaydi; blokni faqat
  smenaboshi ocha oladi.

### 3.8 Profil / audit / maxfiylik
- Profil tahriri **to'liq audit-log** (kim/qachon/eski-qiymat/yangi-qiymat); HR+direktor uchun
  field-darajali RBAC; 7 yil arxiv (soliq talabi — F3 tamoyili).
- Karta arxivlanganda ham LMS/attestatsiya tarix saqlanadi, lekin yangi xodim eskisining
  shaxsiy ma'lumotini ko'rmaydi.

---

## 4. HR Moduli — CHALA / OCHIQ ISHLAR

### 4.1 Onboarding → karta faollash → Payroll zanjiri UZUQ
- **Eng muhim topilma:** onboarding kodi (`hr_onboarding_plans`=3, `milestones`=90 — mexanizm
  real) hech qachon `employee_cards`ga tegmaydi. `hr_employee_onboardings`=0, `onboarding_tasks`=0
  — reja↔karta **binding** amalda ishlamagan (`vision/02-hr.md:6,24`; VIZYON-TEKSHIRUV 02.2, 02.3).
- 30-kunlik sinov muddati → hujjat-to'liqlik → Payroll blok/ochilish zanjiri — ❌ qurilmagan
  (`vision/02-hr.md:24`).
- Natija: LMS-gate (`lmsGate.isCardTrainingComplete`) **o'zi** bor va fail-closed ishlaydi, lekin
  onboarding-jarayonning boshqa bosqichlari (hujjat, probation, karta-bind) uni to'liq
  qamrab olmaydi.

### 4.2 `manager_id`/`head_user_id` zanjiriga tayanadigan HAMMA HR-oqim ishlamaydi
Bu §2.1dagi bitta org-muammoning HR tomonidagi ko'rinishi — lekin ta'siri shu qadar keng
(9+ alohida qaror shu bitta gapga tayanadi) ki alohida ta'kidlash kerak:
- 09:00 onboarding-eslatma eskalatsiyasi (`resolveEscalationTarget`) — cross-ref kerak, alohida
  cron topilmadi.
- Rahbar 24h ko'rmasa avto-eskalatsiya (keyingi org-darajaga) — 🟡 mexanizm bor, `head_user_id`
  bo'sh bo'lgani uchun amalda ishlamaydi.
- Smenaboshi tabel bera olmasa avto-vakalat (`manager_id` bo'yicha) — xuddi shu sabab bilan uzuq.
- HR-dashboard "bo'ysunuvchilar zanjiri" — uzuq (`org_functions.manager_id` 0/97 — HAMMA NULL).

### 4.3 Card-login-gate — kod bor, default OFF
- `login.service.ts:127` — `CARD_LOGIN_GATE_ENABLED` env-flag, **default OFF** (opt-in). Vizyonning
  markaziy xavfsizlik-printsipi ("biriktirilmagan xodim login qila olmaydi") hozircha **jonli
  emas** (VIZYON-TEKSHIRUV, memory `RECONCILIATION SB0055/62/78/88/97`).

### 4.4 Intizom (discipline) — soft-archive va kumulyativ bosqich tasdiqlanmagan
- `discipline_records`=32 qator, `severity` enum (major/medium/low/minor) real ishlaydi, jarima
  hisoblash (`_applyLatenessPenalty`) real.
- Lekin: 6-oydan keyin avto-soft-archive, kumulyativ bosqich hisoblash — kodda alohida tasdiqlanmadi.
- Bosqichli eskalatsiya (og'zaki→yozma→jarima→ishdan bo'shatish) — kod topilmadi
  (VIZYON-TEKSHIRUV 02.55).
- Magic-Numbers audit (memory: `project_magic_numbers_verify_2026_07_07`) — "HR discipline
  escalation 3/5/8" QUEUED-NOT-STARTED holatida qoldi.

### 4.5 Mentor-karta bog'lanishi (HR tomoni) — qurilmagan
- `hr_mentorship_pairings`=0, `mentors`=0, `mentorships`=0 — endpoint real (`hr-gsd.controller.ts:174-206`)
  lekin **data yo'q va `card_id` ustuni yo'q**. Mentor tasdig'i mutlaq-shart gate (mini-test
  faqat mentor tasdig'i bilan to'liq) — ❌ qurilmagan.

### 4.6 I.o. (Acting-role) UI + scoped RBAC yo'q
- BE mexanizm bor (`is_acting`, `acting_supplement`), lekin FE/UI tomoni va i.o.ga xos cheklangan
  RBAC (masalan, pul/kadr masalasida to'liq huquq bermaslik) — ❌ topilmadi.

### 4.7 Field-level RBAC (profil, oylik, razryad, shaxsiy ma'lumot) — umuman yo'q
- Bu §2.8dagi org-muammo bilan bir xil ildiz — HR tomonida ham profil audit-log field-darajali
  emas, field-RBAC (masalan, ex-xodim ma'lumotini yangi xodim ko'rmasligi) qurilmagan
  (VIZYON-TEKSHIRUV, `SB0077/0197/0218 STILL-OPEN`).

### 4.8 Payroll closePeriod jonli karta-formulaga ulanmagan
- `prorateCardPay`/`stakeShare` parametr **bor**, lekin `closePeriod` hali eski
  `normalizeRow`(stored `base_salary`) o'qiydi — karta-asosidagi hisoblash faqat **preview**
  darajasida, real oylik yopilishida ishlatilmaydi (`vision/02-hr.md:47,54`; memory `SB0056/0098`).
- Manfiy oylik → 0 ko'rsatish + qarz keyingi oyga ko'chirish logikasi — alohida tasdiqlanmagan.

### 4.9 Shartnoma-blok — vizyondan kengroq (selektiv emas)
- Vizyon: shartnoma muddati o'tganda **faqat vazifaviy modul** bloklansin. Kod: **butun ERP
  kirish** bloklanadi ("ERP kirishingiz cheklangan" — keng blok, granulyatsiya yo'q)
  (VIZYON-TEKSHIRUV, `SB0203 STILL-OPEN`).

### 4.10 Blok→HR unlock/tiklash workflow — bir nechta joyda yo'q
- Inventar-qaytarish bloki, sanitar-hujjat bloki — bloklash mexanizmi bor, lekin **HR tomondan
  qo'lda ochish/tiklash workflow**si alohida qurilmagan (`SB0021 STILL-OPEN`, ikkalasi ham).

### 4.11 Karta oylik/cap DATA bo'sh (🔑 egasi-data, lekin blocker)
- `org_functions`: `razryad_level_id` 17/97, `min_salary>0` 0/97 (HAMMASI 0/NULL), `tskp` 19/97,
  `ai_exam_enabled` 0/97, `function_description` 0/97.
- Bonus cap master-data maydoni bor, lekin karta-data bo'sh bo'lgani uchun cap-limit logikasi
  amalda hech qachon ishlamaydi.

### 4.12 Boshqa tasdiqlanmagan/qurilmagan ish-oqim qarorlari (HR, qisqa ro'yxat)
Quyidagilar vizyon-javob hujjatida (2026-06-08, 50 qaror) bor, lekin kod-audit (2026-06-27)da
alohida iz topilmadi yoki savol-to'plamidan tashqarida qoldi — **hali kodga tarjima qilinmagan**:
- AI-kamera tungi/kunduzgi 2-sessiya ajratish — cross-ref kerak.
- Internet uzilganda AI-kamera surat offline-queue + 2 soatdan keyin IT+HR alert — yo'q.
- Yillik anketa: Telegram yo'q bo'lsa ERP-modal + 3 marta eslatma (1/3/5-kun) — yo'q.
- Muddati o'tgan malaka bo'lsa smena-rejalash avto-rad (qattiq blok, override yo'q) — yo'q.
- Operator brak yozganda "mas'ul xodim" ixtiyoriy maydon (EP-HR-057) — yo'q.
- MES bekor-turish handlerida "xodimsiz vs xodim-sababli" ajratish → shartli KPI-ta'sir — yo'q.
- AI-kamera zona↔karta bog'lanish maydoni — yo'q.
- Yo'riqnoma yangi versiyaga o'tganda egal-xodimlar avto-aniqlanib qayta-tanishuv checklist — yo'q.
- Exit-interview (ixtiyoriy, "javob bermadi" turnover-kategoriya) — yo'q.
- 360° baholash: bir bo'lim/yaqin hamkasb filtri + anonim + unique-constraint — yo'q
  (`hr_360_feedback`=0).
- Glossariy (yo'riqnoma "Atamalar" bo'limi) + yopiq-imtihon (lug'atsiz test) — glossary jadvali
  **umuman yo'q** (information_schema bo'sh).
- "Jarima bilan bo'shatilgan" Boomerang-recruitment'dan avto-filtrlash — yo'q.
- Internal Job Posting (razryad+bo'lim filtri, parallel-pipeline kuzatuv) — `hr_tz2_internal_job_postings`=0.
- HR "ko'rildi" — bitta maydon tasdiq + 3-eslatma (muddat/1oy/3oy) — yo'q.
- AI-davomat (`hr_ai_attendance`) — **kod real** (`FaceRecognitionService`, `TerritoryLogService`,
  3-rasm bilan ro'yxatdan o'tish `face/register`), lekin jadval **0 qator** — AI-kamera↔tabel
  jonli oqimi hech qachon amalda ishlamagan (VIZYON-TEKSHIRUV `02.49` — bu yagona REFUTED/overstated
  da'vo butun 82-savollik HR auditda: hujjat "bor" degan, aslida "qisman").

### 4.13 Master-data vs business.constants.ts ziddiyati (meta-nuqta)
- HR vizyon hujjati **ataylab** ba'zi qiymatlarni (masalan, "ruxsatsiz chiqish" 30-daqiqalik
  timeout, bonus cap) `business.constants.ts` kod-konstantasi EMAS, balki **master-data jadval**
  orqali sozlanadigan qilishni talab qiladi — bu loyihaning umumiy Qoida-12 (barcha threshold
  `business.constants.ts`da) dan **ataylab og'ish**. Amalda master-data implementatsiyasi hali
  yo'q — bu meъmoriy nuance, egasi e'tiboriga loyiq (kelgusi threshold-CRUD ishida hisobga
  olinishi kerak).

### 4.14 Struktura-meta muammo
- Savol-hujjatida (vision-questions) 30 ta savol bor, javob-hujjatida (vision-1000-answers) 50 ta
  qaror bor — 31–50-qarorlar (AI-kamera zona, exit-interview, 360-eval, Boomerang, HR-digest va h.k.)
  original savol-to'plamidan tashqariga chiqqan, ularga mos "savol" yo'q. Bu ularning hech biri
  noto'g'ri emasligini anglatadi, faqat kelib chiqishi izlanganda savol-javob juftligi to'liq
  mos kelmaydi (`vision/02-hr.md:72`).

---

## 5. Ikkalasiga ham aloqador — Kesishuvchi masalalar (HR + Org)

Bu bo'lim ikkala moduldagi bir xil ildiz-sabab bo'yicha takrorlanadigan muammolarni birlashtiradi
— tuzatilsa ikkala modulda ham katta ta'sir beradi.

1. **🔴 `head_user_id`/`manager_id` bo'shligi** (§2.1) — HR eskalatsiya, org tasdiq-marshruti,
   Coordination approval-chain, notification-routing — barchasi shu bitta ustunga tayanadi.
   Bitta DATA-to'ldirish operatsiyasi (backfill, mexanizm allaqachon tayyor) o'nlab "yo'q"/"qisman"
   itemni bir yo'la "bor"ga aylantiradi.
2. **Field-level RBAC yo'qligi** (§2.8, §4.7) — bitta arxitektura qarori (BE Drizzle projection
   qatlami) ikkala modulda ham maxfiylik-talabini yopadi.
3. **Card-login-gate + Payroll-gate default OFF** (§4.3, §4.8) — kod tayyor, lekin flag yoqilmagan
   va `closePeriod` eski yo'lni o'qiydi. Bu vizyonning eng markaziy printsipi ("karta-siz ish
   yo'q, darslik tugamasa oylik yo'q") hali **amalda kuchga kirmagan** — kod bilan haqiqat orasida
   eng katta tafovut shu yerda.
4. **ЦКП/karta DATA bo'shligi** (§2.5, §4.11) — mexanizm (kaskad, feed-listener, formula-hisoblash)
   deyarli hamma joyda **real va ishlaydi**, lekin `org_functions`/`org_departments`dagi karta-data
   (`tskp_target`, `salary_min/max`, `razryad_level_id`) bo'sh bo'lgani uchun natija ko'rinmaydi.
   Bu "kod xato" emas — **DATA-gate** muammosi (`CARD-ATTRIBUTES-REQUEST` 93-lavozim varag'i).
5. **Mentor-karta bog'lanishi** (§2.7, §4.5) — bir xil jadval to'plami (`mentors`,
   `lms_card_mentors`, `hr_mentorship_pairings`), bir xil sabab (`card_id` ustuni yo'q/bo'sh),
   ikkala modulda ham mentor-tasdiq gate ishlamayapti.
6. **E1 tamoyilining amaldagi holati** — vizyon hujjatlarida E1 ("avto-salbiy-qaror yo'q, inson
   tasdig'i shart") 15+ marta takrorlanadi va aksariyat joyda **kod darajasida hurmat qilingan**
   (audit-log/tasdiq-gate mavjud) — bu ijobiy topilma, faqat DATA/ulanish yetishmayapti, tamoyil
   o'zi buzilmagan.
7. **Ikki-olam kanonik jadval** (§2.2) — `org_departments` vs `org_functions` parallel yashashi
   HR-side (`org_functions`ga keyed Payroll/RBAC) va Org-side (`org_departments`ga keyed FE) ni
   bir-biridan uzib qo'yadi — istalgan yangi HR yoki Org featuri ikkalasini ham hisobga olishi kerak.
8. **`employees.user_id` = 30/30 — HAMMASI NULL** — xodim↔login-akkaunt identifikatsiyasi
   uzilgan. Bu CC (Coordination Center)ning `MANAGER_OF_SENDER`/`POSITION:<CODE>` resolverlarini
   va Telegram-guruh qidiruvini buzadi — ikkala modul ham shu bog'lanishga tayanadi
   (`docs/agent12-hr-orgsxema-2026-06-02.md:279-290`).
9. **`workflow_rules` (gorizontal hujjat-marshrut) jadvali umuman mavjud emas** — bu ham Org
   primitivi (bo'limlar aro avto-marshrut), ham HR primitivi (ta'til/avans/komandirovka tasdiq
   marshruti). Hozir uning o'rnini `cc_workflow_steps` (34 qator, **hardcoded**, jadval emas)
   bosib turibdi (`docs/audit/org-study-2026-06-07.md:191-192`; `vision/_parts/02-hr.md:35`).
10. **PII/oylik-maxfiylik ikkala tomonda ham ochiq** — HR: `EmployeeProfile.tsx:321` har
    qanday ko'rувchiga xom oylikni ko'rsatadi; Org: `findOne` node-endpoint to'liq ma'lumotni
    field-filtrsiz qaytaradi — bu §2.8/§4.7dagi field-RBAC muammosining aniq amaliy ko'rinishi.
11. **Portret wizard — ikki audit bir-biriga zid xulosaga kelgan** — HR-nuqtai-nazardan
    (`docs/hr-module-deep-audit-2026-05-28.md:178-182`) backend **STUB** (GET `{portret:null}`,
    POST DB'ga yozmaydi); Org-nuqtai-nazardan (`docs/ui5-hr-orgsxema-ui-2026-06-02.md:82-93`)
    "TO'LIQ ULANGAN, real JSONB persist" deb da'vo qilinadi — bir kunlik ikkita hujjat orasidagi
    **hal qilinmagan ziddiyat**, jonli tekshiruv talab qiladi.

---

## 6. Xulosa — nima birinchi navbatda hal qilinsa eng ko'p item yopiladi

Ustuvorlik tartibida (ta'sir doirasi bo'yicha, kod-murakkablik bo'yicha emas):

1. **`head_user_id` backfill** (93-lavozim varag'i to'ldirilishi, egasi-DATA) — mexanizm tayyor,
   faqat qiymat kerak. Eng yuqori leverage/effort nisbati.
2. **Card-login-gate + Payroll-gate flag yoqish** (`CARD_LOGIN_GATE_ENABLED=true` + `closePeriod`ni
   `prorateCardPay`ga ulash) — arxitektura qaror + test, kod deyarli tayyor.
3. **Karta master-data to'ldirish** (`razryad_level_id`, `salary_min/max`, `tskp_target`) —
   egasi-DATA, `CARD-ATTRIBUTES-REQUEST` varag'i orqali.
4. **Field-level RBAC (BE projection)** — bitta arxitektura qarori, ikkala modulda maxfiylikni yopadi.
5. **Onboarding→karta→Payroll zanjirini ulash** (`hr_employee_onboardings` real yozilishi) —
   kod-ish, DATA-ga bog'liq emas.
6. **Mentor-karta bog'lanish** (`card_id` ustuni qo'shish + gate) — kichik migratsiya + kod.

Qolgan barcha ❌/🟡 item — yuqoridagi 6 tadan biri hal bo'lgach, ko'plari **avtomatik** "bor"ga
o'tadi (chunki mexanizm allaqachon qurilgan, faqat data/flag/ulanish yetishmayapti).

---

## 7. HR — sahifa-darajali chuqur audit (28-sahifa, 2026-05-28) — qo'shimcha aniq xatolar

Bo'lim 4dagi tematik xulosalarga qo'shimcha — bu yerda **har bir HR sahifa** alohida tekshirilgan
(`docs/hr-module-deep-audit-2026-05-28.md`, 2026 qatorlik chuqur audit). Faqat eng jiddiy/konkret
buglar (fayl:satr bilan) keltirilgan — to'liq ro'yxat manba faylda.

| Sahifa | Bahо | Jiddiy xato |
|---|---|---|
| HR Xarita (Map) | ~40%, BUZUQ | BE SELECT `lat/lng` ustunlarini o'z ichiga olmaydi → xarita production'da **butunlay bo'sh** ko'rinadi (:282-360) |
| Xodimlar (Employees) | ~75% | DELETE tugmasi uchun **BE handler yo'q** (404 qaytaradi, lekin FE "o'chirildi" toast ko'rsatadi); `base_salary` ustuni `text` turida; 10 ta orphan forma-maydon DB ustunisiz (:630-736) |
| AI HR Dashboard | ~45%, HIGH | Asosiy "AI vazifani ishga tushirish" tugmasi **mavjud bo'lmagan route**ga uradi (404 natija sifatida ko'rsatiladi) (:762-843) |
| Bildirishnomalar | ~30%, 🚫 | Schema mos kelmasligi tufayli **Saqlash tugmasi hech narsa saqlamaydi** (:1114-1190) |
| Ta'til va Kasallik | ~40%, ❌ | Contract mos kelmasligi → POST doim 400; `EMPLOYEE` roli ariza topshira olmaydi (chiqarib tashlangan) (:1308-1386) |
| Xodim Baholash (360°) | ~25%, 🚫 | DB ustun-nomi drift (`period_year` vs `rating_year`) — kod yo'li **hech qachon** ishga tushmaydi; sahifa `@deprecated` lekin hamon routed (:1402-1480) |
| Ko'nikmalar Matritsasi | ~25%, 🚫 | 7 tadan 5 ta endpoint sof soxta (`{id:Date.now(),created:true}`); **4 ta** bir-biriga mos kelmaydigan skill-schema parallel yashaydi (:1498-1590) |
| Referral Tizimi | **~10%, ENG PAST** | Maxsus jadval **umuman yo'q** — `findReferrals` aslida `employees` jadvalini so'raydi; POST sof stub; PATCH endpoint mavjud emas (:2079-2163) |
| Kasbiy O'sish (Career Path) | ~20%, ❌ | Jiddiy maydon-nom mos kelmasligi — POST doim 400; mavjud qatorlar hamma joyda "—" ko'rinadi (:1673-1744) |
| Reception | ~50% | 4 ta statistika-kartadan 3 tasi doim 0 ko'rsatadi; auto-checkout cron **o'zining DB CHECK constraint'ini buzadi** (har ishga tushishda jim xato) (:1976-2052) |
| Smena Jadvali | ~75% | `approveSwap` `action` maydonini e'tiborsiz qoldiradi — **rad tugmasi tasdiqlash bilan bir xil ishlaydi** (:1012-1098) |
| Maqsadlar (Goals) | ~70% | FE PATCH yuboradi, BE faqat PUT qabul qiladi — yangilash **jimgina** ishlamaydi; `OPERATOR` roli maqsadlarni o'chira oladi (:917-1003) |
| Mentorlik | — | BE rahbarlar *directory*sini modellashtiradi, FE juftlik (pairing)ni — create **doim 400** |
| Kunlik Hisobot | ~70% | HR-override contract buzilgan (maydonlar jimgina tashlab yuboriladi); PDF shrifti kirill harflarini render qila olmaydi; `empId\|\|1` identifikatsiya-soxtalashtirish bugi (:1878-1951) |
| HR Brend | ~65% | Javob-envelope mos kelmasligi → birinchi yuklashda forma doim bo'sh; `company_id='default'` hardcoded (multi-tenant blocker) (:2170-2247) |
| Haftalik Reja | ~60% | camelCase/snake_case mos kelmasligi — **mavjud har qanday reja o'qishda bo'sh ko'rinadi**; tasdiq-muddat hisobida 5 soatlik teskari xato (:2266-2353) |
| Aktivlar | **~85%, ENG YAXSHI** | Bu guruhdagi yagona to'liq ishlaydigan CRUD sahifa (:1204-1287) |

**Strategik xulosa (manba faylning o'zidan):** ~40% buzuq sahifalarning ildiz sababi asosan
**FE↔BE shartnoma-drift** (javob-envelope shakli + camelCase/snake_case), mantiq yetishmasligi
emas — bitta umumiy unwrapper/interceptor/mapper tuzatilsa 6-8 sahifa bir yo'la tuzaladi.
`lib/api-spec`/`api-zod`/`api-client-react` paketlari **mavjud, lekin bo'sh/ishlatilmagan**
(:2710-2716). Bundan tashqari: xavfsizlik teshigi — `discipline-records-compat`,
`mentorships-compat`, `goals-compat` kontrollerlarida `@UseGuards(RolesGuard)` bor, lekin
**`@Roles()` dekoratori umuman yo'q** — har qanday autentifikatsiyalangan foydalanuvchi kira oladi
(:2574-2579).

---

## 8. Org — fazalar-hujjatlari (Phase1/4/6/7) DDL va kanonik-jadval ziddiyatlari

Bo'lim 2dagi topilmalarga qo'shimcha — 2026-06-08 kunlik 4 ta chuqur faza-hujjat (`ORG-PHASE1/4/6/7`)
alohida DDL-darajadagi bloklovchi qarorlarni aniqladi:

- **Phase 1 — kanonik jadval yo'nalishi TESKARI bo'ldi bir kun ichida:** ertalabki audit
  (`ORG-RE-AUDIT`) `positions`ni kanonik deb tavsiya qildi ("boyroq ustunlar" asosida); kechqurungi
  audit (`ORG-PHASE1-MIGRATION-FINDING`) jonli FK-dalil bilan buni **teskari** qildi —
  `org_functions` 28 jadvaldan 29 ta real FK qabul qiladi, `positions` esa 0 ta. Bundan tashqari
  `org_functions.id=1` va `positions.id=1` **butunlay boshqa** obyektlarni bildiradi ("Bosh
  direktor" vs "Egasi") — qatorlar mos kelmaydi (`:8-30`).
- **Phase 4 — imtihon infratuzilmasi "qayta qurish emas, qayta ishlatish":** AI-imtihon =
  `ai_exam_attempts`, rasmiy imtihon = `lms_exams`, sertifikat = `certificates`, savol-bank =
  `hr_question_bank` — yangi `org_exams`/`org_certificates` jadval KERAK EMAS (`:26-48`). Barcha
  jadvallar 0 qator — qurilish bosqichida.
- **Phase 6 — M:N karta-model qurilishini 4 ta qaror bloklaydi:**
  - Oylik-manba yo'q (yagona `salary` ustuni yo'q, faqat min/max range, ikkalasi ham 100% NULL);
  - **≤1-faol-xodim qoidasi jonli DATA'da BUZILGAN** — 10 ta karta 2-3 ta faol xodimga ega
    (memory "3 karta" deb yozgan edi — bu **kam baholash**, haqiqiy son 10ta) (`:10-19`);
  - "Atomik guard" (`card.service.ts canAssignEmployee`) faqat **ilova darajasida maslahat**
    xarakterida — hech qanday yozuv-yo'li uni chaqirmaydi, DB unique-index yo'q (`:38-41`);
  - Payroll dvigateli faqat `payroll_contracts`ni o'qiydi (0 qator) — `employees.base_salary`
    yoki `org_functions`ni HECH QACHON o'qimaydi; 14 ta payroll/salary jadval — HAMMASI bo'sh;
    "kartalar bo'yicha yig'indi" formulasi hech qayerda amalga oshirilmagan (`:98-101`).
- **Phase 7 — vakansiya-yaratish bugi + i.o. greenfield:**
  `DrizzleHrVacanciesRepository.create()` **ataylab** `org_function_id`/`priority`/
  `number_of_positions`/`open_positions`/`closing_date` maydonlarini insert paytida tashlab
  yuboradi — shuning uchun "Vakant" tab (to'g'ri o'qiydigan) doim bo'sh ko'rinadi (`:35-39`).
  Acting/i.o. konsepsiyasi bu fazagacha DB yoki kodda **umuman mavjud emas edi** — to'liq
  greenfield sifatida qurilgan (`:58-59`). FORMULA-A (oylik yig'indisi) **3 ta alohida joyda**
  qaytadan yozilgan — lockstep-edit xavfi (`:76-84,127-133`).

### 8.1 Meta-topilma — audit hujjatlarining o'zida "ikki xulosa" (twin-conflict)
Kengaytirilgan tadqiqot shuni aniqladi: bir xil EP-ORG-ID **bir xil hujjat ichida** ikki marta
tekshirilib, ikki xil xulosaga kelingan holatlar bor — bu tasodifiy xato emas, balki ikki
mustaqil audit-o'tish (pass) natijasi:
- Karta-shablon qo'llash mexanizmi: 01.15 "✅ bor" vs 01.57 "🟡 qisman" (bir xil ID, bir xil hujjat).
- Vakansiya-ustuvorlik ustuni: 01.31 "bor" vs 01.73 "qisman".
- Import xato-boshqaruvi: 01.34 "bor" vs 01.76 "yo'q".
- ЦКП hisobot-muddati: ba'zi joyda 16 soat, boshqasida 3 soat (§2.5/§2.9da ham qayd etilgan).
- Eskalatsiya-sakrash: Q22 "sakrash yo'q" vs Q38 "max 3 sakrash" (§2.9dan ham).
- Vakant-karta rangi: vizyon "kulrang" so'ragan, kod qizil-punktir ko'rsatadi.
- Kanonik-jadval tavsiyasi **bir kun ichida teskari bo'ldi** (yuqoridagi Phase-1 topilmasi).

**Amaliy xulosa:** kelgusi audit/tekshiruv ishlarida bitta hujjatning o'zidagi ikkita xulosani
"ikkalasi ham to'g'ri" deb qabul qilmaslik kerak — qaysi audit-pass so'nggi/aniqroq ekanini
jonli kod/DB bilan qayta tekshirish talab qilinadi.

---

## Manba fayllar (to'liq ro'yxat — 2 bosqichli tadqiqot: qo'lda o'qilgan asosiy 4 + agent tomonidan 36 fayl)

**Asosiy (qo'lda o'qilgan, §1-6 negizi):**
- `docs/vision/_parts/01-org-kartalar.md` — Org 50 qaror + 10 ochiq savol (2026-06-08)
- `docs/vision/_parts/02-hr.md` — HR 50 qaror + 13 ochiq savol (2026-06-08)
- `docs/audit/VIZYON-TEKSHIRUV-2026-06-27/01-org-kartalar.md` — Org 143-savolli mustaqil verify
- `docs/audit/VIZYON-TEKSHIRUV-2026-06-27/02-hr.md` — HR 82-savolli mustaqil verify
- `docs/audit/OPEN-OWNER-QUESTIONS-CONSOLIDATED-2026-07-11.md` — eng so'nggi konsolidatsiya (#1 head_user_id)

**Qo'shimcha (§7-8 negizi, fon-agent tomonidan o'qilgan):**
- `docs/ORG-KARTA-MODEL-SPEC-2026-06-07.md`, `docs/ORG-PHASE1-MIGRATION-FINDING-2026-06-08.md`,
  `docs/ORG-PHASE4-EXAM-REAUDIT-2026-06-08.md`, `docs/ORG-PHASE6-EMP-CARD-REAUDIT-2026-06-08.md`,
  `docs/ORG-PHASE7-REAUDIT-2026-06-08.md`, `docs/ORG-RE-AUDIT-2026-06-08.md`,
  `docs/org-structure-current-state-2026-06-04.md`, `docs/audit/org-study-2026-06-07.md`,
  `docs/audit/org-vision-analysis-2026-06-07.md`, `docs/audit/KARTALAR-JAVOBLAR-IMPACT-2026-06-08.md`,
  `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`,
  `docs/audit/FINANCE-SOD-ORGCHART-READINESS-2026-07-06.md`,
  `docs/audit/ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06.md`,
  `docs/audit/ORGCHART-PERMISSION-READINESS-FULL-2026-07-06.md`,
  `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md`, `docs/audit/MUSLIMBEK-PROMT-11-HR-2026-06-08.md`,
  `docs/audit/MUSLIMBEK-PROMT-ORG-RAZRYAD-FIX-2026-06-17.md`, `docs/EMPLOYEES_MODULE_AUDIT.md`,
  `docs/EMPLOYEES_MODULE_FIX_PLAN.md`, `docs/HR_MODULE_COMPLETE_AUDIT.md`,
  `docs/HR_PRODUCTION_AGENT_PROMPT.md`, `docs/hr-module-audit.md`, `docs/hr-module-deep-audit-2026-05-28.md`,
  `docs/hr-progress-phase8.md`, `docs/hr-progress.md`, `docs/modul11-hr-FULL-2026-06-03.md`,
  `docs/agent12-hr-orgsxema-2026-06-02.md`, `docs/ui5-hr-orgsxema-ui-2026-06-02.md`,
  `docs/_ui-codescan-5-hr.md`, `docs/vision/_parts/V-01-org.md`, `docs/vision/_parts/V-02-hr.md`,
  `docs/vision/_parts/I4-orgsxema.md`, `docs/vision/_parts/_archive/{B01,B-01}-org.md`,
  `docs/vision/_parts/_archive/{B02,B-02}-hr.md`
- `docs/audit/CARD-ATTRIBUTES-REQUEST.md` — 93-lavozim × 4-atribut bo'sh varaq (egasi-DATA)
- `docs/audit/MASSIV-100/` — 12-fazali karta-markazli execution reja (PHASE-01..10)
- Memory: `project_org_card_centric_model`, `project_org_structure_vysotskiy7`,
  `project_karta_vizyon_spec_2026_06_25`, `project_massiv_100_complete_2026_06_25`,
  `project_ijro_reja_99_agent_2026_06_25`, `project_hr_massive_build_2026_06_18`,
  `project_full_vision_extraction_2026_07_07`

---

*Tuzilgan: 2026-07-13, ikki bosqichda. 1-bosqich: qo'lda 4 ta asosiy manba o'qildi, §1-6 yozildi,
commit `2bdb37f6`. 2-bosqich: fon-agent 36 faylni chuqurroq skanerlab qaytardi (§7-8 + §5.8-11
shu asosda qo'shildi). Rol: faqat konsolidatsiya (read-only tahlil) — hech qanday kod/DB
o'zgartirilmadi. Hech qanday raqam/savol to'qib chiqarilmagan — har bir band yuqoridagi manba
fayllarga bevosita asoslangan.*
