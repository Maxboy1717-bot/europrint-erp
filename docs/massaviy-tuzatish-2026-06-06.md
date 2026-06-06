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
| **QC** approve/finance, approve/qc, reject, inspector-submit (×Patch+Post = 8) | echo {approved:true} | **[FIXED `1cca0f52`]** → qc_inspections.status transitions (finance_approved/qc_approved/rejected/inspector_submitted) |
| **LMS** patchCourse | echo {…body, updated} | **[FIXED `0ba9aec8`]** → UPDATE courses (COALESCE editable fields) |
| **HR** updateGsdEmployee | echo {updated} | **[DECISION]** `gsd` jadval YO'Q, HrGsdService'da updateGsdEmployee yo'q — "gsd employee" modeli noaniq (employees? alohida?) — egasi aniqlashi kerak |
| **HR** vacancies channels/portret, probation-dates | (tekshirilmadi — keyingi turn) | **[TODO-verify]** |
| **SECURITY** getVisitors/visitor-exit | (tekshirilmadi) | **[TODO-verify]** |
| **IOT** oee/live, getDevice, getOEE, heatmap-download, camera analyze | (tekshirilmadi) | **[TODO-verify]** — ko'pi AI/hardcoded |
| **DIRECTOR/COORD** councils/baskets/stats | (tekshirilmadi) | **[TODO-verify]** |
| **ADMIN** queue delete | (tekshirilmadi) | **[TODO-verify]** |

### KATEGORIYA A — oraliq holat (2026-06-06)
- ✅ **12 green-lie TUZATILDI** (DESIGN 3, QC 8, LMS 1) — har biri DB-proof + commit.
- ⭐ verify-don't-trust: DESIGN "no table" katalog xato edi (`designs` bor).
- 🟡 HR gsd = DECISION (model noaniq). DESIGN verify/mockup = INTENTIONAL (AI engine).
- ⏳ Qolgan A (HR vacancies, SECURITY, IOT, DIRECTOR, ADMIN) + B/C/D = keyingi turn(lar). 150+ item — bir turn'ga sig'maydi.
