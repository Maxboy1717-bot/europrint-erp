# ORG / KARTALAR — PHASE 0 RE-AUDIT (read-only) — 2026-06-08

> Modul #02 (T1 poydevor). Manba: `MUSLIMBEK-PROMT-02-ORG-BUILD` + `decisions/01-org-kartalar.md` (EP-ORG-001..143).
> Metod: jonli DB (`_audit/q.cjs`) + kod o'qish (BE/FE). Hech narsa o'zgartirilmadi — faqat shu hisobot.
> ⛔ Vizyon "card-centric" (karta birlamchi). Tizim ~70% qurilgan — **qayta yozish YO'Q, ulash/tuzatish**.

---

## 1. NIMA MAVJUD (jonli tasdiqlangan)

### A) DB — org jadvallari (jonli sanoq)
| Jadval | Qator | Roli |
|---|---|---|
| `org_departments` | **142** | ⭐ Org DARAXT (node/unit). Ustunlar: id, name(_ru), tskp(_ru), parent_id, hierarchy_level, node_type, otdeleniye_id, otdeleniye_code, head_user_id, color, icon, is_active |
| `org_functions` | **97** | Lavozim/funksiya (node-scoped). Ustunlar: department_id(→org_departments), position_name(_ru), tskp+tskp_target+tskp_measurement_unit, function_description |
| `positions` | **96** | Lavozim master-data. Ustunlar: code, name_uz/ru, department_id, level, **rbac_tier**, is_management, **min_salary/max_salary**, headcount, **ckp**, **organization_number**, **ai_exam_enabled**, **statistics_type**, vep(_ru), manager_id |
| `departments` | 18 | Klassik dept (eski) |
| `employees` | 30 | Xodimlar |
| `employee_org_departments` | 30 | Xodim↔org-node bog'lash |
| `node_hr_requests` | 1 | Node HR talabnomalari |
| `org_node_portret` | 0 | Portret (JSONB) — struktura bor, data yo'q |
| `position_folders` | 0 | Karta papkasi (position_id + node_id + lms_course_id) — struktura bor, data yo'q |
| `position_folder_content` | 0 | Papka kontenti (org_function_id, content_type, is_mandatory) |
| `position_permissions` | 0 | RBAC kartadan (module_code, access_level) — EP-ORG-023 |
| `position_required_courses` | 0 | Darslik→karta (course_id, blocks_mes_access) — EP-ORG-027/028 |
| `position_skill_requirements` | 0 | Ko'nikma talablari |
| `vacancies` / `hr_vacancy_profiles` | 0 / 0 | Vakansiya — struktura bor, data yo'q |
| `org_chart_settings` / `org_chart_snapshots` | 0 / 0 | Chart config/snapshot |

**Yordamchi (mavjud):** `certificates`, `skills`, `employee_skills`, `shift_schedules`, `lms_courses`/`courses`/`lms_exams`/`lms_questions`/`ai_exam_attempts`/`lms_enrollments`/`test_questions`.

### B) BE — `modules/org-structure/` (REAL, stub emas — 17 db/repo chaqiruv)
24 endpoint (`@Controller('org-structure')`): `hierarchy` · `stats` · `nodes/flat` · `nodes/:id` (GET/POST/PATCH/DELETE) · `nodes/:id/move` · `users/:userId/node` · `export/excel`+`pdf` · `nodes/:id/folder` (GET/POST/DELETE) · `employees/:userId/folder` · `nodes/:nodeId/history` · `nodes/:nodeId/hr-requests` (GET/POST) · `nodes/:nodeId/portret` (GET/POST) · `nodes/:nodeId/approval-chain` · `direct-manager` · `telegram-group`.
Service metodlari real: getHierarchy/getStats/create/update/remove/move/assignUserToNode/getApprovalChain/getDirectManager/getTelegramGroupForNode. + `core/positions/positions.service.ts`, `admin/position-permissions/`, `node-portret.service.ts`, `position-folder.service.ts`.

