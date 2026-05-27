# 📦 EuroPrint ERP — Modul Reestri

> **Yangilangan:** 2026-05-27  
> **Qo'llab-quvvatlash:** Har yangi sessiyada modul holatini shu fayldan tekshiring.

## Status Tizimi

| Belgi | Status | Ma'nosi |
|-------|--------|---------|
| 🟢 | **BLESSED** | Kanonik, duplikat belgilangan, testlangan, owner himoyasida |
| 🔵 | **INVENTORY** | Audit o'tkazildi, kanonik tanlab belgilandi, @deprecated marker'lar qo'shildi |
| ⚪ | **NOT_YET** | Hali audit o'tkazilmagan |

---

## HR Domain

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| HR Employees (Xodimlar) | 🟢 **BLESSED** 2026-05-27 | [hr-employees.md](hr-employees.md) | @Maxboy1717-bot |
| HR Leave & Attendance | ⚪ NOT_YET | — | — |
| HR Payroll | ⚪ NOT_YET | — | — |
| HR Recruitment | ⚪ NOT_YET | — | — |
| HR Onboarding | ⚪ NOT_YET | — | — |

## Finance Domain

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| Finance AR (Accounts Receivable) | ⚪ NOT_YET | — | — |
| Finance AP (Accounts Payable) | ⚪ NOT_YET | — | — |
| Finance GL (General Ledger) | ⚪ NOT_YET | — | — |
| Finance Payroll GL | ⚪ NOT_YET | — | — |

## Production Domain (MES/PP)

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| Production Orders | ⚪ NOT_YET | — | — |
| Production Sessions | ⚪ NOT_YET | — | — |
| Quality Control | ⚪ NOT_YET | — | — |
| Equipment / OEE | ⚪ NOT_YET | — | — |

## Sales Domain (SD)

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| Sales Orders | ⚪ NOT_YET | — | — |
| Sales Customers | ⚪ NOT_YET | — | — |
| Sales Quotations | ⚪ NOT_YET | — | — |

## Procurement Domain (MM)

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| Purchase Orders | ⚪ NOT_YET | — | — |
| Vendors | ⚪ NOT_YET | — | — |

## Warehouse Domain (WMS)

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| WMS Movements | ⚪ NOT_YET | — | — |
| WMS Catalog | ⚪ NOT_YET | — | — |

## POS Domain

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| POS Monitor | ⚪ NOT_YET | — | — |
| POS Products | ⚪ NOT_YET | — | — |

## Auth Domain

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| Auth (Login/JWT) | ⚪ NOT_YET | — | — |
| Users | ⚪ NOT_YET | — | — |

## Shared / Infrastructure

| Modul | Status | Hujjat | Mas'ul |
|-------|--------|--------|--------|
| DB Schema (lib/db) | ⚪ NOT_YET | — | — |
| i18n (UZ/RU/UZ-CYR) | ⚪ NOT_YET | — | — |
| Notifications | ⚪ NOT_YET | — | — |

---

## 🔵 INVENTORY Modullari — Ochiq Muammolar

### HR Employees (2026-05-27)

Quyidagi ishlar bajarilishi kerak (BLESSED bo'lishdan oldin):
1. `create-employee.handler.ts` — TxOutcome pattern tiklash (`8b763a0b` revert)
2. FE URL drift — `/api/employees` → `/api/hr/employees`
3. `@deprecated` header — 14 BE compat fayli + 6 FE dup sahifa
4. `lib/types/employee.ts` — markaziy tip ta'rifi
5. `e2e/hr-employees.spec.ts` — E2E test

Batafsil: [hr-employees.md](hr-employees.md#-ochiq-muammolar-blessed-bolishdan-oldin-hal-qilinishi-kerak)

---

## 📅 BLESSING Tarixnomasi

| Sana | Modul | Status | Kim |
|------|-------|--------|-----|
| 2026-05-27 | HR Employees (Xodimlar) | 🟢 BLESSED | @Maxboy1717-bot |
| — | — | — | — |

---

## 📋 Yangi Modul BLESSED Qilish Tartibi

Har bir modul uchun "BLESSING CEREMONY" (5 bosqich):

**Bosqich 1 — Inventarizatsiya** (2 soat)
- `docs/modules/<modul>.md` yarating
- DB jadvallar, BE controllers, FE sahifalar ro'yxati

**Bosqich 2 — Kanonizatsiya** (1 kun)
- Kanonik fayl(lar) belgilash
- Boshqalariga `@deprecated` header qo'yish

**Bosqich 3 — FE-BE kontrakt sinxron** (4 soat)
- `lib/types/<modul>.ts` markaziy tip
- URL'lar `/api/<domain>/<modul>` formatda

**Bosqich 4 — E2E test** (4 soat)
- `e2e/<modul>.spec.ts` — login → list → CRUD → verify

**Bosqich 5 — BLESSED** (30 daqiqa)
- `docs/modules/<modul>.md` ga `STATUS: BLESSED`
- Bu faylni yangilash
- `.github/CODEOWNERS` ga qo'shish
