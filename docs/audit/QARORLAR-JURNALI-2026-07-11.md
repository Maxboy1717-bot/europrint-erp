# QARORLAR JURNALI — 2026-07-11 (YAKUNIY)

> Egasi (Muslimbek) chatда dataGated 277 бўйича берган барча жавоблар. Авторитет манба (Q-26).
> Асосий CRUD-тасниф: [[OWNER-JAVOBLAR-2026-07-11]]. Global CRUD tizimi qurilgan (business_settings).

## 🌍 GLOBAL QOIDALAR (xotirada)
1. **CRUD-qoidasi:** threshold/norma/%/kun/summa — hardcode YO'Q, `business_settings` CRUD orqali.
2. **Org-lookup qoidasi:** "qaysi org bo'lim/rol X" — alohida so'ralmaydi; Org `head_user_id` to'ldirilgach auto (masalan 20-cc#88).

## ✅ ARXITEKTURA / MODUL EGALIGI
| Item | Egasi |
|---|---|
| 08-mes #115 qog'oz zayavka | **PP/Rejalashtirish-AI** |
| 09-qc #9 qolip reestri | **Dizayn** |
| 09-qc #60 mijoz maket tasdig'i | **SD (savdo)** |
| 09-qc #75 qaytgan mahsulot qabuli | **QC** |
| 13-crm #21/#96 3-imzoli waybill | **SD** |
| 11-mm ##37 rolik/poddon aktivlar | **WMS** |
| 20-cc #88 Sovershenstvovanie bo'lim | Orgsxema orqali (auto) |

## ⚖️ STRATEGIK
| Item | Qaror |
|---|---|
| 05-director #89 / 19-pos #96 | **A-System TO'LIQ almashtiriladi** (ERP o'rin bosadi) |
| 05-director #35 / 16-iot #17,#107,#67 | **IoT energiya/plyonka sensorlar CAPEX** sotib olinadi (qo'lda emas) |
| 19-pos #14/#79/#106 | **POS omborchi GSD formulasi CKP asosida QAYTADAN** ⚠️ alohida ishlanadi |

## 💰 MOLIYA / TASDIQLASH SIYOSATI
| Item | Qaror |
|---|---|
| 03-finance #118 | Tannarxdan past narx → **direktor tasdig'i** (qat'iy blok emas) |
| 09-qc #27 | Reklamatsiya rad → direktorga faqat **kritik summa/muhim mijoz auto** (aniq summa yo'q) |
| 20-cc #49 | CC tasdiqdan keyin **GL'ga auto** (hisob-raqam GL blokida) |
| 13-crm #7 | Qarz blok → **faqat credit_limit oshganda** (har ochiq qarzda emas) |
| 19-pos #26 | Limit oshgan mijoz → **to'liq to'lov YOKI direktor tasdig'i** (qisman yetarli emas) |
| 03-finance #130/#17 | ZNO to'lov ustuvorligi → **moliya direktori qo'lda** (auto tartib yo'q) |
| 03-finance #101 | Energiya xarajat → **stanok-soat teng taqsim** (IoT kelgach) |

## 👥 RBAC / EGALIK / MAS'ULLIK
| Item | Qaror |
|---|---|
| 13-crm #24/#117 | Mijoz kartasi → boshqa menejer **ko'radi, tahrirlay OLMAYDI** |
| 13-crm #89 | Papka№ → **har buyurtma alohida** (qolip kodlari alohida tizim) |
| 13-crm #46/#135 | Mijoz-operator → **1-buyurtma operatori doimiy biriktiriladi** |
| 20-cc #27/#90/#91 | Hujjat maydoni → **har bo'lim faqat o'z qismini** (texnolog→tex, sifat→QC) |
| 16-iot #59 | Qolip-tayyor emas mas'ul → **qolip tayyorlovchi + dizayn rahbari** |
| 16-iot #6 | Papka yarim tayyor → **PP boshlig'iga**, 2 variant (almashtirish/to'xtatish) |

## 🔧 ISH JARAYONI / LOGIKA
| Item | Qaror |
|---|---|
| 10-wms #8 | Xarid tasdiqlash → **orgsxema (head_user_id)** (summa jadval emas) |
| 10-wms #35 | Zona sig'imi → CRUD, **m²**, 2 qiymat (ogohlantirish% + blok%) |
| 13-crm #129 | STP/format versiya → **qat'iy blok** (2-tur o'zgarish = yangi versiya) |
| 18-notif #89 | Mijoz aybli nosozlik → QC "mijoz aybi" desa **auto savdo menejeriga** |
| 18-notif #115 | Bo'lim hisoboti → **real-vaqt** (webhook/API), batch emas |
| 11-mm ##46 | "Narx tejovi" KPI → **oddiy foiz** (byudjet vs fakt) |
| 05-director #24 | MTD kesim → **MES (fakt) asosiy** |
| 05-director #92 | "Muvaffaqiyatli harakat" (AI) → **reja to'liq + brak yo'q + o'z vaqtida** |
| 05-director #43 | Qayta-imzo → **har bo'lim alohida** |
| 05-director #126 | Xato tasnifi → **qo'lda/qoida** (AI kutilmaydi) |
| 14-mkt #14-96 | SD'ga o'tish majburiy → **STIR + shartnoma + manzil** |
| 19-pos #94 | Norma-fakt manba → **PP standart norma (pp_routing_operations)** |
| 20-cc #41/#72 | AI pre-approval → **100 hujjat to'planguncha** |
| 16-iot #75 | Laminatsiya avto/qo'lda → **har mashina owner/texnolog belgilaydi** |
| 12-lms #30 | Sertifikat imzo → **vaqtincha SHA-256+IP** |

## ⏳ HALI OCHILMAGAN (keyingi bosqichlar)
1. **Taksonomiya ro'yxatlari** — mahsulot turlari (~15, ENG MUHIM), chegirma, bezash, qadoqlash, kod-lug'at.
2. **Hujjat shablon matnlari** — CC/LMS/MES formalar.
3. **GL/moliya bloki** — 26+ item, oddiy tilda alohida.
4. **Kredensiallar** — Telegram/SMS/kamera/sensor CAPEX.
5. **Real ma'lumot** — tarixiy Excel, byudjet, mashina-normalar.
6. **Org `head_user_id`** — 52 blocked + ko'p rol-item ochadi.

> ⭐ Tavsiya: keyingi ish — **taksonomiya (mahsulot turlari)** — eng ko'p joyda ishlatiladi.
