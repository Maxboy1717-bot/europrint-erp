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
| **HR** patchVacancyChannels | echo {channels,updated} | **[DDL-GATE]** `vacancy_channels` jadval yo'q; `vacancies`+`hr_vacancy_profiles`da channels ustun yo'q |
| **HR** patchPortret | echo {portret,updated} | **[FIXED `c0bcd287`]** → UPDATE hr_vacancy_profiles SET candidate_portrait JSONB merge WHERE vacancy_id |
| **HR** patchProbationDates | echo {start_date,end_date,updated} | **[DDL-GATE]** probation_start/end ustun yo'q (hr_vacancy_profiles.probation_days=int faqat) |
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

### KATEGORIYA A — YAKUNIY holat ✅
- ✅ **20 green-lie TUZATILDI** (DESIGN 3, QC 8, LMS 1, SECURITY 3, IOT 3, HR portret 1, DIRECTOR stats 1)
- 🔐 **DDL-GATE × 2**: HR vacancies channels + probation-dates (egasi ruxsati kerak — ustun qo'shish)
- 🟡 **DECISION × 1**: HR gsd (model noaniq); **DATA × 2**: councils hardcoded / admin-queue mock
- ⭐ **INTENTIONAL × 5**: AI-verify/mockup, templates, heatmap export, missions AI
- ⭐ **ALREADY-REAL × 1**: analyzeByMissions getDashboard real, missions passthrough AI-dependent
- verify-don't-trust: DESIGN "no table" = false-positive (designs bor); camera-analyze = real service bor

---

## KATEGORIYA B — DUBLIKATLAR (~50 klaster)
> Har klaster: kanonik tanlash → stub/alternative o'chirish yoki 501 → commit

| Klaster | Kanonik | Alternativ (o'chirish/stub) | Holat |
|---|---|---|---|
| material-kits (iot-enhanced vs wms-barcode) | iot-enhanced (real) | wms-barcode 501 stubs → retire | **[TODO]** |
| printer-config (iot-enhanced vs wms-barcode) | iot-enhanced (real) | wms-barcode 501 stubs → retire | **[TODO]** |
| budgets standalone vs finance/budgets | finance/budgets (real) | standalone → redirect/501 | **[TODO]** |
| gl standalone vs finance/gl | finance/gl (real) | standalone → redirect/501 | **[TODO]** |
| wms/warehouses vs warehouse/warehouses | warehouse/warehouses (real) | wms → proxy/501 | **[TODO]** |
| chat /hr-v2/chat (8 dup routes) | canonical chat | hr-v2/chat parallel → 501 | **[TODO]** |
| kanban CQRS (dead) vs Ext kanban_cards (live) | Ext kanban_cards | CQRS dead code → remove | **[TODO]** |
| verb-dups (production-shift-reports, finance-payments, etc.) | — | — | **[TODO]** |

---

## KATEGORIYA C — 501-STUBLAR (95 ta)
> table-exists → implement; needs-table → DDL-GATE; #FX → leave

| Modul | Endpoint | Holat |
|---|---|---|
| marketing | exhibitions/pr/inbox/settings/ab-tests | **[TODO]** |
| iot-tablet | production-sessions: start/stop/defect/inline-qc/handover/material-kit | **[TODO]** |
| design | notifications/tooling/messages | **[TODO]** |
| finance | reports/loans/tax-calendar | **[TODO]** |
| qc | control-charts | **[TODO]** |
| hr | contracts/courses (lms) | **[TODO]** |

---

## KATEGORIYA D — UZILISHLAR
| Item | Tavsif | Holat |
|---|---|---|
| `lms.certificate.issued` vs `_issued` event drift | 2 ta event name | **[TODO]** |
| `lms.course.enrolled` vs `_assigned` event drift | 2 ta event name | **[TODO]** |
| 13+ zero-listener events | classify each | **[TODO]** |
| FE→BE drift: security/crm-ai-extended/employee-files | FE URL !== BE route | **[TODO]** |
| manager_id/head_user_id 30 NULL | data masalasi | **[DATA]** |
