# MODUL 4 — SIFAT NAZORATI (QC) — TO'LIQ CHUQUR TAHLIL (rasmiy, intervyu uchun)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | QAT'IY READ-ONLY — hech narsa o'zgartirilmadi
> Usul: har sahifa→FE fayl→endpoint→BE handler→DB jadval. Jonli DB (_audit/q.cjs) + BE kod.
> ⭐ VERIFY-DON'T-TRUST: qaror SAQLANADIMI (echo=xavfli, qaror jim yo'qoladi) — har tugma tekshirildi.

---

# QADAM 1 — KASHF

## Jami: 11 sahifa (~13 route)
| # | Sahifa | Route |
|---|---|---|
| 1 | QC Dashboard | /qc/dashboard-home (/qc/dashboard→redirect) |
| 2 | **QC Module** (asosiy, tabli) | /qc-module (+/qc/standards, /qc/parameters, /qc/tests → redirect) |
| 3 | **QC Approval** (3-qaror) | /qc/approval ⭐ |
| 4 | QC Final Inspection | /qc/final |
| 5 | QC Extended (Lab) | /qc/lab |
| 6 | Paper Parameters | /qc/paper-parameters |
| 7 | Supplier Quality | /qc/vendor-quality |
| 8 | Defect Management | /qc/defect-management |
| 9 | Reclamations | /qc/complaints |
| 10 | Warehouse QC Review (POS karantin) | (POS modulida) |
| 11 | Camera Quality / AI Vision | /camera-quality |

## DB jadvallari
- ✅ MAVJUD: qc_inspections, qc_defects, qc_braks, qc_lab_tests, qc_checkpoints, qc_parameters, qc_reclamations, qc_supplier_quality, quality_defects_camera (image_url, ai_confidence)
- ❌ **YO'Q:** `qc_approvals` (qc-defects-extended approval CRUD shu sababli xato)

## BE controllerlar (real vs stub — ajratilgan)
- **REAL:** qc-inspections (CRUD+submit), qc-defects (defects+resolve), qc-defects-extended (braks/supplier-quality/reclamations), qc-new (checkpoints/lab-tests), qc-extended (standards/in-process/root-causes), qc-parameters (CRUD/tests), qc-reclamations
- **FAKE (echo, DB yozmaydi):** qc-defects.controller order-darajadagi approve/qc, approve/finance, reject, inspector-submit (`{orderId, approved:true}`)
- **STUB (501):** braks/cost-impact, pending/qc, control-charts

---

# QADAM 2 — HAR SAHIFA (A–G)

