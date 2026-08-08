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

---

## 📋 TAKSONOMIYA KONTENTI — SEED QILINDI (2026-07-11, jonli)
Egasi haqiqiy ro'yxatlarni berdi → `taxonomy_entries`ga 81 yozuv seed qilindi (commit de4004d8,
europrint jonli). Egasi `/admin/taxonomy` orqali o'zgartiradi:
- **product_type (15):** Gofrakarton list, Gofrokorob, Mikrogofrokorob, Latok, Tray/podnos, Fleksopechat qadoq, Ofset qadoq, Kashirovka, Tigel, Palletli, Displey, Rulon(gofra), List(yassi), Bo'yalgan/laminatsiya, Maxsus.
- discount_type(5) · decoration_type(3) · document_type(6) · kanban_stage(7) · supplier_type(6) · rejection_reason(6) · paper_class(4: topliner/mahalliy/testliner/flyuting) · expense_category(9) · notification_category(6) · org_policy_series(5) · manager_note_category(5) · code_prefix(4: KT/PT/E/GL).
- ⚠️ **07-pp#119 tuzatish:** bezash turlari = CRUD ro'yxat (AI-reja+operator-tayinlash uchun MAJBURIY), "erkin matn" EMAS.

## 💰 GL/MOLIYA QOIDALARI (soddalashtirildi, 2026-07-11)
- **Zarar itemlari** (rework/brak/material-isrofi/muddati-o'tgan/kamomad) → vaqtincha **"Ishlab chiqarish zarari"** hisobiga, keyin buxgalter aniqlaydi.
- **Makulatura qayta-sotuv daromadi** → **"Boshqa daromadlar"**.
- **Marketing xarajat + referral bonus** → ikkisi alohida yangi hisobga.
- **Yo'lda tovar** → vaqtincha **"Yo'lda tovar"** → yetib borgach asosiy hisobga.
- **Boshlang'ich ombor qoldig'i** → direktor tasdig'i bilan bir-martalik.
- **CC hujjat tasdig'i** → auto GL (aniq hisob-raqam buxgalter bilan keyin).

## 🔌 KREDENSIALLAR (2026-07-11)
- Telegram: **har modulga alohida bot** (batafsil 30-savollik alohida sessiya).
- SMS: Eskiz.uz/Play Mobile CRUD + ⭐ **AI qo'ng'iroq** (muhim jarayonlar SMS+qo'ng'iroq → rahbarlar) — YANGI talab.
- AI-kamera (5S/sifat): CAPEX ✓, dona keyin.
- ⚠️ 1C: kattalashtirildi — **ERP→1C moliyaviy uzatish** (alohida loyiha).
- Telefoniya: IP-PBX (Zadarma/Beeline). Yig'ilish kamerasi: CAPEX ✓, direktor-only, 1 yil.

## 📄 HUJJAT SHABLONLARI — YAKUNLANDI
20-cc shablonlar "asosiy maydonlar + CRUD kengaytirish" bilan yopildi. ⚠️ Ochiq: **приказ + NDA yuridik matn** (alohida matn-sessiya).

## ⏳ HAQIQIY OCHIQ (keyingi sessiya)
1. **Org `head_user_id`** — ENG KATTA blocker (52 item + rol-itemlar). 2. приказ+NDA yuridik matn.
3. Telegram bot-per-modul reja. 4. ERP↔1C integratsiya. 5. 5 taksonomiya (cc aloqa-turi, yo'nalish-turi ro'yxat, qadoqlash 10+, lavozim-vositalari, operatsiya-katalogi). 6. Buxgalteriya avtomatlashtirish g'oyasi.

---

## 📋 5 QOLGAN TAKSONOMIYA — YAKUNLANDI (2026-07-11, seed)
Seed qilindi (commit 6d27e557, jonli — jami 96 taxonomy_entries):
- **contact_type (5):** Buyruq, Ma'lumot talabi, Bildirishnoma, So'rov, Hisobot.
- **direction_type (4 starter):** Ofs-karton, Ofs-gofra, Flekso-gofra, Flekso-karton (egasi CRUD orqali to'ldiradi).
- **operation_type (6 starter):** Lak, Kley, Rezka, Bosma, Kashirovka, Vysechka (egasi to'ldiradi).
- packaging (07-pp#120) + lavozim-vositalari (05-director#102) → egasi ERP CRUD orqali to'ldiradi (bo'sh kategoriya).

## 📄 YURIDIK MATNLAR (2026-07-11)
- 01-org#37 (приказ): standart shablon (O'zbekiston mehnat qonuni) — Claude tayyorlaydi (kelgusi matn-sessiya).
- 12-lms#74 (NDA): yurist bilan (tashqi).

## 🌍 YANGI GLOBAL TAMOYIL (xotirada)
**Hech kim ERP tashqarisida (Excel/Word) ishlamasin** — ERP ichida teng funksionallik shart. Excel-import = ixtiyoriy/bir-martalik, asosiy yo'l emas.

## 🏛️ ORG STRUKTURA (head_user_id) — ⚠️ TEKSHIRUV NATIJASI (2026-07-11)
Egasi: "93 test-karta o'chirilsin, hammasi test/demo". **LEKIN jonli tekshiruv ZID ko'rsatdi:**
- `org_departments` = **143 qator, HAQIQIY nomlar bilan** (Ma'muriyat, Bosh Direktor ofisi, Kadrlar bo'limi,
  Marketing, Sotuvlar, Moliya...) + **head_user_id ALLAQACHON to'ldirilgan** (34/35/37/39/40/42/44/47...).
- `org_functions` = 97 qator · `positions` = 96 qator · `users.card_id` = 1 · `employees` = 31.
- Bu "hammasi test/demo" tavsifiga MOS EMAS — ko'pi haqiqiy-ko'rinishli struktura, head_user_id bog'langan.
- ⛔ **HECH NARSA O'CHIRILMADI.** Agar bularni o'chirsam, head_user_id (RBAC) bog'lanishlari uziladi — ko'p
  item shunga tayanadi. **Aniqlik kerak:** aynan qaysi 93 karta / qaysi jadval test? (org_departments haqiqiy
  ko'rinadi.) Egasi tasdiqlamaguncha o'chirish yo'q (Q-46 look-before-delete).
