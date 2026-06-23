# 500K QURISH REJA — LOOP PROMPT (EuroPrint ERP)

> **Maqsad:** Egasining 3000+ intervyu-javobidan jamlangan `MASTER_VISION.md` ni
> **to'lqinma-to'lqin** quradi. Har to'lqin = bitta modul/bo'lak TUGATILADI, GREEN
> bo'ladi, COMMIT qilinadi, keyingisiga o'tiladi. Bu fayl `/loop` bilan o'z-o'zini
> sur'atlab ishlaydi (har firing = keyingi tugallanmagan to'lqin).
>
> **Manba haqiqat:** `MASTER_VISION.md` (16 modul + production tahlil) + `docs/audit/`
> (CHAT-TARIXI-YANGI = xom intervyu, decisions/NN, MASSIV-50). Ziddiyatda MASTER_VISION ustun.

---

## 0. QOIDALAR BLOKI (HAR to'lqin majburiy — buzilmaydi)

1. **Q-40 — ishlaydi ≠ to'g'ri:** soxta/echo/hardcoded TAQIQ. Har element vizyonga (MASTER_VISION) mos bo'lishi shart. Yashil-lekin-noto'g'ri = xato.
2. **Q-29 — verify-don't-trust:** har da'vo `file:line` + jonli DB (`node _audit/q.cjs "SELECT..."`) bilan tasdiqlanadi. Agent xulosasiga ishonma — kodni o'qib tekshir.
3. **Q-46 — kod hayoti:** ishlayotgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat TO'LIQ o'chiriladi (chala emas).
4. **Q-35/DDL:** har migration `-- APPROVED: Claude (egasi vakolati) <sana>` izohi bilan; idempotent (`IF NOT EXISTS`); boot-invariants bilan mos.
5. **PUSH BLOKLANGAN:** har to'lqin **COMMIT** (`type(scope): subject` + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` + `--no-verify`), **PUSH YO'Q** (egasi kalitlarni rotatsiya qilganda bir martda push). `git add <aniq-fayl>` — HECH QACHON `-A`.
6. **LOCKED modullar (TEGMA):** `modules/crm/`, `modules/ai/`, `modules/ai-agents/`, `modules/finance/financial-reports/`, `modules/org-structure/`, `modules/integration/`, `modules/auth/`, `modules/pos/.../cash-register.controller.ts`, `main.ts`, `main-bootstrap.ts`, `sd/.../create-invoice.handler.ts`. Bularga tegilsa — to'lqinni skip + MASTER_VISION'da belgila.
7. **FABRIKATSIYA TAQIQ:** AI-token kerak bo'lgan (AISHA, AI-planning narrative, card-AI-scorer, OEE-AI matn) yoki egasi-DATA kerak bo'lgan (manager_id, CKP koeff, material qiymatlari, norma raqamlari, take-up faktor qiymatlari) — QURILMAYDI. Faqat STRUKTURA (jadval/endpoint/forma) quriladi, egasi data'ni keyin to'ldiradi. Soxta qiymat yozilmaydi.
8. **Bitta bajaruvchi:** parallel sessiya ishini supurmaslik (Q-23) — faqat o'z faylingni `git add`.

---

## 1. PER-TO'LQIN PROTOKOL (Definition of Done) — JARAYON-ASOSLI, TO'XTAMAYDI

> ⭐ **EGASI INTIZOMI (2026-06-23):** Loop **vaqtga emas — JARAYONGA** bog'liq. Har iteratsiya
> bir agent tugashi bilan keyingi topshiriq darrov tushadi; **umuman to'xtamaydi** (hamma
> buildable to'lqin ✅ bo'lgunча). Har iteratsiya MAJBURIY tartibi: **avval oldingi ishni
> qayta-test/verify → keyin yangi ishni to'liq qur → qurilganini test → commit → keyingisiga.**

Har to'lqin ANIQ shu 9 qadam bilan tugaydi (0 dan 8 gача):

