# 📲 IoT / OPERATOR PLANSHET — INPUT MAYDONLAR TO'LIQ TAHLILI (operator qo'lda kiritadigan har ma'lumot)
> Sana: 2026-06-04 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator yoki baza, qavs ichida). Avvalgi "501" topilma NOLDAN qayta tekshirildi.

> **Bu nima:** Sex (zavod tsexi) planshети — mashina operatori o'z ishini qayd qiladigan ekran: ishni
> boshlash, qancha ishlab chiqarganini yozish, brak/nuqsonni yozish, sarflangan materialни skanерlash,
> mashina to'xtashini qayd qilish, smenani topshirish. Bu MES (ishlab chiqarish) va omborга (material
> sarfi) ma'lumot berishi kerak.

> ⭐⭐ **BIR JUMLALI XULOSA (qayta tekshirildi — avvalgi topilma TO'G'RI, eskirmagan):** Planshet
> "qobiq" — chiroyli ko'rinadi, operator **tizimga kira oladi, o'z buyurtmalarini/mashinasini ko'ra oladi,
> favqulodda (SOS) tugmasini bosa oladi** — bular ishlaydi. LEKIN operator **HECH QANDAY ishini qayd
> qila olmaydi:** ishni boshlash, ishlab chiqarish miqdori, brak, material skani, smena topshirish —
> HAMMASI "tayyor emas" (501) qaytaradi va HECH NARSA saqlamaydi.

> **DB holati:** ish-yozish jadvallari umuman YO'Q (iot_production_sessions / iot_downtime_events /
> iot_tablet_sessions / iot_material_kits — hammasi null). Faqat mes_production_sessions bor (boshqa modul, planshetga ulanmagan).

---

# 1-QADAM — PLANSHET EKRANLARI VA FORMALARI

**Topildi: 8 ta planshet ekrani, ~14 input maydon, ulardan ~10 tasi 501/soxta.**

| # | Ekran | Maqsad | Holat |
|---|---|---|---|
| 1 | Kirish (login) | Operator tabel raqami + parol | 🟢 REAL |
| 2 | Buyurtmalarim / Mashinam | Tayinlangan ishni ko'rish | 🟢 REAL (faqat o'qish) |
| 3 | Ishni boshlash/to'xtatish | Smena/sessiya start-stop | 🔴 501 |
| 4 | Brak/nuqson qayd | Brak miqdori + sabab | 🔴 501 |
| 5 | Mashina to'xtashi (downtime) | To'xtash sababi + izoh | 🔴 501 (tablet) |
| 6 | Material skani (sarf) | Sarflangan materialni skanерlash | 🔴 501 |
| 7 | Liniya QC (inline) | QC nuqson soni + izoh | 🔴 501 |
| 8 | Smena topshirish (handover) | Keyingi smenaga izoh | 🔴 501 |
| ⭐ | SOS (favqulodda) | Xavfsizlik tugmasi | 🟢 REAL |

**Fayl:** IoTTablet.tsx + pages/iot/useIoTTablet*.ts (8 hook fayl). **Backend:** iot-tablet.controller.ts.

> ⚠️ Sarlavha izohi tasdiqlaydi (iot-tablet.controller.ts:5-7): *"Wave 11 P1: besh endpoint amalga oshirilgan — login, sos-alert, equipment, orders, worker-schedule. Qolganlari P3-26 stub, HTTP 501 qaytaradi."*

---

# 2-QADAM — HAR FORMA, MAYDONMA-MAYDON

## 🟢 FORMA 1 — KIRISH (login) — ISHLAYDI
**Saqlash:** `POST /api/iot/tablet/login` (iot-tablet.controller.ts:115 — REAL, tabletSvc.login).
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| Tabel raqami | matn/raqam | ✅ HA | login (autentifikatsiya) | schema (parse) | 🟢 REAL |
| Parol | matn | ✅ HA | login | schema | 🟢 REAL |

