# Audit: 04 — Endpoint Diff

**Sana:** 2026-05-25

---

## Backend Endpoint'lar (Jami)

`apps/api/src/modules` ichidan `@Get/@Post/@Put/@Patch/@Delete` dekoratorlari orqali extract qilindi.

| HTTP Method | Soni |
|-------------|------|
| GET | 1545 |
| POST | 754 |
| PATCH | 282 |
| DELETE | 153 |
| PUT | 100 |
| **Jami** | **2834** |

---

## Frontend Chaqiruvlari (Jami)

`artifacts/erp-dashboard/src` ichida `apiRequest(...)` va `fetch(...)` usullari orqali.

| Manba | Soni |
|-------|------|
| `apiRequest(METHOD, path)` | ~1913 ta chaqiruv |
| `fetch('/api/...')` | 6 ta chaqiruv |
| **Jami** | ~1919 |

---

## CRM Moduli: Frontend ↔ Backend Tahlil

Bu modul eng katta va eng yaxshi o'rganilgan modul sifatida namunaviy tekshirildi.

### CRM Backend Controller'lari (prefix'lar)

| Fayl | Controller Prefix |
|------|-------------------|
| `crm-activities.controller.ts` | `crm/activities` |
| `crm-ai-extended.controller.ts` | `crm/ai` |
| `crm-ai.controller.ts` | `crm` |
| `crm-analytics.controller.ts` | `crm` |
| `crm-bitrix-compat.controller.ts` | `crm-bitrix` |
| `crm-companies.controller.ts` | `crm` |
| `crm-contacts.controller.ts` | `crm` |
| `crm-custom-fields.controller.ts` | `crm/custom-fields` |
| `crm-deals.controller.ts` | `crm/deals` |
| `crm-leads.controller.ts` | `crm/leads` |
| `crm-leads-ops.controller.ts` | `crm/leads` |
| `crm-followup-compat.controller.ts` | `crm/followup-activities` |

---

## BE-Only (FE chaqirmaydi — orphan endpoints)

Quyidagi backend endpoint'lar frontend tomonidan chaqirilmayapti. Ba'zilari admin panel yoki webhook uchun mo'ljallangan bo'lishi mumkin, lekin hujjat yo'q.

| Endpoint | Modul | Izoh |
|----------|-------|------|
| `POST /crm/auto-lead/call` | crm | Ichki avtomatlashtirish |
| `POST /crm/auto-lead/form` | crm | Ichki avtomatlashtirish |
| `POST /crm/auto-lead/telegram` | crm | Ichki avtomatlashtirish |
| `POST /crm/auto-lead/website` | crm | Webhook endpoint |
| `POST /crm/churn/retrain` | crm | Admin/ML operatsiyasi |
| `POST /crm/email/send` | crm | Server-side email |
| `POST /crm/meetings/schedule` | crm | Server-side |
| `POST /crm/sms/send` | crm | Server-side SMS |
| `POST /crm/whatsapp/send` | crm | Server-side |
| `GET /crm/robots` | crm-bitrix | FE `crm-bitrix/robots` ni ishlatadi, bu to'g'ri |
| `GET /crm/nba` | crm | Har ikkisi ham bor, lekin FE POST ishlatadi |

---

## FE-Only (BE yo'q — 404 xavfi)

Bu endpoint'lar frontend tomonidan chaqiriladi, lekin backend'da mos `@Controller` + `@Method` juftligi topilmadi.

| Endpoint (FE chaqiruvi) | FE Fayl joylashuvi | Muammo |
|-------------------------|---------------------|--------|
| `POST /api/ai/crm/score-lead/:leadId` | `artifacts/erp-dashboard/src` | **BE'da `/ai/crm/score-lead/:leadId` bor** — yo'l to'g'ri, lekin FE `ai/crm` prefix'ini `/api/ai/crm` sifatida yuboradi. Bu to'g'ri ishlashi kerak. |
| `POST /api/ai/crm/deal-probability/:dealId` | `artifacts/erp-dashboard/src` | Yuqoridagi bilan bir xil holat |
| `POST /api/ai/crm/churn-risk/:contactId` | `artifacts/erp-dashboard/src` | Yuqoridagi bilan bir xil holat |
| `POST /api/ai/crm/next-best-action/:dealId` | `artifacts/erp-dashboard/src` | Yuqoridagi bilan bir xil holat |
| `POST /api/marketing/leads/:id/convert-to-crm` | `artifacts/erp-dashboard/src` | Marketing modulida bu endpoint tekshirilmadi |

---

## Verb Mismatch (Potensial)

| Endpoint | FE Verb | BE Verb | Xavf |
|----------|---------|---------|------|
| `/api/crm/activities/:id` | `PATCH` (done/complete) | `PATCH` | Mos — ammo ikkita path variant bor: `/complete` va `/done`. BE'da faqat `/complete` mavjud. FE `activityId/done` ham ishlatgan — **404 xavfi** |
| `/api/crm/robots/:id/toggle` | `PATCH` | `PATCH` | Mos |
| `/api/crm/robots/:id` | `PUT` | `PUT` | Mos |

### Aniq 404 xavfi:
- **Fayl:** `artifacts/erp-dashboard/src` ichida `apiRequest("PATCH", \`/api/crm/activities/${id}/done\`)`  
  BE'da `@Patch(':id/complete')` bor, lekin `@Patch(':id/done')` yo'q. FE ikkala variant bilan murojaat qilmoqda.

---

## Sandbox Cheklovlari

- Backend endpoint'lar `grep` bilan extract qilindi — controller prefix'lari va metod yo'llari alohida ustunga tushirilmadi. Haqiqiy diff uchun NestJS routing reflection yoki Swagger spec taqqoslash kerak.
- Frontend `apiRequest` funksiyasida dinamik yo'llar (`${getChatApiBase()}`) to'liq tekshirilmadi.
- FE-da `getChatApiBase()` funksiyasi orqali beriladigan chat endpoint'lar alohida tekshirilmadi.
- `crm-extended.controller.ts (compatibility)` moduli `marketing` prefix'i bilan overlap qiladi — bu ataylab bo'lishi mumkin.

