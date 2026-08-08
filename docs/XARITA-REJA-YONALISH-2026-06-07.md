# EUROPRINT ERP — XARITA · REJA · YO'NALISH (Master)

> **Sana:** 2026-06-07 · **Manba:** 130+ vizyon/tahlil fayl + jonli kod/DB/git tekshiruvi (verify-don't-trust)
> **Maqsad:** yagona haqiqat manbai — qayerdamiz (xarita), nima qilamiz (reja), qaysi tartibda (yo'nalish).
> **Ishonch belgisi:** ✅ = bu sessiyada JONLI tasdiqlangan · 📋 = analiz/headline (musur-filtrlanmagan, jonli qayta-tekshiriladi)

═══════════════════════════════════════════════════════════════════
# 1. XARITA — QAYERDAMIZ
═══════════════════════════════════════════════════════════════════

## 1.1 Loyiha
Karton/qadoqlash zavodi ERP'si (Qo'qon). Build-stage (~30 test xodim, operatsion data deyarli bo'sh).
Stack: NestJS+Fastify (BE) · React+Vite+wouter (FE) · PostgreSQL+Drizzle · pnpm monorepo.
Hajm: ~1M qator · 20 modul · ~950 jadval. Branch: `chore/schema-convergence` (de-facto main).
Egasi: non-texnik, yagona — Claude=ustoz/maslahatchi, Muslimbek=bajaruvchi (kod).

## 1.2 Umumiy holat
- **Poydevor: B (~85%)** — DDD/CQRS, 4 global guard, kod sifati toza (array/Result reviewer = 0).
- **Ishlaydigan ERP: D+ (~25-30%)** — modullar yaxshi qurilgan, lekin ULANMAGAN ("orollar").
- **Asosiy metafora (egasi):** "ballonsiz mashina" — dvigatel bor, transmissiya ulanmagan.

### 🔄 YANGILANISH 2026-07-02 (12 o'lchov-agent, jonli kod+DB+HTTP) ✅
> **To'liq master-reja:** [`docs/audit/MASTER-REJA-VIZYON-2026-07-02.md`](audit/MASTER-REJA-VIZYON-2026-07-02.md) — klaster-jadval, sahifalar/data inventar, oltin-ip 27 halqa, egasi-DATA 47 yozuv, 0-3 bosqich reja.

- **Umumiy: modul-klaster o'rtacha 65% (06-27: ~52%, +13)** · data-jonlilik 57% (06-25: ~10%, +47) · sahifalar 85% (467 route: 325 jonli / 123 yarim / 5 stub).
- Klasterlar: WMS/POS 81 · HR/LMS 75 · Finance 70 · CC/Kanban 70 · SD/CRM/Mkt 64 · PP/MES/QC 61 · Org 59 (−4: daraxt-buzilish topildi) · AI/IoT 40.
- **Eng muhim o'zgarishlar (vizyon-fix to'lqinlari 06-30..07-02, ~10 guruh):** G1 ombor (barkod-gate, 47 DEPT ombor avto-sync, raqamlash, sikl-sanash cron jonli) · kassir-hub (1-smena+PIN+X/Z+payroll 4-bosqich) · QYM 16:00 jonli (hr_daily_reports=8449) · kunlik ishlagan-pul PDF (10 ta jonli) · lid-birlashuv (sd_leads VIEW o'chdi) · G4 CC↔Kanban · QC-birlashtirish · gofra 3-formula · NDA modul · ANTHROPIC kalit .env'da.
- **🔴 5 ta P0 (0-bosqich, darhol):** (1) 06-30 to'lqin kod-fayllari GIT-UNTRACKED + Prikaz/Protocol/Council/2-cron modul-registratsiyasi YO'QOLGAN (regress); (2) org daraxt buzuq (owner/CEO parent xato, OTD1-7 dublikat) + razryad EXECUTION jonsiz (exam_pass_threshold NULL); (3) AI jonli chaqiruv=0 (kalit bor!) + kamera soxta endpoint; (4) ЦКП-fakt=0 → karta-oylik darvozasi hamma oylikni 0 qiladi; (5) NPS DI-regress + /api/public/categories 503.
- **Egasi-DATA: 47 yozuv** (A12 yadro: AI-kalit faollashtirish, daraxt-qarori, xodim↔karta, razryad/oylik-band/stake, ЦКП, head_user_id, workflow_rules · B12 rollout: PIN, kassir, QC-konfig · C23 modul-data) — to'liq jadval master-rejada §3.2.

## 1.3 Vizyon (22 — egasi xohlagani, guruhlangan)
- **Yadro:** POS Monitor (retail-skaner ombor) · Kassir-markaz (bitta kassir, hamma naqd) · 9-13 ombor turi (barcode ota-bola, rulon)
- **Ishlab chiqarish:** 22 ofset sex + flekso · gofra liniya · ⭐ sloy formula (kg→m²→list, AI uchun) · kashirovka · tigel (QC markaz)
- **Pul:** oylik (hisob→direktor→kassir→xodim PIN) · podotchet/qarz · oshxona
- **Yangi:** CRM aloqa (SMS+AI-qo'ng'iroq) · menejer buyurtma-paneli · web-sayt · marketing xarajat · SMM AI nazorat · lead-gen 4 kanal
- **⭐ Org-struktura:** butun ERP org-sxemaga bog'lanadi (master data — kim ko'radi/tasdiqlaydi/eskalatsiya)
- **⭐ Oltin ip:** bitta zanjir uchma-uch (buyurtma→i.ch→ombor→moliya)
- **Falsafa:** ERP OSON + tartibga soluvchi · AI ishni qiladi, odam tasdiqlaydi · qog'oz/Excel yo'qoladi · har so'm hisobli.

## 1.4 20 modul spektri 📋
- **Kuchli:** Chat · Ombor/WMS · LMS · Admin · Vazifalar
- **O'rta:** CRM · QC · Texnologiya · Koordinatsiya · Marketing · HR · Moliya · Direktor · IoT · AI-reja · MES · Ta'minot
- **Zaif:** Dizayn · Xo'jalik/MRO · Xavfsizlik (KPP yo'q)

