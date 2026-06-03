# Faza 7 — Kechiktirilgan ishlar (DEFERRED)

> Bu fayl IJRO (FE-lint tozalash) davomida topilgan, lekin **tozalash emas, balki
> feature-ulash yoki kontrakt-mos-emasligini** to'g'rilash talab qiladigan ishlarni
> qayd etadi. Bular alohida loyiha sifatida rejalashtirilishi kerak — 1-qatorlik
> bug-fix EMAS.

## Klaster 2 — Yarim-ulangan fayl-yuklash (storage upload oqimi)

Topildi: 2026-05-31, FE-lint Klaster 2 tahlili davomida.

ERP'ning haqiqiy fayl-yuklash pattern'i 2-bosqichli:
1. Faylni `PUT /api/storage/upload?key=...` ga yuklash (`@fastify/multipart`,
   `storage.controller.ts` faylni `uploads/` ga yozadi, URL qaytaradi).
2. Qaytgan URL'ni JSON metadata sifatida tegishli endpoint'ga yuborish.

ChatLayout (S3 presigned) va KnowledgeBase (`/upload` multipart) bu oqimni
to'g'ri bajaradi. Quyidagilar esa **oqimni umuman bajarmaydi** — faylni
to'g'ridan-to'g'ri JSON-only endpoint'ga urinadi, natijada fayl saqlanmaydi:

### 1. EmployeeDialog — profil rasm
- **Fayl:** `artifacts/erp-dashboard/src/components/EmployeeDialog.tsx:194-204` (`handleAfterSubmit`)
- **Muammo:** `FormData` quriladi, lekin BE `POST /api/hr/employees/:id/profile-image`
  ([`hr-employees-ext.controller.ts:42`](../apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts))
  Zod bilan JSON `{ imageUrl: string }` kutadi — FormData/file QABUL QILMAYDI.
- **`catch {}` jim yutadi** → user xato ko'rmaydi, rasm hech qachon saqlanmaydi.
- **Kerak:** file → `PUT /api/storage/upload` → URL → `POST .../profile-image` `{ imageUrl }`.

### 2. DocumentsTab — xodim hujjat/fayl
- **Fayl:** `artifacts/erp-dashboard/src/pages/employee-profile/DocumentsTabDialogs.tsx:60-78` (`handleUpload`)
- **Muammo 1:** `POST /api/employees/:id/files` route BE'da **UMUMAN YO'Q**
  (faqat `GET :id/files` + `DELETE :id/files/:fileId` bor —
  [`employees-compat-sub.controller.ts:168`](../apps/api/src/modules/compatibility/employees-compat-sub.controller.ts)).
  FE 404 oladi, lekin "Fayl muvaffaqiyatli yuklandi" toast ko'rsatadi (yolg'on muvaffaqiyat).