## 🔴 3. QC Approval — `/qc/approval` ⭐⭐ ENG MUHIM (3-qaror — vizyon yadrosi)
**A.** FE: `pages/QCApproval.tsx` (+ `FinanceApproval.tsx`). **FUNKSIYA:** QC inspektor buyurtmani QABUL/RAD qiladi (3-qaror: qabul→ombor / rework→MES / rad→ta'minotchi); moliya tasdiqlaydi.
**B. ⚠️ HAR TUGMA FAKE:**
- "Qabul (QC)" → `PATCH/POST /qc/approve/qc/:orderId` → **`return { orderId, approved: true }`** (qc-defects.controller:164-177) — **DB ga YOZMAYDI**
- "Rad" → `/qc/reject/:orderId` → `{ orderId, rejected: true }` (:184-197) — FAKE
- "Inspektor topshirish" → `/qc/inspector-submit/:orderId` → `{ orderId, submitted: true }` (:207-217) — FAKE
- "Moliya tasdig'i" → `/qc/approve/finance/:orderId` → `{ approved: true }` (:144-157) — FAKE
- "Kutilayotgan" ro'yxat → `/qc/pending/qc` → **501** (:137)
**C.** ❌ Hech qaysi tugma DB ga yozmaydi (200 qaytaradi). FE pul hisoblamaydi.
**D.** 🔴 **ECHO (jim qaror yo'qolishi)** — foydalanuvchi "qabul/rad" bosadi, 200 oladi, lekin **DB o'zgarmaydi**. (Halol-deferred: deferred-decisions.md 5938c65a — kanonik order jadval noaniq, "ikki order olam" qarori kutilmoqda; lekin handler hali ham 200 qaytaradi → aldov.)
**E.** 🔴. **F. 3-qaror (Q31):** ❌ — qabul→ombor / rework→MES / rad→ta'minotchi ulanmagan; buyurtma hech qayerga bormaydi. **G.** "Qabul qildim/rad etdim" bosadi, lekin **qaror saqlanmaydi** — buyurtma ombor/MES/ta'minotchiga bormaydi.

## ✅ WATCH — Inspeksiya CRUD (prior "PATCH/DELETE echo" — TEKSHIRILDI, TUZATILGAN)
**qc-inspections.controller REAL:** `@Patch(':id')` → `qcNewService.updateInspection` (real UPDATE, :101-112); `@Delete(':id')` → real delete (:119-129); `@Post()`, `@Post(':id/submit')` → commandBus REAL.
➡️ **Inspeksiya qarori YO'QOLMAYDI** — prior flag ESKIRGAN. ⚠️ LEKIN bu **inspeksiya** (qc_inspections); order-daraja approve/reject (qc-defects) hamon fake — ikki alohida sirt.

## 🟢 1. QC Dashboard — `/qc/dashboard-home`
**FUNKSIYA:** QC umumiy panel — brak, reklamatsiya, ta'minotchi sifati, oqim.
**B.** ✅ `/qc/dashboard/stats`, `/flow`, `/braks`, `/inspections`, `/reclamations`, `/supplier-quality` REAL o'qish (read-only).
**E.** 🟢. **F.** panel. **G.** —.

## 🟡 2. QC Module — `/qc-module` (asosiy, +3 redirect)
**FUNKSIYA:** Parametr/test/standart/SPC/AI-tahlil tablari (sifat standartlarini sozlash).
**B.** ✅ Parametr CRUD (`/qc/parameters`, qc-parameters:72-89), test (`/qc/tests`), seed REAL. 🔴 `/qc/control-charts` (SPC) = **501** (qc-new:116).
**C.** qc_parameters(✅). **D.** 🟡 control-charts stub; 3 redirect→1.
**E.** 🟡. **F.** sifat standartlari ✅. **G.** SPC nazorat grafiklarini ko'ra olmaydi (501).

## 🟡 4. QC Final Inspection — `/qc/final`
**FUNKSIYA:** Yakuniy mahsulot inspeksiyasi.
**B.** `/qc/final-inspections`, `/final-orders`, `/papka-orders`. Asosan real; papka bog'lanishi chalkash.
**E.** 🟡. **G.** —.

## 🟢 5. QC Extended (Lab) — `/qc/lab`
**FUNKSIYA:** Laboratoriya testlari, standartlar, sabab tahlili.
**B.** ✅ Lab-test (`/qc/lab-tests`, qc-new:95), standards (qc-extended:66), in-process (:139), root-causes (:156) REAL.
**E.** 🟢. **F.** ✅. **G.** —.

## 🟢 6. Paper Parameters — `/qc/paper-parameters` — ✅ qog'oz sifat parametr CRUD REAL.
## 🟢 7. Supplier Quality — `/qc/vendor-quality` — ✅ ta'minotchi sifat REAL (qc-defects-extended:104).
## 🟢 8. Defect Management — `/qc/defect-management`
**FUNKSIYA:** Brak/defekt boshqaruvi + hal qilish.
**B.** ✅ Defekt yaratish (`/qc/defects`, qc-defects:94) + hal qilish (`/defects/:id/resolve`, :111) REAL UPDATE.
**⚠️ FOTO:** Defekt rasmi = `quality_defects_camera.image_url` (AI kameradan) — **qo'lda foto yuklash YO'Q**.
**E.** 🟢. **F.** ✅. **G.** Defektga qo'lda foto yuklay olmaydi (faqat AI kamera rasmi).

## 🟢 9. Reclamations — `/qc/complaints` — ✅ mijoz shikoyatlari/reklamatsiya REAL (qc-reclamations:93).

## 🟢 10. Warehouse QC Review (POS karantin) — (POS modulida)
**FUNKSIYA:** Ombor karantin/QC ko'rib chiqish (tashqaridan kelgan material).
**B.** ✅ `/pos/wh-features/quarantine`, `/movement` REAL (POS oqimi).
**E.** 🟢. **F. Karantin (Q30):** ✅ REAL — tashqi kirim karantinga, QC tasdig'i bilan asosiy omborga. **G.** —.

## 🟡 11. Camera Quality / AI Vision — `/camera-quality`
**FUNKSIYA:** AI kamera orqali sifat/defekt aniqlash.
**B.** AI kamera → `quality_defects_camera` (image_url, ai_confidence) — camera-ai real Claude Vision.
**C.** quality_defects_camera (AI defektlar). **D.** 🟡 AI bor, lekin QC qaroriga ulanmagan.
**E.** 🟡. **F. AI-vision:** 🟡 — aniqlaydi, lekin avtomatik QC qaror/blokga ulanmagan. **G.** AI defektni ko'radi, lekin u avtomatik QC rad/rework qilmaydi.

---

# QADAM 3 — MODUL UMUMIY

## Sahifa jadvali
| Sahifa | Holat | Asosiy muammo | Vizyon % |
|---|---|---|---|
| QC Dashboard | 🟢 | — | panel |
| QC Module | 🟡 | control-charts stub, 3→1 | ~70 |
| **QC Approval** | 🔴 | **3-qaror FAKE** | ❌ 0 (Q31) |
| QC Final Inspection | 🟡 | papka chalkash | ~60 |
| QC Extended (Lab) | 🟢 | — | ~85 |
| Paper Parameters | 🟢 | — | ~85 |
| Supplier Quality | 🟢 | — | ~80 |
| Defect Management | 🟢 | qo'lda foto yo'q | ~80 |
| Reclamations | 🟢 | — | ~80 |
| Warehouse QC (karantin) | 🟢 | — | ✅ Q30 |
| Camera AI Vision | 🟡 | QC qaroriga ulanmagan | ~50 |

**Jami: 7 🟢 · 3 🟡 · 1 🔴 → taxminan ~72% real (sahifa darajasi).**
⚠️ LEKIN vizyon YADROSI (3-qaror) = **0%**.

## ⭐ VISION WATCH-ITEM VERDIKTLARI (egasi so'ragan)
| Watch | Vizyon | Holat | Dalil |
|---|---|---|---|
| **3-qaror oqimi** (qabul→ombor / rework→MES / rad→ta'minotchi) | Q31 | 🔴 **FAKE 0%** | qc-defects approve/reject/inspector-submit = `{approved:true}`, DB yozmaydi (:144-217) |
| **Karantin** (tashqi kirim→karantin→QC→ombor) | Q30 | 🟢 **REAL** | POS `/wh-features/quarantine` (WarehouseQCReview) |
| **Damage-act→QC** | Q26 | 🟡 **QISMAN** | POS movement DAMAGE→QC oqimi bor, lekin QC qaror fake → uzilgan |
| **AI-vision sifat** | — | 🟡 **QISMAN** | camera-ai real (quality_defects_camera), QC qaroriga ulanmagan |
| **Inspeksiya CRUD** | — | 🟢 **REAL** | qc-inspections PATCH/DELETE persist (prior flag ESKIRGAN) |

## ⭐ CHAIN MUAMMOSI
1. 🔴 **QC → ombor/MES/ta'minotchi (Q31)** — UZILGAN. Order-daraja qabul/rad fake → buyurtma hech qayerga bormaydi
2. 🟢 **QC → karantin → ombor (Q30)** — POS'da REAL ishlaydi
3. 🟡 **QC → MES (rework)** — fake qabul tufayli ulanmagan
4. 🟡 **Damage-act → QC (Q26)** — POS DAMAGE oqimi bor, QC qaror fake
5. 🟡 **AI kamera → QC qaror** — defekt aniqlanadi, lekin avtomatik QC rad/blok qilmaydi

## DB MUAMMOLARI
- ❌ **`qc_approvals` jadval YO'Q** → qc-defects-extended approval CRUD (POST/PATCH /qc/approvals) xato
- ✅ Boshqa QC jadvallar mavjud (qurilish bosqichi, 0 qator)

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **3-qaror FAKE (Q31)** — eng xavfli. QC buyurtmani qabul/rad qilganda DB o'zgarmaydi, buyurtma ombor/MES/ta'minotchiga bormaydi. "Tasdiqladim" yolg'on. Sabab: kanonik order jadval (sales_orders) tanlanmagan (two-worlds qarori)
2. 🔴 **`qc_approvals` jadval yo'q** — tasdiq yozuvi saqlanmaydi
3. 🟡 **AI kamera → QC qaror ulanmagan** — defekt aniqlanadi, qaror chiqmaydi
4. 🟡 **Damage-act → QC uzilgan** — fake qaror tufayli
5. 🟡 **Qo'lda foto yo'q** — defektga faqat AI kamera rasmi (qo'lda yuklash yo'q)

---

## XULOSA (egasiga)
QC **detal-darajada juda yaxshi** (inspeksiya, brak, lab, parametr, reklamatsiya, ta'minotchi — hammasi real DB; inspeksiya qarori saqlanadi). LEKIN **vizyon YADROSI — order-daraja 3-qaror — FAKE:**
- **QC buyurtmani qabul/rad qilganda DB o'zgarmaydi** — `{approved:true}` qaytaradi, lekin buyurtma ombor/MES/ta'minotchiga BORMAYDI (Q31). Eng xavfli: foydalanuvchi "tasdiqladim" deb o'ylaydi
- **Sabab:** "ikki order olam" qarori kutilmoqda — kanonik order jadval tanlanmagan
- **Karantin (Q30) REAL** ishlaydi (POS)

➡️ Bu to'g'ridan-to'g'ri **two-worlds tahliliga** bog'liq: order kanonik jadvali tasdiqlangach, QC 3-qarorni unga yozish mumkin.

> Hech narsa o'zgartirilmadi (read-only). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
