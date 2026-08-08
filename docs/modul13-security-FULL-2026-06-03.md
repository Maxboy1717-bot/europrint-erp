# MODUL 13 — XAVFSIZLIK (Jismoniy / Kirish nazorati) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Zavod jismoniy xavfsizligi — qorovul postlari, odam/mashina kirish-chiqish jurnali,
> tashrifchi ruxsatnomalari, KPP (darvoza) nazorati, kameralar/hodisalar.

> ⭐⭐ **BIR JUMLALI XULOSA:** Bu — ENG ZAIF modul. Ekranlar bor, lekin asosiy ish ishlamaydi:
> tashrifchilar ro'yxati har doim BO'SH (soxta), darvozada mashina qayd qilishni saqlaydigan joy umuman
> YO'Q, ko'p tugma "tayyor emas". Yagona haqiqiy kirish-kuzatuvi — yuz-kamera (u ham xavfsizlik emas,
> HR modulida).

> **DB holati:** Faqat hodisalar jadvali bor (bo'sh). Darvoza/KPP/tashrif jadvallari UMUMAN YO'Q.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 2 ta xavfsizlik sahifasi topdim.**

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | Xavfsizlik paneli | /security |
| 2 | **Xavfsizlik kengaytirilgan** | ⭐ **7 menyu havola → 1 sahifa** (davomat, evakuatsiya, hazmat, PPE, reyting, tashrifchilar, zona-kirish) |

> Eslatma: Bu modul = ZAVOD DARVOZASI xavfsizligi (jismoniy). Dasturiy foydalanuvchi-ruxsatlari (kim qaysi ekranni ko'radi) — boshqa joyda (login/rol tizimi), bu modulda emas.

---

# 2-QADAM — HAR SAHIFA

## 🔴 1. XAVFSIZLIK PANELI — `/security` (SecurityDashboard.tsx)
**Nima uchun:** Qorovul/xavfsizlik boshlig'i uchun panel — tashrifchilar, hodisalar, kirish zonalari, PPE (himoya vositalari), yong'in datchiklari.
**Tugma/forma — KO'PI SOXTA YOKI TAYYOR EMAS:**
- "Tashrifchilar ro'yxati" → **SOXTA — har doim BO'SH** (`GET /security/visitors` → `return []`, security.controller:70 — bazaga umuman bormaydi)
- "Tashrifchi chiqishi" → **SOXTA — saqlamaydi** (`POST /security/visitors/:id/exit` → `return { visitorId, exitedAt, status:'exited' }`, :143 — aks-sado, DB yozmaydi)
- "Hodisa qayd qilish" (`POST /security/report`) → real ko'rinadi (svc'ga boradi), lekin hodisalar jadvali bo'sh (0)
- "Kunlik xulosa" → **"tayyor emas"** (:189)
- "Yong'in datchiklari" → **"tayyor emas"** (:195)
- "PPE tekshiruvlari/statistika/buzilishlari" → **"tayyor emas"** (:201, :207, :213)
**Ma'lumot:** security_incidents jadval bor (0 qator); tashrif jadvali UMUMAN YO'Q.
**Holat:** 🔴 (ekran bor, asosiy ma'lumot soxta/bo'sh/tayyor emas).
**Foydalanuvchi nima qila olmaydi:** Tashrifchilarni ko'ra/ro'yxatga ola olmaydi (har doim bo'sh), kunlik xulosa/PPE/yong'in ma'lumotini ko'ra olmaydi (tayyor emas).

## 🔴 2. XAVFSIZLIK KENGAYTIRILGAN — 7 havola→1 (SecurityExtended.tsx)
**Nima uchun:** 7 funksiya (darvoza davomati, evakuatsiya, xavfli moddalar, himoya vositalari (PPE), reyting, tashrifchilar, zona-kirish) bitta sahifada.
**Tugma:** Asosan o'qish, lekin ko'pi "tayyor emas" (ppe-stats, ppe-violations, daily-summary = 501).
**Holat:** 🔴 (7 funksiyaning ko'pi stub).
**Foydalanuvchi nima qila olmaydi:** 7 alohida havola bosadi, lekin bitta sahifa ochiladi va ko'p bo'lim "tayyor emas".

---

## ⚠️ ASOSIY VIZYON QISMI — KPP (DARVOZA) UMUMAN YO'Q
Egasi vizyonida (ombor bo'limida): "har kirgan/chiqgan mashina + haydovchi + yuk + rasm qayd qilinadi, chiqim hujjatiga bog'lanadi" (KPP/darvoza nazorati). **Bu QURILMAGAN:**
- `gate_logs` (darvoza jurnali) — jadval YO'Q
- `kpp_logs` (KPP jurnali) — jadval YO'Q
- `access_logs` (kirish jurnali) — jadval YO'Q
- `visitor_passes` (tashrif ruxsatnomasi) — jadval YO'Q
**Foydalanuvchi nima qila olmaydi:** Darvozada mashina/haydovchi/yukni umuman qayd qila olmaydi — saqlaydigan joy yo'q.

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Xavfsizlik paneli | 🔴 | tashrif soxta, ko'p stub | ~20 |
| Xavfsizlik kengaytirilgan (7→1) | 🔴 | ko'pi tayyor emas | ~20 |

**Jami: 0 🟢 · 0 🟡 · 2 🔴 → taxminan ~20% haqiqatan ishlaydi (eng zaif modul).**

## ⭐ VIZYON — asosiy talablar
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Qorovul postlari/smenalar** | ❌ | Topilmadi |
| **Odam kirish-chiqish jurnali** | 🟡 | Faqat yuz-kamera orqali (HR modulida, security'da emas) |
| **Mashina kirish-chiqish (KPP)** | ❌ | Jadval yo'q — umuman qurilmagan |
| **Tashrif ruxsatnomalari** | 🔴 | Soxta (ro'yxat bo'sh, chiqish echo) |
| **Hodisalar** | 🟡 | Qayd ko'rinadi, lekin bo'sh |
| **Kamera integratsiyasi** | 🟡 | Kamera bor, lekin xavfsizlik qaroriga ulanmagan |

## ⭐ ZANJIR (sodda)
| Zanjir | Holat |
|---|---|
| **Darvoza kirish → HR davomat** | 🟡 BOR, lekin HR tomonida — yuz-kamera "territory log" (attendance-face.controller:106 `@Post('territory')` → real). Ya'ni xodim darvozada yuz-skaner orqali kelishi HR davomatiga yoziladi. Lekin bu xavfsizlik moduli emas, HR |
| **Material/mashina chiqishi → Ombor** | ❌ UZILGAN — KPP yo'q, mashina chiqishi omborga (chiqim hujjatiga) bog'lanmaydi |
| **Hodisa → boshqaruv** | 🟡 Hodisa qayd ko'rinadi, lekin bo'sh |

## DB MUAMMOLARI (sodda)
- ❌ **Darvoza/KPP/kirish/tashrif jadvallari UMUMAN YO'Q** (gate_logs, kpp_logs, access_logs, visitor_passes) — modulning mohiyati
- ✅ Faqat security_incidents (hodisalar) + security_attendance jadvallari bor (bo'sh)
- ⚠️ Yagona haqiqiy kirish-kuzatuvi (yuz-kamera territory log) HR modulida (security'da emas)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **KPP (darvoza nazorati) umuman yo'q** — mashina/haydovchi/yukni qayd qiladigan joy yo'q. Egasi vizyonining asosiy qismi qurilmagan
2. 🔴 **Tashrifchilar soxta** — ro'yxat har doim bo'sh, chiqish saqlanmaydi
3. 🔴 **Ko'p funksiya "tayyor emas"** — PPE, yong'in, kunlik xulosa stub
4. ⚠️ **Material chiqishi omborga bog'lanmagan** — chiqayotgan yukni nazorat qilib bo'lmaydi

---

## XULOSA (egasiga)
Xavfsizlik — eng zaif, eng ko'p qurilishi kerak modul. Ekranlar bor, lekin **modulning mohiyati ishlamaydi:**
- **Darvoza (KPP) nazorati umuman yo'q** — mashina/haydovchi/yukni qayd qiladigan joy hatto bazada ham yo'q
- **Tashrifchilar ro'yxati soxta** — har doim bo'sh, chiqish saqlanmaydi
- **Ko'p funksiya "tayyor emas"** (PPE, yong'in, kunlik xulosa)

Yagona ishlaydigan kirish-kuzatuvi — yuz-kamera (xodim darvozada yuzini skanerlasa, HR davomatiga yoziladi), lekin u HR modulida, xavfsizlikda emas.

Metafora: xavfsizlik xonasi eshigida "Qorovul" yozuvi bor, lekin ichkarida daftarcha yo'q — qorovul tashrifchilar ro'yxatini ochsa, u har doim bo'sh (soxta), darvozada mashinani yozsa, saqlaydigan joy yo'q. Yagona haqiqiy nazorat — yuz-kamera, u ham boshqa bo'limga (HR) tegishli.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