- **Muammo 2:** storage upload oqimi ham ulanmagan (FormData JSON endpoint'ga).
- **Kerak:** file → `PUT /api/storage/upload` → URL → `POST /api/employee-files`
  `{ employeeId, fileUrl, category, description }` (bu route mavjud, JSON metadata qabul qiladi).

### Status
- **TEGILMADI** (2 ta noto'g'ri "FormData 3-arg" fix revert qilindi — BE qabul qilmaydi).
- Bu "kelajakda feature ulash" — 39-Employee / 1C integratsiyasi kabi alohida loyiha.
- Reusable `uploadToStorage(file): Promise<string>` helper yozilsa, ikkala sayt + kelajakdagilar foydalanadi.

## MUHIM kuzatuv
Audit "stub ~20%" deganди — bu yarim-ulangan featurelar o'shalardan. Fayl-yuklash
bittasi; ehtimol boshqalari ham bor (endpoint mismatch ro'yxati — Klaster 3 — buni
qisman ko'rsatadi). Har "bug"ni AVVAL BE bilan tekshirib, "1-qatorlik fix" yoki
"feature-ulash" ekanini ajratish SHART (verify-don't-trust).

## Klaster 3 — FE↔BE endpoint mismatch (47 ta, 2026-05-31 tasniflandi)

`check-fe-api-urls.mjs --verbose` 47 ta mos-kelmaslik topdi. Har biri BE kodi bilan
tekshirildi (general-purpose agent + qo'lda spot-check). Tasnif:

### A) SCRIPT FALSE-POSITIVE (5) — harakat kerak emas
Guard `@Controller`+metod dekoratorini biladi, lekin array-route va bare `@Post()` ni o'tkazib yuboradi:
- POST crm/ai/extended/chat/respond, churn/analyze, voice/analyze-call — `@Post(['x','y'])` array-route (crm-extended.controller.ts:102/114/120) MAVJUD
- POST /api/micro-modules — bare `@Post()` (lms-misc.controller.ts:116) MAVJUD
- (PATCH hr/employees/* — `:id/status` ga mos, lekin bare `:id` boshqa — pastга qara)
> Kelajak: guard'ni array-route'ni tushunadigan qilib yaxshilash mumkin.

### B) 1-QATORLIK FE PREFIKS TYPO — BE handler REAL, XAVFSIZ FIX (verified)
`EmployeeProfile.tsx` IKKALA prefiksni aralash ishlatadi: `/api/employees/*` (TO'G'RI, contracts/passport/bonuses/fines/overtime ishlaydi) va `/api/hr/employees/*` (XATO, BE'da yo'q). BE handlerlar REAL (employees-compat-profile.service, stub emas):
- GET hr/employees/*/payroll-summary → `employees/:id/payroll-summary` (compat-sub:252) — EmployeeProfile.tsx:259
- POST hr/employees/*/salary-history → `employees/:id/salary-history` (compat-sub:227) — EmployeeProfile.tsx:284
- POST hr/employees/*/sick-leaves → `employees/:id/sick-leaves` (compat-sub:234) — EmployeeProfile.tsx:290
- (GET salary-history/sick-leaves queries:171,177 ham xato prefiks)
**Ta'sir:** bugun bu 3 funksiya JIM ishlamaydi (toast "saqlandi" deydi, lekin 404). Sibling tablar ishlaydi. → FE `/api/hr/employees/` → `/api/employees/` (shu sahifada).

Boshqa typo nomzodlar (BE twin boshqa prefiksда, TEKSHIRISH kerak):
- POST sd/forecast/generate → sales/forecast/generate (sales.controller:113)
- POST warehouse/materials → inventory/materials (inventory-materials:109)
- DELETE/POST cameras/* → camera/cameras (iot-camera singular prefiks)
- POST crm/ai/extended/auto-tasks/create → .../suggest

### C) WRONG-METHOD (10) — FE noto'g'ri HTTP fe'l, BE path boshqa metodда
Har biri TEKSHIRISH kerak: BE handler FE kutgan narsani qiladimi?
- DELETE chat/messages/*/pin → BE POST/PATCH (pin toggle)
- PATCH chat/admin/rooms/*/archive → BE POST
- POST camera-settings → BE PUT
- POST hr/abc-analysis/*/calculate → BE GET
- POST marketing/ai-assistant, marketing/nps → BE GET (stub)
- POST material-balance/movements → BE GET (notImplemented)
- POST mm/vendor-performance → BE GET
- PATCH hr/adaptation/* → BE GET only
- PATCH hr/employees/:id → `hr/employees` da faqat PUT :id; `employees` da PATCH :id bor → prefiks YOKI metod
- PUT sd/payments/* → faqat `/mark-paid` sub-path bor

### D) MISSING — HAQIQATAN QURILMAGAN FEATURE (~20) — DEFER
BE handler umuman yo'q (1-qatorlik fix EMAS — feature qurish):
certificates DELETE · marketing budget/calendar/exhibitions/pr DELETE+PATCH · modules DELETE · warehouses DELETE · crm/custom-fields GET-by-id · sd/quotations GET-by-id · progress/summary · hr/employee-corp/:param · hr/ai-interview/session/*/review · chat/rooms/* PATCH · **employees/*/files POST** (Klaster 2!) · **hr/employees/*/documents POST** (Klaster 2, "not yet wired" izoh) · forecasts/run · security/ppe-checks POST · security/visitors POST · warehouse/movements POST
> marketing exhibitions/pr — BE'da `stub()` qaytaradi (audit "stub ~20%" — bular).

### XULOSA
- HAQIQIY 1-qatorlik xavfsiz FIX: **B guruhi (EmployeeProfile prefiks typo, 3-5 chaqiruv)** — eng yuqori qiymat (HR salary/sick-leave/payroll jim buzilgan).
- C guruhi (wrong-method): ehtiyot — har biri BE semantikasini tekshirib, faqat to'g'ri bo'lsa.
- D guruhi: feature qurish, DEFER.

## Klaster 3-C — wrong-method (10 ta, 2026-05-31 tasniflandi)

BE bilan tekshirildi. 10 dan faqat **1 ta** (#4 abc-analysis) haqiqatan xavfsiz fix.
Qolgani: 2 nozik + 7 defer (yarim-feature/stub/yo'q). FIX qilingan: #4 (commit).

### Nozik (body/funksionallik mos emas) — alohida ko'rib chiqish
- **#2 chat archive** (ChatAdminPage.tsx:55): FE `PATCH {archive:bool}` (toggle) → BE
  `@Post('admin/rooms/:roomId/archive')` (chat-ext:156) body'ni O'QIMAYDI, har doim
  arxivlaydi (unarchive YO'Q). Metod PATCH→POST + funksionallik yarim. BE'ga unarchive
  qo'shish kerak yoki FE toggle'ni olib tashlash.
- **#10 sd-payment** (PaymentsTab.tsx:58): FE `PUT /api/sd/payments/:id {status,paidDate}`
  → BE'da bare `:id` yo'q, faqat `@Put('payments/:id/mark-paid')` (sd-quotations:198).
  Path + ehtimol body mos emas.

### DEFER — yarim-feature yoki BE stub/yo'q (feature qurish kerak)
- **#3 camera-settings** (camera-settings.tsx:68): POST→PUT metod xato, LEKIN BE
  `updateCameraSettings` (camera-extended.service.ts:60) FAQAT `camera_id` bo'lsa status
  yangilaydi; 12 ta sozlamani (safety/quality/penalty...) PERSIST QILMAYDI — `Ok({updated:true})`
  qaytaradi, DB'ga yozmaydi. Fayl-yuklash kabi yarim-feature.
- **#5 marketing/ai-assistant** (POST): BE `@Get('ai-assistant')` → `stub()`.
- **#6 marketing/nps** (POST): BE faqat `@Get('nps')` (read), POST/yozish yo'q.
- **#7 material-balance/movements** (POST): BE `@Get('movements')` → `notImplemented`.
- **#8 mm/vendor-performance** (POST): BE faqat `@Get('vendor-performance')` (alias), yozish yo'q.
- **#9 hr/adaptation/:id** (PATCH): BE faqat `@Get('adaptation/:id')` (hr-dashboard:129), PATCH/yozish yo'q.

### FIX qilingan
- **#4 hr/abc-analysis/:id/calculate** (EmployeeStats.tsx:124): POST→GET. BE
  `@Get('abc-analysis/:id/calculate')` (hr-dashboard:277) REAL (getAbcAnalysis dan ID
  topadi, 404 if yo'q). FE body'siz → GET aynan mos. Commit.

### NAQSH (muhim)
"Wrong-method" mismatch'larning ko'pi metod xatosi EMAS — balki BE'da yozish endpoint'i
umuman qurilmagan (FE optimistik POST yozadi, BE'da faqat GET bor yoki stub). Bu yana
"stub ~20%" naqsh. Har "wrong-method"ni BE service tanasigacha tekshirish SHART.

## Klaster 4 — onError (global handler bilan hal qilindi, 2026-05-31)

205 useMutation onError'siz (189 data-mutation POST/PATCH/DELETE/PUT + 16 arzimas).
Yechim: per-mutation emas — bitta GLOBAL MutationCache.onError (queryClient.ts).
DRY: ~10 qator 205 mutationni qoplaydi, mavjud 508 onError'ni buzmaydi (TanStack
ikkalasini chaqiradi). 501-stub jim o'tkaziladi (query handler'dagi pattern bilan bir xil).

### DEFER — CrmRfmClusters (F210) demo soxta-data
- Fayl: artifacts/erp-dashboard/src/pages/CrmRfmClusters.tsx:41-51
- Audit "soxta data POST" da'vosi QISMAN to'g'ri: `genSampleData()` Math.random() bilan
  80 ta SOXTA mijoz RFM yasaydi va `POST /api/crm/rfm/cluster` ga yuboradi.
- BE REAL (crm-analytics.controller.ts:89, K-Means++ k=6, kmeansSvc.cluster — haqiqiy algoritm).
- Ya'ni: algoritm+BE haqiqiy, lekin KIRISH tasodifiy — haqiqiy mijoz RFM'i emas. Demo sahifa.
- onError BOR (xato emas). Past xavf (ma'lumot buzmaydi), lekin chalg'ituvchi (foydalanuvchi
  haqiqiy deb o'ylashi mumkin).
- KERAK: real mijoz RFM ma'lumotini (orders/customers DB'dan) olib yuborish. Bu demo→real
  ulash feature-ishi, onError tozalash emas. DEFER.
