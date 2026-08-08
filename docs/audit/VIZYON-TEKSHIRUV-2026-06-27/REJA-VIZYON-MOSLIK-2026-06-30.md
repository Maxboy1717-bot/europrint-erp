# EUROPRINT ERP — VIZYONGA YETISH REJASI (39% → 88%+)

> **Sana:** 2026-06-30
> **Asos:** `VIZYON-TASDIQ-2146-TOLIQ` (aniq **1965 savol**, 20 modul) + mustaqil tekshiruv (`00-MASTER-HISOBOT.md` + 20 modul fayli)
> **Hozirgi moslik:** **~39%** (bor 297 / qisman 867 / yo'q 723 / egasi-data 78)
> **Maqsad:** bosqichma-bosqich ~88%+

---

## 0. ASOSIY TASHXIS — bo'shliq qayerda?

| Kategoriya | Soni | Tabiati | Yechim turi |
|---|---|---|---:|
| 🟡 **qisman** | **867 (44%)** | Mexanizm/sxema/endpoint BOR, lekin **data=0** yoki cron/listener/gate ULANMAGAN | **Data seed + wiring** (arzon, tez) |
| ❌ **yo'q** | **723 (37%)** | Umuman qurilmagan (jadval/ustun/kod yo'q) | **Yangi build** (qimmat) |
| 🔑 **egasi-data** | **78 (4%)** | Kod tayyor, faqat **siz qiymat berasiz** | **Egasi kiritadi** (eng arzon) |
| ✅ bor | 297 (15%) | Ishlaydi | — |

⭐ **Strategik xulosa:** vizyonga yetishning eng arzon yo'li — avval **qisman'larni "bor"ga aylantirish** (data+wiring), keyin eng zaif modullarni build qilish. 867 qisman'ning yarmini ulansa ham, moslik ~39%→~55% ga ko'tariladi — **yangi kodsiz**.

---

## REJA — 5 BOSQICH (trayektoriya 39% → 88%)

| Bosqich | Nima | Modullar | Maqsad% | Ish hajmi |
|---|---|---|---:|---|
| **0** | Egasi-data + master seed | Barchasi (78 band) | 39→**46** | 1 hafta (asosan egasi) |
| **1** | Golden-thread wiring + cron/listener faollashtirish | SD→PP→MES→QC→WMS→FIN | 46→**57** | 2-3 hafta |
| **2** | Eng zaif modullarni build | Kanban, Bildirishnoma, Coordination | 57→**68** | 4-6 hafta |
| **3** | O'rta modullarni to'liqlash | MM, MES, SD, CRM, Marketing, IoT | 68→**80** | 6-8 hafta |
| **4** | Qolgan "yo'q" + buzuq-kod tozalash + polish | Barchasi | 80→**88+** | 4-6 hafta |

---

## BOSQICH 0 — Egasi-data + master seed (39→46%) 🔑
**Maqsad:** kod tayyor bo'lgan 78 "egasi-data" bandni + bo'sh master-jadvallarni to'ldirish. Yangi kod deyarli yo'q.

