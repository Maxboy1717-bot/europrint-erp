# MODUL 17 — ADMIN (Tizim Boshqaruvi) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Tizim boshqaruv xonasi — dasturiy foydalanuvchilarni boshqarish (akkaunt
> yaratish/o'chirish), rollar va ruxsatlar (kim nimani ko'rishi va qilishi mumkin), tizim sozlamalari,
> kim nima qilgani yozuvi (audit jurnali), integratsiyalar/API kalitlar. Bu — DASTURIY administratsiya.

> ⭐⭐ **BIR JUMLALI XULOSA (eng muhim savol — xavfsizlik haqiqiymi yoki ekran illuziyasi?):** ENG YAXSHI
> XABAR — ruxsatlar HAQIQATAN MAJBURLANADI. Boshqa ko'p modul bo'sh/soxta bo'lsa-da, bu yerda kirish
> nazorati real: 5 ta umumiy "qorovul" har so'rovni tekshiradi, ruxsati yo'q bo'lsa BLOKLAYDI (faqat
> ekranda tugmani yashirish emas). Kim nima qilgani jurnali ham real — **9322 ta yozuv bor**.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: ~15 ta admin sahifasi topdim.**

| Guruh | Sahifalar |
|---|---|
| **Foydalanuvchi/rol** | SuperAdminPanel (user/tenant), Admin sozlamalari |
| **Audit/jurnal** | Audit jurnali (/admin/audit-log), Auditor paneli (/europrint/auditor), Istisnolar jurnali (/admin/exceptions) |
| **Tizim** | Tizim monitori (/system-monitor), Navbat monitori (/admin/queues), Tekshirish (/admin/validate) |
| **Sozlamalar** | Sozlamalar (/settings + 6 tab: Umumiy/Soliq/Imtihon/GPT/Yo'riqnoma/Kontakt), Bildirishnoma sozlamalari, CFO config |
| **SaaS/integratsiya** | **SaaS kengaytirilgan** (⭐ **6 havola → 1 sahifa**: xatolar/litsenziya/modul-nazorat/monitoring/onboarding/tenant), Integratsiyalar |

---

# 2-QADAM — HAR SAHIFA

## 🟢 ⭐ FOYDALANUVCHI + ROL BOSHQARUVI (SuperAdminPanel + admin-users)
**Nima uchun:** Dasturiy foydalanuvchilarni yaratish/o'chirish, rol berish (kim super_admin, kim manager).
**Tugma:**
- "Rol o'zgartirish" → **REAL** (admin-users.controller:94 `PATCH :id/role`)
- "Foydalanuvchini o'chirish" → **REAL** (:109 `DELETE :id`)
**Ma'lumot:** users=**31** (DATA bor — 27 manager + 3 super_admin + 1 direktor).
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Ishlaydi (rol berish/o'chirish real).

## 🟢 ⭐⭐ RUXSATLAR MAJBURLANADIMI? — HA, HAQIQATAN
**Bu — butun tizim xavfsizligini hal qiluvchi savol.**
- **5 ta umumiy "qorovul" har so'rovda ishlaydi** (app.module.ts:193-197): tezlik-cheklov → kirish (JWT) → rol → vazifa-bo'linishi (SoD) → ruxsat. Bu "qorovullar" har bir so'rovni bekendda tekshiradi.
- **Rol qorovuli HAQIQATAN bloklaydi** — kerakli rolni o'qiydi, foydalanuvchi rolida yo'q bo'lsa "Ruxsat yo'q" deb RAD ETADI (roles.guard.ts:32-60: `if (!includes(userRole)) → Forbidden`). Bu ekranda tugmani yashirish emas — bekendda bloklash.
**Holat:** 🟢. **Xavfsizlik xulosasi:** Ruxsat real majburlanadi, illuziya emas.

## 🟢 ⭐ AUDIT JURNALI (kim nima qilgani) — `/admin/audit-log` (AuditLogPage)
**Nima uchun:** Har bir harakatni (kim, nima, qachon) yozadi.
**Ma'lumot:** audit_logs=**9322 yozuv** (DATA bor!) — jurnal HAQIQATAN yozadi (admin-extra.repo.ts:100).
**Tugma:** Filtrlash/ko'rish → real (admin-extra.controller:42 `/audit`, :48 `/audit-filtered`).
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Ishlaydi (9322 real yozuv).

## 🟢 TIZIM MONITORI + NAVBAT MONITORI + ISTISNOLAR
- **Navbat monitori** (/admin/queues): fon-vazifalarni qayta urinish/o'chirish → **REAL** (admin-queue.controller:49,58)
- **Tizim monitori**, **Istisnolar jurnali** → real ko'rish
**Holat:** 🟢.

## 🟢 CFO CONFIG — `/cfo/config` (CfoConfigSettings)
**Tugma:** Sozlama saqlash → **REAL** (cfo_config=11 qator, 10-modulda ko'rdik). **Holat:** 🟢.

## 🟡 SOZLAMALAR — `/settings` + 6 tab (Settings + SettingsTab*)
**Tugma:** Umumiy/Soliq/Imtihon/GPT/Kontakt → asosan real saqlaydi; ⚠️ **Yo'riqnoma yuklash BUZUQ** (fayl yuborilmaydi, 1-modulda ko'rdik), Bildirishnoma matritsasi qisman.
**Holat:** 🟡 (ko'pi real, ba'zi buzuq).
**Foydalanuvchi nima qila olmaydi:** Yo'riqnoma faylini yuklay olmaydi.

## 🟡 SaaS KENGAYTIRILGAN — 6 havola→1 (SaaSExtended) + Integratsiyalar
**Tugma:** Tenant ro'yxati, modul-nazorat, monitoring → asosan ko'rish; ⚠️ **tenant yaratish/onboarding/modul o'zgartirish "tayyor emas"** (saas.controller 501, 1-modulda ko'rdik).
**Holat:** 🟡 (ko'rish real, tenant boshqaruvi stub).
**Foydalanuvchi nima qila olmaydi:** Yangi tenant yarata/onboarding qila olmaydi (501).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Foydalanuvchi/rol boshqaruvi | 🟢 | — (real, majburlanadi) | ~80 |
| Audit jurnali | 🟢 | — (9322 real) | ~85 |
| Navbat/tizim monitori | 🟢 | — | ~70 |
| CFO config | 🟢 | — | ~75 |
| Sozlamalar (6 tab) | 🟡 | yo'riqnoma yuklash buzuq | ~60 |
| SaaS kengaytirilgan (6→1) | 🟡 | tenant boshqaruvi stub | ~40 |
| Integratsiyalar | 🟡 | qism stub | ~50 |

**Jami: ~4 🟢 · ~3 🟡 · 0 🔴 → taxminan ~65% haqiqatan ishlaydi (xavfsizlik jihatdan eng kuchli modul).**

## ⭐⭐ XAVFSIZLIK VERDIKTI (bu modulning eng muhim savoli) — MAJBURLANADI vs EKRAN-ILLUZIYASI
**Ruxsatlar HAQIQATAN MAJBURLANADI — illuziya EMAS.**
- 5 ta umumiy "qorovul" (tezlik/kirish/rol/SoD/ruxsat) har so'rovda bekendda ishlaydi (app.module.ts:193-197)
- Rol qorovuli ruxsati yo'q so'rovni RAD ETADI (Forbidden), ekranda tugmani yashirish emas (roles.guard.ts:56)
- Bu butun tizim uchun amal qiladi (har modulda @Roles/@RequirePermission)
- ⭐ Demak boshqa modullarning kirish nazorati REAL (illuziya emas) — masalan HR'da PIP/eNPS faqat HR roliga ochiq (11-modulda tasdiqlangan)
- Audit jurnali REAL (9322 yozuv) — kim nima qilganini haqiqatan yozadi

**Qisqasi:** Boshqa modullar bo'sh/soxta bo'lsa ham, **xavfsizlik qatlami haqiqiy va mustahkam.** Eshikdagi qulf haqiqatan qulflaydi (bekend tekshiradi), va kirish daftarchasi (audit) haqiqatan yoziladi.

## ⭐ ZANJIR (sodda)
| Zanjir | Holat |
|---|---|
| **Foydalanuvchi ↔ HR xodim** | 🟢 BOG'LANGAN — 31 foydalanuvchidan 30 tasi HR xodim yozuviga ulangan (har akkaunt real xodimga tegishli) |
| **Audit jurnal ↔ barcha modullar** | 🟢 ULANGAN — har modulda harakatlar yoziladi (9322 yozuv, umumiy AuditInterceptor) |

## DB MUAMMOLARI (sodda)
- ✅ users (31), audit_logs (9322), cfo_config (11) — DATA bor (kam modulda shunday)
- ⚠️ Tenant/SaaS boshqaruv qismi stub (jadval bor, kod ulanmagan)
- ⚠️ Zaxira (backup) sahifasi topilmadi — vizyon talab qilsa, yo'q

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. ✅ **Xavfsizlik MUSTAHKAM** — bu muammo emas, balki yaxshi xabar (boshqa modullardan farqli, bu real ishlaydi)
2. 🟡 **SaaS tenant boshqaruvi stub** — yangi tenant yaratib bo'lmaydi (agar kerak bo'lsa)
3. 🟡 **Sozlamalar: yo'riqnoma yuklash buzuq** — fayl yuborilmaydi
4. ⚠️ **Zaxira (backup) sahifasi yo'q** — agar vizyon talab qilsa

---

## XULOSA (egasiga)
Admin (tizim boshqaruvi) — xavfsizlik jihatdan ENG KUCHLI modul. Bu modulda eng katta xavf "ruxsatlar soxta — faqat ekranda tugma yashiriladi, lekin bekend baribir ruxsat beradi" edi. **Bu xavf YO'Q.** Ruxsatlar haqiqatan majburlanadi:
- 5 ta umumiy "qorovul" har so'rovni bekendda tekshiradi
- Rol qorovuli ruxsati yo'q kishini RAD ETADI (Forbidden), nafaqat tugmani yashiradi
- Kim nima qilgani jurnali REAL — 9322 ta yozuv

Demak butun tizimning kirish nazorati real va ishonchli (boshqa modullar bo'sh bo'lsa ham). Foydalanuvchilar HR xodimlariga bog'langan (30/31). Kichik kamchiliklar: SaaS tenant boshqaruvi stub, yo'riqnoma yuklash buzuq.

⭐ **Halol javob:** boshqa 16 moduldan farqli, bu modul ROST ishlaydi — xavfsizlik soxta emas, real majburlanadi. Bu — egasi uchun eng ishonchli xabar: 400+ xodim uchun kirish nazorati haqiqiy.

Metafora: binoning xavfsizlik tizimi haqiqiy — qulflar haqiqatan qulflaydi (bekend kimga ruxsat borligini chindan tekshiradi), va har kirishni yozadigan haqiqiy daftar bor (9322 yozuv). Bu — eshikka "Faqat ruxsat bilan" deb yozib qo'yib, eshikni ochiq qoldirish EMAS.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
