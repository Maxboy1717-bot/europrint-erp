# EuroPrint ERP — VIZYONNI TO'LIQ AMALGA OSHIRISH: Agentlarga To'liq Ijro Rejasi (2026-07-11)

> **Maqsad:** `docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md` (2,563 vizyon item, 20 modul)
> ni **agentlar yordamida to'liq qurib bo'lish** — triaj → build-spec (parallel) → harvest
> (bitta-yozuvchi commit) → egasi-qarorlari. Bu hujjat **o'zi-yetarli**: agent (yoki yangi sessiya)
> shu rejani o'qib, hech qanday qo'shimcha kontekstsiz davom eta oladi.
>
> **Bu reja nima EMAS:** yangi vizyon, yangi dizayn, yoki "V2". Bir kodbaza, joyida quriladi.
> **Manba hujjatlar:** master-plan (yuqorida), `_PHASE2-BUILDABLE-QUEUE-2026-07-11.md`,
> `_PHASE2-OWNER-DECISIONS-2026-07-11.md`, `_item-loop-progress-2026-07-11.md`,
> `_loop-open-questions-2026-07-11.md`, `GURUH-B-OWNER-QUEUE-2026-07-09.md`.

---

## 0. QISQA XULOSA (avval shuni o'qing)

- Master-plan da **2,563 item** bor; ulardan **1,143 "Code-buildable-now" marker**.
- **37-agentlik adversarial triaj** har markerni jonli tekshirdi va aniq tasnifladi:

| Guruh | Soni | Kim bajaradi |
|---|---:|---|
| ✅ **confirmedBuildable** — hozir quriladi (mavjud schema, egasi-qarorsiz, bloklanmagan) | **84** | Agent spec yozadi → bosh-agent commit |
| 🔴 **schemaGated** — yangi jadval/ustun/enum kerak (Q-35) | **369** | Egasi tasdig'i → keyin quriladi |
| 🔴 **ownerDecision** — chegara/siyosat/ma'lumot kerak | **276** | Egasi javobi → keyin quriladi |
| 🟡 **chainDep** — boshqa (qurilmagan) itemga bog'liq | **297** | Bog'liqlik qurilgach avto-ochiladi |
| ⛔ **blocked** — bloklangan sohaga tegadi | **71** | Tegilmaydi |
| ✔ **alreadyHa** — allaqachon jonli (stale-doc) | **4** | Ha deb belgilanadi |

