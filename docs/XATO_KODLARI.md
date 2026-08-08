# EUROPRINT ERP — XATO KODLARI KATALOGI

> **Barcha modullar uchun standartlashtirilgan xato kodlari.**
> Result<T> pattern bilan birga ishlaydi: `err(AppErr('HR_001', 'Xato matni'))`.
> Bog'liq: [API_SHARTNOMA.md](API_SHARTNOMA.md) §8 · [STANDARTLAR.md](../STANDARTLAR.md) §4 Result<T>

---

## AppErr Yaratish (Standart)

```typescript
// apps/api/src/common/errors/app-error.ts
export function AppErr(code: string, message: string, details?: unknown): AppError {
  return { code, message, details };
}

// Ishlatish:
return err(AppErr('HR_NOT_FOUND', `Xodim #${id} topilmadi`));
return err(AppErr('SD_VALIDATION', 'Miqdor musbat bo\'lishi kerak', { field: 'quantity' }));
```

---

## 1. UMUMIY (GLOBAL) XATO KODLARI

| Kod | HTTP | Ma'nosi | Misol |
|-----|------|---------|-------|
| `NOT_FOUND` | 404 | Yozuv topilmadi | `Entity #42 topilmadi` |
| `VALIDATION_ERROR` | 400 | Kiritma xato | Zod parse xatosi |
| `UNAUTHORIZED` | 401 | Token yo'q/eskirgan | JWT expired |
| `FORBIDDEN` | 403 | Ruxsat yo'q | Rol yetarli emas |
| `CONFLICT` | 409 | Unikal cheklov | Email allaqachon mavjud |
| `BUSINESS_RULE` | 422 | Biznes qoida | Tasdiqlangan buyurtmani o'chirib bo'lmaydi |
| `NOT_IMPLEMENTED` | 501 | Hali tayyor emas | In-progress funksiya |
| `INTERNAL` | 500 | Server xatosi | DB ulanmadi, kutilmagan |

---

## 2. HR MODULI XATOLARI (`HR_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `HR_NOT_FOUND` | 404 | Xodim topilmadi | `hr_employees.id` yo'q |
| `HR_ALREADY_EXISTS` | 409 | Xodim allaqachon bor | Email/tabel takror |
| `HR_FUNCTION_REQUIRED` | 422 | Lavozim ko'rsatilmagan | `org_function_id` null |
| `HR_RAZRYAD_INVALID` | 422 | Razryad noto'g'ri | `razryad_level_id` 1-6 emas |
| `HR_PAYROLL_CLOSED` | 422 | Davr yopilgan | Yopiq davr o'zgartirib bo'lmaydi |
| `HR_LEAVE_OVERLAP` | 422 | Ta'til ustma-ust | Sana oralig'i boshqa ta'til bilan mos |
| `HR_INSUFFICIENT_BALANCE` | 422 | Ta'til balansi yetarli emas | Qolgan kun kamroq |

---

## 3. SD (SAVDO) MODULI XATOLARI (`SD_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `SD_ORDER_NOT_FOUND` | 404 | Buyurtma topilmadi | `sales_orders.id` yo'q |
| `SD_CUSTOMER_NOT_FOUND` | 404 | Mijoz topilmadi | `sd_customers.id` yo'q |
| `SD_CANNOT_CANCEL` | 422 | Bekor qilib bo'lmaydi | Status `IN_PROGRESS` yoki `COMPLETED` |
| `SD_CANNOT_CONFIRM` | 422 | Tasdiqlab bo'lmaydi | Allaqachon tasdiqlangan |
| `SD_INVALID_QUANTITY` | 422 | Miqdor noto'g'ri | 0 yoki manfiy |
| `SD_PRICE_REQUIRED` | 422 | Narx ko'rsatilmagan | Narx manba aniqlanmagan |
| `SD_DELIVERY_DATE_PAST` | 422 | Sana o'tgan | `delivery_date` bugundan oldin |

---

## 4. PP (ISHLAB CHIQARISH REJASI) XATOLARI (`PP_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `PP_WORK_ORDER_NOT_FOUND` | 404 | Ish buyurtmasi topilmadi | `work_orders.id` yo'q |
| `PP_TECH_CARD_NOT_FOUND` | 404 | Texnologik karta topilmadi | `technology_cards.id` yo'q |
| `PP_CAPACITY_EXCEEDED` | 422 | Quvvat oshib ketdi | Ish markazida joy yo'q |
| `PP_MATERIAL_INSUFFICIENT` | 422 | Material yetarli emas | BOM dan kamroq stok |
| `PP_CANNOT_RELEASE` | 422 | Ishga tushirib bo'lmaydi | Material zaxirasiz |
| `PP_WORK_ORDER_ACTIVE` | 422 | Ish buyurtmasi faol | Bekor qilib bo'lmaydi |

---

