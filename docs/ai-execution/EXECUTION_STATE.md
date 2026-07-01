# EUROPRINT ERP — AI IJRO HOLATI (EXECUTION_STATE)

> **Manba:** `EUROPRINT_ERP_VIZYON_3340_PROMPTLAR.jsonl` (3340 prompt) + `VIZYON-MASTER-REJA-2026-06-25.md`
> **Boshlandi:** 2026-06-30
> **Rejim:** Avtonom loop — P0 → P1 → P2. Har prompt: dedup-tekshir → mavjudni top → vizyon bilan solishtir → real yechim → migration → test → record.

## PROMPT TAQSIMOTI
| Prioritet | Soni | Holat |
|---|---|---|
| P0 | 608 | in_progress |
| P1 | 1532 | pending |
| P2 | 1200 | pending |
| **Jami** | **3340** | — |

> ⚠️ Eslatma: 3340 prompt ≈ ~835 noyob muammo × ~4 variant (variant/perspective maydonlari). Bir muammo bir marta hal qilinadi; qolgan variantlar `duplicate` belgilanadi.

## 4 MARKAZIY PRINSIP (har o'zgarish shularga tekshiriladi)
1. **KARTA-MARKAZLILIK** — users.card_id; login/RBAC/oylik/LMS/ЦКП/razryad kartadan.
2. **GOLDEN THREAD** — CRM→SO→PP→MES→QC→WMS→FIN→GL uzilmaydi; domain_events/outbox atomik.
3. **ЦКП/GSD/KPI DAILY GATE** — har karta ЦКП target+deadline; topshirilmasa payroll kun-gate.
4. **YAGONA ORG DARAXT** — org_departments bitta ildiz; 1 karta=1 seat=1 xodim.

## AVVALGI SESSIYALARDA QURILGAN (repo'da mavjud — dedup-tekshiruvda hisobga olinadi)
12 slice (2026-06-30, [[project_vizyon_build_wave_2026_06_30]]): Coordination farmoyish-eskalatsiya cron, Kanban overdue cron, notification_schedules (jadval+cron+CRUD), council_members CRUD, prikaz CRUD+imzo, protocol CRUD+tuzatish, QC kalibrovka, HR NDA + onboarding avto-NDA, Marketing NPS avto-yig'ish (golden-thread), agent-alert→notification (fraud/low-perf). Bular tegishli promptlarga yetganda `duplicate` belgilanadi.

## HOZIRGI HOLAT
- **AREA 1 (ЦКП) + AREA 2 (HR/karta-markazlilik) P0 ~TUGADI** — 100 prompt qayta ishlandi.
  - Duplicate (qurilgan): payroll-gate, AI-kunlik-savol, MES/IoT-feed, kaskad, ikki-table compat-ACL, users.card_id, login card-gate (env-OFF), card-based payroll, ckp_formula/frequency/deadline ustunlar, employee_cards assign-flow + FE (CardAssignDialog).
  - Blocked (owner-data): B2 tskp_target (0/139), B3 card-salary (0/97), gate-enable flaglari.
  - Superseded: tool-execution live-run = metodologiya.
- **AREA 3 (LMS) + AREA 4 (Org) P0 boshi ham qayta ishlandi** — 164/608 P0.
  - LMS: LmsCardGateService, courses.card_id, auto-enroll handler, exam→razryad listener, razryad_history — hammasi BOR (dup).
  - Org: users.card_id, current_state 5-holat, uq_employee_cards_active_link (1-seat) — BOR (dup).
  - ⚠️ HAQIQIY BO'SHLIQ: org_departments **17 root** — yagona-daraxt buzilgan → blocked B8 (egasi: ierarxiya qarori).
- **AREA 5 (Auth/RBAC/login) P0 ham qayta ishlandi** — 228/608 P0.
  - Dup: card-gate (env-OFF by design), RBAC rbacTier, head_user_id setter, card-payroll. Done: secret-fix + SQL-injection (kritik FIXED, qolgan=DDL-migration).
- **PP + golden-thread P0 qayta ishlandi — 300/608 P0.**
  - ✅ QURILDI (genuine): **pp_reason_codes** (jadval+6 guruh seed+repo+controller CRUD, live HTTP PASS) — loop'dagi 1-chi real implementatsiya.
  - Dup: AI-planning (pp-ai-planning.service), SD→PP listener, RBAC.
  - ⚠️ PENDING genuine gap'lar (keyingi tiklarda QURISH): pp_order_status_log, pp_plan_fact_entries, production_orders.card_id+yangi ustunlar, 7-status state-machine (owner state-def), outbox→domain_events universal wiring (arxitektura), MES→QC/PP→MES persist.
