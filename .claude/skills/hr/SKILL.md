---
name: hr
description: EuroPrint HR moduli — 400+ xodim, davomad, ish haqi, KPI, ta'til, rekruting, adaptatsiya, sertifikatsiya. Trigger so'zlar: "xodim", "HR", "ish haqi", "payroll", "davomad", "attendance", "ta'til", "KPI", "rekruting", "candidate", "adaptatsiya".
---

# HR Moduli — Skill

## Modul hududi
- Backend: `apps/api/src/modules/hr/`, `apps/api/src/modules/lms/`, `apps/api/src/modules/adaptation/`, `apps/api/src/modules/feedback-360/`
- Frontend: `artifacts/erp-dashboard/src/pages/HR*.tsx`, `Adaptation.tsx`, `Tests.tsx`, `LMS*.tsx`
- Schema: `lib/db/src/schema/hr-*.ts`, `attendance.ts`, `leave.ts`, `kpi.ts`, `discipline.ts`, `recruitment.ts`

## Ierarxiya
```
Department (30+)
  └── Position
       └── Employee (400+)
            ├── Attendance records (real-time)
            ├── Payroll (oylik)
            ├── KPI records (kunlik)
            ├── Leave balance (yillik)
            └── Discipline records
```

## Asosiy konseptlar

### Leave Balance
- Har xodim uchun `balanceDays` (yillik kvota)
- `approveLeave(b, days)` → `Err('INSUFFICIENT')` agar yetmasa
- Statuslar: `pending → approved → cancelled`
- Cancel approved leave → balance avtomatik qaytariladi

### Discipline Thresholds (kech kelganlik bo'yicha oylik hisob)
```
0–2  → none
3–4  → warning
5–7  → reprimand
8+   → discharge
```

### KPI Score (weighted)
- Achievement × 0.4 + Quality × 0.3 + OEE × 0.2 + Attendance × 0.1
- Har metrik 0–100 oralig'ida, yig'indi 100 ga teng

### Attendance Classification
- `clockIn == null` → absent
- `clockOut == null` → open
- worked minutes < 4 hours → half-day
- lateBy > 15 min → late, else → present

### Face Recognition
- Threshold: 0.85 similarity
- Min 3 image enrollment (eski 1-image legacy)
- `registerEmbeddingFromImages(employee_id, [img1, img2, img3])`

### Recruitment Funnel FSM
```
applied → screened → interview → offer → hired
                  ↘ rejected (har bosqichdan)
```

### Adaptation Lifecycle
```
planned → day1 → week1 → month1 → month3 → completed
                                          ↘ aborted
```

## API endpointlar
- `GET /api/hr/employees` — xodimlar (hr/admin roli)
- `POST /api/hr/employees` — yangi xodim
- `PATCH /api/hr/employees/:id` — yangilash
- `GET /api/hr/leave-requests` — ta'til so'rovlari
- `POST /api/hr/leave-requests` — yangi so'rov (any employee)
- `PATCH /api/hr/leave-requests/:id/approve` — tasdiqlash (hr roli)
- `GET /api/hr/attendance` — davomad
- `POST /api/hr/attendance/check-in` — kirish
- `POST /api/hr/attendance/check-out` — chiqish
- `GET /api/hr/kpi/:employeeId` — KPI
- `GET /api/hr/discipline` — intizom yozuvlari
- `GET /api/lms/courses` — kurslar
- `POST /api/lms/courses/:id/enroll` — kursga yozilish

## Maxfiylik (MUHIM!)
**Ish haqi ma'lumotlari** — faqat `hr_manager`, `finance_manager`, `super_admin` ko'ra oladi.
**Personal data** (passport, INN, telefon) — admin paneldan tashqari joyda mask qilinadi.
**Face embedding** — bcrypt-style hash emas, raw float vector; faqat similarity-da ishlatiladi.

## Test fayllari
- `apps/api/test/hr/employees-calc.spec.ts` — 20 tests
- `apps/api/test/hr/hr-exhaustive.spec.ts` — 152 tests

## Eslatma
- `useAuth` hooki canonical (`useAuth.tsx`); `use-auth.ts` re-export shim.
- Yangi xodim qo'shishda Zod `EmployeeSchema` (firstName 1-100 char, INN 14 digit, phone `+998...`).
