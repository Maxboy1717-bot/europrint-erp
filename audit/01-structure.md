# Audit: 01 — Loyiha Strukturasi

**Sana:** 2026-05-25
**Auditor:** Claude (mustaqil tahlil)
**Qoida:** Hech qanday mavjud audit/rapor `.md` fayli o'qilmadi. Barcha raqamlar real bash buyruqlari natijasi.

---

## Backend Modullar

| Modul | LOC | Controller | Service | Spec |
|---|---:|---:|---:|---:|
| adaptation | 9 | 0 | 1 | 0 |
| admin | 1996 | 5 | 7 | 0 |
| agents | 2103 | 1 | 17 | 0 |
| ai | 8699 | 15 | 25 | 6 |
| ai-agents | 2140 | 1 | 8 | 0 |
| aisha | 3714 | 3 | 6 | 0 |
| applications | 10 | 0 | 1 | 0 |
| auth | 2159 | 3 | 7 | 0 |
| bot-gateway | 978 | 1 | 0 | 0 |
| camera | 4 | 0 | 1 | 0 |
| chat | 4689 | 6 | 10 | 1 |
| common | 603 | 1 | 4 | 0 |
| communication-center | 4408 | 6 | 10 | 0 |
| compatibility | 15344 | 32 | 41 | 0 |
| core | 2229 | 4 | 3 | 0 |
| crm | 11796 | 15 | 27 | 11 |
| design | 1476 | 2 | 3 | 0 |
| director | 6482 | 12 | 13 | 1 |
| ecommerce | 1598 | 6 | 2 | 1 |
| erp | 2033 | 4 | 4 | 1 |
| export | 255 | 1 | 1 | 0 |
| feedback-360 | 5 | 0 | 1 | 0 |
| fi | 5 | 0 | 1 | 0 |
| finance | 13351 | 31 | 31 | 0 |
| general | 1341 | 3 | 2 | 0 |
| hr | 35350 | 46 | 72 | 2 |
| hr-assets | 12 | 0 | 2 | 0 |
| integration | 1711 | 5 | 3 | 0 |
| iot | 6164 | 12 | 10 | 0 |
| kanban | 6104 | 8 | 6 | 0 |
| legacy | 246 | 3 | 2 | 0 |
| lms | 4766 | 12 | 12 | 0 |
| logistics | 1844 | 1 | 5 | 0 |
| marketing | 2144 | 4 | 3 | 0 |
| mes | 3175 | 5 | 6 | 0 |
| mm | 4006 | 7 | 7 | 0 |
| mro | 1520 | 1 | 2 | 0 |
| notifications | 2347 | 1 | 7 | 0 |
| order-workflow | 1507 | 1 | 0 | 0 |
| org-structure | 1437 | 1 | 3 | 0 |
| pos | 16850 | 21 | 52 | 0 |
| pos-v2 | 2106 | 4 | 0 | 0 |
| pp | 6907 | 10 | 21 | 0 |
| qc | 6051 | 9 | 13 | 0 |
| queue | 1130 | 0 | 1 | 0 |
| remaining | 5137 | 12 | 12 | 0 |
| sd | 6913 | 10 | 9 | 1 |
| security | 1765 | 2 | 3 | 1 |
| shared | 1034 | 0 | 2 | 0 |
| storage | 140 | 1 | 0 | 0 |
| wms | 8681 | 22 | 22 | 1 |

**Jami backend LOC:** 244 984
**Jami modul soni:** 52
**Jami spec fayllari:** 26 (faqat 10 modulda test mavjud)

### Stub-marker topilgan modullar (nisbat boyicha tartiblangan)

| Modul | Endpointlar | Stub-markerlar | Baho |
|---|---:|---:|---|
| aisha | 5 | 33 | KRITIK — markerlar endpointdan 6x kop |
| marketing | 99 | 60 | KRITIK — deyarli hammasi stub |
| ai-agents | 12 | 18 | KRITIK nisbat |
| security | 25 | 10 | JIDDIY — xavfsizlik moduli ozi stub |
| design | 22 | 12 | YUQORI nisbat |
| iot | 137 | 50 | YUQORI |
| mm | 69 | 22 | YUQORI |
| hr | 448 | 76 | ORTA (hajmga nisbatan) |
| finance | 174 | 30 | ORTA |
| pos | 149 | 27 | ORTA |
| wms | 157 | 30 | ORTA |
| integration | 69 | 14 | ORTA |
| compatibility | 363 | 14 | PAST nisbat |

