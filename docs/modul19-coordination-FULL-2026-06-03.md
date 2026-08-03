# MODUL 19 — KOORDINATSIYA (Bo'limlararo ish oqimi) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Bo'limlar orasidagi "yo'l boshqaruvchisi" — bir bo'lim ishni keyingisiga uzatishi
> (handoff), bo'limlararo tasdiqlar, eskalatsiya (yuqoriga ko'tarish), bo'limlararo xabar/bildirishnoma.
> Bu modulning BUTUN MAQSADI — qolganlarini BOG'LASH. Shuning uchun bu — "modullar orol" muammosining
> eng muhim sinovi.

> ⭐⭐ **BIR JUMLALI XULOSA (eng muhim savol — bu qatlam ROSTAN bog'laydimi yoki yana bir ko'rinish?):**
> YAXSHI XABAR — bu yerda BITTA HAQIQIY, isbotlangan bog'lanish bor: **buyurtmaga avans to'langanda → tizim
> avtomatik 5 bo'limga ish tarqatadi** (qolip/dizayn/klishe/logistika/ombor), va har bo'lim o'z jadvaliga
> haqiqiy yozuv oladi. Bu — shunchaki chiroyli sxema EMAS, ROST ko'chiradi. LEKIN bu — YAGONA avtomatik
> bog'lanish (qolgan "QC brak→qayta ishlash", "kam qoldiq→xarid" hali qo'lda), data bo'sh, va eskalatsiya
> ("rahbarimga ko'tar") buzuq (har bir xodimning rahbari bazada ko'rsatilmagan).

> **DB holati:** fan-out jadvallari bor (hammasi bo'sh — qurilish bosqichi); dokla/rasporyazhenie jadval bor;
> employees.manager_id 30/30 NULL → "rahbarga eskalatsiya" yo'li uzilgan.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 5 ta asosiy koordinatsiya sahifasi + 1 "ko'rinmas dvigatel"** (fan-out — sahifa emas, lekin asosiy bog'lovchi).

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | **Koordinatsiya** (dokla/rasporyazhenie/3-savat) | /coordination |
| 2 | **Tasdiqlash oqimi** | /approval-workflow, /approvals |
| 3 | Buyurtma tasdiqlash oqimi | /order-approval, OrderWorkflow |
| 4 | Bo'lim tasdiqlari (Dizayn/Moliya/QC/Texno) | /design/approval, /finance/approval, /qc/approval, /tech-approval |
| ⭐ | **Buyurtma→Bo'lim fan-out** (ko'rinmas dvigatel — ASOSIY bog'lovchi) | (sahifa emas; avans to'langanda avtomatik ishlaydi) |

---

# 2-QADAM — HAR SAHIFA

## 🟢 ⭐⭐ ASOSIY DVIGATEL — BUYURTMA→BO'LIM FAN-OUT (eng muhim — ROST bog'lanish)
**Nima uchun:** Buyurtma menejeri qaysi bo'limlar kerakligini belgilaydi → mijoz 70% avans to'laydi → tizim AVTOMATIK har tanlangan bo'limga ish tarqatadi (har biri kuzatiladigan job: "boshlandi"→"bajarildi").
**HAQIQATAN ISHLAYDIMI — HA:**
- **Signal yuboriladimi (publisher bormi)?** → ✅ HA. Avans tasdiqlanganda tizim "Avans tasdiqlandi" xabarini yuboradi (confirm-advance-payment.handler:115 `eventBus.publish(new AdvanceApprovedEvent)`; +tech-three-checkpoint.listener:92). ⭐ Bu MUHIM: Moliyada tinglovchilar bor edi, lekin XABAR yuboruvchi yo'q edi (o'lik). Bu yerda xabar ROST yuboriladi.
- **Xabarni kim ushlaydi (tinglovchi)?** → ✅ HA (advance-approved-fanout.listener:25 `handle`). Tanlangan bo'limlarni o'qiydi, har biriga job yaratadi, "boshlandi" deb belgilaydi.
- **NECHTA bo'lim ulangan?** → ✅ **5 bo'lim:** qolip (mold:41), dizayn (design:49), klishe (cliche:57), logistika (logistics:65), ombor (warehouse:73). Har biri o'z bo'lim jadvaliga (ow_molds / ow_tech_cards / ow_cliches / ow_shipping_requests / ow_material_requirements) HAQIQIY yozuv yaratadi + holatni "boshlandi" qiladi.
- ⚠️ **6-bo'lim (ishlab chiqarish) ulanmagan** (:84 "department not yet wired" — line-item/katalog yo'q).
- ⚠️ **Sarlavha eskirgan:** kodning izohi "faqat qolip ulangan" deydi (:9), LEKIN kod aslida 5 bo'limni ulagan (izoh yangilanmay qolgan — verify-don't-trust: izohga emas, kodga ishondim).
**Ma'lumot:** sd_order_departments=0, ow_molds=0, ow_tech_cards=0, ow_cliches=0, ow_shipping_requests=0, ow_material_requirements=0 (HAMMASI BO'SH — qurilish bosqichi; ilgari 1 buyurtma/5 bo'lim bilan jonli isbotlangan, keyin tozalangan).
**Holat:** 🟢 (mexanizm ROST + isbotlangan, lekin hozir bo'sh + tor).
**Foydalanuvchi nima qila olmaydi:** Bu BITTA bog'lanish ROST ishlaydi (avans→5 bo'lim), LEKIN bu yagona avtomatik bog'lanish — boshqa hech bir bo'lim boshqasiga avtomatik ish uzatmaydi (QC brak→qayta ishlash, kam qoldiq→xarid hali ham qo'lda).

## 🟢 1. KOORDINATSIYA — `/coordination` (CoordinationPage.tsx)
**Nima uchun:** Hujjat oqimi — doklad (hisobot) yozish, rasporyazhenie (farmoyish) berish, 3-savat (kiruvchi/kutish/chiquvchi).
**Tugma:**
- "Doklad yaratish" → **REAL** (coordination.controller:59 `POST dokla`, createDoklaWithValidation — tekshirib saqlaydi)
- "Farmoyish yaratish" → **REAL** (:103 `POST rasporyazhenie`, createRaspWithValidation)
- 3-savat ko'rish, statistika → real
**Ma'lumot:** dokla + rasporyazhenie jadvallari bor (schema-business-a-2.ts:39,53).
**Holat:** 🟢 (real hujjat oqimi, lekin QO'LDA — odam yozadi/yuboradi).
**Foydalanuvchi nima qila olmaydi:** Doklad/farmoyish yozish va yuborish ishlaydi, lekin bu qo'lda hujjat almashinuvi (avtomatik bo'lim-bog'lanish emas).

## 🟢 2. TASDIQLASH OQIMI — `/approval-workflow` (ApprovalWorkflowPage.tsx)
**Nima uchun:** Umumiy tasdiqlash dvigateli — biror narsani tasdiqqa yuborish, tasdiqlash/rad etish, kutilayotganlar.
**Tugma:**
- "Tasdiqqa yuborish" → **REAL** (approval-workflow.controller:87 `submit`, svc.create)
- "Tasdiqlash" → **REAL** (:94 `approve/:id`, svc.approve, kim tasdiqlagani yoziladi)
- "Rad etish" → **REAL** (:103 `reject/:id`, svc.reject + sabab)
- "Kutilayotganlar / tarix" → real (svc.getPending / getHistory)
**Holat:** 🟢 (real tasdiqlash dvigateli). **Foydalanuvchi nima qila olmaydi:** Ishlaydi (tasdiq/rad real saqlanadi).

## 🟡 3. BUYURTMA TASDIQLASH OQIMI — `/order-approval` (OrderApprovalWorkflow.tsx)
**Nima uchun:** Buyurtma bo'yicha bosqichma-bosqich tasdiqlash.
**Tugma:** `/approval-workflow/order` ga ulanadi (umumiy dvigatelga) — asosan real.
**Holat:** 🟡 (real dvigatelga ulanadi, lekin buyurtma-fan-out bilan to'liq integratsiya emas).
**Foydalanuvchi nima qila olmaydi:** Buyurtmani tasdiqlay oladi, lekin bu tasdiq avtomatik fan-out bilan bir oqim emas (alohida).

## 🟡 4. BO'LIM TASDIQLARI — Dizayn/Moliya/QC/Texno (/design/approval, /qc/approval, ...)
**Nima uchun:** Har bo'lim o'z tasdiqlarini ko'radi/beradi.
**Tugma:** Aralash — ba'zilari real (umumiy dvigatelga ulangan), ⚠️ **QC buyurtma-darajasidagi 3-qaror (tasdiq/rad) SOXTA** edi (4-modulda topilgan: qc_approvals jadvali yo'q, `/qc/approve/qc/`).
**Holat:** 🟡 (aralash — qism real, QC order-darajasi soxta).
**Foydalanuvchi nima qila olmaydi:** Bo'lim tasdiqlarini ko'radi, lekin QC'da buyurtma-darajasidagi qaror saqlanmaydi (4-modul).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| ⭐ Buyurtma→Bo'lim fan-out | 🟢 | ROST bog'laydi, lekin bo'sh + tor (5/6) | ~70 |
| Koordinatsiya (dokla/rasp) | 🟢 | qo'lda hujjat oqimi | ~65 |
| Tasdiqlash oqimi | 🟢 | — (real dvigatel) | ~70 |
| Buyurtma tasdiqlash | 🟡 | fan-out bilan ulanmagan | ~50 |
| Bo'lim tasdiqlari | 🟡 | QC order-darajasi soxta | ~45 |

**Jami: 3 🟢 · 2 🟡 · 0 🔴 → taxminan ~60% haqiqatan ishlaydi.**

## ⭐⭐ KATTA VERDIKT (bu modulning eng muhim savoli) — OROLLARNI ROSTAN BOG'LAYDIMI?
**HALOL JAVOB: QISMAN — bitta KUCHLI haqiqiy bog'lanish bor, lekin to'liq "asab tizimi" emas.**

✅ **ROST tomoni (boshqa modullardan farqli):** Buyurtma→bo'lim fan-out — bu butun ERP'dagi YAGONA to'liq, isbotlangan, avtomatik bog'lanish. Xabar ROST yuboriladi (publisher bor — Moliyadagi o'lik tinglovchidan farqli), 5 bo'lim ushlaydi va har biri o'z jadvaliga HAQIQIY ish-yozuvi oladi. Bu shunchaki sxema-rasm EMAS — ish ROSTAN qabul qiluvchi bo'limga yetib boradi.

⚠️ **ZAIF tomoni:**
1. Bu YAGONA avtomatik bog'lanish — faqat BITTA trigger (buyurtma avansi → 5 bo'lim). Boshqa hech narsa avtomatik ulanmagan (QC brak→qayta ishlash, kam qoldiq→xarid, ishlab chiqarish tugadi→ombor — hali qo'lda)
2. Data BO'SH (hammasi 0) — mexanizm isbotlangan, lekin hozir jonli oqim yo'q
3. Ishlab chiqarish (6-bo'lim) ulanmagan
4. Eskalatsiya buzuq — "rahbarimga ko'tar" yo'li ishlamaydi (pastda)

**Qisqasi:** koordinatsiya qatlami — "orollar" muammosidan ISTISNO, lekin u BITTA mustahkam ko'prik, butun asab tizimi emas. Bitta kuchli sim ikki qirg'oqni bog'lagan; qolgan o'nlab bog'lanish hali qo'lda.

## ⭐ ZANJIR — har handoff qabul qiluvchiga YETIB BORADIMI?
| Handoff | Holat |
|---|---|
| Buyurtma avansi → qolip bo'limi | 🟢 YETADI (ow_molds'ga yozuv + "boshlandi") |
| Buyurtma avansi → dizayn | 🟢 YETADI (ow_tech_cards) |
| Buyurtma avansi → klishe | 🟢 YETADI (ow_cliches) |
| Buyurtma avansi → logistika | 🟢 YETADI (ow_shipping_requests) |
| Buyurtma avansi → ombor | 🟢 YETADI (ow_material_requirements) |
| Buyurtma avansi → ishlab chiqarish | 🔴 YETMAYDI (6-bo'lim ulanmagan, :84) |
| QC brak → qayta ishlash vazifasi | 🔴 YO'Q (avtomatik emas) |
| Kam qoldiq → xarid vazifasi | 🔴 YO'Q (avtomatik emas) |
| "Rahbarimga eskalatsiya" | 🔴 BUZUQ (manager_id NULL — pastda) |

## DB MUAMMOLARI (sodda)
- ⚠️ **employees.manager_id 30/30 BO'SH (NULL)** — "rahbarimga ko'tar" eskalatsiya yo'li xodimni topadi, lekin RAHBARINI topolmaydi (cc-org-resolver.service:6, MANAGER_OF_SENDER yo'li uzilgan; faqat DEPT_HEAD yo'li ishlaydi)
- ✅ Fan-out jadvallari bor (sd_order_departments + 5 ow_* bo'lim jadvali), lekin HAMMASI BO'SH (0)
- ✅ dokla/rasporyazhenie jadvallari bor
- ⚠️ qc_approvals jadvali yo'q (4-modul) → bo'lim tasdig'i qismi soxta

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. ✅ **Asosiy bog'lanish ROST** — buyurtma→5 bo'lim fan-out ishlaydi (bu yaxshi xabar; boshqa modullardan farqli)
2. 🔴 **Faqat BITTA avtomatik bog'lanish bor** — QC brak→qayta ishlash, kam qoldiq→xarid kabi qolgan handoff'lar hali qo'lda
3. 🔴 **Eskalatsiya buzuq** — har xodimning rahbari bazada ko'rsatilmagan (manager_id 30/30 NULL), "rahbarga ko'tar" ishlamaydi
4. 🟡 **Ishlab chiqarish bo'limi fan-out'ga ulanmagan** (6/6 emas, 5/6)
5. 🟡 **Hammasi bo'sh** — mexanizm isbotlangan, lekin jonli oqim yo'q (qurilish bosqichi)

---

## XULOSA (egasiga)
Koordinatsiya — "modullar orol" muammosining eng muhim sinovi, va bu yerda **eng yaxshi xabar** bor: butun ERP'dagi YAGONA to'liq, avtomatik, isbotlangan bog'lanish shu modulda. Buyurtmaga avans to'langanda tizim AVTOMATIK 5 bo'limga (qolip, dizayn, klishe, logistika, ombor) ish tarqatadi, va har bo'lim o'z jadvaliga HAQIQIY ish-yozuvi oladi. Bu — Moliyadagidek "tinglovchi bor, lekin xabar yuboruvchi yo'q" emas; bu yerda xabar ROST yuboriladi va qabul qiluvchiga ROST yetib boradi.

LEKIN bu — bitta mustahkam ko'prik, butun asab tizimi emas. Bu yagona avtomatik bog'lanish (qolgan handoff'lar — QC brak→qayta ishlash, kam qoldiq→xarid — hali qo'lda); ishlab chiqarish bo'limi hali ulanmagan; va "rahbarimga eskalatsiya" buzuq, chunki bazada har xodimning rahbari ko'rsatilmagan (30/30 bo'sh). Hozir data ham bo'sh (mexanizm isbotlangan, lekin jonli oqim yo'q).

⭐ **Halol javob:** koordinatsiya qatlami SOXTA-DISPLAY EMAS — u ROSTAN ikki bo'limni bog'laydi (isbotlangan). Lekin u hali BITTA bog'lanish; egasi xohlagan "hamma bo'lim avtomatik bog'langan" holat uchun yana o'nlab shunday ko'prik kerak.

Metafora: ikki qirg'oq orasiga BITTA haqiqiy, mustahkam ko'prik qurilgan — mashina ROSTAN u tomonga o'tadi (bo'yalgan soxta ko'prik emas). Lekin daryo bo'ylab yana o'nta joyda ko'prik kerak edi — u yerlarda hali odamlar qo'lda qayiqda kechib o'tyapti. Va "rahbaringni chaqir" qo'ng'irog'i simsiz — chaqirsangiz hech kim kelmaydi, chunki kimning rahbari kimligi hech qayerda yozilmagan.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