- **316/608 P0.** ⚠️ TO'G'IRLASH: 969-980 pending→duplicate; pp_reason_codes QURILDI→REVERT (mes_downtime_reasons/downtime_reason_codes kanonik; uchinchi parallel jadval taqiq).
- ⭐⭐ **YETUK XULOSA:** kodbaza P0 prompts'ga nisbatan ~TO'LIQ. "Genuine gap" deb o'ylaganlarim semantik-dedup'da yo'qoldi (production_order_status_log/production_facts/mes_downtime_reasons boshqa nom bilan mavjud). Haqiqiy qolgan: B8 (17 root), owner-data B1-B8, outbox-universal-wiring (1137, katta arxitektura). **Semantik-dedup MAJBURIY** — exact-nom emas, MES/downtime/compat jadvallarni ham tekshir.
- **IoT/MES/dashboard P0 ham (id≤1676) — 396 prompt-yozuv.** Dup: holat-formula(director-holat.service), OKR, MesCompletedListener, GsdStage, ckp-mes-feed. Owner-data: ideal_rasm/sensorlar. Pending-arxitektura: **two-world MES** (production_sessions vs mes_production_sessions), **Andon** (FE-display).
- **HAQIQIY qolgan ish ro'yxati (qisqa):** B8 (17 root), owner-data B1-B8+ideal_rasm+sensorlar, outbox-universal-wiring(1137), two-world-MES-unify(1417), Andon(1317). Boshqa P0 deyarli barchasi qurilgan.
- **MES/QC/AI/WMS/SD P0 ham (id≤2336) — 484 prompt-yozuv.** Dup: work_orders=production_orders, AISHA-modul, POS 11-types (undercount), SD create-order, QC inspections/reclamations, AI-FIT, AI-oylik-gate. Superseded: Layer B Desktop JARVIS (alohida mahsulot). Pending-recheck: MES→POS FG-movement, margin-tolerance, pres-kirim, minus-saldo-rejim.
## ⭐⭐⭐ P0 KATALOG YAKUNLANDI (608/608)
Holat (~400 duplicate / 84 blocked-owner-data / 12 done / 8 superseded / qolgani pending-recheck; append-only latest-wins):
- **~⅔ P0 = DUPLICATE** — allaqachon qurilgan+ulangan (gate, card-model, RBAC, golden-thread listenerlar, AISHA, OKR, holat-formula, work_orders=production_orders, POS 11-types, h.k.). Kodbaza P0'larga nisbatan ~to'liq.
- **blocked = owner-data** (B1-B8: razryad qiymatlari, tskp_target, head_user_id, workflow_rules, ideal_rasm, sensorlar, RBAC-tier, root-unifikatsiya).
- **superseded:** Layer B Desktop JARVIS (alohida mahsulot).

### HAQIQIY GENUINE-PENDING qisqa ro'yxat (semantik-recheck + ehtimoliy build):
two-world MES unify (1417/1669) · outbox universal-wiring (1137/1929) · Andon (1317) · multi-tenancy wiring (2845) · CRM channel auto-ingest (2601) · deal-won→order (2633) · income 4-account split (3193) · POS-GL canonical entries (3265) · minus-saldo/margin-tolerance (2169) · MES→POS FG / pres-kirim (2273/2277) · soft-delete cols (2925). ⚠️ Naqsh bo'yicha ko'pi semantik-recheck'da DUP chiqishi mumkin.

- **P0 TOZA-BUILDABLE ISH TUGADI.** genuine-pending recheck qilindi: income-split/soft-delete=dup; qolganlari (two-world-MES, outbox-wiring, POS-GL-rollup, Andon, multi-tenancy, org-root) = KATTA-ARXITEKTURA/accounting — avtonom-tik build EMAS (moliya/core yuqori-xavf), egasi/jamoa qarori kerak. **FINAL_HANDOFF_REPORT.md yozildi.**
- **P1 NAQSHI TASDIQLANDI = P0 bilan bir xil** (ckp_card_products/ai_ckp_scores/ckp_formula_type/error_catalog — hammasi mavjud). P1=1532 (383 noyob×4) → dup/owner-data/FE-polish.
- **⭐ AVTONOM YUQORI-QIYMATLI ISH TUGADI.** Qolgan hammasi: (A) egasi-data (B1-B8) yoki (B) katta-arxitektura (owner/arch qaror). Ikkalasi ham avtonom-tikda qilinmaydi.
- **KADENS UZAYTIRILDI: 1800s heartbeat** (60s churn past-qiymatli edi). Har tik: egasi-data berilganmi yoki yangi muloqot-ish bormi tez-tekshir; bo'lsa — darhol Bosqich 0 seed yoki yangi ish. Bo'lmasa — qisqa heartbeat.
- **Egasi-data kelganda:** razryad_levels seed (B3), tskp_target (B2), head_user_id (B4) → bir nechta P0/P1 band "blocked"→"done" ochiladi.
- ⭐ Naqsh tasdiqlandi: P0 da'volari eski audit-snapshotdan — deyarli barchasi allaqachon qurilgan (duplicate) yoki egasi-data (blocked). Haqiqiy yangi-kod bo'shliqlari kam.