### C) FE — org sahifalar (mavjud)
`pages/OrgStructureHierarchy.tsx` (asosiy org-chart) · `components/hr/orgnode/` (EditDialog, **FolderTab**, **HistoryTab**, MoveDialog, useOrgNodeData) · `components/hr/org/AddNodeDialog.tsx` · `pages/OrgNodePortretTab.tsx` (**Portret tab**) · `components/hr/portret/HRRequestDialog.tsx` · `hooks/usePositionPermissions.ts` (RBAC) · `OrgStructureSection.tsx` (employee dialog).

---

## 2. ⭐ KATTA TOPILMA — 3 ta arxitektura masalasi (owner qaror)

### MASALA-1 — "Karta" qaysi jadval? (eng muhim, EP-ORG-001 + EP-ORG-040)
Vizyon: karta = birlamchi master-data (`cards` jadval). **Jonli holat: `cards` jadval YO'Q.** "Karta" hozir 3 ta jadvalga tarqalgan:
- `org_departments` (142) = daraxt/unit (node)
- `positions` (96) ╳ `org_functions` (97) = **IKKI lavozim-olam** (ikkalasida ham ЦКП bor) → bu aynan EP-ORG-040 taqiqlagan "ikki-olam".

`positions`: salary-band + rbac_tier + ckp + ai_exam_enabled + statistics_type (boy). `org_functions`: department_id(daraxtga ulangan) + tskp_target + tskp_measurement_unit. Satellite jadvallar (`position_folders`/`position_permissions`/`position_required_courses`) HAR IKKISIGA (position_id + org_function_id) bog'lanadi.

**Tavsiyam:** Yangi `cards` jadval YARATMAslik (3-olam xavfi). `positions` = kanonik KARTA qilinadi (eng boy: salary+rbac+exam+ckp), unga yetishmagan karta-maydonlari qo'shiladi (razryad_id, status, salary_type, otdeleniye, deleted_at), `org_functions` ning daraxt-bog'lanishi + ЦКП-target unga ko'chiriladi/bog'lanadi, `org_departments` daraxti saqlanadi. **Lekin bu EP-ORG-001 "cards jadval" so'zidan farq qiladi** → owner tasdig'i shart.

### MASALA-2 — `razryad_levels` master-data YO'Q (EP-ORG-009/043, Phase 2)
Sozlanadigan razryad jadvali yo'q. `positions.level` (int) bor, lekin master-data emas. → Yangi jadval kerak (Q-35).

### MASALA-3 — ЦКП o'lchov (EP-ORG-049, Phase 3)
`org_functions.tskp_measurement_unit` ustuni MAVJUD lekin BO'SH (0 ta qiymat). SON/FOIZ/VAQT enum sifatida ishlatilmagan. → reuse + to'ldirish.

---

## 3. GAP JADVALI — Build prompt Phase 1-7 ↔ mavjud holat

