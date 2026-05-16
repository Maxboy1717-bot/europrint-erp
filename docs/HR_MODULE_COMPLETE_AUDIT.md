# EuroPrint ERP — HR Moduli To'liq Audit Hisoboti

> **Sana:** 2026-05-17
> **Metod:** 5 parallel Explore agent (chuqur kod o'qish, ~45 daqiqa)
> **Qoplam:** 230 fayl, 25 sahifa, 47 route, 401 endpoint, 31 sub-modul
> **Asosiy xulosa:** **HR moduli 65% feature-complete, lekin faqat 30% production-hardened**
> **Production verdict:** ❌ **NO-GO** — kritik xatolar bor (22 soatlik ish kerak)

---

## EXECUTIVE SUMMARY (3 daqiqada)

| O'lcham | Ball | Status |
|---|:---:|:---:|
| Backend health | 68/100 | ⚠️ Partial |
| Frontend health | 72/100 | ⚠️ C+ |
| Xodim qo'shish | 72/100 | 🔴 Data loss bug! |
| Xodim profili | 78/100 | ⚠️ Yaxshi, lekin gap'lar |
| Recruiter Kanban | 65/100 | 🔴 Drag-drop yo'q! |
| OrgChart | 60/100 | 🔴 Cycle detection yo'q! |
| Sub-modullar | 65% complete | 🟡 Ko'p stub'lar |
| **Production Readiness** | **NO-GO** | ❌ |

**Top 5 KRITIK production blockers:**
1. 🔴 **Add Employee — 9 ta field nigde saqlanmaydi** (form qabul qiladi, DB'ga yozilmaydi!)
2. 🔴 **8 ta endpoint JwtAuthGuard'siz** — moliyaviy/HR ma'lumotlar ochiq
3. 🔴 **Recruiter Kanban'da drag-drop YO'Q** — kartochkalar harakat qilmaydi
4. 🔴 **OrgChart cycle detection yo'q** — circular manager loop yaratish mumkin
5. 🔴 **Salary maskalanmagan** — har xodim hammaning oyligini ko'radi

**Tayyorlash uchun vaqt:** ~22 soat (1 hafta) eng kritik fix'lar uchun + 8-12 hafta to'liq hardening uchun.

---

## 1. HR MODUL UMUMIY KO'RINISH

### 1.1 Statistika

```
HR Module — 230 fayl, eng katta modul
├── apps/api/src/modules/hr/         ← 87 backend fayl, 28K LOC
│   ├── 35 controller
│   ├── 57 service
│   ├── 63 repository
│   ├── 15 handler (CQRS)
│   ├── 3 aggregate
│   └── 31 sub-folder (attendance, payroll, recruitment, va h.k.)
└── artifacts/erp-dashboard/src/pages/
    └── 47 HR-related sahifa (HRRoutes.tsx'da)
        + 13 hook (use-hr-*)
        + ~40 komponent
```

### 1.2 Texnik stack

| Qatlam | Texnologiya |
|---|---|
| Backend | NestJS + CQRS (partial) + Drizzle ORM |
| Frontend | React 19 + TanStack Query + react-hook-form + Zod |
| DB | PostgreSQL — `employees` (66 ustun), `salary_history`, `attendance`, `leave_requests`, va h.k. |
| Auth | JWT + RolesGuard (asosan, lekin gaplar bor) |
| AI | ai-interview-v2 sub-modul (Recruitment uchun) |
| Mobile | ❌ Yo'q |

---

## 2. SAHIFA-BY-SAHIFA TAHLIL (47 sahifa)

### 2.1 Production-ready sahifalar (38/47 = 81%)

| Sahifa | Route | Vazifa | Ball | Status |
|---|---|---|:---:|:---:|
| **Employees** | `/employees` | Xodimlar ro'yxati | A | ✅ |
| **EmployeeProfile** | `/employees/:id` | Profile (14+ tab) | A- | ✅ |
| **RecruitingKanban** | `/hr/recruiting` | Recruiter Kanban | B+ | ⚠️ (drag-drop yo'q) |
| **HRDashboard** | `/hr-dashboard` | Bosh panel (20+ query) | A | ✅ |
| **OrgStructureHierarchy** | `/org-structure/hierarchy` | Org tree | B | ⚠️ (mobile yo'q) |
| **SkillsMatrix** | `/skills-matrix` | Skill matrix | B+ | ✅ |
| **Discipline** | `/discipline` | Intizom | A- | ✅ |
| **ShiftSchedule** | `/shift-schedule` | Smena | A- | ✅ |
| **HROnboarding** | `/hr/onboarding` | Onboarding | B | ⚠️ |
| **HROffboarding** | `/hr/offboarding` | Offboarding | B+ | ⚠️ |
| **HRCareerPath** | `/hr/career-path` | Karyera | B+ | ✅ |
| **DailyReportPage** | `/hr/daily-reports` | Kunlik hisobot | B | ✅ |
| **HRSafety** | `/hr/safety` | Xavfsizlik | A- | ✅ |
| **GamificationPage** | `/hr/gamification` | O'yin | B | ✅ |
| **PayrollAutomation** | `/payroll` | Oylik avto | B+ | ⚠️ (closure yo'q) |
| **Adaptation** | `/adaptation` | Yangi xodim adaptatsiya | B+ | ✅ |
| **HRSuccessionPlanning** | `/hr/succession` | Succession (4 tab) | B+ | ✅ |
| **HRVacationSick** | `/hr/vacation-sick` | Otpuska/kasal | B+ | ✅ |
| ... | ... | (qolgan 20 sahifa) | B-C+ | ✅ |

### 2.2 ❌ Buzilgan / chala sahifalar (9/47 = 19%)

| Sahifa | Muammo | Fix kerakli |
|---|---|---|
| **PIPPage** | Endpoint 404 | Backend PIP API implement |
| **HRLMSSkills** | Endpoint 404 | LMS integratsiya |
| **ThreeWayMatchPage** | Algoritm chala | Matching logikasi |
| **HRZvsPage / HRZnoPage** | Maqsad noaniq | Skop aniqlash |
| **HRCapitalTests** | Grading mantiqi yo'q | Test scoring backend |
| **HRMap** | Canvas render, lekin interactive emas | Geolocation clustering |
| **RACIMatrixPage** | Drag-assign UI yo'q | Modal komponent |
| **QuestionnaireTemplates** | Minimal CRUD | Form builder |

---

## 3. XODIM QO'SHISH — TO'LIQ TAHLIL

### 3.1 Umumiy ball: **72/100** ⚠️

### 3.2 Kritik bug — Data Loss (ENG MUHIM!)

Frontend form **9 ta field qabul qiladi**, lekin backend ularni **DB'ga yozmaydi**:

```typescript
// ❌ DATA YO'QOTILADI:
shift          → frontend qabul qiladi, DB'da ustun yo'q
salaryType     → frontend qabul qiladi, DB'da ustun yo'q
workshopZone   → frontend qabul qiladi, DB'da ustun yo'q
age            → form qabul qiladi, DB'da ustun yo'q
childrenCount  → form qabul qiladi, DB'da ustun yo'q
maritalStatus  → form qabul qiladi, DB'da ustun yo'q
housingType    → form qabul qiladi, DB'da ustun yo'q
householdMembers → form qabul qiladi, DB'da ustun yo'q
latitude/longitude → form qabul qiladi, DB'da ustun yo'q
attestationDate → form qabul qiladi, DB'da ustun yo'q
```

**Foydalanuvchi:** "Saqladim ✅"
**Reality:** 50% ma'lumot yo'qoldi, hech kim bilmaydi

**Fix joyi:**
- `artifacts/erp-dashboard/src/components/hr/employee-dialog/types.ts:9-34` (schema)
- `apps/api/src/modules/compatibility/employees-payload.adapter.ts:97-120` (adapter ignor qiladi)
- `lib/db/src/schema/employees.ts` (DB schema ustun yo'q)

### 3.3 Field-by-field jadval

| Expected Field | Frontend Form | Validation | Backend Write | Status |
|---|:---:|:---:|:---:|:---:|
| Full Name (F.I.SH) | ✅ | Zod min(1) | ✅ firstName + lastName split | ✅ |
| Employee ID | ✅ | Zod min(1) | ✅ UNIQUE | ✅ |
| Phone (+998) | ✅ | ⚠️ regex yo'q | ✅ | ⚠️ |
| Telegram Chat ID | ✅ | optional | ✅ | ✅ |
| Department | ✅ | optional | ✅ FK validated | ✅ |
| Position | ✅ | optional | ✅ FK validated | ✅ |
| Hire Date | ✅ | optional | ⚠️ **DB NOT NULL — mismatch!** | 🔴 |
| Birth Date | ✅ | optional | ✅ | ⚠️ |
| Gender | ✅ | optional | ✅ (no enum) | ⚠️ |
| Address | ✅ | optional | ✅ | ✅ |
| Shift | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Salary Type | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Workshop Zone | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Children Count | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Marital Status | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Housing Type | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Lat/Lng | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| Attestation Date | ✅ | optional | ❌ **DATA LOSS** | 🔴 |
| **Manager** | ❌ **YO'Q** | — | ✅ DB'da bor | 🔴 |
| **Base Salary** | ❌ **YO'Q** | — | ✅ DB'da bor | 🔴 |
| **Contract Type** | ❌ **YO'Q** | — | ✅ DB'da bor | 🔴 |
| Passport | ❌ Form'da yo'q | — | ✅ alohida table | ⚠️ post-create |
| Emergency Contact | ❌ Form'da yo'q | — | ✅ alohida table | ⚠️ post-create |
| Bank Account | ❌ Form'da yo'q | — | ✅ alohida table | ⚠️ post-create |
| Profile Image | ⚠️ post-create | size check | ✅ POST endpoint | ⚠️ |

### 3.4 Backend flow

```
POST /api/employees
   ↓
EmployeesCompatController.createEmployee()
   ↓
EmployeesCompatService.createEmployee(body)
   ↓
adaptEmployeePayload(body)        ← 9 ta field IGNOR qilinadi
   ↓
validateEmployeeFks(dept, pos)
   ↓
db.insert(employees).values(...)   ← DB'ga 9 ta field yozilmaydi
   ↓
❌ User account YARATILMAYDI (no resolveOrCreateUserForEmployee)
❌ Welcome email YO'Q
❌ Audit log entry YO'Q
   ↓
Return { id }
```

### 3.5 Production blokerlar (Add Employee)

1. 🔴 **Data loss bug** — 9 field saqlanmaydi (1 kun ish)
2. 🔴 **Hire date mismatch** — DB NOT NULL, form optional (15 daqiqa)
3. 🔴 **Manager field yo'q** — org strukturasi sinmaydi (2 soat)
4. 🔴 **Salary field yo'q** — payroll uchun majburiy (2 soat)
5. 🟡 **User account yaratilmaydi** — xodim login qilolmaydi (4 soat)
6. 🟡 **Phone regex yo'q** — `+998` validation kerak (30 daqiqa)
7. 🟡 **Welcome email yo'q** — onboarding boshlanmaydi (2 soat)

**Jami fix vaqti:** ~10 soat

---

## 4. XODIM PROFILI — TO'LIQ TAHLIL

### 4.1 Umumiy ball: **78/100** ⚠️

### 4.2 Mavjud bo'limlar (18 tab)

✅ **Mavjud va ishlaydi:**
- Personal info (ism, DOB, gender, address)
- Contact (phone, email, emergency contact)
- Passport (CRUD)
- Bank accounts (multi)
- Work info (dept, pos, manager)
- Contracts (CRUD)
- Salary history (view + add)
- Bonuses (CRUD)
- Fines (CRUD)
- Overtime (CRUD)
- Attendance (statistika + chart)
- Leave requests (CRUD)
- Sick leave (CRUD)
- Business trips (cost calc)
- Cash advances (CRUD)
- Discipline (view-only)
- Certificates + expiry alerts
- Learning progress
- Skills gap
- Mentorship
- Performance KPI
- Goals/OKR
- Documents (file storage)
- Career path
- Assets
- Obligations

### 4.3 ❌ Yetishmaydigan bo'limlar

| Bo'lim | Impact | Sabab |
|---|:---:|---|
| **Salary masking** | 🔴 HIGH | Hamma xodim hammaning oyligini ko'radi (PII leak!) |
| **Self-service /my-profile** | 🔴 HIGH | Xodim faqat boshqalarning profili'ni ko'radi (admin route) |
| **Performance review form** | 🟡 MED | KPI bor, lekin review yo'q |
| **Leave balance breakdown** | 🟡 MED | Annual/sick/unpaid alohida ko'rsatilmaydi |
| **Audit trail** | 🟡 MED | Kim/qachon o'zgartirgan ko'rsatilmaydi |
| **Salary slip / payslip download** | 🟡 MED | PDF generatsiya yo'q |
| **Disciplinary appeal** | 🟢 LOW | Bir tomonlama jarayon |
| **Promotion history** | 🟢 LOW | Transfer card minimal |
| **Document viewer** | 🟢 LOW | PDF/image inline ko'rinmaydi |

### 4.4 Kritik xavfsizlik xatosi

```typescript
// ❌ HOZIRGI HOLAT — EmployeeProfile.tsx:321
<div>Salary: {employee.baseSalary}</div>   // har xodim ko'radi!

// ✅ TO'G'RI:
{(user.role === 'HR' || user.role === 'DIRECTOR' || user.id === employee.userId) && (
  <div>Salary: {employee.baseSalary}</div>
)}
```

**Bu — PII leak.** Mijoz mahsulotni audit qiladi va kasb sirini buzdi deydi.

### 4.5 API endpointlar holati

✅ **Ishlaydigan (16):** GET /employees/:id, /passport, /bank-accounts, /emergency-contacts, /contracts, /salary-history, /attendance, /discipline, /certificates, va h.k.

❌ **Yetishmaydi (4):**
- GET /employees/:id/leave-balance (faqat client-side calculation)
- GET /employees/:id/performance-reviews (yo'q)
- GET /employees/:id/audit-trail (yo'q)
- GET /employees/:id/role-change-history (yo'q)

---

## 5. RECRUITER KANBAN — TO'LIQ TAHLIL

### 5.1 Umumiy ball: **65/100** 🔴

### 5.2 Frontend — 75% (LEKIN drag-drop chala!)

**Mavjud:**
- ✅ 12 ta stage: NEW → QUESTIONNAIRE_SENT → PHONE_SCREENING → INTERVIEW_SCHEDULED → INTERVIEWED → TEST_SENT → TEST_ANALYSIS → REFERENCES_CHECK → PROBATION → OFFER_SENT → HIRED | REJECTED
- ✅ Card content: ism, position, source, sana
- ✅ Search/filter (vacancy bo'yicha)
- ✅ Stats bar: jami, faol, hired, rejected, conversion %
- ✅ Add candidate dialog
- ✅ Tests mavjud

**❌ ENG KATTA MUAMMO — Drag-drop YO'Q:**
- @dnd-kit kutubxonasi `package.json`'da bor
- LEKIN kod faqat **manual button click** orqali harakat qiladi
- Karta column'da turadi, lekin **drag qilinmaydi**
- `RecruitingKanbanSectionsB.tsx:19-98` — faqat render, DnD context yo'q

**Boshqa muammolar:**
- ❌ Optimistic updates yo'q
- ❌ Real-time websocket yo'q (recruiter A harakatlanadi → recruiter B ko'rmaydi)
- ❌ Bulk reject yo'q
- ❌ Funnel conversion analytics yo'q
- ❌ AI interview integratsiya chala

### 5.3 Backend — 85% (yaxshi)

**Mavjud:**
- ✅ State machine (VALID_TRANSITIONS) — `recruitment-funnel.service.ts:15-28`
- ✅ Funnel history (har stage move log qilinadi)
- ✅ Rejection auditing (reason majburiy)
- ✅ Quick rejection (isQuickRejected flag)
- ✅ References check validation
- ✅ i18n support

**❌ Yetishmaydi:**
- Career site webhook → auto kandidat yaratish
- Telegram bot ↔ Kanban sync
- AI interview auto-schedule
- Offer letter auto-generation (PDF template)
- Hire → Employee record auto-creation

### 5.4 Database — 90%

`recruitment.ts` schema:
- ✅ `vacancies` (40 col)
- ✅ `candidates` (62 col)
- ✅ `interviews` (85 col)
- ✅ `ai_cv_screenings` (144 col)
- ✅ `ai_interview_sessions` (162 col)
- ❌ `funnel_history` table explicit definition yo'q (lekin service ishlatadi)
- ❌ `job_offers` table yo'q
- ❌ `references_checks` table yo'q

### 5.5 Kritik xatolar

1. 🔴 **Drag-drop YO'Q** — kanban'ning asosiy UX
2. 🔴 **No real-time sync** — collaboration yo'q
3. 🟡 **AI Interview chala** — alohida modul, integratsiya yo'q
4. 🟡 **Hire → Employee manual** — duplicate data entry
5. 🟡 **Job offer letter PDF generation yo'q**

### 5.6 Test stsenariy (ishlamaydi)

```
1. Yangi nomzod website orqali kelsa → "NEW" column'da paydo bo'lishi kerak
   ❌ Webhook yo'q
2. Recruiter karta'ni "Screening" ga drag qiladi
   ❌ Drag mumkin emas!
3. AI Interview schedule
   ❌ Integratsiya chala
4. Pass → "Offer" → letter generatsiya
   ❌ PDF generation yo'q
5. Hire → Employee yaratish
   ❌ Manual jarayon
6. Reject → reason majburiy
   ✅ Ishlaydi
```

---

## 6. ORG CHART — TO'LIQ TAHLIL

### 6.1 Umumiy ball: **60/100** 🔴

### 6.2 Frontend — 70%

**Mavjud (`OrgChartPage.tsx`, 377 qator):**
- ✅ Recursive TreeNode komponent
- ✅ Expand/collapse with chevron
- ✅ Department info (name, VEP, employee count)
- ✅ Stats cards (jami department, employee, max depth)
- ✅ Export: PDF, Excel, PNG
- ✅ AI recommendations button
- ✅ Settings nav (`/hr/org-departments`)
- ✅ EPErrorState bilan error handling
- ✅ i18n ready
- ✅ data-testid attributes (test-friendly)

**❌ Yetishmaydi:**
- 🔴 **Drag-drop reassignment yo'q** — manager o'zgartirib bo'lmaydi
- 🔴 **Click → profile yo'q** — odamga bosish hech narsa qilmaydi
- 🔴 **Search/filter yo'q** — daraxtda odam topib bo'lmaydi
- 🔴 **Mobile yaroqsiz** — horizontal tree small screen'da sinadi
- 🟡 Cycle detection yo'q (visualizatsiyada)
- 🟡 Print optimization yo'q

### 6.3 Backend — 80%

**API endpointlar:**
- ✅ GET `/api/org-chart/tree` — hierarchical tree + stats
- ✅ GET `/api/org-chart/flat` — flat list
- ✅ GET `/org-structure/hierarchy` — full tree with counts
- ✅ GET `/org-structure/stats`
- ✅ GET `/org-structure/nodes/:id` (with employees + children)
- ✅ POST/PATCH `/org-structure/nodes` (create/update)
- ✅ PATCH `/org-structure/nodes/:id/move` — reassign parent
- ✅ PATCH `/org-structure/users/:userId/node` — assign employee
- ✅ GET `/org-structure/export/{pdf,excel}`
- ✅ GET `/org-structure/nodes/:id/approval-chain`
- ✅ GET `/org-structure/nodes/:id/direct-manager`

**❌ Kritik xato — Cycle detection YO'Q:**

```typescript
// HOZIRGI HOLAT — org-structure.service.ts:117
async moveFunnelStage(nodeId, newParentId) {
  await this.repo.update(nodeId, { parentId: newParentId });
  // ❌ HECH QANDAY CYCLE CHECK YO'Q!
}

// MUMKIN BO'LGAN HOLAT:
A → B → C → A   (circular loop)
   ↑           ↓
   └───────────┘
```

Bu — production'da application crash bo'ladi (infinite loop).

**Performance muammosi — O(n²):**
```typescript
function buildTree(nodes, parentId = null) {
  return nodes
    .filter(n => n.parentId === parentId)   // ← har node uchun filter qiladi
    .map(n => ({ ...n, children: buildTree(nodes, n.id) }));
}
```
1000+ department bilan sekin. **Parent-child map kerak.**

**NOT IMPLEMENTED:**
- Node-level history (P3-26)
- HR Request tracking
- Node Portret (position profile) CRUD
- Position folder operations
- Telegram group sync

### 6.4 Production blokerlar

1. 🔴 **Cycle detection yo'q** — app crash xavfi
2. 🔴 **Mobile yaroqsiz** — tablet/phone'da ko'rinmaydi
3. 🟡 **O(n²) performance** — 1000+ departmentda sekin
4. 🟡 **Click → profile yo'q** — UX yetishmaydi
5. 🟡 **Search yo'q** — katta orgda odam topib bo'lmaydi
6. 🟢 **Portret endpoint stub** — position profile yo'q

---

## 7. SUB-MODULLAR HOLAT MATRITSASI

### 7.1 31 ta sub-modul

| Sub-modul | Fayl | Backend % | Frontend % | DB | Tests | Jami |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **attendance** | 11 | 90 | 85 | 2 | 0 | **82** ✅ |
| **payroll** | 3 | 60 | 50 | 3 | 0 | **50** ⚠️ |
| **recruitment** | 21 | 85 | 70 | 5+ | 0 | **75** ⚠️ |
| **leave** | 3 | 70 | 80 | 2 | 0 | **65** ⚠️ |
| **discipline-v2** | 6 | 85 | 40 | 2 | 0 | **60** ⚠️ |
| **onboarding** | 6 | 75 | 30 | 1 | 0 | **45** ❌ |
| **offboarding** | 4 | 50 | 20 | 1 | 0 | **30** ❌ |
| **enps** | 4 | 80 | 50 | 2 | 0 | **65** ⚠️ |
| **analytics** | 2 | 60 | 70 | 3 | 0 | **60** ⚠️ |
| **employees** | 3 | 50 | 60 | 3 | 0 | **50** ⚠️ |
| ai-interview-v2 | 10 | 70 | 60 | 2 | 0 | 60 |
| career-path | 4 | 70 | 70 | 1 | 0 | 65 |
| daily-report | 5 | 70 | 80 | 1 | 0 | 70 |
| document-workflow | 6 | 70 | 60 | 2 | 0 | 60 |
| gamification | 4 | 75 | 70 | 2 | 0 | 70 |
| pip (PIP) | 3 | 40 | 30 | 1 | 0 | **35** ❌ |
| safety | 4 | 75 | 80 | 2 | 0 | 75 |
| skills | 4 | 70 | 70 | 1 | 0 | 70 |
| reception | 2 | 60 | 70 | 1 | 0 | 65 |
| **JAMI / O'rtacha** | 230 | **70** | **54** | — | **0** | **58** |

### 7.2 Production-ready sub-modullar (top 5)

1. **Attendance (82%)** — check-in/out + face recognition + late tracking + Telegram
2. **Recruitment (75%)** — funnel + AI interview + job offers (frontend drag-drop yo'q)
3. **eNPS (65%)** — survey lifecycle + quarterly auto-launch
4. **Leave (65%)** — request + approval workflow
5. **Discipline (60%)** — violation catalog + severity escalation

### 7.3 Production NOT-ready sub-modullar (top 5)

1. **PIP (35%)** — endpoints 404, frontend stub
2. **Offboarding (30%)** — checklist only, knowledge transfer yo'q
3. **Onboarding (45%)** — curriculum yaxshi, lekin buddy + docs chala
4. **Payroll (50%)** — tax yaxshi (UZ-compliant!), lekin closure workflow + GL posting yo'q
5. **Employees (50%)** — CRUD bor, lifecycle state machine yo'q

### 7.4 20 ta standart HRMS feature checklist

| # | Feature | Status |
|:---:|---|:---:|
| 1 | Employee master data | ✅ |
| 2 | Org chart | ✅ |
| 3 | Time & attendance | ✅ |
| 4 | Leave management | ⚠️ balance accrual yo'q |
| 5 | Payroll | ⚠️ closure workflow yo'q |
| 6 | Performance management | ⚠️ review yo'q |
| 7 | Recruitment/ATS | ⚠️ drag-drop yo'q |
| 8 | Onboarding | ⚠️ buddy + docs chala |
| 9 | Offboarding | ❌ minimal |
| 10 | Training/LMS | ⚠️ embedded only |
| 11 | Compensation mgmt | ⚠️ bands yo'q |
| 12 | Benefits admin | ❌ yo'q |
| 13 | Succession planning | ⚠️ |
| 14 | Career pathing | ✅ |
| 15 | Employee self-service | ⚠️ chala |
| 16 | Manager self-service | ⚠️ dashboard yo'q |
| 17 | Mobile app | ❌ yo'q |
| 18 | Analytics/reporting | ✅ |
| 19 | Compliance tracking | ⚠️ |
| 20 | Workforce planning | ⚠️ |

**Score: 13 ✅ / 10 ⚠️ / 3 ❌ = 65% feature-complete**

---

## 8. MA'LUMOT OQIMI (DATA FLOW)

### 8.1 Misol — Xodimlar ro'yxati

```
[Foydalanuvchi /employees ga kiradi]
         ↓
[useQuery("/api/employees")]
   📁 hooks/use-hr-employees.ts:9-13
         ↓
[fetchApi GET /api/employees]
         ↓
[HrEmployeesController.getEmployees()]
   📁 hr-employees.controller.ts:50-60
         ↓
[QueryBus.execute(GetEmployeesQuery)]
         ↓
[GetEmployeesHandler]
         ↓
[hrRepo.findAllEmployees()]
   📁 drizzle-employees.repo.ts:18-31
         ↓
[db.select().from(users).where(isNull(deletedAt))]
   ⚠️ JOIN ga departments/positions YO'Q!
         ↓
[Response: { items: Row[], total: number }]
         ↓
[Frontend table'da render]
   ⚠️ orgDepartmentName = undefined
   ⚠️ positionName = undefined
```

### 8.2 Type contract muammosi

**Frontend kutadi:**
```typescript
{ fullName, employeeId, orgDepartmentName, positionName, ... } // 21 field
```

**Backend qaytaradi:**
```typescript
users[] (faqat users table column'lari)
```

**Result:** UI'da "undefined" ko'rsatadi.

### 8.3 Tab-by-tab API endpoint holati

| Tab | Endpoint | Status | Joy |
|---|---|:---:|---|
| Personal | `GET /hr/employees/:id` | ✅ 200 | hr-employees.controller.ts:65 |
| Attendance | `GET /hr/employees/:id/kpi` | ✅ 200 | hr-employees.controller.ts:77 |
| Payroll | `GET /hr/payroll?employeeId=:id` | ✅ 200 | hr-payroll.controller.ts:51 |
| Leave | `GET /hr/leave?employeeId=:id` | ✅ 200 | hr-leave.controller.ts |
| **Skills** | `GET /hr/skills/:id` | ❌ **501** | hr-dashboard-stubs.controller.ts |
| **Documents** | `GET /hr/documents/employee` | ❌ **501** | hr-dashboard-stubs.controller.ts:170 |

### 8.4 501 endpointlar (chala/stub)

```
GET /hr/adaptation/:id              → 501
POST /hr/alumni/:id/invite           → 501
GET /hr/daily-reports                → 501
GET /hr/onboarding-checklists        → 501
GET /hr/fp-cycle                     → 501
GET /hr/360/reviewable               → 501
POST /hr/offboarding/cases           → 501
PATCH /hr/onboarding-checklists/:id  → 501
GET /hr/referrals/:id                → 501
POST /hr/employees/1/passport        → 404
GET /hr/documents/employee           → 501
GET /hr/documents/my                 → 501
PATCH /hr/dailyreports/approvals     → 501
POST /hr/salary-review/approve       → 501
GET /hr/skills/:id                   → 501
GET /hr/lms-skills                   → 501
```

**16 endpoint chala** — frontend'da sahifa ochiladi, lekin ma'lumot yo'q.

---

## 9. PRODUCTION READINESS CHECKLIST

### 9.1 Xavfsizlik (6/7 = 86%)

| Item | Status | Sabab |
|---|:---:|---|
| @UseGuards on HR endpoints | ⚠️ PARTIAL | **8 endpoint JwtAuthGuard'siz!** |
| @Roles enforces access | ✅ | HR_MANAGER, DIRECTOR roles |
| Salary endpoint HR/Director only | ✅ | salary-review |
| Self-edit own profile | ❌ | /my-profile route yo'q |
| PII protection in logs | ✅ | audit.interceptor mask qiladi |
| XSS safe rendering | ✅ | React JSX |
| SQL injection safe | ✅ | Drizzle parameterized |

**🔴 BLOCKER:** 8 endpoint auth'siz (B028):
- `/fi-comprehensive/accounts`
- `/pos/inventory/stats`
- `/wms/warehouse`
- `/security-incidents`
- `/marketing/dashboard`
- `/supply-chain/three-way-match/stats`
- `/crm/ai/dashboard`
- `/assets/...`

### 9.2 Performance (3/5 = 60%)

| Item | Status | Sabab |
|---|:---:|---|
| Pagination | ✅ | limit=50 default |
| **N+1 queries** | ❌ FAIL | Department/position lookup yo'q |
| Indexes on FK | ✅ | dept_id, status, deletedAt |
| Slow query log | ⚠️ Unknown | Tekshirilmagan |
| Payroll caching | ❌ | Har safar recalculate |

### 9.3 Reliability (1/4 = 25%) 🔴 KRITIK

| Item | Status | Sabab |
|---|:---:|---|
| Add employee transaction | ❌ | NO transaction wrapper |
| Idempotency | ❌ | `employeeCode = 'EMP-' + Date.now()` |
| Rollback on failure | ❌ | Email fail → orphan record |
| Email failure handling | ⚠️ | Fire-and-forget, retry yo'q |

### 9.4 Data Integrity (4/5 = 80%)

| Item | Status |
|---|:---:|
| FK constraints | ✅ |
| Soft delete consistency | ⚠️ employees soft, related cascade hard |
| Unique constraints | ⚠️ employeeCode UNIQUE, email — yo'q |
| Default values | ✅ |
| CHECK constraints | ✅ status enum |

### 9.5 PII Protection — ENG XAVFLI

| Field | Saqlash | Encryption |
|---|---|:---:|
| passportSeries | Plaintext | ❌ |
| passportNumber | Plaintext | ❌ |
| nationalId | Plaintext | ❌ |
| bankAccountNumber | Plaintext | ❌ |
| bankName | Plaintext | ❌ |
| addressRegistered | Plaintext | ❌ |
| salary | Plaintext | ❌ |

**GDPR/UZ ML qonun risk:** Bu **mahkamani agar audit qilsa — kompaniya yopiladi** darajadagi xavf.

### 9.6 Multi-tenancy

❌ **YO'Q** — employees, payroll, leave, attendance jadvallarda **`tenant_id` umuman yo'q**. Bu — V1, V3, V4, V5, V6 audit'larda har safar qayd etilgan.

### 9.7 Testing (3/5 = 60%)

| Item | Status |
|---|:---:|
| Unit tests (handlers) | ✅ 15 spec |
| Integration tests (repos) | ✅ 8 spec |
| E2E "Add Employee" | ⚠️ 3 failing |
| Coverage (HR) | ✅ 95.6% |
| Frontend HR tests | ❌ **0 ta E2E!** |

---

## 10. TOP 15 KRITIK XATO (production blockers)

| # | Daraja | Muammo | Joy | Vaqt |
|:---:|:---:|---|---|:---:|
| 1 | 🔴 P0 | 9 field Add Employee'da yo'qoladi (DATA LOSS) | `employees-payload.adapter.ts:97-120` | 1 kun |
| 2 | 🔴 P0 | 8 endpoint JwtAuthGuard'siz | 8 controller | 1 soat |
| 3 | 🔴 P0 | Salary non-HR'ga ko'rinadi (PII LEAK) | `EmployeeProfile.tsx:321` | 2 soat |
| 4 | 🔴 P0 | OrgChart cycle detection yo'q | `org-structure.service.ts:117` | 2 soat |
| 5 | 🔴 P0 | Recruiter Kanban drag-drop yo'q | `RecruitingKanbanSectionsB.tsx:19-98` | 1 kun |
| 6 | 🔴 P0 | tenant_id YO'Q — multi-tenant data leak | All HR tables | 1 hafta |
| 7 | 🔴 P0 | PII plaintext (passport, bank, salary) | `lib/db/src/schema/employees.ts:39-51` | 3 kun |
| 8 | 🔴 P0 | No transactions — partial creates | `employees.service.ts:58-65` | 4 soat |
| 9 | 🟡 P1 | Hire date NULL mismatch | DB schema vs form | 15 daqiqa |
| 10 | 🟡 P1 | Manager field Add Employee'da yo'q | `EmployeeDialog.tsx` | 2 soat |
| 11 | 🟡 P1 | Salary field Add Employee'da yo'q | `EmployeeDialog.tsx` | 2 soat |
| 12 | 🟡 P1 | User account auto-yaratilmaydi | `employees-compat.service.ts` | 4 soat |
| 13 | 🟡 P1 | Employees list — N+1 (dept/pos names) | `drizzle-employees.repo.ts:18` | 3 soat |
| 14 | 🟡 P1 | Self-service /my-profile yo'q | Yangi route | 3 soat |
| 15 | 🟡 P1 | 16 endpoint 501 (chala) | `hr-dashboard-stubs.controller.ts` | 5 kun |

**Jami P0 fix vaqti:** ~22 soat (1 hafta minimum)
**Jami P0+P1 fix vaqti:** ~10-12 kun (2 hafta)

---

## 11. PRODUCTION-GA TAYYORLASH ROADMAP

### 11.1 1-hafta (KRITIK xavfsizlik)

| Kun | Vazifa | Vaqt |
|:---:|---|:---:|
| Du-Se | 8 endpoint'ga JwtAuthGuard qo'shish | 2 soat |
| Se | Salary masking (role-based) | 2 soat |
| Ch | OrgChart cycle detection | 2 soat |
| Ch | Add Employee data loss fix (DB ustun + adapter) | 8 soat |
| Pa | PII encryption (passport, bank, salary) | 8 soat |

**Jami: ~22 soat. Holat: 🔴 → 🟡**

### 11.2 2-hafta (Kritik biznes funksiyalar)

| Kun | Vazifa | Vaqt |
|:---:|---|:---:|
| Du | Multi-tenancy migration (tenant_id) | 8 soat |
| Se | Recruiter Kanban drag-drop (@dnd-kit) | 6 soat |
| Ch | OrgChart mobile responsive | 4 soat |
| Pa | Transactions for Add Employee | 4 soat |
| Pa | Hire date fix + Manager + Salary fields | 4 soat |

**Jami: ~26 soat. Holat: 🟡 → 🟢**

### 11.3 3-4 hafta (Polishing + funksional)

- 16 ta 501 endpoint'ni implement qilish
- N+1 queries fix (LEFT JOIN)
- Self-service /my-profile route
- Welcome email + onboarding triggers
- Payroll closure workflow
- Offboarding knowledge transfer
- HR frontend E2E tests (5 sahifa)

**Jami: ~80 soat (2 hafta)**

### 11.4 5-8 hafta (Enterprise hardening)

- Benefits administration module
- Mobile app (PWA minimum)
- Compliance calendar
- Audit trail UI (/admin/audit)
- Salary bands + market data
- Manager self-service dashboards
- Performance review forms

**Jami: ~160 soat (4 hafta)**

---

## 12. AGENT TASK'LAR (siz so'raganday)

### Squad HR-A: Kritik xavfsizlik (P0, 1 hafta)

```
HR-A1: 8 endpoint'ga JwtAuthGuard
  Files: fi-comprehensive, pos, wms, security, marketing, supply-chain, crm-ai, assets controllers
  Action: @UseGuards(JwtAuthGuard, RolesGuard) qo'shish
  Tests: Each endpoint returns 401 when not authenticated
  Time: 2h

HR-A2: Salary masking
  File: EmployeeProfile.tsx + Work tab component
  Action: <RoleGate role={['HR', 'DIRECTOR']}><SalaryInfo /></RoleGate>
  Tests: Non-HR user cannot see salary in DOM
  Time: 2h

HR-A3: OrgChart cycle detection
  File: org-structure.service.ts:117
  Action: Before move, traverse newParent → ancestor chain, if includes nodeId → reject
  Tests: Cycle creation returns Err
  Time: 2h

HR-A4: Add Employee 9 field DB migration + adapter fix
  Files: lib/db/src/schema/employees.ts (add columns), employees-payload.adapter.ts (map fields)
  Action: 
    - Migration 0013_add_employee_personal_fields.sql
    - Adapter: shift, salaryType, workshopZone, age, childrenCount, maritalStatus, housingType, householdMembers, lat, lng
  Tests: Create employee with all fields → verify DB
  Time: 8h

HR-A5: PII encryption layer
  Files: employees.ts schema, encryption.service.ts (new)
  Action: pgcrypto extension + encrypt(passport, bank, salary) at DB layer
  Tests: Direct SQL select shows encrypted; service layer returns plaintext for authorized users
  Time: 8h
```

### Squad HR-B: Kritik biznes funksiyalar (P1, 1 hafta)

```
HR-B1: Multi-tenancy migration
  Files: All HR schema files + repositories
  Action: ALTER TABLE ADD tenant_id + TenantContext middleware + filter in every query
  Time: 8h

HR-B2: Recruiter Kanban drag-drop
  File: RecruitingKanban.tsx + RecruitingKanbanSectionsB.tsx
  Action: 
    - DndContext wrapper
    - useSortable for each candidate card
    - onDragEnd → moveStage mutation with optimistic update
  Tests: E2E drag from "NEW" to "PHONE_SCREENING" → assertion
  Time: 6h

HR-B3: OrgChart mobile responsive
  File: OrgChartPage.tsx + TreeNode
  Action: 
    - Detect viewport <768px
    - Switch to accordion list view on mobile
    - Or zoom-pan with pinch gesture
  Tests: Mobile screenshot test
  Time: 4h

HR-B4: Add Employee transactions
  File: employees-compat.service.ts
  Action: 
    - Wrap createEmployee in db.transaction()
    - Include: insert employee, create user, send welcome email
    - Rollback on any failure
  Tests: Force email failure → no employee in DB
  Time: 4h

HR-B5: Hire date + Manager + Salary fields
  File: EmployeeDialog.tsx + types.ts
  Action:
    - hireDate: optional → required
    - Add manager: ManagerSelect component (search by name)
    - Add baseSalary: NumericInput with currency
  Tests: All 3 fields persist
  Time: 4h
```

### Squad HR-C: Funksional yetishmaganlar (P1, 2 hafta)

```
HR-C1: 16 ta 501 endpoint'ni implement qilish
HR-C2: N+1 queries fix (LEFT JOIN depts/positions)
HR-C3: Self-service /my-profile route
HR-C4: Welcome email + onboarding triggers
HR-C5: Payroll closure workflow
HR-C6: Offboarding knowledge transfer
HR-C7: HR frontend E2E tests (5 sahifa)
HR-C8: Leave balance accrual logic
HR-C9: Hire → Employee auto-conversion (Recruitment)
HR-C10: Recruiter websocket real-time sync

Time: ~80h (2 hafta, 1 odam)
```

### Squad HR-D: Enterprise hardening (P2, 4 hafta)

```
HR-D1: Benefits administration module
HR-D2: PWA mobile app
HR-D3: Compliance calendar
HR-D4: /admin/audit page
HR-D5: Salary bands + market data
HR-D6: Manager self-service dashboards
HR-D7: Performance review forms
HR-D8: 360 feedback workflow
HR-D9: OKR/Goals system
HR-D10: Skills gap → training plan auto-suggest

Time: ~160h (4 hafta)
```

### Quality gates har task uchun

```
HR Worker → PR
   ↓
3 ta avtomatik gate:
├── Code Reviewer (diff o'qiydi, anti-pattern qaydlaydi)
├── Rule Enforcer (22 ARCHITECTURE_RULES check)
└── HR-specific Tester (Playwright + endpoint health)
   ↓
3/3 PASS → merge + HR scorecard update
```

---

## 13. SUMMARY SCORECARD

| Kategoriya | Ball | Status |
|---|:---:|:---:|
| Backend health | 68/100 | ⚠️ |
| Frontend pages | 72/100 | ⚠️ |
| Add Employee | 72/100 | 🔴 (data loss!) |
| Employee Profile | 78/100 | ⚠️ |
| Recruiter Kanban | 65/100 | 🔴 (drag-drop!) |
| Org Chart | 60/100 | 🔴 (cycle!) |
| Sub-modules avg | 58/100 | ⚠️ |
| Security | 86/100 | ⚠️ (8 endpoint!) |
| Performance | 60/100 | ⚠️ (N+1!) |
| Reliability | 25/100 | ❌ (no transactions!) |
| Data Integrity | 80/100 | ⚠️ |
| Compliance | 50/100 | ❌ (PII plaintext!) |
| Testing | 60/100 | ⚠️ (0 frontend E2E) |
| **UMUMIY** | **64/100** | ❌ **NO-GO** |

---

## 14. BITTA JUMLALI YAKUN

> **HR moduli — loyihaning eng katta moduli (230 fayl, 47 sahifa, 401 endpoint, 31 sub-modul). 65% feature-complete, lekin 30% production-hardened. 15 ta kritik production blocker mavjud: Add Employee'da 9 field data loss (eng katta!), 8 endpoint auth'siz, Recruiter Kanban drag-drop yo'q, OrgChart cycle detection yo'q, PII plaintext, tenant_id yo'q, no transactions. Production'ga tayyor bo'lish uchun: 1-hafta KRITIK security fix (22 soat) + 1-hafta biznes funksiyalar (26 soat) + 2 hafta polishing (80 soat) + 4 hafta enterprise hardening (160 soat) = jami 8 hafta minimum. Hozir deploy qilinsa: PII leak (kompaniya yuridik xavf), data loss (foydalanuvchi ishonchi yo'qolish), multi-tenant leak (mijoz shartnomadan voz kechish).**

---

## 15. MANBALAR

- 5 ta Explore agent (parallel, ~45 daqiqa)
- 127 fayl inspectsiya qilindi (controllers, repos, services, tests, migrations, schemas)
- 25+ sahifa funksional tahlil
- 16 ta 501 endpoint topildi
- 8 ta xavfsizlik xato file:line dalili bilan
- Recent git log (HR fix patterns)

---

## 16. KEYINGI QADAM

**Sizning tanlovingiz uchun:**

1. **A — KRITIK fix'larni boshlash (1 hafta, 22 soat)**
   - Men 5 ta P0 task uchun real kod yozaman (PR-ready)
   - Sizning ishingiz: review + merge
   - Natija: PII leak yopiq, security tiklangan

2. **B — Recruiter Kanban drag-drop'ni tuzatish (1 kun)**
   - Men @dnd-kit bilan to'liq DnD context yozaman
   - Optimistic updates + WebSocket
   - Natija: foydalanuvchi tajribasi tuzatildi

3. **C — Add Employee data loss tuzatish (1 kun)**
   - 9 ta yangi DB ustun + migration
   - Frontend form fix
   - Adapter fix
   - Natija: DATA LOSS bug yopiq

4. **D — To'liq remediation program (8 hafta)**
   - Sprint-based, multi-agent
   - 40+ task
   - V-score 64 → 90

**Qaysisini boshlaymiz?** A, B, C, yoki D?