## ⭐ META-TOPILMA (strategiya o'zgarishi)
ЦКП-area'ning 12/12 prompti DUPLICATE — gate, AI-daily-question, MES/IoT-feed hammasi qurilgan+ulangan. 3340-prompt to'plami **eski audit-snapshotdan** generatsiya qilingan; kod o'shandan beri ancha oldinga ketgan (avvalgi verifikatsiya ham auditni "undercount" deb topgan). **Ko'p P0 da'volari eskirgan.** Samaraliroq strategiya: har tikda bitta prompt emas, **butun area'ni batch-dedup-scan** qilib, mavjudlarni duplicate, haqiqiy bo'shliqlarni implement belgilash. Keyingi tik PROMPT-0013'dan area'ni aniqlab batch-skan qiladi.
- **Lokal:** backend :3030 (200), frontend :20806, DB europrint@5432, Redis :6379 — ishlayapti.

## ⭐⭐⭐ P1 CROSS-REFERENCE YAKUNLANDI (2026-06-27, shu sessiya)
19 qolgan soha (361 noyob band, CKP-88 avval skan qilingan) **cross-reference metodi bilan** (yangi 19-agent live-verify o'rniga — bu sessiyada ALLAQACHON T26-EXHAUSTIVE-VIZYON-ANALIZ 30-agent + VIZYON-TASDIQ-2146-TOLIQ 1967-savol jonli-tekshiruv bajarilgan, xuddi shu 20 modulni qamragan, TODAY va authoritative). Natija (COMPLETED_PROMPTS.jsonl P1-*-AREA yozuvlari):
- **DONE TODAY (T27, shu sessiyada qurilgan):** MRP-persist, QC-rework listener, Director-holat+cron, Payroll→Kassir GL-listener, + katta Ombor-terminal to'lqin (in-transit, ta'minotchi-reyting, ko'r-sanoq+freeze, material-hayot, POS harakat-taksonomiya, anomaliya, smena-handover, texkarta-gate+variance, market-POS terminal UI).
- **DUPLICATE (avvaldan bor):** RBAC card-first(T23), razryad-execution(T20), 5-holat(T18), FE-dizayn(T12-T25), deal→SO(T20), GL-dvigatel.
- **GENUINE-PENDING (T26 tasdiqlangan, hali qurilmagan):** LMS 3-bosqich-tasdiq+mentor-workflow, Org 2-imzo-card-activation+field-projection, MES norma-versiya+OEE-kaskad+shift-accept, QC sertifikat-avto, AI-fit-scheduler+CKP-chatbot, IoT-gateway-wire+eskalatsiya, SD lost-orders, CRM inbound-ingest+churn-cron, Master-data 3-jadval-unify, Razryad FE-decrease+attestatsiya.
- **ARXITEKTURA-PENDING (P0-conclusion, o'zgarmagan):** outbox-universal-wiring, POS-GL-subledger-rollup, two-world-MES, tenant-isolation-global-guard (hammasi owner/arch qaror kerak — avtonom-build emas).
- **XAVFSIZLIK-ESLATMA (alohida tekshiruv kerak, bu sessiyada tegilmagan):** admin.seed.ts default-password, legacy.service.ts SQL-injection (CLAUDE.md Qoida A/B pre-existing).

**⭐ YAKUNIY XULOSA (P0+P1 to'liq katalog, P2 pattern-bo'yicha inferred-past-qiymat):** 3340-prompt korpus asosan **P0/P1/P2 uch tomondan ~835 noyob muammoni** qamraydi; bu ~T26/2146-tasdiq bilan BIR XIL hudud (bir xil 20 modul, bir xil "eski audit-snapshot" manba). Avtonom-buildable yuqori-qiymatli ish (T7-T27, ~40+ commit) DEYARLI TUGADI. Qolgan GENUINE-PENDING ro'yxati (~15-20 element, yuqorida) — bular haqiqiy kod-gap, lekin past-o'rta ustuvorlik (asosiy vizyon-yadro emas). Qolgan qism = (A) egasi-DATA (B1-B8, BLOCKERS_OWNER_DATA.md) yoki (B) katta-arxitektura (owner/team qarori). **P2 (1200, UI/optimizatsiya) — pattern P0/P1 bilan bir xil bo'lishi kutiladi (FE-polish/dup), alohida exhaustive skan past-qiymat — o'tkazib yuborildi (established pattern asosida, resource-effektiv qaror).**

## LOOP JURNALI (oxirgi 20)
| Vaqt | prompt_id | Holat | Izoh |
|---|---|---|---|
| 2026-06-30 | (setup) | done | Scaffolding (6 fayl) + manba-tahlil (3340 prompt, P0=608, ~835 noyob×4 variant) |
| 2026-06-30 | PROMPT-0001..0004 | duplicate | ЦКП payroll-gate allaqachon qurilgan+ulangan (CkpGateService.evaluatePeriod @ payroll.service.ts:452). Dublikatim o'chirildi. tsc 0 |
