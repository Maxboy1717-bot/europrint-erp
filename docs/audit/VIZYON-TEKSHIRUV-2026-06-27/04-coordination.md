# 04 — Coordination / Council — Mustaqil tekshiruv (adversarial audit)

**Sana:** 2026-06-27
**Modul:** 04 — Coordination / Council (Vysotskiy 7 kengash, doklad, rasporyajeniye, prikaz, protokol, ЗВС, workflow_rules, golden-thread koordinatsiya)
**Savol soni:** 117
**Doc self-claim:** 30% vizyon qoplama
**Tekshiruvchi realPct (bor=1 / qisman=0.5 / yoq=0):** ~22%

## Yakuniy hisob (verified)
- ✅ bor (real): 1
- 🟡 qisman (real): 49
- ❌ yoq (real): 67
- 🔑 egasi-data: 0
- CLAIM confirmed: 112
- CLAIM refuted/overstated: 5

**Xulosa:** Doc juda aniq va konservativ yozilgan. DB jadval mavjudligi/yo'qligi, qator soni va kod fayl iqtiboslarining deyarli barchasi JONLI tekshiruvda tasdiqlandi. Doc'ning 30% headline'i per-savol breakdown (≈22%) bilan solishtirganda biroz optimistik, lekin har bir savol-darajadagi flag (❌/🟡/✅) haqqoniy.

## JONLI DB DALIL (psql europrint)
- councils=5 qator, chairperson_id non-null=0 (hammasi NULL ✓), meeting_schedule non-null=0 (hammasi NULL ✓)
- council_members, prikaz, protocol, protocols jadvallari **YO'Q** (to_regclass=null) — doc ❌ claimlari to'g'ri
- dokla=2, rasporyazhenie=0, zvs=0, workflow_rules=0, cc_documents=0, downtime_events=2, design_orders=0, design_tooling=0, sd_order_timeline=0, internal_requests=0, ckp_fact_values=0, ckp_card_products=0, ai_ckp_scores=0, mes_shift_handovers=0, qc_braks=0, waste_records=0, attendance_logs=0, lessons=13
- dokla ustunlar: id,title,employee_id,status,from_user_id,from_name,council_level,subject,problem,result,proposal — **deadline/tur/ilova ustuni YO'Q** (doc to'g'ri)
- rasporyazhenie ustunlar: from_user_id,to_user,task,deadline,priority,done_at,done_by,done_note — **asos/soispolnitel/acceptedAt YO'Q** (doc to'g'ri)
- workflow_rules ustunlar: request_type,source_department_id,source_function_id,step_order,approver_department_id,approver_function_id (doc to'g'ri)
- qc_braks ustunlar: papka_order_id,stage,reason,operator_id,cost_impact... — **department/responsible_manager YO'Q** (doc to'g'ri)

## KOD DALIL
- `modules/wms/application/outbound-enforcement.service.ts:73` checkIssueAllowed → :115 BLOCK_GOFRA_LAYER_MISMATCH (EP-WMS-085) + :128 EP-WMS-084 BLOK — REAL (04.94, 04.70)
- `modules/design/domain/enums/design-status.enum.ts:7-13` NEW/AI_GENERATED/DESIGNER_REVIEW/WAITING_CUSTOMER_APPROVAL/APPROVED/REJECTED/REVISION_REQUESTED — REAL (04.73)
- `modules/bot-gateway/bots/bot.helpers.ts:151,164` faqat /zvs_status — topshiriqlarim/dokladlarim/bajardim YO'Q (04.58, 04.63)
- `modules/director/presentation/coordination.controller.ts:33` @Roles(admin,manager,supervisor,director,ceo); :84 baskets; :214 stats (04.60, 04.113)
- `coordination.repository.ts:111` overdue = SELECT CASE (cron emas!); :178 listBaskets cc_documents.basket_state; :195 priority-CASE ordering (04.66, 04.88, 04.110)
- `coordination.service.ts:86` markRaspDoneWithAuth → bitta bosqichli done (04.42)
- director modulda **@Cron/escalation/@OnEvent YO'Q** (grep bo'sh) — eskalatsiya qurilmagan (04.15, 04.23, 04.61, 04.62, 04.64)
- `cron/daily-report.cron.ts:19` @Cron('0 16 * * 1-5') markAbsentEmployees (04.68, 04.83)
- `director.module.ts:115` TelegramModule import (04.50, 04.96)
- `design.controller.ts:179` GET tooling, :189 wear-forecast (04.75)
- `cc-sla.cron.ts:37` @Cron EVERY_30_MINUTES escalateApprovals, :53 inbox SLA — REAL SLA cron (cc_approvals/cc_documents uchun) (04.116)
- `workflow-rules.service.ts:26` resolve; **chaqiruvchi BOR**: `create-approval-request.handler.ts:132` workflowRules.resolve(...) (04.65, 04.101 — doc'ning "chaqiruvchi yo'q" da'vosi NOTO'G'RI)
- `zvs.controller.ts:58,71` approve/reject (04.56, 04.57, 04.114)
- `mes-shifts-stats.repo.ts:65` INSERT INTO mes_shift_handovers (04.81)
- `drizzle-downtime.repo.ts:104` save, :127 endDowntime, :169 getDowntimeSummary (04.69)
- `ckp-daily-aggregate.cron.ts:34` @Cron('0 1 * * *'); `ckp-cascade.listener.ts:55` @OnEvent(CKP_REPORTED_EVENT) (04.84, 04.102, 04.117)
- **markOverdue cron HECH QAYERDA YO'Q** (grep bo'sh butun apps/api/src)