## 5. MES (ISHLAB CHIQARISH IJROSI) XATOLARI (`MES_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `MES_SESSION_NOT_FOUND` | 404 | Sessiya topilmadi | `production_sessions.id` yo'q |
| `MES_SESSION_ACTIVE` | 422 | Sessiya allaqachon faol | Ikkinchi sessiya ochib bo'lmaydi |
| `MES_SHIFT_NOT_ACTIVE` | 422 | Smena faol emas | Smena boshlanmagan |
| `MES_OPERATOR_NOT_ASSIGNED` | 422 | Operator biriktirilmagan | `operator_id` null |
| `MES_QUANTITY_EXCEEDED` | 422 | Miqdor oshib ketdi | Rejalashtirilgandan ko'p |
| `MES_WORK_CENTER_BUSY` | 422 | Ish markazi band | Boshqa buyurtma bajarilmoqda |

---

## 6. QC (SIFAT NAZORATI) XATOLARI (`QC_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `QC_CHECK_NOT_FOUND` | 404 | Tekshiruv topilmadi | `quality_checks.id` yo'q |
| `QC_ALREADY_COMPLETED` | 422 | Tekshiruv tugallangan | Qayta o'zgartirib bo'lmaydi |
| `QC_INVALID_DEFECT_CODE` | 422 | Nuqson kodi noto'g'ri | `defect_catalog.code` da yo'q |
| `QC_QUANTITY_MISMATCH` | 422 | Miqdor mos kelmaydi | Tekshirilgan + brak > ishlab chiqarilgan |

---

## 7. WMS (OMBOR) XATOLARI (`WMS_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `WMS_MATERIAL_NOT_FOUND` | 404 | Material topilmadi | `material_cards.id` yo'q |
| `WMS_INSUFFICIENT_STOCK` | 422 | Zaxira yetarli emas | `warehouse_stock.quantity` < kerak |
| `WMS_WAREHOUSE_NOT_FOUND` | 404 | Ombor kodi noto'g'ri | `warehouse_code` ro'yxatda yo'q |
| `WMS_CANNOT_WRITE_VIEW` | 500 | VIEW ga yozib bo'lmaydi | `current_stock` VIEW — INSERT TAQIQ |
| `WMS_MOVEMENT_LOCKED` | 422 | Harakat bloklangan | Inventarizatsiya davomida |

---

## 8. FIN (MOLIYA) XATOLARI (`FIN_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|---------|-------|
| `FIN_ACCOUNT_NOT_FOUND` | 404 | Hisob topilmadi | `accounts.code` yo'q |
| `FIN_DEBIT_CREDIT_MISMATCH` | 422 | Balans mos kelmaydi | Debet ≠ Kredit (GL) |
| `FIN_PERIOD_LOCKED` | 422 | Davr qulflangan | Yopiq davr o'zgartirib bo'lmaydi |
| `FIN_INVOICE_PAID` | 422 | Faktura to'langan | To'langan fakturani o'chirib bo'lmaydi |
| `FIN_BUDGET_EXCEEDED` | 422 | Byudjet oshib ketdi | So'ralgan summa limit dan yuqori |
| `FIN_SAP76_FORBIDDEN` | 500 | SAP#76 taqiq | `gl_journal_entries` ga yozish urinishi |

---

## 9. CRM XATOLARI (`CRM_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `CRM_LEAD_NOT_FOUND` | 404 | Lead topilmadi | `crm_leads.id` yo'q |
| `CRM_DEAL_NOT_FOUND` | 404 | Deal topilmadi | `crm_deals.id` yo'q |
| `CRM_ASSIGNED_REQUIRED` | 422 | Mas'ul ko'rsatilmagan | `assigned_by_id` NOT NULL |
| `CRM_CANNOT_CONVERT` | 422 | Konversiya mumkin emas | Lead holati CLOSED_LOST |
| `CRM_DUPLICATE_CONTACT` | 409 | Kontakt takror | Telefon/email allaqachon bor |

---

## 10. AUTH XATOLARI (`AUTH_*`)

| Kod | HTTP | Holat | Sabab |
|-----|------|-------|-------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Login/parol noto'g'ri | — |
| `AUTH_TOKEN_EXPIRED` | 401 | Token eskirgan | JWT exp o'tgan |
| `AUTH_TOKEN_INVALID` | 401 | Token buzilgan | Imzo mos kelmaydi |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh token eskirgan | Qayta kirish kerak |
| `AUTH_ROLE_INSUFFICIENT` | 403 | Rol yetarli emas | `@Roles()` cheklov |
| `AUTH_OTP_EXCEEDED` | 429 | OTP urinishlari tugadi | 5/5min limit |
| `AUTH_PASSWORD_WEAK` | 400 | Parol zaif | Min 8 belgi, 1 raqam, 1 katta harf |

---

## Controller da Xato Qaytarish

```typescript
// Service Result<T> → Controller HTTP xato:
const result = await this.service.findEmployee(id);
if (!result.ok) {
  switch (result.error.code) {
    case 'HR_NOT_FOUND':
      throw new NotFoundException(result.error.message);
    case 'HR_PAYROLL_CLOSED':
      throw new UnprocessableEntityException(result.error.message);
    default:
      throw new InternalServerErrorException(result.error.message);
  }
}
return result.data;

// Yoki yagona yordamchi:
import { unwrapOrThrow } from '@common/result/unwrap-or-throw';
return unwrapOrThrow(await this.service.findEmployee(id));
```

---

*EuroPrint ERP · Xato Kodlari · Versiya: 2026-06-18*