## 🟢 FORMA 2 — SOS (favqulodda) — ISHLAYDI
**Saqlash:** `POST /api/iot/tablet/sos-alert` (iot-tablet.controller.ts:126 — REAL, raiseSosAlert insert).
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| Ogohlantirish turi | ro'yxat | yo'q | sos-alert (insert + listener) | schema | 🟢 REAL |
| Xabar | matn | yo'q | sos-alert | schema | 🟢 REAL |

> ⭐ SOS xavfsizlik uchun atayin "fail-open" — operator noma'lum bo'lsa ham yoziladi (:130-132). To'g'ri qaror.

## 🔴 FORMA 3 — ISHNI BOSHLASH/TO'XTATISH — 501
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| Buyurtma tanlash | ro'yxat | ✅ HA | (o'qish real, lekin START saqlamaydi) | — | 🟡 ko'rish real |
| Ishni boshlash | tugma | — | ❌ `POST production-sessions/:id/start` → **501** (:190) | — | 🔴 501 |
| Ishni to'xtatish | tugma | — | ❌ `POST .../stop` → **501** (:197) | — | 🔴 501 |

## 🔴 FORMA 4 — BRAK/NUQSON QAYD — 501
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| Brak miqdori (defectQty) | raqam | — | ❌ `POST .../defect` → **501** (:204) | ⚠️ yo'q | 🔴 501 |
| Brak sababi (defectReason) | ro'yxat | — | ❌ **501** | — | 🔴 501 |
| Brak bosqichi (defectStage) | ro'yxat | — | ❌ **501** | — | 🔴 501 |

> Dalil: FE'da maydonlar bor (useIoTTabletCore.ts:57-59 defectQty/defectReason/defectStage), lekin submit 501.

## 🔴 FORMA 5 — MASHINA TO'XTASHI (downtime, planshet) — 501
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| To'xtash sababi kodi | ro'yxat | — | ❌ reason-codes GET ham **501** (iot-main:270) | — | 🔴 501 |
| To'xtash izohi (downtimeNotes) | matn | — | ❌ planshetdan real IoT POST yo'q | — | 🔴 501 |

> ⚠️ MUHIM nuance: MES'da ALOHIDA, real downtime endpoint BOR (`POST /mes/downtime-events`, mes-maintenance.controller:133) — lekin u **desktop MESDowntimes sahifasi** (`/mes/downtimes`) uchun, OPERATOR PLANSHETI uchun emas. Operator planshetdan to'xtashni qayd qila olmaydi.

## 🔴 FORMA 6 — MATERIAL SKANI (sarf) — 501
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| Material skani (scanningItemId) | skan | — | ❌ `POST material-kit-items/:id/scan` → **501** (:156) | — | 🔴 501 |

## 🔴 FORMA 7 — LINIYA QC (inline) — 501
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| QC nuqson soni (qcDefectCount) | raqam | — | ❌ `POST .../inline-qc` → **501** (:225) | ⚠️ yo'q | 🔴 501 |
| QC izohi (qcNotes) | matn | — | ❌ **501** | — | 🔴 501 |

## 🔴 FORMA 8 — SMENA TOPSHIRISH (handover) — 501
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/501 |
|---|---|---|---|---|---|
| Topshirish izohlari (handoverNotes) | matn (bir nechta) | — | ❌ `POST tablet/handover` → **501** (:147) | — | 🔴 501 |

---

## 📝 MAYDONLAR XULOSASI (sodda)
- **MUSTAHKAM (ROST ishlaydi):** Tabel+parol (login), SOS turi+xabar (favqulodda). Faqat shu 4 maydon.
- **🔴 SOXTA/501 (ekranda bor, saqlamaydi):** brak miqdori, brak sababi, brak bosqichi, to'xtash sababi, to'xtash izohi, material skani, QC nuqson soni, QC izohi, smena topshirish izohi — HAMMASI 501. Operator yozadi, tugma bosadi → "tayyor emas", hech narsa saqlanmaydi.
- **YO'Q (ish uchun kerak, lekin maydon ham yo'q):** "Ishlab chiqarilgan miqdor" (output qty) uchun alohida maydon ko'rinmaydi — faqat brak (defectQty) bor; demak operator "men 500 dona qildim" deyishning to'g'ridan-to'g'ri joyi ham yo'q (start/stop vaqt orqali kutilgan, lekin u ham 501).
- **⚠️ TEKSHIRUVSIZ:** brak miqdori, QC soni — manfiy/cheksiz qiymat (lekin baribir 501 saqlamaydi).

