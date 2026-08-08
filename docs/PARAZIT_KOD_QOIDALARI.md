# EUROPRINT ERP — PARAZIT KOD QOIDALARI

> **Parazit (o'lik, soxta, duplikat) kodni aniqlash, oldini olish va o'chirish qoidalari.**
> §15 (STANDARTLAR.md) umumiy xatolar katalogi. Bu hujjat = AMALIY QO'LLANMA.
> Har yangi commit oldidan bu ro'yxat bo'yicha tekshiring.
> Bog'liq: [STANDARTLAR.md](../STANDARTLAR.md) §15 · [V2_PAPKA_STRUKTURASI.md](V2_PAPKA_STRUKTURASI.md)

---

## 1. PARAZIT KOD NIMA?

```
Parazit kod = loyihada bor, lekin hech narsa qilmaydi (yoki yomon qiladi):
  - SOXTA: `return { ok: true }` — amalni bajarmas, muvaffaqiyat bildiradi
  - O'LIK: import qilinmaydi, chaqirilmaydi, route da yo'q
  - DUPLIKAT: bir xil mantiq ikki joyda (birini o'zgartirsa, ikkinchisi eskiradi)
  - STUB: `throw new Error('not implemented')` — hech qachon bajarilmagan
  - ECHO: kiritilgan ma'lumot DB ga bormay, xuddi shu holda qaytadi
  - PHANTOM: controller mavjud, lekin module.ts da ro'yxatga olinmagan
  - GHOST: FE da ko'rinadi, lekin BE endpoint yo'q (yoki aksincha)
```

---

## 2. PARAZIT TURLAR VA ANIQLASH

### 2.1 SOXTA JAVOB (Fake Response)
```typescript
// ❌ PARAZIT — DB ga bormaydi, har doim "muvaffaqiyat"
@Post('send-notification')
async send(@Body() body: unknown) {
  return { ok: true };           // hech narsa qilmaydi!
}

@Get('analytics')
async getAnalytics() {
  return { data: [], total: 0 }; // DB ga bormaydi
}

// ANIQLASH:
grep -rn "return { ok: true }" apps/api/src/modules/
grep -rn "return \[\]" apps/api/src/modules/
grep -rn "return {}" apps/api/src/modules/
grep -rn "data: \[\]" apps/api/src/modules/

// Ruxsat etilgan (ISTISNO):
return { success: true };  // DELETE dan keyin (real o'chirishdan keyin)
return { data: [] };       // REAL empty list (DB so'rovi bo'sh qaytdi)
```

### 2.2 ECHO PATTERN (Kiritma = Chiqitma)
```typescript
// ❌ PARAZIT — saqlamaydi, kiritilgan ma'lumotni qaytaradi
@Post('employees')
async create(@Body() body: CreateEmployeeDto) {
  return { ...body, id: Math.random() }; // DB INSERT yo'q!
}

// ❌ PARAZIT — hardcoded "muvaffaqiyat"
@Post('payroll/process')
async processPayroll() {
  return { processed: 150, total: 45_000_000 }; // hardcoded raqam!
}
```

### 2.3 STUB (Hech qachon bajarilmagan)
```typescript
// ❌ PARAZIT
async calculateOee(sessionId: number): Promise<number> {
  throw new Error('Not implemented yet'); // hech qachon yozilmagan
  // YOKI:
  return 0.85; // hardcoded OEE!
}

// ❌ PARAZIT — no-op listener
@OnEvent('work_order.completed')
async handleWorkOrderCompleted(event: WorkOrderCompletedEvent) {
  // TODO: QC check yaratish
  console.log('Event received'); // DB ga hech narsa yozilmaydi
}
```

### 2.4 O'LIK KOD (Dead Code)
```typescript
// ❌ PARAZIT — hech qayerda import qilinmaydi
export class LegacyOrderCalculator {
  calculate(items: any[]) { ... } // hech kim chaqirmaydi
}

// ❌ PARAZIT — export qilinmaydi, hech qayerda yo'q
function formatPhoneNumber(phone: string): string { ... } // orphan

// ANIQLASH:
node scripts/check-orphans.mjs  // orphan controller va service
// TS compiler: npx ts-prune  // ishlatilmagan export
```

### 2.5 DUPLIKAT MANTIQ (Duplicate Logic)
```typescript
// ❌ PARAZIT — bir xil hisob ikki joyda
// hr-payroll.controller.ts:
const net = gross * (1 - 0.08 - 0.12); // kontroller da hisob!

// hr-payroll.service.ts:
const net = gross - inps - ndfl; // servis da ham xuddi shu!

// QOIDA: Biznes hisob FAQAT service/domain da.
// Controller: faqat parse, delegate, return.
```

### 2.6 PHANTOM MODULE (Ro'yxatga olinmagan)
```typescript
// ❌ PARAZIT — controller bor, lekin app da yo'q
@Controller('crm/reports')
export class CrmReportsController { ... }
// app.module.ts da: CrmReportsController YO'Q!

// ANIQLASH:
grep -rn "Controller" apps/api/src/modules/ | grep -v ".spec." | grep -v "//.*Controller"
# Topilgan controllerlar app.module.ts da bormi?
```

### 2.7 GHOST ENDPOINT (FE-BE mos kelmaydi)
```typescript
// FE: apiRequest('GET', '/api/hr/employees/skills')
// BE: bu endpoint MAVJUD EMAS → 404

// ANIQLASH:
node scripts/check-fe-api-urls.mjs
# → "7 ta FE apiRequest BE route bilan mos kelmadi"
```

### 2.8 VIEW GA YOZISH (Runtime crash)
```sql
-- ❌ PARAZIT — current_stock VIEW ga INSERT (doim xato)
INSERT INTO current_stock (material_card_id, quantity) VALUES (1, 100);
-- → ERROR: cannot insert into view "current_stock"

-- ❌ PARAZIT — mes_shift_handovers VIEW ga ALTER
ALTER TABLE mes_shift_handovers ADD COLUMN notes TEXT;
-- → ERROR: "mes_shift_handovers" is a view, not a table
```

---

## 3. PARAZIT OLDINI OLISH QOIDALARI

### Qoida P-1: Yangi endpoint = REAL DB
```
Har yangi POST/PATCH/DELETE endpointda:
✅ Drizzle INSERT / UPDATE / DELETE bo'lishi shart
✅ Saqlagandan keyin SELECT (yangilangan holat)
✅ Event emit (agar tegishli bo'lsa)
❌ return { ok: true } yoki return body
```

### Qoida P-2: Event listener = REAL amal
```
@OnEvent('x.created') listener:
✅ Real DB yozuvi yoki boshqa real amal
✅ Test: event emit qilganda DB o'zgardimi?
❌ console.log dan boshqa narsa yo'q
❌ // TODO: implement
```

### Qoida P-3: Har endpoint faqat bir maqsad
```
GET /api/hr/employees     → ro'yxat (FAQAT ro'yxat)
POST /api/hr/employees    → yaratish (FAQAT yaratish)
PATCH /api/hr/employees/:id → yangilash (FAQAT yangilash)

❌ TAQIQ — bir endpoint ikki ish:
POST /api/hr/employees/upsert → create + update aralash
```

### Qoida P-4: Faylni qo'shishdan oldin tekshir
```bash
# Shu nom bilan fayl bor?
find apps/api/src -name "*[nom]*"

# Shu endpoint allaqachon bor?
grep -rn "router.get.*[path]\|@Get.*[path]" apps/api/src/
```

### Qoida P-5: Modul file barrel
```typescript
// modules/hr/hr.module.ts da BARCHA provayderlar ro'yxatga olinishi kerak:
providers: [HrEmployeeService, HrEmployeeRepository, HrPayrollService],
controllers: [HrEmployeeController, HrPayrollController],

// ❌ Controller bor lekin providers da yo'q → Phantom Module
```

---

## 4. PARAZIT KOD O'CHIRISH TARTIB

**Bosqich 1: Aniqlash**
```bash
# Avtomatik tekshiruvlar:
node scripts/check-no-new-stubs.mjs     # yangi stub
node scripts/check-fe-api-urls.mjs       # ghost endpoint
grep -rn "return { ok: true }" apps/api/src/modules/

# Qo'lda tekshirish:
# 1. Har endpoint da real DB amal bormi?
# 2. Har event listener da real amal bormi?
# 3. Har controller module.ts da ro'yxatga olinganmi?
```

**Bosqich 2: Tasdiqlash (Q-29: verify-don't-trust)**
```bash
# O'chirishdan oldin: bu kod rostdan ishlatiladimi?
grep -rn "[fayl-nomi]\|[funksiya-nomi]" apps/api/src/ artifacts/erp-dashboard/src/
# Agar hech nima topilmasa → o'chirish xavfsiz
```

**Bosqich 3: O'chirish**
```bash
# ❌ EMAS: faylni bo'sh qoldirish
# ❌ EMAS: // @deprecated comment va shu yerda qoldirish
# ✅ TO'G'RI: butunlay o'chirish

git rm apps/api/src/modules/legacy/old-crm.service.ts
git add -p  # faqat o'chirilgan fayl
git commit -m "chore(crm): remove dead CrmLegacyService (parazit)"
```

**Bosqich 4: Test**
```bash
npx tsc -p apps/api/tsconfig.json --noEmit  # 0 xato
node scripts/golden-thread-chain-proof.cjs   # oltin zanjir
```

---

## 5. V2 MODUL QURISHDA PARAZIT OLDINI OLISH

### Modul qurishdan oldin (pre-work):
```bash
# 1. Eski modulda nima bor? (parazit vs ishlaydi)
ls apps/api/src/modules/[modul]/

# 2. Eski moduledan qaysilari HAQIQATAN ishlaydi?
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3030/api/[modul]/[endpoint]
# 200 + real data = ishlaydi → V2 ga ko'chirish
# 200 + [] yoki hardcoded = parazit → o'chirish
# 404/500 = ishlamaydi → o'chirish

# 3. FE da bu endpoint ishlatilganmi?
grep -rn "/api/[modul]" artifacts/erp-dashboard/src/
```

### Modul qurishdan keyin (post-work):
```bash
# ✅ Har endpoint uchun tekshir:
# - real DB operatsiya bormi?
# - event emit bormi (kerak bo'lsa)?
# - unit test bormi?
# - integration test bormi?

# ✅ Eski modulni o'chir:
git rm -r apps/api/src/_legacy/[modul]/
git commit -m "chore([modul]): remove v1 legacy (v2 ready)"
```

---

## 6. PRE-COMMIT PARAZIT TEKSHIRUVI

```bash
# Yangi stublar:
node scripts/check-no-new-stubs.mjs

# FE-BE ghost:
node scripts/check-fe-api-urls.mjs

# Forma saqlamaydi:
node scripts/check-form-has-save.mjs

# Qo'lda (har sprint oxirida):
grep -rn "return { ok: true }\|return \[\]\|not.*implement\|TODO.*implement" \
  apps/api/src/modules/ --include="*.ts"
```

---

## 7. PARAZIT KOD KATALOGI (Hozirgi V1 da)

Quyidagilar PARAZIT — V2 da bu pattern takrorlanmasin:

| Tur | Miqdor | Fayl misol |
|-----|--------|-----------|
| `return { ok: true }` | ~50 ta | chat.controller.ts:307 |
| Bo'sh array return | ~30 ta | sd-customers.controller.ts:111 |
| No-op event listener | 13 ta | mes→QC, IoT→MES, pos→GL |
| Hardcoded raqam | ~20 ta | depreciation.service.ts:36 |
| VIEW ga yozish urinishi | 2 ta | current_stock, mes_shift_handovers |
| Phantom controller | 3 ta | CrmReports, FinancialExtended... |
| Ghost endpoint (FE bor, BE yo'q) | 7 ta | /api/cameras, /api/crm/ai/... |
| Duplicate mantiq | ~30 ta | payroll hisob controller va service |

**V2 da BULAR YO'Q bo'lishi shart** — SPRINT_REJA.md bo'yicha qurilayotganda bu qoidalar amal qiladi.

---

*EuroPrint ERP · Parazit Kod Qoidalari · Versiya: 2026-06-18*