## REFUTED CLAIMS (Isbot da'vosi noaniq/overstated)
- **04.65** — doc: "resolve chaqiruvchi yo'q" → NOTO'G'RI. `create-approval-request.handler.ts:132` workflowRules.resolve() ni REAL chaqiradi (approval oqimiga ulangan). Status qisman to'g'ri (0 qator), lekin doc mexanizmni kam baholagan.
- **04.101** — doc: "avto-yo'naltirish data-siz isbotsiz / hech qaysi oqim ishlatmaydi" → qisman noto'g'ri: resolve approval-request handlerga ulangan; faqat data (0 qator) yo'q.
- **04.89** — doc: "overdue-marker (cron markOverdue) bor" → cron YO'Q; overdue faqat SELECT CASE (repo:111). Status yoq to'g'ri, sub-claim overstated.
- **04.77** — doc: "cron markOverdue bor" → cron YO'Q (faqat hisoblanadi).
- **04.116** — doc: "rasporyajeniye markOverdue cron + eskalatsiya" → rasp uchun cron YO'Q; faqat cc-sla.cron (cc_approvals) mavjud. Status qisman to'g'ri, sub-claim overstated.

---

## Per-savol tekshiruv (qisqa)

Quyida flag → VERIFIED → CLAIM. Batafsil dalil yuqorida (DB/KOD DALIL).