---

# 3-QADAM — OPERATOR OQIMI (boshlash → ishlab chiqarish → brak → material → smena tugatish)

| Bosqich | Operator nima kiritadi | Saqlanadimi? | MES/omborга yetadimi? | Holat |
|---|---|---|---|---|
| **Kirish** | tabel + parol | ✅ HA (login real) | — | 🟢 REAL |
| **Ishni ko'rish** | buyurtma/mashina tanlash | ✅ o'qish real | — | 🟢 REAL (faqat ko'rish) |
| **Ishni boshlash** | start tugma | ❌ **501** | ❌ YO'Q | 🔴 qurilmagan |
| **Ishlab chiqarish miqdori** | (maydon ham yo'q) | ❌ YO'Q | ❌ YO'Q | 🔴 qurilmagan |
| **Brak qayd** | miqdor+sabab+bosqich | ❌ **501** | ❌ YO'Q | 🔴 qurilmagan |
| **Material sarfi (skan)** | material skani | ❌ **501** | ❌ omborga sarf YETMAYDI | 🔴 qurilmagan |
| **Liniya QC** | nuqson soni+izoh | ❌ **501** | ❌ QC'ga YETMAYDI | 🔴 qurilmagan |
| **Smena tugatish** | topshirish izohi | ❌ **501** | ❌ YO'Q | 🔴 qurilmagan |
| **SOS (favqulodda)** | tur+xabar | ✅ HA (real insert) | ✅ listener'ga yetadi | 🟢 REAL |

### ⭐ Zanjir qayerda uziladi
Operator planshetdan ish qayd qila olmaganligi uchun **butun zanjir boshidayoq uziladi:**
- 🔴 Ishlab chiqarish → MES: planshetdan **HECH NARSA o'tmaydi** (start/stop/miqdor 501)
- 🔴 Material sarfi → Ombor: skan 501, demak **sarflangan material ombordan kamaymaydi**
- 🔴 Brak → QC/MES: 501, **brak hech qayerga yozilmaydi**

> Ya'ni: 7-modul (MES) va 15-modul (IoT) topilmasi TASDIQLANDI — operator planshети ishlab chiqarish ma'lumotini bera olmaydi, shuning uchun MES "yoqilg'isiz" qoladi.

---

# 4-QADAM — UMUMIY XULOSA

## Ekranlar jadvali
| Ekran | Maydon | Real | Soxta/501 |
|---|---|---|---|
| Kirish | 2 | 2 | 0 |
| SOS | 2 | 2 | 0 |
| Ishni ko'rish | (o'qish) | ✅ | — |
| Ishni boshlash/to'xtatish | 1+2 tugma | 0 | start/stop 501 |
| Brak qayd | 3 | 0 | 3 |
| Downtime | 2 | 0 | 2 |
| Material skani | 1 | 0 | 1 |
| Liniya QC | 2 | 0 | 2 |
| Smena topshirish | 1 | 0 | 1 |

**Jami: ~14 maydon, 4 real (login+SOS), ~10 ta 501/soxta. → Operator hech qanday ISH qayd qila olmaydi.**

## ⭐ INPUT-DATA VERDIKTI (egasi savoli)
**Operator nimani ROST kiritib saqlay oladi:** Faqat 2 narsa — tizimga kirish (tabel+parol) va favqulodda SOS tugmasi (xavfsizlik). Shulardan tashqari hech narsa.

**Ekranda kiritsa bo'ladigandek ko'rinadi, lekin SAQLAMAYDI (501):** ishni boshlash, ishlab chiqarish, brak miqdori/sabab, mashina to'xtashi, material skani, liniya QC, smena topshirish — HAMMASI. Operator raqam yozadi, tugma bosadi, lekin tizim "tayyor emas" deydi va hech narsa saqlanmaydi.

**Halol tomoni:** bu SOXTA-muvaffaqiyat EMAS — tizim halol "501 / tayyor emas" qaytaradi (yashil yolg'on emas). Lekin operator uchun natija bir xil: ishini qayd qila olmaydi.

## DB MUAMMOLARI (sodda)
- ❌ **iot_production_sessions jadvali YO'Q** → ishlab chiqarish qayd qilib bo'lmaydi
- ❌ **iot_downtime_events jadvali YO'Q** → planshetdan to'xtash qayd qilib bo'lmaydi
- ❌ **iot_tablet_sessions jadvali YO'Q** → smena sessiyasi yo'q
- ❌ **iot_material_kits jadvali YO'Q** → material skani saqlanmaydi
- ✅ Faqat mes_production_sessions bor (boshqa modul — planshetga ulanmagan)

## ⭐ ENG MUHIM 5 INPUT MUAMMOSI (egasi birinchi shularni hal qilsin)
1. 🔴 **Ishlab chiqarish miqdorini yozib bo'lmaydi** — start/stop 501, "ishlab chiqarilgan miqdor" maydoni ham yo'q (MES'ning asosiy yoqilg'isi)
2. 🔴 **Brak qayd qilib bo'lmaydi** — miqdor/sabab/bosqich bor, lekin submit 501 (sifat statistikasi yo'q)
3. 🔴 **Material sarfi skani 501** — sarflangan material ombordan kamaymaydi (ombor noto'g'ri qoldiq ko'rsatadi)
4. 🔴 **4 ta jadval umuman yo'q** — production-sessions/downtime-events/tablet-sessions/material-kits
5. 🟡 **"Ishlab chiqarilgan miqdor" maydoni dizaynda ham yo'q** — faqat brak bor; asosiy ishlab chiqarish kirituvi yetishmaydi

---

## XULOSA (egasiga)
Operator planshети — kutilgandek "qobiq". Bu modulda eng katta savol "operator ishini qayd qila oladimi?" edi. **Javob: YO'Q.** Operator faqat tizimga kira oladi, o'z buyurtmasini va mashinasini ko'ra oladi, va favqulodda tugmasini bosa oladi — bular ROST. Lekin ishini qayd qilishning HAR usuli (boshlash, ishlab chiqarish miqdori, brak, material skani, smena topshirish) "tayyor emas" (501) qaytaradi va hech narsa saqlamaydi. Buning uchun kerakli 4 jadval umuman yaratilmagan.

Bu — halol "tayyor emas" (soxta-muvaffaqiyat emas — yashil yolg'on emas), lekin operator uchun natija bir xil: planshet ish qurolini emas, faqat "ko'rish oynasi"ni beradi. Va shuning uchun butun ishlab chiqarish zanjiri shu yerdan uziladi — MES "yoqilg'isiz" qoladi (operator data kiritmaguncha), material ombordan kamaymaydi.

⭐ **Avvalgi topilma (7+15 modul: "tablet 501") qayta tasdiqlandi — eskirmagan.** Login/SOS/o'qish qo'shildi (Wave 11), lekin asosiy ish-yozish hali ham 501.

Metafora: tsexga chiroyli planshet o'rnatilgan — operator kartasi bilan kiradi, ekranda bugungi ishini va mashinasini ko'radi, qizil favqulodda tugmasi ham ishlaydi. Lekin "500 dona qildim", "3 tasi brak", "shu materialni ishlatdim" deb yozmoqchi bo'lsa — har tugma "tez orada" deb javob beradi. Ya'ni planshet ko'rsatadi, lekin yozib olmaydi — bu daftarсиz qalam.

> Hech narsa o'zgartirmadim (faqat o'qidim + bu hujjatni yozdim). Tuzatishni Agent 1 sizning qaroringiz bo'yicha qiladi.
