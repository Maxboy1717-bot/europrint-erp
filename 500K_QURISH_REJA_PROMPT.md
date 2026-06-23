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

## 1. PER-TO'LQIN PROTOKOL (Definition of Done)

Har to'lqin ANIQ shu 7 qadam bilan tugaydi:

1. **SCOPE** — to'lqin-modulning aniq `file:line` nishonlarini o'qi (Read), DB holatini `q.cjs` bilan tekshir.
2. **DDL** (agar kerak) — idempotent migration + `APPROVED` izoh; jonli DB'ga qo'lda yoki invariants orqali; rollback-tx bilan tasdiqla.
3. **KOD** — schema/repo/service/controller/DTO/listener; Result<T> + Zod + Drizzle (raw SQL faqat murakkab); ishlayotgan kod buzilmaydi.
4. **FE** (agar bor) — useQuery/useMutation + EP shablon + token (yangi dizayn yo'q).
5. **GREEN** — `apps/api/node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` = MENING fayllarimda 0 xato (mavjud locked-modul xatolari hisobga olinmaydi, lekin yangi xato qo'shilmaydi). FE: `tsc --noEmit` MENING fayllarimda 0. `pnpm --filter @europrint/api run build` (yoki swc) PASS. Lint/reviewer skriptlar (`scripts/run-all-reviewers.sh` tegishli) WARN'siz.
6. **VERIFY (Q-40):** clean-dist rebuild (`rm -rf apps/api/dist` → restart) → jonli HTTP yoki DB-proof (rollback-tx) → vizyonga moslik. "Kirit→saqla→qayta-och→ko'rinadimi".
7. **COMMIT** — faqat o'z fayllarim; xabar `type(scope): subject` + Co-Authored-By; `git log -1` bilan tasdiqla. MASTER_VISION'da to'lqin holatini ✅ belgila. → **Keyingi to'lqinga o't.**

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

### 🌊 TO'LQIN 3 — PP/MM: Material + sloy-formula ulanishi
- **Vizyon:** material = kind(plain/corrugated)+format+grammaj+sloy-stack; gofra m²↔list↔kg formula har sarfda ishlaydi.
- **Hozir:** sloy-formula REAL ✅ (`gofra-conversion.service.ts`, `pp_flute_types`=5) lekin `material_cards`=31 (material_kind=NULL), `material_layer_config`=0, `material_norms`=0 — formula oziq-data'siz.
- **Qur:** (a) `material_cards`ga `material_kind`+`format_a`+`format_b` to'ldirish STRUKTURASI (egasi 21-material seed bergach). (b) `material_layer_config` seed-struktura. (c) MES/PP sarf-yo'lini `GofraConversionService`ga ULA (hozir chaqirilmaydi) — sarf m² → formula → kg/list. (d) `material_norms` per-sex+marka strukturasi.
- **Gated:** 21-material qiymatlari + marka koeffitsientlari (take-up/chiqindi/kley) = **egasi DATA**.

### 🌊 TO'LQIN 4 — PP: Per-sex parametrlar (norma/brak/ishchi/mashina)
- **Vizyon:** har sex sozlanadigan: norma(m²/list/kg/smena), brak%, min/max ishchi, mashina(rang/qolib/tezlik), kirish/chiqish.
- **Hozir:** `work_centers`da norma/brak ustun yo'q; equipment(7) mashina-config yo'q; routing-rule yo'q.
- **Qur:** (a) `work_centers`ga `norma_m2_per_shift`, `norma_kg_per_shift`, `brak_limit_pct`, `min_crew_size`, `max_crew_size` (DDL). (b) `work_center_equipment_config` jadval (machine_id→colors/mold/speed). (c) `org_functions.work_center_id` link (sex↔orgsxema). (d) Config endpointlar (PUT /pp/work-centers/:id/norma, /brak, /crew).
- **Gated:** norma/brak qiymatlari = **egasi DATA** (struktura quriladi).

### 🌊 TO'LQIN 5 — MES: per-sex sessiya + m²/list/kg + downtime→rework
- **Vizyon:** sessiya sex-belgili; chiqim m²/list/kg birlikda; downtime sabab→rework-routing; 4-darajali OEE per-sex.
- **Hozir:** sessiya REAL (6 qator) lekin sex-belgi yo'q; `mes_material_consumption` birlik=text (konversiya yo'q); downtime(2) rework'ga ulanmagan.
- **Qur:** (a) `production_sessions`ga sex/work_center-link + m²/list/kg birlik-enum. (b) Material-consumption→GofraConversion ulash. (c) Downtime reason→rework-routing (To'lqin 2 graf'iga). (d) Sex-level OEE.
- **Nishonlar:** `mes-shifts-stats.repo.ts:91,154`, `mes-production-sessions.repo.ts`.

### 🌊 TO'LQIN 6 — PP/MES: AI-navbat STRUKTURASI + material BRON
- **Vizyon:** AI navbat FIFO+muddat/mijoz/tiraj/summa; buyurtmada material bron; IoT-tablet AI-rank; no-preemption.
- **Hozir:** `ProductionPriorityService.buildQueue` REAL logika LEKIN hech chaqirilmaydi; bron faqat POS; IoT-tablet buyurtma ko'rsatadi (REAL) lekin AI-rank emas.
- **Qur (struktura, AI-narrative emas):** (a) `buildQueue`ni REAL endpointga ula (`GET /pp/queue` / scheduler). (b) PP-buyurtmada material-bron (stock_reservations) trigger. (c) IoT-tablet'ni queue-rank bilan ko'rsatish. (d) Director queue-override darvozasi.
- **Gated:** AI'ning aqlli reordering/narrative = **AI-token** (FIFO+factor STRUKTURASI hozir quriladi).

### 🌊 TO'LQIN 7 — HR/MES: Kunlik hisobot/KPI to'ldirish
- **Vizyon:** 16-soat (smena-aware) kesim; STKP per-rol; reja-recall→PDF→eskalatsiya; cross-rating(xizmat reytingi); mashina-no-output→KPI savol.
- **Hozir:** `hr_daily_reports`=6090 REAL ✅, cron REAL, KPI(60) REAL; lekin 16h faqat soat 15:30/16:00; STKP global hardcode; PDF ulanmagan; served-rates yo'q.
- **Qur:** (a) Smena-aware 16h kesim (shift_start'dan). (b) `stkp_config` per-rol/sex jadval (vazn override). (c) Reja-recall→PDF→eskalatsiya workflow. (d) Served-rates cross-rating. (e) Mashina-no-output→KPI-savol trigger.
- **Gated:** STKP vazn qiymatlari = **egasi DATA**.

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

## 4. LOOP BOSHQARUVI

- Har firing: `MASTER_VISION.md` + bu fayl o'qi → birinchi ✅ bo'lmagan to'lqinni ol → PROTOKOL (§1) bo'yicha tugat → ✅ belgila → keyingi firing.
- Hamma buildable to'lqin ✅ bo'lsa → loop to'xtaydi, egasiga "GATED qoldi: AI-token + DATA" hisoboti.
- Har to'lqin oxirida 1-qatorli holat: `To'lqin N — <modul> ✅ commit <hash> | GREEN | DB-proof OK`.

---

*Tayyorladi: Claude (menejer+bosh dasturchi), 2026-06-23. Manba: MASTER_VISION.md + production deep-analysis + 16-modul konsolidatsiya. Push bloklangan (kalit rotatsiya kutadi) → commit-only.*