---

## Frontend

- Sahifalar (/pages/**/*.tsx): **1 311 ta**
- Komponentlar (/components/**/*.tsx): **626 ta**
- Jami frontend LOC: **363 624**

---

## Build Holati

- TypeScript xatolari: aniqlab bolmadi
- Sabab: tsc binary node_modules/.bin/tsc yolida topilmadi (pnpm workspace har paketga alohida node_modules yaratadi; root darajasida tsc yoq)
- Runtime xatolari tekshirilmadi

---

## Migrations

- Schema TypeScript fayllari (lib/db/**/*.ts): **260**
- SQL migration fayllari (apps/api/drizzle/*.sql): **17**
- SQL migration fayllari (lib/db/drizzle/*.sql): **15**
- Jami SQL migratsiyalar: **32**

---

## Git Faolligi (oxirgi 2 hafta)

- Commit soni: **220** (juda faol rivojlanish)

| Ozgarish soni | Fayl |
|---:|---|
| 17 | docs/hr-progress.md |
| 15 | apps/api/src/modules/hr/hr.module.ts |
| 15 | artifacts/erp-dashboard/src/locales/ru/common.json |
| 14 | apps/api/src/app.module.ts |
| 13 | artifacts/erp-dashboard/src/locales/uz/common.json |
| 11 | artifacts/erp-dashboard/src/locales/ru/warehouse.json |
| 10 | artifacts/erp-dashboard/src/locales/uz/warehouse.json |
| 10 | artifacts/erp-dashboard/src/locales/uz/hr.json |
| 10 | artifacts/erp-dashboard/src/locales/uz/crm.json |
| 10 | apps/api/src/modules/iot/presentation/iot-main.controller.ts |
| 9 | artifacts/erp-dashboard/src/pages/OrgChartPage.tsx |
| 9 | apps/api/src/modules/crm/crm.module.ts |
| 8 | pnpm-lock.yaml |

---

## Anomaliyalar

1. **Test qamrovi kritik past** — 52 moduldan faqat 10 tasida spec fayli bor. compatibility (363 endpoint, 15 344 LOC) va finance (174 endpoint, 13 351 LOC) eng katta modullar, birorta test yoq.

2. **aisha moduli** — 5 ta endpoint, 33 ta stub-marker. Endpointdan 6x kop marker, toliq bosh skelet.

3. **security moduli stub** — 25 ta endpoint, 10 ta stub-marker. Xavfsizlik moduli ozi ishlamaydi, bu butun tizim uchun xavf.

4. **pos-v2 va order-workflow** — controller bor, service fayli yoq. Controller qayergadir bevosita murojaat qiladi yoki umuman ishlamaydi.

5. **Skelet modullar** (adaptation 9 LOC, camera 4 LOC, feedback-360 5 LOC, fi 5 LOC, hr-assets 12 LOC) — faqat bosh fayl, kodi yoq.

6. **compatibility moduli hajmi** — 15 344 LOC, 32 controller, 41 service bitta modul ichida. Monolith korinishi.

7. **Frontend/Backend LOC nisbati** — Frontend (363 624) backend (244 984)dan 48% katta. Frontend kop mock/static data ishlatayotgan bolib korinadi.

8. **i18n fayllari eng faol commit obektlari** — 220 commitning katta qismi tarjima JSON fayllari.

9. **legacy moduli ochirilmagan** — 3 controller faol tizimda.

10. **Ikki parallel POS moduli** — pos (16 850 LOC, 21 ctrl, 52 svc) va pos-v2 (2 106 LOC, 4 ctrl, 0 svc) bir vaqtda mavjud. Qaysi biri ishlatilayotgani noaniq.

---

## Sandbox Cheklovlari

- **TypeScript build xatolari** — tsc binary katta node_modules daraxtida timeout tufayli topilmadi. Xato soni noaniq.
- **Runtime tekshiruvi** — server ishga tushirilmadi, real API javoblari korilmadi.
- **Database holati** — PostgreSQL ulanishi va migratsiya holati tekshirilmadi.
- **Docker/CI/CD** — bu audit faylida korilmadi (boshqa bosqich).