## 1.5 5 ildiz muammo (eng muhim — bularni tuzatsa o'nlab "muammo" yo'qoladi)
| # | Ildiz | Holat |
|---|---|---|
| 1 | **Oltin ip** (buyurtma→i.ch→ombor→moliya) | ✅ **TO'LIQ bog'landi** (2026-06-07) — POS→ombor→GL→daftar + QC create + delivery create tuzatildi (⚠️ QC raw-SQL workaround: qc_inspections.id INTEGER vs Drizzle UUID drift) |
| 2 | **Moliya orol** (GL→entries) | ✅ qisman — 2 finance writer + payroll → entries; gl_lines 1 writer qoldi |
| 3 | **manager_id 30/30 NULL** | 🔴 ochiq — avval head_user_id (124/142 bo'sh) to'ldirish kerak |
| 4 | **Ikki-olam** (2 order/7 GL/2 stok) | qisman — warehouse_stock kanonik, current_stock=VIEW; 12 uuid FK qoldi |
| 5 | **Soxta tugmalar** (echo/hardcoded) | qisman — ba'zilari tuzatilgan; status-katalog aniqlaydi |

## 1.6 Git / CI / Backup holati ✅ (jonli — 2026-06-07 yangilandi)
- ✅ **Backup BO'LDI** — chore origin'da (0 ahead), secret **scrub** qilingan (filter-repo, e7fe97d3). 2 kalit history'dan o'chdi.
- ✅ **main sync BO'LDI** — origin/main = chore HEAD (PR #10 Merged). 831-commit gap yopildi.
- ✅ **code-quality.yml CI = YASHIL** (testlar 1410 pass + 22 qoida; ko'pi RATCHET orqali: raw-sql 53/missing-test 40/i18n-leak 64 — qarz cheklangan, yo'qolmagan).
- ✅ **ci.yml = YASHIL** (5 job: typecheck/lint/build/security/test — run 27077376082). ⚠️ yashilда 1 ta chegara-pasaytirish: FE coverage 15%→10% (test oshirish emas, bar pasaytirish).
- ~40 branch hali turibdi (cleanup'da 0 o'chdi — hech biri "isbotlangan merged" emas, xavfsizlik uchun saqlandi; zarari yo'q).

## 1.7 Jonli tasdiqlangan ✅ vs Headline 📋 (halol)
- ✅ **Ishonchli (bu sessiya jonli):** git/CI/backup · reviewer (0/0) · oltin ip (entries Dr1010/Cr6000) · GL writerlar · mappings=8 · secret leak · MES→QC+IoT real INSERT.
- 📋 **Headline (qayta-tekshiriladi):** 20-modul % · SAP detailed catalog (60 green-lie/55 orphan/40 fake — signal-count, musur bo'lishi mumkin) · "today honest" verdikt.

═══════════════════════════════════════════════════════════════════
# 2. REJA — NIMA QILISH KERAK
═══════════════════════════════════════════════════════════════════

## 2.1 DARHOL (xavf — bugun)
1. **Secret tozalash + backup push** — 2 kalitni rotate → allow-URL re-push (private repo) YOKI filter-repo scrub. 588 commit GitHub'ga.
2. **A.3 deletions commit** — 3 o'lik fayl ` D` holatda, commit qilinmagan (ba428f1c o'tkazib yuborgan).

## 2.2 OLTIN IP (LIVE — kengaytirish)
- EXTERNAL_IN ishladi. Boshqa harakat turlari (chiqim/transfer) + gl_account_mappings to'liq (8 qator bor) bilan sinash.
- POS inline path kanonik (event path o'lik, o'chirildi). Double-count yo'q.

## 2.3 ILDIZ + ORG-STRUKTURA (POYDEVOR) — ⭐ QARORLAR (intervyu 2026-06-07) · tahlil: `docs/audit/org-vision-analysis-2026-06-07.md`
- **Org-chart = YAGONA master** (Vysotskiy 7-Otdeleniye, o'zgaruvchan chuqurlik daraxt). Hammasi undan **DATA-driven** [Q1/Q5].
- **VERTIKAL — manager_id** [Q1/Q4]: daraxtда **bevosita yuqori node boshlig'i** ("dept head" EMAS; har bo'lim har xil chuqurlik). ⚠️ oldingi soddalashtirilgan manager_id promt **RETRACTED**.
- **GORIZONTAL — workflow_rules** [Q5]: bo'limlararo yo'l (avans: Sotuv→Moliya→Kassir) org-structure'dan **sozlanadi** (admin, hardcoded emas). Hozir jadval **YO'Q**.
- **Holat:** skelet QURILGAN (142 node, RBAC 1380), lekin rahbarlik-DATA (head_user_id **18/142**, manager_id **0/30**) + gorizontal jadval + ЦКП (tskp **0/97**) **YO'Q** → **foundational build, tez fix EMAS**.
- **Kanonik buyurtma** = `sales_orders` (menejer kiritadi) [Q2] → fan-out dept'lar `org_departments`'ga bog'lanadi + 12 uuid FK. **DDL**.
- **GL #76** = sex bo'yicha ALOHIDA hisob [Q3] → cost-center = `org_departments` node (parallel master EMAS; SAP cost-center bor) + entries kengaytirish/repoint. **DDL**.
- **Ochiq — egasi:** rahbarlik DATA (kim qaysi node'ga rahbar — faqat siz/HR) · ЦКП maqsadlar · imzo PIN/login. **Texnik — men tavsiya:** workflow_rules jadval · manager derivatsiya · 2-dept-olam · kodlash kanoni.

## 2.4 STATUS KATALOG ✅ TUGADI (2026-06-07) — `docs/audit/status-catalog-2026-06-07.md`
13 parallel read-only agent · 341 controller · ~2127 route · backend down → statik + DB-proof. Natija:
- 🟢 **~1930 REAL (≈91%)** — haqiqatan ishlaydi (poydevor solid).
- 💀 **~74 ALDAMCHI** = 38 green-lie (200 qaytaradi, HECH SAQLAMAYDI) + 34 mock (soxta raqam) + 2 e2. **Eng xavfli — jim yo'qotish.**
- ❌ **41 BUZUQ (5xx)** = 38×500 + 3×503.
- 🧨 **5 FK uuid↔int** — create→read jim uziladi (marketing exhibitions/inbox).
- ⭐ Oltin ip: 1→3 va 5→6 ishlaydi (entries DB-proof); **2 UZILISH:** QC create (500) + delivery create (404).
- ✅ Musur tozalandi: chat/sd-customers/wms-integration/IoT/MES→QC eski flaglar = allaqachon tuzatilgan (refuted).

### KONKRET FIX-BACKLOG (prioritet):
- **P0 — Oltin ip 2 uzilish** (zanjirni bog'laydi): QC create `POST /api/qc/inspections` 500 (`CreateInspectionCommand` handler ro'yxatdan o'tmagan) · Delivery create `POST /api/sd/deliveries` 404 (controller'da `@Post` yo'q, service bor).
- **P1 — 74 aldamchi** (jim yo'qotish/soxta): finance (invoice post→GL yozmaydi, payment verify) · qc (approve/reject rowCount e'tiborsiz) · crm (ai/comms echo) · hr (referrals/mentorship yo'q jadval).
- **P2 — 41 5xx:** 12 yo'q jadval→27 route (zno/zvs/micro_modules/qc_approvals/mm_*/mes_*) [DDL=ruxsat Q-35] · 9 ustun-drift (rename: invoices.issue_date→invoice_date, fi_invoices.source_id, warehouse_batches.item_id) · 5 handler ro'yxatdan o'tmagan.
- **Flag (owner):** pos-v2 RBAC (UPPER_CASE rol vs lowercase model → ~16 route 403 xavfi).

## 2.5 MODUL-MODUL (3-faza: tahlil→intervyu→ijro)
- Modul 1 (CRM/Savdo) + 2 (Marketing) — intervyu TUGAGAN, ijro kutadi.
- Modul 3-20 — intervyu kutadi (taxmin yo'q — har modul: tahlil→egasi qaror→task→ijro).

## 2.5b ⭐ ORG = KARTA-DARAXT (intervyu 2026-06-07, 6 rond) — `memory: org-card-centric-model`
Org = **bitta DARAXT, har NODE = KARTA** (karta = ham bo'lim ham lavozim). Egasidan boshlanadi (**7 qatlam**). Karta asosiy, xodim ikkilamchi (kartaga xodim qidiriladi). 1 karta=1 o'rindiq (dublikat 01,02..); razryad **hamma kartada** + dinamik (xodim o'ssa ko'tariladi); xodim ko'p karta→oylik yig'indi, daraxtда har joyda ko'rinadi. Karta: talab·razryad·oylik(soat/kun/ish+bonus)·darslik·ЦКП·ko'nikma·hozirgi-holat·portret(=kerakli xodim). **Markaziy AI**: mos-baho·PDF·3kun-yo'q→profil-blok·chatbot·ko'nikma-matritsa→vorislar(sabab bilan, ichki o'sish). ЦКП kunlik hisobot = **faqat mashinasiz** xodimlar (mashinachilar avto-o'lchanadi); 16soat-bermasa kun-oylik yo'q. Imtihon=xodim belgilaydi(min 3oy)→razryad→HR hujjat+ichki sertifikat; o'sish=HR+rahbariyat tasdiq. Vakant rahbar→pastdagilar rahbarsiz ishlayveradi. Karta HR yaratadi, **o'chmaydi** (tahrir+to'liq tarix). ⭐ Hamma data **bitta DDL sinxron** (ikki-olam yo'q). Darslik tugamasa o'sha karta oyligi yo'q; kartasiz ERP yo'q. **Keyingi: yaxlit spec → tasdiq → ijro.**

## 2.6 YANGI VIZYONLAR (DEFER — MVPdan keyin)
- CRM SMS/AI-qo'ng'iroq · web-sayt · lead-gen 4 kanal · marketing xarajat · AI kamera (GPU) · kassir-hub (katta).

## 2.7 HARD BOUNDARY — egasi qarori kerak
- 12 uuid FK migration (DDL) · GL #76 cost-center qarori · outbox kengaytirish · kassir konsepti · dizayn standarti · branch promote (keyin).

═══════════════════════════════════════════════════════════════════
# 3. YO'NALISH — QAYSI TARTIBDA
═══════════════════════════════════════════════════════════════════

```
0. DARHOL                ✅ TUGADI    — secret scrub + backup + main sync
        ↓
1. REPO HYGIENE          ✅ TUGADI    — ci.yml + code-quality yashil · A.3 o'chdi · branch cleanup (0 o'chdi — none merged, saqlandi)
        ↓
2. STATUS KATALOG        ✅ TUGADI    — 2127 route · ~1930 real · 74 aldamchi · 41 5xx · oltin ip 2 uzilish (→ §2.4)
        ↓
3. OLTIN IP — 2 UZILISH  ✅ TUGADI   — QC create + delivery create tuzatildi (76f846d9, 768426e7) → zanjir TO'LIQ bog'landi
        ↓
4. ILDIZ                 ⬜           — manager_id ← head_user_id · kanonik buyurtma · GL #76
        ↓
5. ALDAMCHI + 5xx        ⬜           — 74 aldamchi (P1, jim yo'qotish) + 41 5xx (P2; 12 yo'q jadval = DDL ruxsat)
        ↓
6. MODUL-MODUL           ⬜           — 20 modul (tahlil→intervyu→ijro)
        ↓
7. YANGI VIZYON          ⬜           — kassir-hub · CRM aloqa · web · AI kamera
```

**Prinsiplar (har qadamda):**
- ⭐ Verify-don't-trust — har da'vo jonli (kod+DB), eski raqamga ishonma.
- ⭐ Anti-musur — nomzod≠tasdiqlangan, dalil-yoki-tashla, adversarial-skeptik.
- ⭐ Ishlaydi≠to'g'ri — real INSERT+DB-proof, echo/fake TAQIQ.
- ⭐ Bo'laklab, jonli-isbotli — har bo'lak ko'rinadigan natija (oltin ipdek), keyin keyingisi.
- ⭐ Tomir kesish — o'chirish=butun ildiz (qaytmaydi).
- ⭐ Massaviy EMAS — bittalab, ruxsat darvozasi, har "tugadi" spot-check.

═══════════════════════════════════════════════════════════════════
# 4. ISH USULI — KIM NIMA QILADI
═══════════════════════════════════════════════════════════════════

| Rol | Kim | Qiladi |
|---|---|---|
| Egasi / Qaror | Maxboy | vizyon, qaror, yo'nalish (non-texnik) |
| Ustoz / Maslahatchi | Claude (chat) | tahlil, reja, **promt yozish**, nazorat (read-only verify) — KOD YO'Q |
| Bajaruvchi | Muslimbek | kod yozadi, commit qiladi |

**⭐ ISH MODELI (owner 2026-06-07):** ish **AREA/modul bo'yicha** — agent bir hududда ishlaganда **TUZATISH + QURISH + QO'SHISH** ni BIRGA qiladi (bitta promt; qayta-qayta bormaydi). Hududда qurish/qo'shish poydevor/owner-data/DDL kutsa → o'sha qism GATED (tayyor bo'lganда). Parallel: butun ERP tozalash+qurish+qo'shish; **o'chirishga ENG ehtiyot** (isbot + owner "ha" + tomir-kesish + backup; shubha→tegmaslik). Tartib: hozirgi fix-batch → org-karta (poydevor) → Finance/QC/Ombor... area-ma-area.

**3 faza (har ish):** TAHLIL (read-only) → QAROR (egasi+Claude intervyu) → TAHRIR (Muslimbek, ruxsat darvozasi).
**Qoidalar:** CLAUDE.md Q-1..45 (kod uslubi A,B,1-23 + jarayon Q-24..45). git add -A TAQIQ · alohida commit · DDL=egasi ruxsati.

═══════════════════════════════════════════════════════════════════
# 5. QAYERDA NIMA (index)
═══════════════════════════════════════════════════════════════════
- **Bu fayl** = master xarita/reja/yo'nalish (yagona haqiqat).
- **Memory** (Claude) = ~50 yozuv — har sessiya avtomatik o'qiladi (vizyon, ildiz, qarorlar, git/CI/secret).
- **docs/** = SAP audit (`docs/audit/`) · 20-modul tahlil · master reja · INTERVYU-QARORLARI · TASK-RO'YXATI.
- **CLAUDE.md** = qoidalar (Q-1..45) + reviewer holati.

> Bu fayl yangilanadi: muhim o'zgarish/qaror bo'lganda darrov shu yerga yoziladi (Q-25 — bitta haqiqat manbai).
