# MODUL 12 — LMS (O'qitish / Training) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Xodimlarni o'qitish — kurslar, darslar, test/imtihonlar, kimga qaysi kurs
> biriktirilgan, kim tugatgan, sertifikatlar. HR bilan bog'lanishi kerak (xodim o'qish tarixi, yangi
> xodim uchun onboarding).

> ⭐⭐ **BIR JUMLALI XULOSA:** LMS — eng TO'LIQ modullardan biri. Asosiy amallar HAQIQATAN ishlaydi:
> kurs yaratasiz, xodim test topshiradi va bal SAQLANADI, sertifikat beriladi. Asosiy kamchilik —
> hali kurs/o'quvchi yo'q (bo'sh), o'quv videosini fayl emas, havola (link) bilan qo'shasiz, va yangi
> xodim onboarding kursiga avtomatik yozilmaydi.

> **DB holati:** LMS jadvallari bor, lekin hammasi BO'SH (0 kurs/dars/imtihon/sertifikat — qurilish bosqichi).

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 11 ta LMS sahifasi topdim.**

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | Kurslar | /courses, /lessons |
| 2 | Kurs tafsiloti | /courses/:id |
| 3 | Dars o'ynatgich | /courses/:id/lessons, /video-progress |
| 4 | AI imtihonlar | /ai-exams, /ai-exam, /all-exams |
| 5 | Sertifikatlar | /certificates |
| 6 | LMS paneli | /lms-dashboard |
| 7 | **LMS kengaytirilgan** | ⭐ **7 menyu havola → 1 sahifa** (kurs muallifi, gamification, leaderboard, byudjet, micro-learning, operator sertifikatsiya, test boshqaruvi) |
| 8 | Bilim bazasi | /lms/knowledge-base |
| 9 | LMS qo'llab-quvvatlash | /lms/support |
| 10 | Ko'nikmalar matritsasi | /skills-matrix |
| 11 | HR↔LMS ko'prik | /integration/hr-lms (HR modulida) |

---

# 2-QADAM — HAR SAHIFA

## 🟢 1,2. KURSLAR + KURS TAFSILOTI — `/courses`, `/courses/:id`
**Nima uchun:** O'quv kurslari ro'yxati — kurs yaratish, tahrirlash, darslar/modullar.
**Tugma:**
- "Kurs yaratish" → **HAQIQATAN ISHLAYDI** — bazaga yozadi (courses.controller:79-83, real `createCourse`)
- "Tahrirlash" → **REAL** (:127)
**Ma'lumot:** lms_courses=0 (bo'sh).
**Holat:** 🟢. **Vizyon (kurslar):** ✅ ~80%.
**Foydalanuvchi nima qila olmaydi:** Hozircha ishlaydi (faqat hali kurs kiritilmagan).

## 🟢 3. DARS O'YNATGICH — `/courses/:id/lessons`, `/video-progress` (LessonPlayer)
**Nima uchun:** O'quvchi darsni ko'radi, video ko'rish progressi saqlanadi.
**Tugma:**
- "Darsni tugatish" → **REAL** (`/lms/progress/complete`, lms-core.controller:128)
- Video progress → **REAL** (qancha ko'rilgani saqlanadi, drizzle-lms-misc.repo.ts:46, ON CONFLICT bilan)
**Holat:** 🟢. **Vizyon (darslar + tugatish kuzatuvi):** ✅ ~75%.
**Foydalanuvchi nima qila olmaydi:** Ishlaydi.

## 🟢 4. AI IMTIHONLAR — `/ai-exams`, `/ai-exam`, `/all-exams` (3 havola)
**Nima uchun:** Test/imtihon yaratish va topshirish, bal qo'yish.
**Tugma:**
- "Imtihon yaratish" → **REAL** (lms-core.controller:68 `@Post('exams')`)
- "Imtihon topshirish" → **REAL, BAL SAQLANADI** (lms-core:80 `exams/:id/submit`; lms-attempts:84 `:id/submit`; lms-exams.service: score/status/passed yoziladi)
**Holat:** 🟢. **Vizyon (test + bal yozish):** ✅ ~80%.
**Foydalanuvchi nima qila olmaydi:** Ishlaydi (bal haqiqatan saqlanadi, qattiq yozilgan emas).

## 🟢 5. SERTIFIKATLAR — `/certificates` (Certificates)
**Nima uchun:** Kursni tugatgan xodimga sertifikat berish.
**Tugma:**
- "Sertifikat berish" → **REAL** (lms-certificates.controller:55 `@Post('issue')`; certification.service:57 `INSERT INTO lms_certificates`)
- "Bekor qilish (revoke)" → **REAL** (:98)
**Holat:** 🟢. **Vizyon (sertifikat):** ✅ ~80%.

## 🟢 8. BILIM BAZASI — `/lms/knowledge-base` (KnowledgeBase)
**Nima uchun:** Hujjat/material kutubxonasi.
**Tugma:**
- "Yuklash" → **REAL FAYL YUKLASH** (knowledge-base.controller:112 `@Post('upload')`)
- ⚠️ **Xavfsizlik eslatmasi:** yuklanadigan fayl turi to'liq tekshirilmaydi (avvalgi xavfsizlik tahlirida belgilangan — xavfli fayl yuklanishi mumkin)
**Holat:** 🟢 (fayl yuklash ishlaydi, lekin tur tekshiruvi zaif).
**Foydalanuvchi nima qila olmaydi:** Ishlaydi, lekin xavfli fayl turini bloklamaydi (xavfsizlik kamchiligi).

## 🟢 9,10. LMS QO'LLAB-QUVVATLASH + KO'NIKMALAR MATRITSASI — `/lms/support`, `/skills-matrix`
**Tugma:** Ticket yaratish → **REAL** (lms-core:134). Ko'nikma matritsasi → **REAL** (HR ko'nikmalaridan). **Holat:** 🟢.