**0.1 — Egasi beradigan qiymatlar (siz kiritasiz, blokerlar):**
- **Razryad qiymatlari** (`razryad_levels` 6 qator NULL): `salary_min/max`, `exam_type`, `exam_pass_threshold`, `max_retakes` (Org Q3,Q4,Q13,Q14).
- **ЦКП normalari** (`org_departments/org_functions.tskp_target` = 0): har karta uchun maqsad qiymat (Org Q9,Q10).
- **Karta-shablonlar** (`card_templates` = 0 qator): 10-15 zavod lavozimi (Org Q17).
- **workflow_rules** (0 qator): kim-kimga-tasdiq qoidalari (Coordination Q65,Q101).
- **kim-kimni-boshqaradi** (`org_departments.head_user_id` NULL): vertikal zanjir (Org).
- **AI kalitlar** (har karta AI'si uchun).

**0.2 — Master-data seed (idempotent SQL, kod-tomon):**
- roles, razryad 1-6, unit_of_measures, accounts (BHMS), defect_catalog — `docs/migration/seed/` allaqachon tayyor → ishga tushirish.
- Kanban kanonik 3-savat (hozir test-axlat: `as/salom/SADSD`) → standart `Bajariladi/Jarayonda/Bajarildi`.
- shift_types A/B/C 12h (hozir MORNING/EVENING/NIGHT 9h).

**Natija:** ~78 egasi-data + ~40-50 qisman(data=0) → bor. **+~7%**.

---

## BOSQICH 1 — Golden-thread + cron/listener wiring (46→57%) 🔗
**Maqsad:** mexanizm BOR lekin ULANMAGAN narsalarni ulash. Bu eng katta "qisman→bor" konvertatsiyasi.

**1.1 — Oltin zanjir (SD→PP→MES→QC→WMS→FIN) eventlari:**
- Hozir ko'p event 0-listener (xotira: 13+ zero-listener event). Har bosqich orasidagi `@OnEvent` listenerlarni ulash.
- `domain_events` jadvali bo'sh — outbox→handler oqimini jonlashtirish.

**1.2 — Cron/eskalatsiya faollashtirish (kod bor, ishlamaydi yoki yo'q):**
- **Coordination:** `rasporyajeniye markOverdue` cron YO'Q (faqat SELECT CASE) → eskalatsiya cron qo'shish. `cc-sla.cron` namuna bor (cc_approvals uchun ishlaydi).
- **Kanban:** eskalatsiya cron yo'q (faqat `kanban-recurring.cron`) → WIP-limit/SLA/reopen cron.
- **Bildirishnoma:** BullMQ kodbazada BOR lekin NTF'ga ulanmagan → 24h taymer + delayed-job NTF'ga ulash.

**1.3 — GL/ЦКП feed:**
- `ckp-mes-feed.listener` bor → ЦКП-fakt data oqimini tekshirib jonlashtirish (`ckp_card_products`=0).
- GL-posting (SD→FIN) ishlaydi, lekin "retry" yo'q — best-effort qoldiriladi yoki outbox-retry qo'shiladi.

**Natija:** ~100+ qisman → bor. **+~11%**.

---

## BOSQICH 2 — Eng zaif modullarni build (57→68%) 🔴
Haqiqiy% eng past 3 modul (eng katta "yo'q" klasteri).

**2.1 — Kanban (15% → ~50%, 100 ta "yo'q"):**
- `kanban_cards` yetishmayotgan ustunlar: `category`, `confidential`, `quantity/tiraj/progress`, `card_id` (lavozim-karta bog'lanish).
- RBAC: "faqat boshliq vazifa beradi" (assigner gate).
- WIP-limit, reopen/rollover/moveBack, urgent-limit, escalation, mention, auto-observer.
- `fromDeficiency` (sifat-nuqsondan vazifa), `probationDecision`, `mentorWatch`.

**2.2 — Bildirishnoma (15% → ~50%, 58 ta "yo'q"):**
- **`notification_schedules`** markaziy matritsa jadvali (umuman yo'q) — yaratish + egasi-sozlanadigan vaqt.
- **`kanban_column_sla`**, **`ntf_doc_views`** jadvallari (yo'q) — yaratish.
- 24h verbal-confirm taymer (BullMQ bilan).
- `users.telegram_id` UNIQUE index (hozir non-unique).
- org-marshrut bo'yicha digest (daraja-eskalatsiya).

**2.3 — Coordination (22% → ~50%, 67 ta "yo'q"):**
- Yetishmayotgan jadvallar: **`council_members`**, **`prikaz`**, **`protocol`** (umuman yo'q) — yaratish.
- `dokla` ustunlari: `deadline`, `tur`, `ilova`.
- `rasporyazhenie` ustunlar: `asos`, `soispolnitel`, `acceptedAt`.
- Kengash (council) oqimi: chairperson, meeting_schedule (hozir NULL), a'zolar.
- Eskalatsiya cron (1.2 bilan bog'liq).

**Natija:** 3 modul ~15-22% → ~50%. **+~11%**.

---

## BOSQICH 3 — O'rta modullarni to'liqlash (68→80%) 🟡
Qisman ko'p, "bor"ga aylantirishga yaqin modullar.

- **MM (25%):** `mm_goods_receipts` 3-way match (PO↔qabul↔hisob-faktura), vendor `MFO/bank/inn/yuridik-manzil` + majburiy-blok, EOQ cron.
- **MES (27%):** `production_operations` jadvali (yo'q — bottleneck uchun) yoki mavjud jadvalga to'liq ko'chirish; OEE haqiqiy (hozir hardcoded 0.85/0.97); brigada A/B/C; real-vaqt smena oqimi.
- **SD (34%):** 3-checkpoint gate (BOM/routing/card) `ready_for_planning` o'tishida; avans-gate to'liq.
- **CRM (33%):** `sd_customers.segment` CHECK + qiymatlar (vip/regular/new); папка-mijoz ro'yxati; RFM/churn data.
- **Marketing (32%):** NPS avto-trigger (buyurtma yopilganda); ROI atribusiya-oyna so'rovga qo'llash.
- **IoT (38%):** sensor data oqimi (hozir 0); IoT→Telegram allaqachon ulangan (faqat data yo'q).

**Natija:** **+~12%**.

---

## BOSQICH 4 — Qolgan "yo'q" + tozalash + polish (80→88%+) 🧹
- Qolgan kichik "yo'q" bandlar (har modulda 5-15 ta).
- **Buzuq-kod tozalash (Q-46) davom:** SD-retry, CRM-segment-CHECK kabi doc-oshirilishi; qolgan VIEW-write/dead-column tekshiruvi. (MES detectBottleneck + CC parent_document_id allaqachon hal qilingan — 2026-06-30.)
- Doc-tuzatish: 83 rad etilgan da'voni `VIZYON-TASDIQ-2146` da to'g'rilash (ayniqsa ~50 "kam baholangan").
- Stub sahifalar (22 route) → real yoki EPComingSoon.

---

## USTUVORLIK MANTIQI

1. **Arzon→qimmat:** egasi-data (0) → seed (kam) → wiring (o'rta) → build (qimmat).
2. **Ta'sir×oson:** Bosqich 0+1 (data+wiring) eng katta %-o'sishni eng kam kod bilan beradi (39→57%).
3. **Eng zaif birinchi build:** Kanban/Bildirishnoma/Coordination (foydalanuvchi har kuni ko'radi).
4. **Q-46 doimiy:** har bosqichda buzuq/soxta kod topilsa — darhol fix yoki to'liq o'chirish.

## EGASIDAN KUTILAYOTGAN QARORLAR (blokerlar)
Bosqich 0 boshlanishi uchun siz beradigan data:
1. Razryad: 6 razryad uchun oylik-oraliq + imtihon-chegara + qayta-topshirish limiti.
2. ЦКП: har asosiy karta uchun norma (maqsad qiymat + o'lchov turi).
3. Karta-shablonlar: 10-15 zavod lavozimi ro'yxati.
4. workflow_rules: kim qaysi hujjatni kimga tasdiqqa yuboradi.
5. head_user_id: kim-kimni-boshqaradi (vertikal zanjir).
6. AI kalitlar (har karta AI'si uchun).

---

*Manba: `00-MASTER-HISOBOT.md` + 20 modul tekshiruv fayli. Trayektoriya %lari taxminiy — har bosqich oxirida qayta-tekshiruv bilan aniqlanadi.*