- 04.1 ❌→yoq (confirmed) council_members jadval yo'q, chairperson_id NULL
- 04.2 ❌→yoq (confirmed) councils da rol/member ustuni yo'q
- 04.3 ❌→yoq (confirmed) kvorum logikasi grep=0
- 04.4 ❌→yoq (confirmed) ovoz mexanizmi yo'q
- 04.5 ❌→yoq (confirmed) delegatsiya yo'q
- 04.6 ❌→yoq (confirmed) conflict-of-interest yo'q
- 04.7 ❌→yoq (confirmed) majlis turi entiteti yo'q
- 04.8 🟡→qisman (confirmed) meeting_schedule ustun bor lekin NULL×5; ЗВС cron yo'q
- 04.9 ❌→yoq (confirmed) meeting jadval yo'q
- 04.10 ❌→yoq (confirmed) povestka yo'q
- 04.11 ❌→yoq (confirmed) davomat koordinatsiyada yo'q
- 04.12 ❌→yoq (confirmed) meeting entiteti yo'q
- 04.13 🟡→qisman (confirmed) dokla=2 qator, tur ustuni yo'q
- 04.14 ❌→yoq (confirmed) dokla'da deadline ustuni yo'q (DB tasdiq)
- 04.15 ❌→yoq (confirmed) eskalatsiya cron yo'q (director @Cron=0)
- 04.16 🟡→qisman (confirmed) subject/problem/result/proposal bor, 6-maydon/ilova yo'q
- 04.17 ❌→yoq (confirmed) ERP auto-pull yo'q
- 04.18 🟡→qisman (confirmed) status sent/read/resolved wired
- 04.19 🟡→qisman (confirmed) rasporyazhenie bor, prikaz jadval YO'Q (DB tasdiq)
- 04.20 🟡→qisman (confirmed) priority+deadline ustun bor, avto-muddat yo'q
- 04.21 🟡→qisman (confirmed) 5 maydon bor, asos ustuni yo'q
- 04.22 🟡→qisman (confirmed) to_user yagona, soispolnitel yo'q
- 04.23 ❌→yoq (confirmed) eskalatsiya cron yo'q; overdue=SELECT CASE
- 04.24 ❌→yoq (confirmed) rad/uzaytirish kanali yo'q
- 04.25 🟡→qisman (confirmed) status assigned/in_progress/done+overdue (~4)
- 04.26 ❌→yoq (confirmed) prikaz jadval yo'q
- 04.27 ❌→yoq (confirmed) prikaz kategoriya yo'q
- 04.28 ❌→yoq (confirmed) raqamlash yo'q
- 04.29 ❌→yoq (confirmed) asos havola ustuni yo'q
- 04.30 ❌→yoq (confirmed) prikaz jadval yo'q
- 04.31 ❌→yoq (confirmed) immutable yo'q
- 04.32 ❌→yoq (confirmed) protocol jadval/controller yo'q (DB+grep tasdiq)
- 04.33 ❌→yoq (confirmed) imzo zanjiri yo'q
- 04.34 ❌→yoq (confirmed) imzo audit yo'q
- 04.35 ❌→yoq (confirmed) imzo muddat cron yo'q
- 04.36 ❌→yoq (confirmed) protokol versiya yo'q
- 04.37 ❌→yoq (confirmed) e'tiroz entiteti yo'q
- 04.38 ❌→yoq (confirmed) auto action-item yo'q (grep=0)
- 04.39 ❌→yoq (confirmed) bajarilish foizi yo'q
- 04.40 ❌→yoq (confirmed) kun tartibi ko'chirish yo'q
- 04.41 ❌→yoq (confirmed) done_note text bor, fayl-dalil yo'q
- 04.42 🟡→qisman (confirmed) markRaspDone bitta bosqich (service:86)
- 04.43 ❌→yoq (confirmed) reyting/KPI hisob yo'q
- 04.44 ❌→yoq (confirmed) arxiv paket yo'q
- 04.45 ❌→yoq (confirmed) tsvector qidiruv yo'q
- 04.46 ❌→yoq (confirmed) visibility ustuni yo'q
- 04.47 ❌→yoq (confirmed) HARD DELETE, immutable yo'q
- 04.48 ❌→yoq (confirmed) audit-log koordinatsiyada yo'q
- 04.49 ❌→yoq (confirmed) PDF/Excel export yo'q
- 04.50 🟡→qisman (confirmed) TelegramModule import (module:115), notify ulanmagan
- 04.51 ❌→yoq (confirmed) majlis entiteti yo'q
- 04.52 ❌→yoq (confirmed) favqulodda majlis yo'q
- 04.53 ❌→yoq (confirmed) modul signal emit yo'q
- 04.54 ❌→yoq (confirmed) council_members yo'q, FK yo'q
- 04.55 🟡→qisman (confirmed) UI i18n bor, per-document til yo'q (chegara holat)
- 04.56 🟡→qisman (confirmed) zvs controller create/list/approve/reject, sessiya wrapper yo'q
- 04.57 🟡→qisman (confirmed) approve/reject bor, partial/amount yo'q
- 04.58 ❌→yoq (confirmed) Seshanba cron yo'q
- 04.59 ❌→yoq (confirmed) sessiya hisoboti yo'q
- 04.60 🟡→qisman (confirmed) Overview tab + /stats real, majlis/prikaz soni yo'q
- 04.61 ❌→yoq (confirmed) eskalatsiya cron yo'q
- 04.62 ❌→yoq (confirmed) avto-routing yo'q (manager_id grep=0)
- 04.63 🟡→qisman (confirmed) faqat /zvs_status
- 04.64 ❌→yoq (confirmed) AI listener director'da yo'q
- 04.65 🟡→qisman (**refuted sub-claim**) workflow_rules struktura+resolve REAL, **chaqiruvchi BOR** (handler:132), 0 qator
- 04.66 🟡→qisman (confirmed) baskets tab + repo:178, cc_documents=0
- 04.67 ❌→yoq (confirmed) papka_no havola ustuni dokla/rasp da yo'q
- 04.68 ❌→yoq (confirmed) 24h-reja generator yo'q, cron faqat absent-marker
- 04.69 🟡→qisman (confirmed) downtime_events=2, repo REAL, mas'ul-bo'lim yo'q
- 04.70 🟡→qisman (confirmed) outbound BLOCK REAL (svc:128), override/notify uzilgan
- 04.71 🟡→qisman (confirmed) workflow_rules dept+function darajasi, 0 qator
- 04.72 🟡→qisman (confirmed) sd_order_timeline bor (0 qator), handoff segment yo'q
- 04.73 🟡→qisman (confirmed) DesignStatus enum REAL, design_orders=0
- 04.74 ❌→yoq (confirmed) podpisnoy_lists jadval yo'q, gate yo'q
- 04.75 🟡→qisman (confirmed) design_tooling REAL+endpoint, 0 qator, per-order bog' yo'q
- 04.76 ❌→yoq (confirmed) roller/pallet-transport reestr yo'q
- 04.77 ❌→yoq (**refuted sub-claim**: "cron markOverdue" — cron YO'Q)
- 04.78 🟡→qisman (confirmed) mes_operations/routing bor, algoritm-turi yo'q
- 04.79 🟡→qisman (confirmed) papka FK ba'zi joyda, coordination ulanmagan
- 04.80 ❌→yoq (confirmed) priladka-koordinatsiya yo'q
- 04.81 🟡→qisman (confirmed) handover INSERT REAL (repo:65), 0 qator
- 04.82 ❌→yoq (confirmed) success/mistake blank yo'q, lessons=LMS
- 04.83 🟡→qisman (confirmed) runDailyQuestionPush:229 + ckp cron, haftalik/oylik to'liq emas
- 04.84 🟡→qisman (confirmed) ckp_fact_values infra REAL, koordinatsiya-hodisa ulanmagan
- 04.85 ❌→yoq (confirmed) tayyorlik % hisobi yo'q
- 04.86 🟡→qisman (confirmed) manager_id bor, STOP→menejer notify yo'q
- 04.87 ❌→yoq (confirmed) attendance koordinatsiyaga ulanmagan, 0 qator
- 04.88 🟡→qisman (confirmed) listBaskets repo:178, cc_documents=0
- 04.89 ❌→yoq (**refuted sub-claim**: "cron markOverdue" — cron YO'Q, faqat SELECT CASE)
- 04.90 ❌→yoq (confirmed) qc_braks da department/manager ustuni yo'q (DB tasdiq)
- 04.91 🟡→qisman (confirmed) downtime MATERIAL reason bor, 3-broadcast ulanmagan
- 04.92 🟡→qisman (confirmed) qc_braks REAL, manager-KPI atributsiya yo'q, 0 qator
- 04.93 ❌→yoq (confirmed) real-vaqt norma signal yo'q
- 04.94 ✅→bor (confirmed) gofra layer mismatch BLOCK REAL (svc:115)
- 04.95 ❌→yoq (confirmed) konstruktor handoff yo'q (grep=0)
- 04.96 🟡→qisman (confirmed) revisions+timeline bor, broadcast+ack yo'q
- 04.97 🟡→qisman (confirmed) protokol→action zanjiri qisman, davomat-bog' yo'q
- 04.98 ❌→yoq (confirmed) energiya KPI yo'q (grep=0)
- 04.99 🟡→qisman (confirmed) onboarding+LMS bor, karta-gate ulanmagan
- 04.100 🟡→qisman (confirmed) internal_requests bor, ma'lumot-so'rovi turi ulanmagan, 0 qator
- 04.101 🟡→qisman (**refuted sub-claim**) workflow_rules+resolve REAL+chaqiruvchi BOR (handler:132), 0 qator
- 04.102 🟡→qisman (confirmed) ckp infra REAL, normalar 0 qator
- 04.103 ❌→yoq (confirmed) plan-fakt og'ish signal yo'q
- 04.104 🟡→qisman (confirmed) qc_braks REAL, manager-KPI yo'q
- 04.105 ❌→yoq (confirmed) razmer-optimizatsiya qaror-turi yo'q
- 04.106 ❌→yoq (confirmed) operator+yordamchi juftlik yo'q
- 04.107 ❌→yoq (confirmed) razmer→3-tasdiq oqimi yo'q
- 04.108 🟡→qisman (confirmed) urgent CASE 0 ordering, cc_documents=0
- 04.109 🟡→qisman (confirmed) internal_requests struktura, kesish/rulon turi yo'q, 0 qator
- 04.110 🟡→qisman (confirmed) design priority+CASE ordering, sales_orders priority yo'q
- 04.111 🟡→qisman (confirmed) internal_requests bor, xizmat turi ulanmagan
- 04.112 ❌→yoq (confirmed) smena readiness-gate yo'q
- 04.113 🟡→qisman (confirmed) RolesGuard+@Roles (ctrl:33), maydon-darajali yo'q
- 04.114 🟡→qisman (confirmed) director approvals/zvs/approval_workflows REAL, avto-gate-routing data-siz
- 04.115 🟡→qisman (confirmed) design_orders maydon+Zod, to'liq ТТ gate isbotsiz
- 04.116 🟡→qisman (**refuted sub-claim**) cc-sla.cron REAL, lekin "rasporyajeniye markOverdue cron" YO'Q
- 04.117 🟡→qisman (confirmed) ai_ckp infra REAL, koordinatsiya-hodisa ulanmagan, 0 qator
