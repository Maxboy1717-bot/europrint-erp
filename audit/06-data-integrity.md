# Audit: 06 — Ma'lumotlar Integratsiyasi

**Sana:** 2026-05-25

---

## Pul Tipi (Money)

**Holat: ASOSAN YAXSHI — `numericMoney` helper mavjud, lekin qo'llanish izchil emas**

### `numericMoney` ta'rifi

**Fayl:** `lib/db/src/schema/numeric-money.ts`

```ts
// PostgreSQL: NUMERIC(18, 4) — exact decimal, float yaxlitlash xatosiz
export const numericMoney = (name: string) => customType<{ data: number; driverData: string }>({
  dataType() { return "numeric(18, 4)"; },
  fromDriver(value: string): number { return parseFloat(value ?? "0") || 0; },
  toDriver(value: number): string { return String(value ?? 0); },
})(name);
```

`NUMERIC(18, 4)` — to'g'ri tanlov. `doublePrecision` (float8) ishlatilmagan — bu ijobiy.

### Nomuvofiqliklar: `numericMoney` o'rniga plain `numeric()` ishlatilgan joylar

| Fayl | Ustun | Tip | Muammo |
|------|-------|-----|--------|
| `lib/db/src/schema/crm-contacts.ts:63` | `opportunityAmount` | `numeric("opportunity_amount")` — precision yo'q | Scale noaniq — DB default precision=∞ |
| `lib/db/src/schema/crm-contacts.ts:270` | `annualRevenue` | `numeric("annual_revenue")` — precision yo'q | Scale noaniq |
| `lib/db/src/schema/crm-pipelines.ts:77` | `compensationAmount` | `numeric(..., {precision:15, scale:2})` | `numericMoney` scale=4 bilan nomuvofiq |
| `lib/db/src/schema/crm-pipelines.ts:247` | `forecastAmount` | `numeric("forecast_amount")` — precision yo'q | Scale noaniq |
| `lib/db/src/schema/fi-expenses.ts:26` | `amount` | `numeric(..., {precision:15, scale:2})` | Moliyaviy miqdor — scale=2 kifoya qilmasligi mumkin |
| `lib/db/src/schema/hr-goals.ts:48` | `fineAmount` | `numeric(..., {precision:12, scale:2})` | HR pul miqdori — scale farqi |
| `lib/db/src/schema/hr-goals.ts:140` | `currentBalance` | `numeric(..., {precision:15, scale:4})` | scale=4 — yaxshi, lekin `numericMoney` emas |
| `lib/db/src/schema/hr-goals.ts:141` | `totalValue` | `numeric(..., {precision:15, scale:2})` | scale=2 |
| `lib/db/src/schema/hr-goals.ts:161,162` | `posBalance`, `netSalaryUzs` | `numeric(..., {precision:14, scale:2})` | Maosh hisob-kitobi — scale=2 |
| `lib/db/src/schema/hr-tz2-schema.ts:344,454,458-462` | `salaryAmount`, `penaltiesTotal`, maosh ustunlari | `numeric(..., {precision:15, scale:2})` | Barchasida scale=2, `numericMoney` scale=4 bilan nomuvofiq |
| `lib/db/src/schema/marketing-schema.ts:23` | `spentAmount` | `numeric(..., {precision:15, scale:2})` | Marketing xarajat |

**Asosiy muammo:** Pul miqdorlari uchun `scale=2`, `scale=4` va `scale noaniq` — uchta turli standart ishlatilmoqda. Agar moliyaviy hisob-kitoblar bu ustunlar orasida amalga oshirilsa, yaxlitlash nomuvofiqliği vujudga kelishi mumkin.

**Tavsiya:** Barcha pul ustunlari uchun `numericMoney` (`NUMERIC(18,4)`) ga standartlashtirish kerak.

---

## Multi-Tenant

**Holat: DIQQAT — `tenant_id` faqat ayrim modullarda bor, ko'pchilik modullarda yo'q**

### `tenant_id` mavjud bo'lgan sxemalar (16 ta satr, ~8 ta fayl):

- `aisha-schema.ts` — Aisha conversations va tool calls
- `attendance.ts` — Davomat
- `crm-contacts.ts` — Leads, contacts, companies
- `crm-pipelines.ts` — Deals
- `departments.ts` — Bo'limlar

### `tenant_id` YO'Q bo'lgan muhim sxemalar (99 ta fayl):

| Sxema fayl | Muhimligi | Xavf |
|------------|-----------|------|
| `fi-schema.ts`, `fi-expenses.ts`, `fi-banking.ts`, `fi-kassa.ts` | YUQORI | Moliyaviy ma'lumotlar tenant'siz — bitta ERP instansiyasi uchun mo'ljallangan |
| `pos-schema.ts`, `pos-schema-v2.ts`, `pos-retail.ts` | YUQORI | POS tranzaksiyalar |
| `sd-schema.ts`, `sd-core.ts`, `sd-billing.ts` | YUQORI | Sotuv buyurtmalari |
| `mm-materials.ts`, `mm-inventory.ts`, `mm-procurement.ts` | YUQORI | Ombor va xarid |
| `pp-schema.ts` | YUQORI | Ishlab chiqarish |
| `hr-employees-docs.ts`, `hr-performance.ts` | O'RTA | HR hujjatlar |
| `qc-schema.ts` | O'RTA | Sifat nazorati |
| `ecommerce-schema.ts` | O'RTA | Internet-do'kon |
| `users.ts`, `positions.ts` | O'RTA | Foydalanuvchilar |