| Phase / Feature (vizyon) | Mavjud? | Gap | Effort |
|---|---|---|---|
| **P1** Karta = master-data + atomic CRUD | 🟡 QISMAN — `positions`(96) card-like, CRUD `org-structure` node bor | Kanonik karta tanlash (Masala-1); status(5-holat), salary_type, deleted_at, otdeleniye yo'q | L (qaror+DDL) |
| **P1** Org-unit daraxt Bo'lim→Sex→Uskuna→Ishchi + 7-otdeleniye | ✅ MAVJUD — `org_departments` 142 node, otdeleniye_id/code, node_type, hierarchy_level | Unit'ga camera-zone + Telegram-group-ID maydoni (telegram endpoint bor, maydon?) | S |
| **P1** Org-change → ERP roles/POS-warehouse avto-kaskad | 🟡 QISMAN — `department_warehouse_map` bor (0), position_permissions bor | Kaskad event'lar (EP-ORG-041) ulanishi tekshirilmagan | M |
| **P2** Razryad master-data + kartaga bog'lash | ❌ YO'Q | `razryad_levels` jadval + karta FK (Masala-2) | M (DDL) |
| **P3** GSD/ЦКП (SON/FOIZ/VAQT) + norm | 🟡 QISMAN — `positions.ckp`, `org_functions.tskp/target/unit` (bo'sh) | measurement enum to'ldirish + per-employee tuzatish (EP-ORG-051) | M |
| **P3** Karta papkasi 6/12-bo'lim + to'liqlik% | 🟡 QISMAN — `position_folders`+`position_folder_content` struktura bor (0 data) | 6/12-section model (vazifa/javobgarlik/GSD/reglament/jarayon/ta'lim) + completeness% (EP-ORG-007/095) | M |
| **P4** Imtihon + sertifikat + per-card AI exam | 🟡 QISMAN — `lms_exams`/`lms_questions`/`ai_exam_attempts`/`certificates` bor; `positions.ai_exam_enabled` bor | Karta-turi+razryad bo'yicha savol-bank, configurable threshold/retake (EP-ORG-053/055/056) | M |
| **P5** Karta 8-tab UI | 🟡 QISMAN — FE node-tablar: Folder/History/Portret/Edit/Move (~5) | 8-tab (Asosiy·Xodimlar·Farzandlar·Vakant·Papka·Statistika·Portret·Tarix) — card-centric (EP-ORG) | M |
| **P6** Xodim↔karta many-to-many + oylik→profil agregatsiya | 🟡 QISMAN — `employee_org_departments`(30) node-link | Many-to-many card-link + oylik agregatsiya (EP-ORG-142, multi-stavka EP-ORG-066) | L (formula qaror) |
| **P7** Vakansiya (aging/SLA) + i.o. + glossary + history | 🟡 QISMAN — `vacancies`/`hr_vacancy_profiles`(0), `history` endpoint bor | aging/priority/SLA (EP-ORG-072-074), i.o. dated (EP-ORG-060-062), staleness reminder (EP-ORG-137) | M |

**Umumiy:** Hech narsa noldan emas — daraxt(142), node-CRUD, papka/portret/RBAC/darslik satellite jadvallari, LMS/exam infra HAMMASI bor. Asosiy ish = **kanonik karta tanlash + ikki-olam birlashtirish + yetishmagan maydon/jadval (razryad) + card-centric UI**.

---

## 4. OWNER QAROR KUTILADI (qurishdan OLDIN)

1. **MASALA-1 (eng muhim):** Kanonik karta = `positions`-ni KARTA qilamizmi (tavsiyam, 3-olam yo'q), yoki yangi `cards` jadval (vizyon so'zi)? `org_functions` (97) bilan nima qilamiz — birlashtiramizmi `positions`ga?
2. **MASALA-2:** `razryad_levels` yangi jadval — ruxsat (Q-35)? Ustunlar: nom+raqam, min-talab, oylik-band(dan-gacha), imtihon-turi, sertifikat-shart, tavsif (EP-ORG-043).
3. **MASALA-3:** ЦКП o'lchov — `org_functions.tskp_measurement_unit`ni SON/FOIZ/VAQT enum qilib to'ldiramizmi (reuse), yoki `positions.ckp`ga ko'chiramizmi?
4. **Phase tartibi:** Build prompt P1→P7 tartibida boramizmi? P1 (karta data-model + CRUD) birinchi.

---

## 5. KEYINGI QADAM
⛔ **STOP — hech narsa qurilmadi.** Owner shu hisobotni ko'rib, MASALA-1/2/3 bo'yicha qaror beradi + "davom" deydi → keyin **PHASE 1** (karta data-model + atomic CRUD) boshlanadi (permission-gate bilan).

*Tayyorlandi: 2026-06-08 · Bajaruvchi (PHASE 0 read-only) · git status'da faqat shu fayl ko'rinishi kerak.*
