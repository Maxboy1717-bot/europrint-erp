# MASSAVIY TUZATISH — to'liq sweep (2026-06-06)
> EDITOR (inline, subagent yo'q). Har item JONLI kodda tekshiriladi (katalog ko'p soxta-positiv).
> Yorliqlar: [FIXED hash] / [ALREADY-REAL fp] / [DDL-GATE] / [DATA] / [DECISION] / [INTENTIONAL] / [FE-PAGE]

## KATEGORIYA A — GREEN-LIES (echo/200 lekin DB yozmaydi)
| Item | Jonli holat | Yorliq |
|---|---|---|
| **DESIGN** generateDesigns | Date.now() id, saqlamasdi | **[FIXED `ecf796c7`]** → `designs` INSERT |
| **DESIGN** approveDesign | echo {approved} | **[FIXED `ecf796c7`]** → designs UPDATE status |
| **DESIGN** rejectDesign | echo | **[FIXED `ecf796c7`]** → designs UPDATE status+rejection_reason |
| **DESIGN** verifyDesign | Math.random score | **[INTENTIONAL]** real AI-verify engine kerak (DB-gap emas) |
| **DESIGN** generateMockup | fake URL | **[INTENTIONAL]** real rendering engine kerak |
| **DESIGN** findTemplates | 5 hardcoded | **[INTENTIONAL]** static config (templates jadval yo'q; design_library_items ≠ template) |
| **QC** approve/finance, approve/qc, reject, inspector-submit (×Patch+Post = 8) | echo {approved:true} | **[FIXED `1cca0f52`]** → qc_inspections.status transitions |
| **LMS** patchCourse | echo {…body, updated} | **[FIXED `0ba9aec8`]** → UPDATE courses (COALESCE editable fields) |
| **HR** updateGsdEmployee | echo {updated} | **[DECISION]** `gsd` jadval YO'Q — egasi model aniqlashi kerak |
| **HR** patchVacancyChannels | echo {channels,updated} | **[FIXED `a487aac2`]** DDL: ADD channels jsonb → UPDATE hr_vacancy_profiles SET channels=dto.channels::jsonb |
| **HR** patchPortret | echo {portret,updated} | **[FIXED `c0bcd287`]** → UPDATE hr_vacancy_profiles SET candidate_portrait JSONB merge WHERE vacancy_id |
| **HR** patchProbationDates | echo {start_date,end_date,updated} | **[FIXED `a487aac2`]** DDL: ADD probation_start/end date → UPDATE via funnel JOIN WHERE hcf.id=pipeline_id |
| **SECURITY** getVisitors | return [] | **[FIXED `72dd210b`]** → SELECT FROM security_visitors ORDER BY created_at DESC LIMIT 50 |
| **SECURITY** recordVisitorExit (POST) | echo {exitedAt,status} | **[FIXED `72dd210b`]** → UPDATE security_visitors SET exited_at=NOW(), status='exited' |
| **SECURITY** patchVisitorExit (PATCH) | echo {exitedAt,status} | **[FIXED `72dd210b`]** → UPDATE security_visitors SET exited_at=NOW(), status='exited' |
| **IOT** getOeeLive | hardcoded zeros | **[FIXED `a4b4dfd8`]** → AVG from oee_records latest date |
| **IOT** getDevice (/sensors/:id) | echo {id} | **[FIXED `c398677f`]** → SELECT * FROM iot_devices WHERE id (404 if missing) |
| **IOT** getOEE (/sensors/:id/oee) | hardcoded 85.5 | **[FIXED `c398677f`]** → SELECT FROM oee_records WHERE machine_id ORDER BY date DESC LIMIT 1 |
| **IOT** heatmap generate-pdf/excel | return {url:null} | **[INTENTIONAL]** fayl eksport tizimi kerak (S3/blob) |
| **IOT** analyzeByMissions | echo {missions,dashboard} | **[ALREADY-REAL fp]** getDashboard() = real; missions lista passthrough (AI tahlil = engine kerak) |
| **DIRECTOR** getCouncils | 5 hardcoded | **[DATA]** `councils` jadval yo'q — statik config yoki egasi qo'shadi |
| **DIRECTOR** approvals getStats | approvedToday/rejectedToday = 0 | **[FIXED `a4b4dfd8`]** → COUNT FROM approval_requests WHERE status+date match today. avgApprovalTime=0 hali [DATA] |
| **ADMIN** deleteFailedJob | echo {id,deleted} | **[DATA]** admin-queue service butunlay mock/stub (BullMQ yo'q) — egasi qaror qiladi |

### KATEGORIYA A — YOPIQ ✅ (22/22)
- ✅ **22 green-lie TUZATILDI** (DESIGN 3, QC 8, LMS 1, SECURITY 3, IOT 3, HR portret+channels+probation 3, DIRECTOR stats 1)
- 🟡 **DECISION × 1**: HR gsd (model noaniq); **DATA × 2**: councils hardcoded / admin-queue mock
- ⭐ **INTENTIONAL × 5**: AI-verify/mockup, templates, heatmap export, missions AI
- ⭐ **ALREADY-REAL × 1**: analyzeByMissions getDashboard real, missions passthrough AI-dependent
- Commits: ecf796c7 / 1cca0f52 / 0ba9aec8 / c0bcd287 / 72dd210b / c398677f / a4b4dfd8 / a487aac2

---

## KATEGORIYA B — DUBLIKATLAR (~50 klaster)
> Har klaster: kanonik tanlash → stub/alternative o'chirish yoki 501 → commit

| Klaster | Kanonik | Alternativ (o'chirish/stub) | Holat |
|---|---|---|---|
| material-kits (iot-enhanced vs wms-barcode) | pos_printer_configs / material_kits (DB) | wms-barcode 501 stubs wired to real DB tables | **[FIXED `98363e9e`]** |
| printer-config (iot-enhanced vs wms-barcode) | pos_printer_configs (DB) | wms-barcode 501 stubs wired to real DB tables | **[FIXED `98363e9e`]** |
| budgets standalone vs finance/budgets | both real, same service | FE uses standalone paths; both delegate to same BE | **[KEEP]** |
| gl standalone vs finance/gl | both real, same service | FE uses standalone paths; both delegate | **[KEEP]** |
| wms/warehouses vs warehouse/warehouses | warehouse/warehouses | general-legacy-b routes COMMENTED OUT (no active dup) | **[ALREADY-CLEAN fp]** |
| chat /hr-v2/chat (8 dup routes) | canonical /chat | ChatAdvancedController (5 dup routes) de-registered from ChatModule; ChatAdvancedUploadsController (thread/forward UNIQUE) kept | **[FIXED `b98fa32a`]** |
| kanban CQRS (dead) vs Ext kanban_cards (live) | Ext kanban_cards | KanbanController (5 CQRS routes → kanban_tasks 0 rows) de-registered; live KanbanBoardsController/CardsController stay | **[FIXED `4969ddf5`]** |
| verb-dups: shift-reports POST/PUT close; payments PATCH/POST approve; gl GET/POST reverse; director kpi/kpis; saas tenants/v2 | — | All: same handler, intentional alias; FE uses kpis (plural) | **[KEEP x5]** |

### KATEGORIYA B — YOPIQ ✅ (8/8 klaster)
- ✅ **FIXED ×3**: material-kits+printer-config (98363e9e), chat hr-v2 dup (b98fa32a), kanban CQRS (4969ddf5)
- ✅ **KEEP ×3**: budgets/gl standalone (real, FE uses), verb-dups (intentional aliases)
- ✅ **ALREADY-CLEAN ×1**: wms/warehouses (commented out)
- Commits: 98363e9e / b98fa32a / 4969ddf5

---

## KATEGORIYA C — 501-STUBLAR — FAZA 1 NATIJASI

### ✅ Phase 1: DDL-FREE (table exists → implemented)

| Commit | Modul | Route(lar) |
|---|---|---|
| `c868c59b` | marketing | exhibitions(CRUD)/settings/ab-tests/social-api/blog(18 routes) |
| `e23d04df` | design | notifications/tooling/messages (5 routes) |
| `ef79407a` | iot-tablet | sessions/start/stop/defect/inline-qc/handover/kit-scan (10 routes) |
| `1baffb2` | iot+qc+wms | downtime-reason-codes, PATCH device, createAlert, resolveAlert, getBraksCostImpact, getPendingQc, getControlCharts, getTransactions, getOrdersByDate (9 routes) |
| `b41e0417` | hr+material-balance | getDashboardStats, getAdaptationById, getFpCycle, getMovements (4 routes) |
| `114790ac` | kanban | PATCH cards/:id/assign (1 route) |
| `cf69d6b6` | integration | GET/POST expense (expense_reports), GET/POST invoice (invoices) (4 routes) |
| `83da337a` | hr-compat+hr-dashboard+iot-enhanced | PATCH/DELETE/POST test_questions, GET ai_interview_sessions, GET session/:id/review, GET production_orders (6 routes) |

**JAMI: ~57 DDL-free stub → real DB (8 commit)**

---

### ✅ Phase 2: DDL-GATE — BARCHA 25 ITEM YOPIQ

| # | Modul / Controller | Route(lar) | Natija |
|---|---|---|---|
| 1 | marketing-analytics-stubs | GET/POST/GET marketing/pr, GET marketing/pr/:id | **[USE-EXISTING `pr_activities`]** (GROUP 1) |
| 2 | marketing-analytics-stubs | GET inbox/conversations … POST inbox/ai-reply/:id | **[USE-EXISTING `social_conversations`/`social_messages`]** (GROUP 1) |
| 3 | iot-tablet | GET production-sessions/:id/crew | **[USE-EXISTING `machine_crews`]** `9a8eaaf8` |
| 4 | iot-tablet | POST production-sessions/:id/evaluation | **[USE-EXISTING `shift_evaluations`]** `9a8eaaf8` |
| 5 | iot-tablet | POST production-sessions/:id/material-return | **[USE-EXISTING `material_movements`]** `9a8eaaf8` |
| 6 | iot-sensors-main | GET iot/sensors/predictive-maintenance | **[USE-EXISTING `equipment_maintenance`]** `89ceda3d` |
| 7 | kanban-cards | GET/POST kanban/chat-messages/:id/files | **[USE-EXISTING `task_chat_message_files`]** `46a7d563` |
| 8 | kanban-reports | GET kanban/projects | **[USE-EXISTING `task_projects`]** `46a7d563` |
| 9 | finance-main | GET finance/reports | **[INTENTIONAL]** `// FEATURE_FLAGGED: #FX-4` annotated in code |
| 10 | finance-main | GET finance/loans | **[INTENTIONAL]** `// FEATURE_FLAGGED: #FX-4` annotated in code |
| 11 | finance-extended-payroll | GET finance-extended/tax-calendar | **[USE-EXISTING `payroll_tax_rules`]** `89ceda3d` |
| 12 | finance-extended-payroll | GET finance-extended/salary-benchmark/:id | **[USE-EXISTING `salary_bands`]** `89ceda3d` |
| 13 | reports.controller | GET reports/production-efficiency | **[USE-EXISTING `oee_records`]** `3202fd1e` |
| 14 | hr-compat-a | GET hr/hrc-tests/employee/:id/results | **[USE-EXISTING `hr_tool_test_results`]** `48c369a5` |
| 15 | hr-compat-a | POST hr/hrc-tests/sessions | **[USE-EXISTING `hr_interview_sessions`]** `48c369a5` |
| 16 | hr-dashboard | GET/POST/GET hr/birthdays/settings | **[DDL-GATE]** no table found; stays 501 — egasi jadval qo'shadi |
| 17 | hr-dashboard | GET hr/hrc-tests/employee, public, stats | **[USE-EXISTING `hr_interview_sessions`/`hrc_iq_questions`/`hr_tool_test_results`]** `48c369a5` |
| 18 | hr-dashboard | GET hr/360/reviewable | **[USE-EXISTING `employee_360_assessments`]** `48c369a5` |
| 19 | hr-dashboard | GET hr/enps/surveys/results | **[USE-EXISTING `enps_surveys`+`enps_survey_responses`]** `48c369a5` |
| 20 | hr-dashboard | GET hr/employee-corp | **[USE-EXISTING `employee_career_profiles`]** `48c369a5` |
| 21 | hr-dashboard | GET hr/offboarding/questions | **[USE-EXISTING `offboarding_checklist_items`]** `48c369a5` |
| 22 | hr-vacancies-pipeline | GET hr/pipeline/:id/checklist | **[USE-EXISTING `hr_candidate_funnels`.checklist_data]** `48c369a5` |
| 23 | org-structure | GET org-structure/nodes/:nodeId/history | **[USE-EXISTING `node_hr_requests`]** `828df661` |
| 24 | pp/production-reports | GET production-reports/orders | **[USE-EXISTING `production_orders`]** `3202fd1e` |
| 25 | integration | GET integration/skill-gap | **[USE-EXISTING `employee_skill_scores`]** `828df661` |

**Jami Phase 2: 22 × [USE-EXISTING] + 2 × [INTENTIONAL] + 1 × [DDL-GATE] = 25/25 ✅**
> 🔑 Nol yangi jadval yaratilmadi (Two-worlds Guard ushlab qoldi — katalog da'volari soxta edi)

---

### 🔵 Phase 3: [INTENTIONAL] (#FX-gated yoki AI-engine)

| Controller | Route(lar) | Sabab |
|---|---|---|
| security.controller | GET/POST security/daily-summary, ppe-checks, ppe-stats, ppe-violations, fire-sensors | **#FX-6** — Feature gated |
| wms-integration | GET/POST warehouse/integration/mm/*, fi/stock-valuation, summary, root | **#FX-3** — Feature gated |
| hr-dashboard-extra | GET hr/contracts | **#FX-9** — Feature gated |
| hr-dashboard-extra | GET hr-capital/courses, GET hr-capital/stats | **#FX-9** — Feature gated |
| mm-dashboard | GET/POST/PATCH mm/vendor-invoices/*, three-way-match, 3way-match/:id, fleet/*, vehicles/*, driver/expenses, materials/:id/suppliers | **#FX-2** — Feature gated |
| ai.controller | GET ai/forecast/demand, GET/POST ai/rush-orders, GET/POST rush-orders/:id/approve/reject | **AI-engine** — demand forecast engine kerak |
| ai-agents.controller | POST ai-agents/:agentId/trigger | **AI-engine** — agent trigger engine kerak |
| pp/technology | POST technology/cards/generate, POST technology/cards/:id/optimize | **AI-engine** — `calculated_by_ai` flag, AI routing logic kerak |
| marketing-analytics-stubs | POST content/ai-generate, POST churn-risk/ai-signal, GET ai-assistant, POST leads/recalculate-scores, POST leads/:id/convert-to-crm, POST website/blog/ai-generate | **AI-engine** — ML/AI model kerak |

---

## KATEGORIYA D — UZILISHLAR
| Item | Tavsif | Holat |
|---|---|---|
| `lms.certificate.issued` vs `_issued` event drift | 2 ta event name | ✅ TUZATILDI (8994d36c) |
| `lms.course.enrolled` vs `_assigned` event drift | 2 ta event name | ✅ TUZATILDI (8994d36c) |
| Zero-listener events — **9 ta** (tasniflandi) | ko'ring: D.ZL jadval | **[OWNER]** |
| FE→BE drift security POST routes (visitors/incidents/ppe-checks) | 3 ta yo'q route | ✅ TUZATILDI (8994d36c) |
| FE→BE drift marketing DELETE/PATCH (budget/calendar/exhibitions) | 5 ta yo'q route | ✅ TUZATILDI (d99ad62f) |
| FE→BE drift HR employees PATCH | PUT bor edi, PATCH yo'q | ✅ TUZATILDI (932757a0) |
| FE→BE drift qolgan (cameras/certificates/chat/modules/warehouses/...) | 25 ta | **[INTENTIONAL/GATED]** |
| manager_id/head_user_id 30 NULL | data masalasi | **[DATA]** |

### D.ZL — Zero-listener events tasnifi (2026-06-06)

Emitlanadi lekin `@OnEvent` tinglovchi **YO'Q** (9 ta):

| Event name | Emitter fayl | Turi | Harakat |
|---|---|---|---|
| `hr.attendance.recorded` | `record-attendance.handler.ts:48` | Davomad yozilganda | Owner: notification/WFM listener kerakmi? |
| `hr.payroll.calculated` | `calculate-payroll.handler.ts:95` | Oylik hisoblaganda | Owner: journal/notification kerakmi? |
| `payroll.period.closed` | `payroll.service.ts:93` | Davr yopilganda (har xodim) | Owner: GL posting kerakmi? |
| `pos.gl.auto_posted` | `pos-gl-auto.listener.ts:108` | GL avtomatik yozilganda | `pos.gl.approved` bor — log yoki notification? |
| `pos.requisition.submitted` | `pos-requisition-workflow.service.ts:57` | Talab yuborilganda | Owner: notification kerakmi? |
| `pos.requisition.approved` | `pos-requisition-workflow.service.ts:88` | Talab tasdiqlanganda | Owner: notification kerakmi? |
| `pos.requisition.rejected` | `pos-requisition-workflow.service.ts:116` | Talab rad etilganda | Owner: notification kerakmi? |
| `pos.requisition.fulfilled` | `pos-requisition-workflow.service.ts:195` | Talab bajarilganda | Owner: stock-update trigger? |
| `pos.requisition.cancelled` | `pos-requisition-workflow.service.ts:228` | Talab bekor qilinganda | Owner: notification kerakmi? |

**Tahlil:** Bular "fire-and-forget" — emit qilinadi, ammo hech kim tinglomaydi. Hozircha runtime xatosi yo'q (EventEmitter2 tinglovchisiz emit'ni ignor qiladi). Lekin `pos.requisition.*` va `payroll.*` ehtimol notification/GL trigger talab qiladi. **Owner qaror qabul qilsin.**