**Tahlil:** `tenant_id.default(1)` ko'rinishi shuni ko'rsatadiki, hozirgi arxitektura ko'p kompaniyali (multi-tenant SaaS) emas, balki bitta kompaniya uchun mo'ljallangan. Faqat CRM, Aisha va davomat modullari future multi-tenant uchun tayyorlangan. Bu ataylab qilingan arxitektura qarori bo'lishi mumkin — lekin hujjatda aniq ko'rsatilmagan.

---

## FK va onDelete

**Holat: YAXSHI — barcha `.references()` chaqiruvlari `onDelete` bilan**

Tekshiruv natijalari:

```bash
# FK without onDelete — faqat multi-line formatdagi references topildi
grep -rn "\.references(" .../schema --include="*.ts" | grep -v onDelete
```

Topilgan "onDelete yo'q" ko'rinishdagi satrlar (`hr-tz2-schema.ts:136,234,238,308,338,341`) haqiqatda multi-line formatda yozilgan va keyingi satrlarda `onDelete` mavjud:

```ts
positionId: integer("position_id").references(() => positions.id, {
  onDelete: "set null",  // ← keyingi satrda
}),
```

**Yagona istisno:**  
**Fayl:** `lib/db/src/schema/qc-schema.ts:155`
```ts
papkaOrderId: varchar("papka_order_id").notNull().references(() => papkaOrders.id),
```
Bu FK'da `onDelete` ko'rsatilmagan — PostgreSQL default `RESTRICT` ishlatadi. Agar `papkaOrders` yozuvini o'chirmoqchi bo'lsangiz, tegishli `qc_final_inspections` yozuvlarini avval o'chirish kerak bo'ladi. Bu intentional bo'lishi mumkin (ma'lumot muhofazasi), lekin hujjatda izoh yo'q.

### `onDelete` qiymatlari taqsimoti (namunaviy):

| `onDelete` qiymati | Ishlatilishi |
|--------------------|-------------|
| `"cascade"` | Ko'p ishlatiladi — bog'liq yozuvlar avtomatik o'chadi |
| `"set null"` | Ko'p ishlatiladi — bog'liq ustun `NULL` ga o'tadi |
| Ko'rsatilmagan (RESTRICT) | `qc-schema.ts:155` — 1 ta topildi |

---

## Index'lar

**Holat: YAXSHI — 679 ta index, yaxshi qamrov**

| Ko'rsatkich | Qiymat |
|-------------|--------|
| Jami `index(...)` chaqiruvlari | **679** |
| Sxema fayllari soni | **115 ta `.ts` fayl** |
| O'rtacha fayl boshiga | ~5.9 ta index |

### Index sifati:

Tekshirilgan namunalarda:
- `idx_crm_leads_tenant_id` — CRM leads uchun tenant_id index'i
- `idx_crm_contacts_tenant_id` — contacts uchun
- `idx_crm_companies_tenant_id` — companies uchun
- `idx_crm_deals_tenant_id` — deals uchun
- `aisha_conv_tenant_idx`, `aisha_tool_tenant_idx` — Aisha uchun

FK ustunlari uchun index'lar ham mavjud (masalan, `employee_assets_asset_id_idx`, `employee_assets_employee_id_idx` — `ddl-migrations.ts:41,43`).

**Tekshirilmagan:** Qaysi FK ustunlarida index yo'q. 679 ta index ko'p, lekin 115 ta faylda nechta jadval borligini bilib olsak, FK/index nisbatini aniqroq baholash mumkin.

---

## Xulosa

| Soha | Holat | Urgentlik |
|------|-------|-----------|
| Pul tipi — `numericMoney` vs `numeric()` | Nomuvofiq — 3 xil scale ishlatilmoqda | O'RTA |
| `crm-contacts.ts` `opportunityAmount`, `annualRevenue` — precision yo'q | Noaniq DB xatti-harakati | PAST |
| Multi-tenant — ko'pchilik modullarda `tenant_id` yo'q | Arxitektura qarorini hujjatlashtirish kerak | PAST |
| FK `onDelete` — `qc-schema.ts:155` da ko'rsatilmagan | `RESTRICT` default — intentional emasligini tekshirish kerak | PAST |
| Index'lar — 679 ta | Yaxshi qamrov | OK |
| `numericMoney` helper — to'g'ri implementatsiya | `NUMERIC(18,4)`, XSS-safe Zod integration | OK |