## 🟡 6. LMS PANELI — `/lms-dashboard` (LMSDashboard)
**Nima uchun:** O'qitish umumiy ko'rinishi — leaderboard, kurs tugatish trendi, sertifikatlar.
**Tugma:** Faqat ko'rish. **Ma'lumot:** bo'sh (0 data) → ko'rsatadigan narsa kam.
**Holat:** 🟡 (real o'qiydi, bo'sh).

## 🟡 7. LMS KENGAYTIRILGAN — 7 havola→1 (LMSExtended)
**Nima uchun:** 7 funksiya (kurs muallifi, gamification, leaderboard, byudjet, micro-learning, operator sertifikatsiya, test boshqaruvi) bitta sahifada.
**Holat:** 🟡 (ko'p funksiya bitta sahifada, ba'zilari ko'rish-asosiy).
**Foydalanuvchi nima qila olmaydi:** 7 alohida havola bosadi, lekin bitta sahifa ochiladi (chalkash).

## 🟡 11. HR↔LMS KO'PRIK — `/integration/hr-lms` (HR modulida)
**Nima uchun:** Xodim ko'nikma kamomadi, sertifikat muddati.
**Holat:** 🟡 — **faqat O'QISH** (ko'nikma kamomadini ko'rsatadi, lekin avtomatik kursga yozmaydi).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Kurslar | 🟢 | bo'sh data | ~80 |
| Kurs tafsiloti | 🟢 | — | ~75 |
| Dars o'ynatgich | 🟢 | — | ~75 |
| AI imtihonlar | 🟢 | — (bal saqlanadi) | ~80 |
| Sertifikatlar | 🟢 | — | ~80 |
| Bilim bazasi | 🟢 | fayl tur tekshiruvi zaif | ~70 |
| Qo'llab-quvvatlash + Ko'nikmalar | 🟢 | — | ~70 |
| LMS paneli | 🟡 | bo'sh data | ~55 |
| LMS kengaytirilgan (7→1) | 🟡 | 7 havola 1 sahifa | ~45 |
| HR↔LMS ko'prik | 🟡 | faqat o'qish | ~30 |

**Jami: 7 🟢 · 3 🟡 · 0 🔴 → taxminan ~70% haqiqatan ishlaydi (eng to'liq modullardan biri!).**

## ⭐ VIZYON — asosiy talablar
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Kurslar + darslar** | 🟢 | Yaratish/tahrirlash real |
| **O'quv materiali yuklash (video/PDF)** | 🟡 | Bilim bazasida fayl yuklash bor; kurs videosi havola (link) bilan, fayl emas |
| **Test/imtihon (bal yozish)** | 🟢 | Topshirish + bal saqlash real |
| **Kursga yozish + tugatish kuzatuvi** | 🟢 | Real (enroll + progress) |
| **Sertifikatlar** | 🟢 | Berish/bekor qilish real |
| **HR bog'lanishi** (o'qish→profil, yangi xodim→onboarding) | 🟡 | LMS hodisa chiqaradi, HR o'qiydi (ko'prik), lekin yangi xodim avtomatik yozilmaydi |

## ⭐ ZANJIR MUAMMOSI (sodda)
- LMS kursni tugatganda **hodisa chiqaradi** (`lms.course.enrolled`, enroll-course.handler:55), HR uni **o'qiy oladi** (ko'prik orqali)
- 🟡 LEKIN **yangi xodim (HR'dan) avtomatik onboarding kursiga YOZILMAYDI** — ko'nikma kamomadi → kursga biriktirish zanjiri yo'q (11-modulda ham ko'rdik). O'qish va HR bir-birini ko'radi, lekin avtomatik harakat yo'q.

## DB MUAMMOLARI (sodda)
- ✅ Hamma LMS jadvali bor; yo'q jadval/dublikat muammosi katta emas
- Hammasi BO'SH (0 kurs/o'quvchi/imtihon — qurilish bosqichi)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🟡 **Bo'sh** — modul tayyor, lekin hali kurs/o'quvchi kiritilmagan (boshqa modullardan farqli — bu yerda kod tayyor)
2. 🟡 **Kurs videosi fayl bilan yuklanmaydi** — faqat havola (link); o'quv materialini to'g'ridan yuklab bo'lmaydi
3. 🟡 **HR auto-onboarding yo'q** — yangi xodim avtomatik o'quv kursiga yozilmaydi
4. ⚠️ **Bilim bazasi fayl xavfsizligi** — yuklanadigan fayl turi to'liq tekshirilmaydi (xavfsizlik)

---

## XULOSA (egasiga)
LMS — **eng to'liq qurilgan modullardan biri.** Boshqa ko'p moduldan farqli o'laroq, asosiy amallar haqiqatan ishlaydi: kurs yaratasiz, o'quvchi test topshiradi va **bal saqlanadi**, sertifikat beriladi, video ko'rish progressi kuzatiladi. Bilim bazasida hatto fayl yuklash ham bor.

Asosiy kamchiliklar kichik: (1) hali hech narsa kiritilmagan (bo'sh), (2) kurs videosini fayl emas, havola bilan qo'shasiz, (3) yangi xodim avtomatik onboarding kursiga yozilmaydi.

Metafora: o'quv markazi qurilgan va sinflar ishlaydi — kurs ochasiz, o'quvchi imtihon topshiradi va bahosi yoziladi, diplom beriladi. Faqat hali o'quvchi/kurs yo'q, o'quv videosini yuklash o'rniga internet havolasini yopishtirasiz, va yangi xodim avtomatik darsga yozilmaydi.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