- **84 confirmedBuildable dan ~17 tasi allaqachon qurildi** (Phase-2, quyida ro'yxat) + **~61 ready spec**
  `scratchpad/specs/NN.json` da tayyor turibdi. Qolgani harvest kutmoqda.
- **"To'liq" = 84 quriladi (agent+harvest) + 645 (schema+owner) egasi javob bergач ochiladi +
  297 zanjirli avto-ochiladi.** 71 bloklangan, 4 tayyor.

---

## 1. UCH-FAZALI MASHINA (isbotlangan, ishlayapti)

```
   ┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌─────────────────┐
   │  FAZA A     │     │     FAZA B        │     │     FAZA C         │     │   FAZA D        │
   │  TRIAJ      │ ──▶ │  BUILD-SPEC       │ ──▶ │  HARVEST           │ ──▶ │  OWNER-DECISIONS│
   │ (bir marta) │     │ (parallel workflow)│     │ (bitta-yozuvchi)   │     │ (egasi javobi)  │
   └─────────────┘     └──────────────────┘     └───────────────────┘     └─────────────────┘
   19 modul agenti     84 agent: har item        bosh-agent har spec'ni    egasi 645 itemni
   + skeptik           uchun tsc-xavfsiz spec     Edit qiladi + commit      ochadi (schema/data)
   → tasnif            + DB-isbot ISHLAB CHIQARADI (pre-commit tsc validaytsiya)
```

**Muhim tamoyil (Q-31 bitta-yozuvchi):** agentlar **HECH QACHON commit qilmaydi**. Ular faqat
tekshiradi va **spec** (tayyor-qo'llaniladigan tahrirlar + DB-isbot) ishlab chiqaradi.
**Bosh-agent** har spec'ni ko'rib chiqadi, qo'llaydi (Edit) va commit qiladi. Bu commit'ni
parallellashtirib bo'lmaydi — u ketma-ket va bosh-agentniki.

### FAZA A — TRIAJ (allaqachon bajarilgan, qayta ishlatiladigan skript bor)
Har modul uchun bitta agent master-plan bo'limini o'qiydi, har "Code-buildable-now" itemni jonli
tekshiradi (grep kod + `node _audit/q.cjs "SQL"`) va 6 guruhga ajratadi. Keyin skeptik agent
"buildableNow" nomzodlarini qayta tekshiradi (shubha bo'lsa pasaytiradi).
**Skript:** `<session>/workflows/scripts/master-plan-full-triage-*.js` — qayta ishlatish uchun
`Workflow({scriptPath})`. Natija: 84/369/276/297/71/4 tasnif.

### FAZA B — BUILD-SPEC (parallel workflow, qayta ishlatiladigan skript bor)
Har confirmedBuildable item uchun bitta agent:
1. Item'ni topadi (queue doc + master-plan).
2. **Jonli qayta-tekshiradi** (grep + q.cjs) — haqiqatan quriladimi? Aks holda `rejected`/`dup`/`already-done`.
3. **Minimal, tsc-xavfsiz** implementatsiyani loyihalaydi: aniq `anchorOld`/`replacement` tahrirlar
   (fayldan so'zma-so'z ko'chirilgan anchor) + yangi fayllar (to'liq kontent).
4. **DB-isbot** qiladi (read-only SELECT yoki rollback-tx) va HAQIQIY natijani yozadi.
5. Struktura qaytaradi: `{module, itemNo, verdict, edits[], newFiles[], dbProof, commitSubject, commitBody, filesTouched}`.
**Skript:** `<session>/workflows/scripts/phase2-build-specs-*.js`. 84 item embed qilingan
(`args` string bo'lib ketadi — item'lar skriptga `const ITEMS=[...]` sifatida joylashtirilishi SHART).

### FAZA C — HARVEST (bitta-yozuvchi, bosh-agent qo'lda)
Har `ready` spec uchun bosh-agent:
1. Spec fayl `scratchpad/specs/NN.json` o'qiydi.
2. Har `edit.anchorOld` ni **jonli faylda tekshiradi** (grep/Read) — mos kelmasa, to'g'ri anchor topadi.
3. `Edit` bilan qo'llaydi (anchorOld → replacement); `newFiles` ni `Write` bilan yaratadi.
4. Concurrent-session check (`git log --oneline -3`).
5. `git add <aniq-fayllar>` (HECH QACHON `-A`) + `git commit` — **pre-commit hook tsc validaytsiya qiladi**.
6. tsc yiqilsa: xatoni tuzatadi YOKI spec'ni revert qiladi + open-questions'ga yozadi (yarim qoldirmaydi).

### FAZA D — OWNER-DECISIONS (egasi javobi 645 itemni ochadi)
`_PHASE2-OWNER-DECISIONS-2026-07-11.md` — 369 schema + 276 owner-decision, modul bo'yicha guruhlangan.
Egasi javob bergач, o'sha item'lar `confirmedBuildable` ga aylanadi → FAZA B/C takrorlanadi.

---

## 2. QOIDALAR BLOKI (har agent va harvest UCHUN majburiy)

> Bu qoidalar `CLAUDE.md` (A,B,1-23 + Q-24..Q-47) va loyiha-standartlaridan. Buzilsa = xato.

### Xavfsizlik / yaxlitlik
- **R1 — Bitta-yozuvchi (Q-31):** agent commit QILMAYDI; faqat bosh-agent commit qiladi.
- **R2 — Bir item = bir commit:** bundling yo'q; `git add <aniq-fayl>` (HECH QACHON `git add -A`/`.`).
- **R3 — Concurrent check:** har commitdan OLDIN `git log --oneline -3` — boshqa sessiya bormi.
- **R4 — Fabrikatsiya taqiq (Q-40/Q-10):** soxta/echo/hardcoded javob YO'Q. Ma'lumot bo'lmasa —
  halol bo'sh-holat (`{items:[], total:0}` / `NO_DATA` / `NOT_FOUND`), fake emas.
- **R5 — Yarim qoldirma (Q-33):** boshlangan item to'liq quriladi yoki to'liq revert qilinadi.
- **R6 — Ysubagent xatosi:** yiqilgan agentning yarim-holatini darrov revert, open-questions'ga yoz, keyingisiga o't.

### Schema / egasi darvozalari
- **R7 — Q-35 (yangi jadval/ustun):** yangi `CREATE TABLE`/`ALTER ADD COLUMN`/yangi enum = **egasi ruxsati**.
  Agent bunday itemni `schemaGated` deb belgilaydi, QURMAYDI (`check-unauthorized-migration` bloklaydi).
- **R8 — Egasi-qaror (chegara/siyosat/ma'lumot):** un-fabricatable qiymat kerak bo'lsa = `ownerDecision`, qurilmaydi.
- **R9 — Zanjir (chainDep):** boshqa qurilmagan itemga bog'liq bo'lsa — bog'liqlik qurilmaguncha kutadi.

### Bloklangan sohalar (HECH QACHON tegilmaydi — hatto incidental)
- **R10:** Org-01 struktura / `org_departments.head_user_id` backfill.
- **R11:** HR-02 razryad / oylik / payroll.
- **R12:** Finance-03 SoD user-provisioning.
- **R13:** AI-17 credential-bog'liq kod (AI-kalit owner-gated).
- **R14:** Bilingual / Cyrillic-ustun logikasi.
- ⚠️ Yo'naltirish (kim-НО/direktor) `head_user_id` orqali resolve qilsa = **blocked**, AGAR RBAC-rol
  yo'li mavjud bo'lmasa. RBAC-rol bo'yicha yo'naltirish (`WHERE role='HR_MANAGER'`) = xavfsiz.

### Kod-uslub (backend)
- **R15 — Result<T>:** repo/service `Promise<Result<T>>` qaytaradi; `throw`/`return null` yo'q.
- **R16 — DB faqat repo'da (Qoida 15):** service `db.*` chaqirmaydi; controller = transport-only (Qoida 6).
- **R17 — Zod (Qoida 3):** `@Body()` Zod schema bilan validate qilinadi.
- **R18 — AppErrorCode:** faqat yaroqli kod — `CONFLICT | NOT_FOUND | VALIDATION | FORBIDDEN | DB_ERROR |
  INTERNAL | UNAUTHORIZED`. **`BUSINESS_RULE` YAROQSIZ.**
- **R19 — Array.isArray (Qoida 2):** `.map/.filter/...` dan oldin `Array.isArray()`.
- **R20 — Fayl ≤900 qator, funksiya ≤150 (Qoida 13).**
- **R21 — Raw SQL cheklangan (Qoida 4/16):** murakkab so'rov uchun `typedExecute<T>` (izoh bilan).

### Commit / tekshiruv
- **R22 — Commit type:** `feat|fix|docs|chore|refactor|perf|test` (`vision` YAROQSIZ). Format:
  `<type>(<scope>): <desc>`. Vizyon-refni (`vision 09-qc#1`) bodyga yoz, type'ga emas.
- **R23 — DB-isbot majburiy:** har data/logika o'zgarishi jonli DB bilan isbotlanadi
  (`node _audit/q.cjs "SELECT ..."` YOKI `BEGIN...ROLLBACK` node-skript). Eski buzuq holatni emas,
  YANGI to'g'ri holatni isbotla.
- **R24 — tsc (pre-commit):** har commit `apps/api typecheck` (backend) yoki `erp-dashboard typecheck` (FE)
  ni ishga tushiradi; yiqilsa commit bloklanadi.
- **R25 — Verify-don't-trust (Q-29):** doc/spec da'vosini tekshirilmagan deb hisobla; anchor'ni jonli
  faylda, DB-holatini q.cjs bilan tasdiqlа. Doc kunlar-eski — jonli holat ustun.

---

## 3. USTUVORLIK TARTIBI VA MODUL OFFSETLARI

**Tartib (oltin-zanjir avval):** MES(08) → QC(09) → WMS(10) → SD(06) → PP(07) → CC(20) →
Coordination(04) → CRM(13) → Marketing(14) → Kanban(15) → IoT(16) → LMS(12) →
Notifications(18) → Director(05) → POS(19) → MM(11). **AI(17) — BUTUNLAY O'TKAZIB YUBORILADI.**
Org(01)/HR(02)/Finance(03) — faqat non-struktura/non-razryad/non-salary/non-SoD itemlar (aks holda blocked).

**Master-plan offsetlari (qatorlar):**
`01 Org 31 · 02 HR 1481 · 03 Finance 2365 · 04 Coord 3682 · 05 Director 5407 · 06 SD 6871 ·
07 PP 8594 · 08 MES 10102 · 09 QC 11494 · 10 WMS 12547 · 11 MM 13797 · 12 LMS 15119 ·
13 CRM 16068 · 14 Marketing 17583 · 15 Kanban 18724 · 16 IoT 20878 · 17 AI 22355 (SKIP) ·
18 Notif 23392 · 19 POS 24901 · 20 CC 26182` (fayl oxiri ~27640).

Item ajratish (bir modul uchun): `awk 'NR>=<start> && NR<<end>' <master-plan>` yoki `Read(offset,limit)`.

---

## 4. MODUL BO'YICHA TASNIF (37-agent triaji natijasi)

| Modul | Marker | ✅buildable | 🔴schema | 🔴owner | 🟡chain | ⛔blocked | ✔ha |
|---|---:|---:|---:|---:|---:|---:|---:|
| 08 MES | 62 | 1 | 25 | 7 | 23 | 3 | 0 |
| 09 QC | 38 | 0* | 12 | 14 | 10 | 0 | 1 |
| 10 WMS | 30 | 8 | 6 | 8 | 2 | 4 | 2 |
| 06 SD | 76 | 3 | 43 | 15 | 8 | 5 | 0 |
| 07 PP | 46 | 8 | 19 | 5 | 7 | 5 | 0 |
| 20 CC | 72 | 3 | 19 | 32 | 17 | 1 | 0 |
| 04 Coord | 52 | 1 | 10 | 14 | 22 | 2 | 0 |
| 13 CRM | 84 | 6 | 27 | 19 | 28 | 2 | 0 |
| 14 Marketing | 73 | 13 | 33 | 11 | 11 | 1 | 0 |
| 15 Kanban | 140 | 13 | 36 | 20 | 48 | 16 | 0 |
| 16 IoT | 68 | 0 | 12 | 19 | 27 | 8 | 0 |
| 12 LMS | 45 | 3 | 15 | 12 | 9 | 4 | 0 |
| 18 Notif | 94 | 4 | 18 | 25 | 37 | 2 | 0 |
| 05 Director | 61 | 8 | 13 | 18 | 16 | 5 | 0 |
| 19 POS | 23 | 0 | 13 | 6 | 4 | 0 | 0 |
| 11 MM | 71 | 9 | 41 | 5 | 14 | 0 | 0 |
| 01 Org | 37 | 1 | 8 | 20 | 1 | 6 | 0 |
| 02 HR | 33 | 2 | 8 | 11 | 3 | 6 | 1 |
| 03 Finance | 38 | 1 | 11 | 15 | 10 | 1 | 0 |
| **JAMI** | **1143** | **84** | **369** | **276** | **297** | **71** | **4** |

\* QC#1 (atomik karantin) triajdan OLDIN qo'lda qurilgan — shu bois QC buildable=0, lekin item real qurildi.

---

## 5. ALLAQACHON QURILGAN (Phase-2, harvest ustiga quriladi)

Bu 84 dan (yoki qo'lda) qurilgan itemlar — QAYTA QURILMAYDI (jonli holatni tekshir, `already-done` bo'lsa o't):

| # | Item | Commit |
|---|---|---|
| 1 | 09-qc#1 atomik karantin (SERIALIZABLE + FOR UPDATE) | `537e2ab3` |
| 2 | 10-wms#12 sanoq-aniqlik KPI | `19b2e0fc` |
| 3 | 07-pp#3 stanok parallel-lock (advisory) | `4ab3cea6` |
| 4 | 14-mkt#77 NPS QC-reklamatsiya gate | `5b5c2a7c` |
| 5 | 13-crm#2 round-robin advisory-lock | `fd313f48` |
| 6 | 18-notif#70 Telegram sendDocument | `20576be8` |
| 7 | 07-pp#106 kunlik 3-taymer dashboard | `e1cc49e2` |
| 8 | 07-pp#38 eng-yomon-stanok OEE reyting | `cffdd66f` |
| 9 | 18-notif#33 LeaveApproved bildirishnoma | `2c948b8f` |
| 10 | 07-pp#89 CancelProductionOrder + alloc reversal | `e2d579ec` |
| 11 | 14-mkt#30 field-RBAC AR-balance mask | `82b37103` |
| 12 | 10-wms#88 norma og'ish (norma/fakt %) | `9c00fbda` |
| 13 | 13-crm#4 field-visit communication_data + scheduled_at | `2456338d` |
| 14 | 18-notif#17 bot inline keyboard | `c6a0f2ae` |
| 15 | 10-wms#45 PP rezervi muzlatishdan ustun (KUTMOQDA) | `db28924a` |
| 16 | 12-lms#27 haftalik progress cron (non-AI) | `004e13aa` |
| 17 | 02-hr#46 attention-needed haftalik digest cron | `dd3d3f77` |

**Phase-1 dizayn (14 commit `dbce2b1e`..`a0c79e7f`):** D1 pesah→#FAFAF9, D2 overflow, D3 EPTable,
D4 shell spacing, D5 7 jadval, D6 `--mod-*` signatura. Jonli build'da isbotlangan.

---

## 6. HARVEST RESUME NUQTASI (hozirgi holat)

- **Harvest qilingan (14 spec):** #36, #23, #56, #16, #13, #55, #15, #32, #09, #24, #53, #06, #51, #74.
- **Qolgan collision-free ready specs:** `#52, #73, #50, #01, #02, #22, #28, #67, #11, #17, #18, #54, #26, #49`.
- **Keyin — same-file klasterlar** (sekvensial qo'llash kerak, chunki bir faylni bir necha spec teadi):
  - `drizzle-kanban-cards.repo.ts` (6 spec), `wms.module.ts` (5), `business.constants.ts` (5),
    `director/dashboard-query.repository.ts` (5), `marketing.module.ts` (4), director dashboard
    service/controller (4), CC/kanban/mm klasterlari. Bir faylni teadi degan spec'lar KETMA-KET
    qo'llanadi (birini commit, keyin keyingisining anchor'i qayta tekshiriladi).
- **Rad etilgan (qurilmaydi):** 13-crm#16 (parallel-360 FE — jonli data regress qiladi; 2-item re-scope kerak).
- **Xato/noto'liq (qayta-run yoki qo'lda):** 07-pp#107, 11-MM#11.13 (StructuredOutput cap);
  07-pp#86, 14-mkt#14-8, kanban#C32/#C44, 05-dir#106, 03-fin#C12 (noto'liq spec).
- **Dup (o't):** 14-mkt#14-55/#14-63, kanban#74/#76, 11-MM#11.47.

**Spec fayllar:** `<session>/scratchpad/specs/NN.json` (75 ta). Har biri to'liq edits+newFiles+dbProof+commit.

---

## 7. TO'LQIN-REJA (agentlarga bosqichma-bosqich berish)

Har "to'lqin" = bitta modul-guruh yoki bitta build-spec workflow + harvest. Bosh-agent har to'lqinda:

**TO'LQIN 1 (hozir davom etmoqda) — 84 confirmedBuildable ni tugatish:**
1. Qolgan ~61 ready spec'ni harvest qil (§6 ro'yxat tartibida). Har biri: read spec → anchor tekshir →
   Edit/Write → concurrent-check → commit (tsc). Har 8 commitda checkpoint (`_item-loop-progress`).
2. Same-file klasterlarni ketma-ket qo'lla.
3. Noto'liq/xato spec'larni qayta-run qil (build-spec workflow'ni faqat o'sha itemlar bilan) yoki qo'lda qur.
4. Yakunda: 84 dan nechta qurildi, nechta rejected/rescope — hisobot.

**TO'LQIN 2..N — chainDep ni ochish:**
- Har qurilgan item boshqa itemlarning bog'liqligini ochadi. Bir item qurilgach, unga bog'liq
  chainDep itemlarni qayta tekshir (endi buildable bo'ldimi?). Buildable bo'lsa → yangi build-spec + harvest.
- 297 chainDep asta-sekin ochiladi (masalan: item 18 `current_stage` populate qilinsa, MES 19/47 ochiladi).

**TO'LQIN (egasidan keyin) — 645 schema/owner:**
- Egasi `_PHASE2-OWNER-DECISIONS` ga javob bergач: o'sha itemlar buildable bo'ladi.
- Eng katta ochuvchi javoblar (§8) birinchi. Har javob paketi uchun: build-spec workflow (o'sha
  modul itemlari) → harvest.
- **Schema-tasdiq bo'lgach:** yangi migration `APPROVED: <egasi/sana>` izohi bilan yoziladi (Q-35),
  keyin kod quriladi + DB-proof.

---

## 8. EGASI-QARORLARI — ENG KO'P OCHUVCHI (birinchi shular)

`_PHASE2-OWNER-DECISIONS-2026-07-11.md` da to'liq; eng katta ta'sirlilari:

1. **⭐ MES schema paketi** (norma-versiyalash ustunlari, `oee_targets` jadvali, `machine_crew_members`,
   `station_norms`, downtime kodlari) → ~15+ MES item ochiladi.
2. **MM schema paketi** (41 schema item — narx-tarix, sverka jadvallari, owner_type ustuni) → ~41 MM item.
3. **Marketing schema** (33 item — goal_type, promo, brand_passport) → ~33 Marketing.
4. **CRM/CC RBAC siyosati** (kim qaysi lidni/hujjatni ko'radi) → ~50 CRM+CC item.
5. **Chegara-qiymatlar** (QC strategik-reklamatsiya chegarasi, MES bonus A/B/C summasi, WMS approval
   matritsasi summalari) → o'nlab item.
6. **Master-data** (real ~30 mashina ro'yxati, razryad qiymatlari — HR bloklangan qism egasi-data).

**Har javob = paket.** Masalan "MES norma-versiyalashni tasdiqlaysizmi?" → ha → 4/17/58 + downstream 11/13 quriladi.

---

## 9. QAYTA ISHLATILADIGAN ARTEFAKTLAR (agent shulardan foydalanadi)

| Artefakt | Yo'l | Vazifa |
|---|---|---|
| Triaj workflow | `<session>/workflows/scripts/master-plan-full-triage-*.js` | Modullarni qayta-tasnif (yangi/o'zgargan) |
| Build-spec workflow | `<session>/workflows/scripts/phase2-build-specs-*.js` | Item'lar uchun spec ishlab chiqarish (ITEMS const embed) |
| Buildable navbat | `_PHASE2-BUILDABLE-QUEUE-2026-07-11.md` | 84 item + fayllar + DB-proof reja |
| Owner-qarorlar | `_PHASE2-OWNER-DECISIONS-2026-07-11.md` | 645 item, modul bo'yicha |
| Harvest progress | `_item-loop-progress-2026-07-11.md` | Nima qurildi, resume nuqtasi |
| Ochiq savollar | `_loop-open-questions-2026-07-11.md` | Rad/skip/ambiguity |
| DB-proof asbob | `_audit/q.cjs "SELECT ..."` | Read-only jonli SQL |
| DB rollback-proof | `<session>/scratchpad/*-proof.cjs` naqsh | pg BEGIN...ROLLBACK (write-path isbot) |

**Build-spec workflow'ni yangi paket uchun ishlatish:** skriptdagi `const ITEMS=[{m,n,t},...]` ni
yangi item ro'yxati bilan almashtir (`args` STRING bo'lib ketadi — embed SHART), keyin `Workflow({scriptPath})`.

---

## 10. AGENT UCHUN BUILD-SPEC PROMT SHABLONI (so'zma-so'z)

> Har build-spec agentga beriladigan promt (workflow ichida avtomatik). Yangi agent qo'lda ham ishlatishi mumkin.

```
Produce a build SPEC for ONE vision item. Module: {M}. Item: #{N} — {TITLE}

STEP 1 — locate: grep _PHASE2-BUILDABLE-QUEUE for "#{N}" under module "{M}" (Files + DB-proof plan).
  Read the item's FULL entry in the master plan (Vision citation, Evidence, Dependencies).
STEP 2 — LIVE re-verify (don't trust docs): read cited files, run node _audit/q.cjs "...".
  Confirm buildable on EXISTING schema, no owner input, no blocked touch, no unbuilt dependency.
  If not -> verdict='rejected'/'already-done'/'dup' with reason.
STEP 3 — design the MINIMAL surgical implementation (repo method + service + controller, or a new
  file for a page/cron). anchorOld = VERBATIM copy from the current file (unique). replacement = full
  new text. Follow the RULES BLOCK (§2): Result<T>, DB-in-repo (Qoida 15), Zod, valid AppErrorCode
  (NOT 'BUSINESS_RULE'), commitType feat|fix|... (NOT 'vision'), no fake responses (Q-40).
STEP 4 — DB-proof read-only (SELECT or BEGIN...ROLLBACK) and paste the REAL output.
Return {module, itemNo, verdict, summary, edits[], newFiles[], filesTouched[], dbProof, commitType,
  commitSubject, commitBody}. READ-ONLY: do not edit source, do not commit.
```

---

## 11. YAKUNIY HISOBOT SHABLONI (har to'lqin oxirida)

1. To'lqin N: nechta item qurildi (Ha), commit-oralig'i.
2. Rad/rescope/xato itemlar (sabab bilan).
3. Ochilgan yangi chainDep itemlar (keyingi to'lqinга).
4. Yangi topilgan egasi-qarorlari (agar bo'lsa) → `_PHASE2-OWNER-DECISIONS` + `GURUH-B` ga qo'shiladi.
5. Resume nuqtasi (qaysi spec/item qoldi).
6. Savollar OXIRDA, birga (piecemeal emas) — egasi-gated / safety-skip / scope-ambiguity uchta bo'lim.

---

## 12. XAVFSIZLIK NAZORATI (har harvest commitida avtomatik)

Pre-commit hooklar (buzsa commit bloklanadi/ogohlantiradi):
- `apps/api|erp-dashboard typecheck` — **tsc (BLOK)**.
- `check-design-tokens.mjs` — inline xom rang (BLOK).
- `check-unauthorized-migration.mjs` — ruxsatsiz CREATE TABLE (WARN → Q-35).
- `check-no-secret-print.mjs` — secret (BLOK).
- `check-endpoint-test.mjs`, `check-form-has-save.mjs`, `check-large-diff.mjs` — WARN.
- sidebar/stub/schema-dup ratchet — regress himoyasi.

**Agar tsc yiqilsa:** bosh-agent xatoni o'qiydi → tuzatadi (import qo'shish, field nomini to'g'irlash,
`snake_case` vs `camelCase` — mapped RETURN type'ni tekshir, intermediate query type'ni emas) YOKI
spec'ni revert qiladi + open-questions'ga yozadi. Yarim qoldirmaydi (R5).

---

**JAMI:** Bu reja bilan agent(lar) 84 ni to'liq quradi (~61 spec + qolganini), egasi 645 ni ochadi,
297 zanjirli avto-ochiladi. Bir kodbaza, joyida, tsc+DB-isbot bilan. Bitta-yozuvchi commit —
xavfsiz, izchil, regress-himoyalangan.