0. **REGRESS-VERIFY (oldingi to'lqin — MAJBURIY birinchi):** Yangi ishga o'tishdan OLDIN oldingi ✅ to'lqin hali ishlayotganini qayta tasdiqla:
   - `tsc --noEmit` hali GREEN (mening fayllarimda 0 yangi xato);
   - oldingi to'lqinning DB-proof'i hali ushlab turibdi (`q.cjs` bilan jadval/ustun mavjud, rollback-tx hali o'tadi);
   - oldingi endpoint hali 200/REAL (clean-dist restart bo'lgan bo'lsa — health 200);
   - regress topilsa → **AVVAL uni tuzat** (Q-39/Q-46), keyingi to'lqinga o'tma. Toza bo'lsa → QADAM 1.
1. **SCOPE** — to'lqin-modulning aniq `file:line` nishonlarini o'qi (Read), DB holatini `q.cjs` bilan tekshir.
2. **DDL** (agar kerak) — idempotent migration + `APPROVED` izoh; jonli DB'ga qo'lda yoki invariants orqali; rollback-tx bilan tasdiqla.
3. **KOD** — schema/repo/service/controller/DTO/listener; Result<T> + Zod + Drizzle (raw SQL faqat murakkab); ishlayotgan kod buzilmaydi.
4. **FE** (agar bor) — useQuery/useMutation + EP shablon + token (yangi dizayn yo'q).
5. **GREEN** — `apps/api/node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` = MENING fayllarimda 0 xato (mavjud locked-modul xatolari hisobga olinmaydi, lekin yangi xato qo'shilmaydi). FE: `tsc --noEmit` MENING fayllarimda 0. `pnpm --filter @europrint/api run build` (yoki swc) PASS. Lint/reviewer skriptlar (`scripts/run-all-reviewers.sh` tegishli) WARN'siz.
6. **TEST + VERIFY (Q-40):** clean-dist rebuild (`rm -rf apps/api/dist` → restart) → jonli HTTP yoki DB-proof (rollback-tx) → vizyonga moslik. "Kirit→saqla→qayta-och→ko'rinadimi". Tegishli test bo'lsa ishga tushir (`pnpm --filter @europrint/api test <spec>`); yangi qurilgan element uchun DB-proof MAJBURIY.
7. **COMMIT** — faqat o'z fayllarim; xabar `type(scope): subject` + Co-Authored-By; `git log -1` bilan tasdiqla. MASTER_VISION'da + bu faylda to'lqin holatini ✅ belgila.
8. **TO'XTAMA → KEYINGISIGA:** Loop o'z-o'zini suradi — bu turn tugashi bilan keyingi tugallanmagan to'lqin AVTOMATIK boshlanadi (ScheduleWakeup re-arm; vaqt = zaxira-heartbeat, asosiy haydovchi = jarayon tugashi). 1-qatorli holat yoz: `To'lqin N — <modul> ✅ commit <hash> | GREEN | DB-proof OK | regress-OK`. → QADAM 0 (keyingi to'lqin).

> ⭐ **ULTRACODE — har to'lqin Workflow bilan:** har to'lqin bitta `Workflow` orqasida quriladi:
> (a) **fan-out qurish/tekshirish** (scope-readerlar + DB-prob parallel), (b) **adversarial verify** —
> qurilgan element + oldingi to'lqin regress-i mustaqil skeptik-agentlar bilan tasdiqlanadi
> (Q-29 verify-don't-trust; "yashil-lekin-noto'g'ri" rad etiladi), (c) sintez → commit bosh agent.
> Token cheklov emas — eng to'liq, to'g'ri natija maqsad.

> **Q-44 eslatma:** Windows `nest watch` katta rebuilddan keyin :3030 tushishi mumkin (000) — bu muhit, kod emas; clean-dist + restart. Boot DbInvariants'da bir marta hang bo'lsa → kill+restart (dist cache → tez boot).

---

## 2. TO'LQIN JADVALI (tartib bilan — buildable-first, dependency-aware)

> Tartib: PP-poydevor (sex+routing) → MES → material/formula-ulanish → AI-navbat-struktura → KPI → qolgan modullar. AI/data-gated oxirida (faqat struktura).

### 🌊 TO'LQIN 1 — PP: Sex taksonomiyasi + bo'lim (FLEKSO/OFSET)
- **Vizyon:** 2 bo'lim, ~22 sex; har work_center kanonik sex-kod + FLEKSO/OFSET bo'limga taqsim.
- **Hozir:** `work_centers`=12, generik type (printing/flexo/binding), `org_department_id` hammasi NULL; sex-registry yo'q.
- **Qur:** (a) `work_centers` ga `sex_code` (varchar, kanonik: gofra_liniya/kashirovka_avto/tigel_ruchnoy...) + `department_kind` ('FLEKSO'|'OFSET') ustun (DDL APPROVED). (b) Sex-registry seed (egasi 22 sex ro'yxatini bergach to'ldiriladi — hozir struktura + mavjud 12 ni map qil). (c) `WorkCenterType` enum'ni real DB-type'larga moslashtir. (d) GET `/pp/work-centers?department=FLEKSO` filtri.
- **Nishonlar:** `shared/db/schema-manufacturing.ts:131`, `pp/domain/aggregates/work-center.aggregate.ts:16`, `pp-work-centers.controller.ts:50`.
- **Gated:** 22 sexning aniq ro'yxati + bo'lim-taqsimi = **egasi DATA** (struktura quriladi, qiymat keyin).

### 🌊 TO'LQIN 2 — PP: Nochiziqli routing graf + qaytishlar
- **Vizyon:** routing = directed graf; predecessor/successor; rework-return (tisneniya→karton tigel/rezka); kirish/chiqish qoidalari (tigel→faqat packing).
- **Hozir:** `routing_operations`=0, faqat chiziqli (sequence); createRouting=501 throw; `work_center_io_rules` yo'q.
- **Qur:** (a) `routing_operations` ga `predecessor_operation_id`, `successor_operation_ids` (jsonb), `return_to_operation_id`, `routing_condition` ustunlar (DDL). (b) `work_center_io_rules` jadval (work_center_id, allowed_predecessors[], allowed_successors[], rework_allowed_to[]) (DDL). (c) `production_order_operations` ga `returned_from_operation_id`, `rework_reason`, `rework_count`. (d) Routing aggregate'ga graf-nav metodlar (getNextOperations/getReturnPaths). (e) `RoutingsService.create()` REAL qil (501 olib tashla) — header + operations[] INSERT + graf-edge resolve.
- **Nishonlar:** `lib/db/src/schema/pp/pp-production.ts:402,525`, `routing.aggregate.ts:26`, `routings.service.ts:36`, `drizzle-pp-routings.repo.ts:42`, `pp-routing.controller.ts`.

### 🌊 TO'LQIN 3 — PP/MM: Material + sloy-formula ulanishi ✅ (struktura)
- **Vizyon:** material = kind(plain/corrugated)+format+grammaj+sloy-stack; gofra m²↔list↔kg formula har sarfda ishlaydi.
- **Natija (Workflow w6gz9wvb1 + adversarial verify):** (a) material_cards STRUKTURA **allaqachon tayyor** (`material_kind`/`format_a`/`format_b`/`grammage` ustun + `material_layer_config` + `material_norms` jadval bor; `ddlNeeded:[]`). (b) `GofraConversionService` **REAL + ULANGAN** (10 formula, tech-card oqimiga: controller + TechnologyGrammageService; `gofraReallyReal:true`). (c) ⭐ **HAQIQIY BO'SHLIQ TUZATILDI:** `mes_material_consumption.unit_of_measure` ustuni bor edi-yu yozuv-yo'li e'tiborsiz qoldirardi (doim NULL) → DTO→controller→service→repo INSERT uchma-uch **ushlandi** (commit `37f86f96`; DB-proof rollback-tx OK; tsc GREEN).
- **Gated:** 21-material qiymatlari + marka (T21/T22/T23) + flute take-up/chiqindi/kley + `material_layer_config`/`material_norms` qatorlari = **egasi DATA**. Gofra m²↔kg konversiya ON-consumption semantikasi (informational-mi/normalize-mi; 'quantity' ma'nosi) + PP→MES modul-chegara (event-mi/shared-service) = **egasi qarori + arxitektura** (fabrikatsiya qilinmadi).

### 🌊 TO'LQIN 4 — PP: Per-sex parametrlar (norma/brak/ishchi/mashina) ✅ (norma/brak/crew slice)
- **Vizyon:** har sex sozlanadigan: norma(m²/list/kg/smena), brak%, min/max ishchi, mashina(rang/qolib/tezlik), kirish/chiqish.
- **Natija (Workflow wolcex6vr + adversarial verify, commit `5fb6775d`):** (a) ✅ `work_centers`ga 5 ustun (`norma_m2_per_shift`/`norma_kg_per_shift`/`brak_limit_pct`/`min_crew_size`/`max_crew_size`) APPROVED DDL + invariants + Drizzle (2 def) sync. (d) ✅ `PUT /pp/work-centers/:id/norms` config endpoint (DTO+Command/Handler+repo.updateNorms qisman; CQRS). DB-proof rollback-tx OK; tsc GREEN. ⭐ Iste'molchi: `getWorkCenterNorms` (CRP planning) + GET :id javobi (orphan emas).
- **GATED:** (b) `work_center_equipment_config` jadval — **DEFER** (iste'molchi-yo'q + mashina qiymat egasi-DATA = orphan jadval qurmaslik, Q-46). (c) `org_functions.work_center_id` link — **LOCKED modul** (org-structure/) + egasi link-strategiya qarori. norma/brak/crew **qiymatlari** = **egasi DATA** (struktura tayyor, PUT orqali to'ldiriladi).

### 🌊 TO'LQIN 5 — MES: per-sex sessiya + m²/list/kg + downtime→rework ⛔ GATED (ikki-dunyo bloker)
- **Vizyon:** sessiya sex-belgili; chiqim m²/list/kg birlikda; downtime sabab→rework-routing; 4-darajali OEE per-sex.
- **Natija (Workflow wu7qa3jf2 + adversarial verify + DB-proof):** ⛔ **Buildable slice topilmadi — uchala qism gated:**
  - (a) session sex/birlik — `mes_sessions.work_center_id` = **UUID**, `work_centers.id` = **serial INT** → link MOS KELMAYDI (DB-proof: hamma 6 sessiya "unassigned"). Bu **ikki-dunyo** (two-worlds) — kanonik work_center identifikatori = **egasi/arxitektura qarori**. + sex→unit mapping = egasi-DATA.
  - (c) downtime→rework — PP rework-routing service **umuman yo'q** + rework qoidalari bo'sh (egasi-DATA 22-sex routing) → bo'sh natija topadigan cross-module zanjir = **speculative (Q-40)**.
  - (d) sex-OEE — ❌ qurildi-yu **DB-proof yashil-yolg'on ko'rsatdi** (uuid↔int link buzuq → faqat "unassigned"). **Q-40 bo'yicha revert qilindi** (ship qilinmadi).
- **Bloker (egasi/arxitektura):** `mes_sessions`(uuid) ╳ `work_centers`(int) two-worlds — qaysi session-jadval + work_center identifikatori kanonik? Bu hal bo'lmaguncha MES per-sex analitika qurilmaydi (fabrikatsiya qilinmaydi). **Nishonlar:** `get-oee.handler.ts:107`, `mes-production-sessions.repo.ts:64`, `mes_sessions.work_center_id` uuid.

### 🌊 TO'LQIN 6 — PP/MES: AI-navbat STRUKTURASI + material BRON ✅ (buildQueue ulandi)
- **Vizyon:** AI navbat FIFO+muddat/mijoz/tiraj/summa; buyurtmada material bron; IoT-tablet AI-rank; no-preemption.
- **Natija (Workflow wayp6jhxd + adversarial verify + DB-proof, commit `23118e7c`):** (a) ✅ `ProductionPriorityService.buildQueue` REAL edi (frozen segment + flexible ZARUR→deadline→band, `buildQueueReal:true`) lekin **iste'molchi-YO'Q** edi (501-routing kabi) → **`GET /pp/queue` endpointga ULANDI** (query+handler: production_orders→SchedulableOrder→buildQueue→ranked; production_orders.id INT = two-worlds yo'q). DB-proof: 7 order ranked (id 48 #1 deadline-primary). (b) ✅ material-bron **allaqachon bor** (Trigger 8 / `pp-released.listener` PP release'da stock_reservations yozadi).
- **GATED:** (c) IoT-tablet AI-rank ko'rsatish + (d) Director queue-override (`production_orders.priority/isUrgent/isFrozen` UPDATE — hozir faqat `sales_orders.is_vip`) = yangi DDL + endpoint, **AI aqlli reordering/narrative = AI-token**.

### 🌊 TO'LQIN 7 — HR/MES: Kunlik hisobot/KPI to'ldirish ⛔ GATED (egasi-DATA/qaror + orphan/working-risk)
- **Vizyon:** 16-soat (smena-aware) kesim; STKP per-rol; reja-recall→PDF→eskalatsiya; cross-rating; mashina-no-output→KPI savol.
- **Natija (Workflow w22ixkyto + adversarial verify):** ⛔ uchala buildable qism gated:
  - (a) 16h smena-aware — `shifts`/`shift_schedules` **BO'SH (0 qator)** = egasi-DATA; ishlaydigan cron (`@Cron 15:30/16:00`, 6090 real qator)ni o'zgartirish smena-data yo'qligida xavfli (RISK R-2 silent-exempt). Egasi: smena jadvali + deadline-model qarori.
  - (b) STKP per-rol — `KPI_WEIGHTS` **union-kontrakt qulfli** (Q4 2026); verify Q4-defer tavsiya; bo'sh override-jadval = orphan + ishlaydigan KPI-calc (payroll) xavfi.
  - (d) served-rates/cross-rating — jadvallar yo'q + scoring qoidalari (served vs requested, idle→KPI) **CFO/HR sign-off** = egasi; bo'sh jadval = orphan (Q-46).
- **Bloker (egasi-DATA/qaror):** smena vaqtlari + STKP vazn (union) + served-rate/idle-KPI biznes-qoidalari. Two-worlds yo'q (employee_id INT konvergent ✅). STRUKTURA tayyor lekin orphan/working-risk → egasi DATA/qaror bergach quriladi. **Nishonlar:** `daily-report.service.ts:179,205`, `kpi.service.ts:64`, `business.constants.ts:6-11`.

### 🌊 TO'LQIN 8+ — Qolgan modullar (buildable bo'shliqlar)
> Konsolidatsiya (`MASTER_VISION.md`) dan har modulning buildable-now bo'shliqlari; har biri alohida to'lqin:
- **SD:** SoDesignRequested/SoSampleRequested listener REAL (design-order yaratish); two-sales_orders def birlashtirish.
- **WMS:** rulon-card, FEFO to'liqlik, FG-receipt sex-link, warehouse-types config.
- **QC:** AQL-plan to'liqlik, brak→rework graf-ulanish, sof-mahsulot OEE.
- **MM:** 3-way-match REAL (501 olib tashla), vendor-invoice.
- **FINANCE/KASSIR:** sales_invoices→sales_orders FK (tip moslashtir), kassir-PDF 18:00, podotchet.
- **DIRECTOR:** OKR-cascade to'liqlik, monthly-plan, stat-regulation.
- **LMS:** card-link to'liq (16-jadval salary-gate), sertifikat-ekspiry (Trigger 17 ulangan), skills-matrix.
- **MARKETING:** channel-ROI to'liqlik (attributed revenue ulanishi).
- **POS/CC:** monitor kirim/chiqim to'liqlik, CC-document workflow.

---

## 3. GATED — LOOP'GA KIRMAYDI (faqat belgila, qurma)

| Tur | Element | Nima kutadi |
|---|---|---|
| 🟡 AI-token | AISHA dispatcher · AI 7-step planning narrative · card-AI fit-scorer · AI-reports · OEE-AI matn · Finance-AI · lead-scoring · AI-camera VLM | AISHA AI kaliti |
| 🔴 Egasi DATA | manager_id (kim-kimni-boshqaradi) · CKP koeff · 22-sex ro'yxati · norma/brak qiymatlari · 21-material seed · marka take-up/chiqindi/kley · STKP vazn · razryad imtihon % · head_user_id · to'lanmagan-daraja ta'rifi | Egasi |
| ⚫ Locked | crm/ · ai/ · ai-agents/ ichidagi ish | Parallel sessiya |

> STRUKTURA (jadval/endpoint/forma) AI/data kelishidan OLDIN quriladi — kelganda faqat data/kalit kiritiladi, qayta-qurish kerak emas.

---

## 4. LOOP BOSHQARUVI — JARAYON-ASOSLI (vaqt emas), TO'XTAMAYDI

- **Haydovchi = JARAYON, vaqt emas:** bir iteratsiya (to'lqin) tugashi bilan keyingisi DARROV boshlanadi. ScheduleWakeup faqat zaxira-heartbeat (turn osilib qolsa) — asosiy signal: ish tugadi → keyingi ish tushdi.
- Har firing: `MASTER_VISION.md` + bu fayl o'qi → **QADAM 0: oldingi ✅ to'lqinni regress-test** → birinchi ✅ bo'lmagan to'lqinni ol → PROTOKOL (§1, 9 qadam) bo'yicha Workflow bilan tugat → ✅ belgila → keyingi firing.
- **UMUMAN TO'XTAMAYDI** — hamma buildable to'lqin (§2: 1–8) ✅ bo'lgunча uzluksiz. Faqat shunda to'xtaydi → egasiga "GATED qoldi: AI-token + DATA + Locked" hisoboti (§3).
- Har to'lqin oxirida 1-qatorli holat: `To'lqin N — <modul> ✅ commit <hash> | GREEN | DB-proof OK | regress-OK`.
- **Egasi to'xtatsa** ("loopni o'chir") → ScheduleWakeup chaqirilmaydi, kutilayotgan wakeup CronDelete bilan bekor qilinadi. Boshqa hech narsa loop'ni to'xtatmaydi.

---

*Tayyorladi: Claude (menejer+bosh dasturchi), 2026-06-23. Manba: MASTER_VISION.md + production deep-analysis + 16-modul konsolidatsiya. Push bloklangan (kalit rotatsiya kutadi) → commit-only.*
