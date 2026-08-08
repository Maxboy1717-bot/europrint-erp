# 📥 POS MONITOR — INPUT MAYDONLAR TO'LIQ TAHLILI (qo'lda kiritiladigan har bir ma'lumot)
> Sana: 2026-06-04 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator yoki baza, qavs ichida — o'qimasangiz ham bo'ladi).
> ⚠️ Vizyon arxivi (EUROPRINT_BARCHA_JAVOBLAR.md) topilmadi — intake oqimi (DRAFT→KARANTIN→QC→OMBOR→AI_GL) bo'yicha tahlil qildim.

> **POS Monitor nima:** Zavod ombori uchun skaner-uslubidagi ekran — tovar KIRIM (qabul) va CHIQIM
> (berish), barkod/QR, rulon og'irligi, va ko'p bosqichli tashqi-kirim oqimi (DRAFT → KARANTIN → QC →
> OMBOR_MENEJER → AI_GL). Markaziy ombor yo'q; moliya-menejer paneli markaz.

> ⭐⭐ **BIR JUMLALI XULOSA:** Asosiy kirim formasi (Kirim Wizard) YAXSHI qurilgan — material, miqdor,
> narx, partiya, muddat ROST saqlanadi va stok HAQIQATAN o'zgaradi (atomik). LEKIN bir nechta maydon
> ekranda ko'rinadi-yu, saqlanmaydi (yo'qoladi): **STIR/INN, valyuta, per-qator og'irlik va 2-qatordan
> keyingi sertifikat**. Va bir nechta maydonda tekshiruv yo'q (manfiy narx/og'irlik o'tib ketadi).

---

# 1-QADAM — POS MONITOR SAHIFALARI VA FORMALARI

**Topildi: 7 ta POS Monitor sahifasi, ~21 ta input maydon turi.**

| # | Sahifa | URL | Input bormi? |
|---|---|---|---|
| 1 | **Kirim Wizard** (asosiy kirim) | /wms/kirim-new | ✅ 15 maydon (5 bosqich) |
| 2 | **POS Monitor** (tez kirim/chiqim) | /wms/pos-monitor | ✅ ~5 maydon |
| 3 | **Barkod skaner** | /wms/scanner | ✅ 1 maydon (skan) |
| 4 | Karantin | /wms/quarantine | ❌ 0 input (faqat tasdiq/rad tugma) |
| 5 | Tovar qabul (GRN) | /warehouse/goods-receiving, /wms/grn | ✅ (9-modul hududi) |
| 6 | Barkod tizimi | /warehouse/barcodes | ko'rish/chop |
| 7 | GL posting monitori | /integration/gl-posting | ko'rish (AI_GL natijasi) |

> Eslatma (Qoida 22): POS = yagona `pos-monitor` klasteri (eski 9×`/pos/*` o'chirilgan). `/pos/printer-config` hali Stub.

---

# 2-QADAM — HAR FORMA, MAYDONMA-MAYDON

## 🟢 FORMA 1 — KIRIM WIZARD (asosiy tashqi-kirim, 5 bosqich)
**Fayl:** WarehouseKirimWizard.tsx + ...Steps.tsx + ...Types.ts. **10 kirim turi** (Karantin, Xom ashyo, Rulon, Tayyor mahsulot, Yarim tayyor, Brak, Asbob, Xo'jalik, MRO). Tur tanlanganda maydon yorliqlari o'zgaradi.
**Saqlash:** "Tasdiqlash" → `POST /api/pos/movements` (asosiy) + `POST /api/pos/inventory-passport` (qo'shimcha) (WarehouseKirimWizard.tsx:126,128).

### Bosqich 1 — Asosiy ma'lumotlar (8 maydon)
| Maydon | Turi | Majburiy? | Qayerga saqlanadi | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Manzil ombori | ro'yxat | ✅ HA (bloklaydi) | pos_movements.to_warehouse_id | bo'sh→blok (:93) | 🟢 REAL |
| Kelish sanasi | sana | yo'q (bugun default) | pos_movements.document_date | yo'q | 🟢 REAL |
| Ta'minotchi nomi | matn | ✅ HA (turga qarab) | pos_movements.supplier_name | bo'sh→blok (:94) | 🟢 REAL |
| **STIR/INN** | matn | yo'q | ❌ **HECH QAYERGA** (ustun yo'q + yuborilmaydi) | yo'q | 🔴 **SOXTA — yo'qoladi** |
| Shartnoma raqami | matn | ✅/yo'q (turga) | pos_movements.document_number | bo'sh→blok (:95) | 🟢 REAL |
| Yuk xati raqami | matn | yo'q | pos_inventory_passport (qo'shimcha) | yo'q | 🟡 faqat passportda |
| **Valyuta** | ro'yxat | yo'q | ⚠️ **ustun BOR, lekin FE yubormaydi** | yo'q | 🔴 **SOXTA — yo'qoladi (drift)** |
| Izoh | matn (katta) | yo'q | pos_movements.notes | yo'q | 🟢 REAL |

### Bosqich 2 — Materiallar (har qator uchun 5 maydon)
| Maydon | Turi | Majburiy? | Qayerga saqlanadi | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Material | ro'yxat | ✅ HA | pos_movement_lines.material_card_id | bo'sh→blok (:98) | 🟢 REAL |
| Miqdor | raqam | ✅ HA (>0) | pos_movement_lines.quantity | >0 majbur; ⚠️ MAX yo'q | 🟢 REAL |
| Birlik narxi | raqam | yo'q | pos_movement_lines.unit_price | ⚠️ **YO'Q (0/manfiy o'tadi)** | 🟢 REAL, tekshiruvsiz |
| Partiya № (avto) | matn | yo'q | pos_movement_lines.batch_number | yo'q; tasodifiy avto-gen | 🟢 REAL |
| Yaroqlilik muddati | sana | yo'q | pos_movement_lines.expiry_date | yo'q | 🟢 REAL |

### Bosqich 3 — Inventar pasporti (har qator uchun 2 maydon)
| Maydon | Turi | Majburiy? | Qayerga saqlanadi | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| **Og'irlik (kg)** | raqam | yo'q | pos_inventory_passport.weight_kg (faqat JAMI) | ⚠️ yo'q | 🟡 **per-qator YO'QOLADI, faqat jami** |
| **Sertifikat / Seriya** | matn | yo'q | pos_inventory_passport (faqat 1-QATOR!) | yo'q | 🟡 **faqat 1-qator saqlanadi (qolgani yo'qoladi)** |

> ⚠️ Dalil: submit faqat `lines[0].certificateNumber` yuboradi (WarehouseKirimWizard.tsx:135) va og'irlikni `totalWeight` (jami) sifatida yuboradi (:134). Demak 3-bosqichda har qatorга alohida og'irlik/sertifikat yozsangiz ham — faqat jami og'irlik va birinchi qatorning sertifikati saqlanadi.

### Bosqich 4-5 — Ko'rib chiqish + Tasdiqlash
Bosqich 4 = faqat ko'rsatish (yangi maydon yo'q). Bosqich 5 = muvaffaqiyat ekrani.

---

## 🟢 FORMA 2 — POS MONITOR (tez kirim/chiqim operatsiyasi)
**Fayl:** PosMonitorPage.tsx. **Saqlash:** `POST /api/pos-operations` (PosMonitorPage.tsx:90).
| Maydon | Turi | Majburiy? | Qayerga saqlanadi | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Material (barkod/tanlash) | skan/ro'yxat | ✅ HA | pos-operations.materialId | bo'sh→blok (:82) | 🟢 REAL |
| Miqdor | raqam | ✅ HA (>0) | pos-operations.quantity | >0 + isNaN tekshiruv (:82) | 🟢 REAL |
| Sabab/izoh | matn | yo'q | pos-operations.reason | yo'q | 🟢 REAL |
| Chek raqami (ЧЕК-) | matn | — | (qidiruv/lookup ehtimoli) | — | 🟡 tekshirilsin |
| Jadvalda qidirish | matn | yo'q | hech qayerga (faqat ekran filtri) | — | ⬜ ekran-qidiruv |

## 🟢 FORMA 3 — BARKOD SKANER
**Fayl:** BarcodeScanner.tsx. **Saqlash:** `POST /api/wms/barcode/scan` (:57).
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Barkod kodi | skan/matn | ✅ HA | barcode/scan (lookup) | trim + bo'sh emas (:93) | 🟢 REAL (qidirish) |

## ⬜ KARANTIN sahifasi — 0 INPUT
WarehouseQuarantine.tsx da input maydon YO'Q (0 ta) — faqat tasdiq/rad tugmalari (`/api/pos/wh-features/quarantine`). Demak bu yerda qayta yozish yo'q (ma'lumot oldingi bosqichdan keladi).

---

## 📝 MAYDONLAR XULOSASI (sodda)
- **MUSTAHKAM (ROST saqlanadi):** Ombor, sana, ta'minotchi, shartnoma, izoh, material, miqdor, narx, partiya, muddat (Wizard); material+miqdor+sabab (POS Monitor); barkod (skaner). Bular asosiy ma'lumot — yaxshi ishlaydi.
- **🔴 SOXTA (ekranda bor, saqlanmaydi):** **STIR/INN** (ustun yo'q), **valyuta** (ustun bor lekin yuborilmaydi). Ularni yozasiz, "saqlash" bosasiz — yo'qoladi.
- **🟡 QISMAN YO'QOLADI:** per-qator **og'irlik** (faqat jami saqlanadi), 2-qatordan keyingi **sertifikat** (faqat 1-qator saqlanadi).
- **⚠️ TEKSHIRUVSIZ (yomon ma'lumot o'tadi):** **birlik narxi** (0 yoki manfiy o'tadi), og'irlik (manfiy o'tadi), miqdorga MAX yo'q, STIR formati tekshirilmaydi. Faqat "miqdor > 0" va majburiy maydonlar bloklaydi.
- **YO'Q (vizyon talab qiladi, lekin maydon yo'q):** rulon kengligi (RM-ROLLS bannerda va'da qilingan, lekin alohida maydon yo'q — og'irlik bor, kenglik yo'q); QR/barkod chop etish maydoni; mas'ul xodim tanlash.

---

# 3-QADAM — INTAKE OQIMI (DRAFT → KARANTIN → QC → OMBOR → AI_GL)

| Bosqich | Kim/nima kiritadi | Ma'lumot o'tadimi? | Saqlanadimi? | Holat |
|---|---|---|---|---|
| **DRAFT** | Wizard'da hamma maydon to'ldiriladi | — | `POST /api/pos/movements` → pos_movements + pos_movement_lines | 🟢 REAL |
| **KARANTIN** | Tashqi tovar QC-HOLD omboriga tushadi | ✅ O'TADI (qayta yozish yo'q — Karantin sahifasida 0 input) | movement QC-HOLD'ga yo'naltiriladi | 🟢 REAL |
| **QC** | QC tasdiq/rad tugmasi | ✅ O'TADI | `/wh-features/quarantine` → status o'zgaradi | 🟢 REAL |
| **OMBOR_MENEJER** | (avtomatik) tasdiqlanganda stok asosiy omborga | ✅ O'TADI | **upsertStockIn — ATOMIK** (`available_quantity + qty`, ON CONFLICT, quarantine-workflow.repo:68-71) | 🟢 REAL |
| **AI_GL** | (avtomatik) GL yozuvi hisoblanadi | ✅ O'TADI | debit WAREHOUSE_QC / kredit ACCOUNTS_PAYABLE → `INSERT pos_gl_postings` (auto-gl-posting.repo:82) | 🟡 **REAL, lekin POS-lokal jadval** |

### ⭐ MUHIM — AI_GL haqida (oxirgi bosqich, moliyaga yetadimi?)
- ✅ AI_GL HAQIQATAN GL yozuvini hisoblaydi va saqlaydi (debit/kredit hisob raqamlari bilan — auto-gl-posting.service.ts:43)
- ⚠️ LEKIN u **pos_gl_postings** (POS modulining O'Z jadvali)ga yozadi — asosiy moliya daftari EMAS (`gl_journal` jadvali umuman yo'q). Demak yozuv hisoblanadi va saqlanadi, lekin **asosiy Moliya moduli uni avtomatik o'qimaydi** (10-modulda: Moliya — orol)
- ⚠️ Hozircha **pos_gl_postings=0** (hech qachon real data bilan ishlamagan)

### Ma'lumot YO'QOLISHIMI / QAYTA YOZISH?
✅ **YAXSHI XABAR: ma'lumot bosqichlar orasida QAYTA YOZILMAYDI.** Karantin sahifasida 0 input — tovar bir marta (DRAFT'da) kiritiladi, keyin status o'zgaradi, ma'lumot movement yozuvi orqali o'tadi. Bu — to'g'ri qurilgan.

---

# 4-QADAM — UMUMIY XULOSA

## Sahifalar jadvali
| Sahifa | Maydon soni | Real | Soxta/yo'qoladi | Tekshiruvsiz |
|---|---|---|---|---|
| Kirim Wizard | 15 | 10 | 4 (STIR, valyuta, per-og'irlik, sertifikat 2+) | narx, og'irlik |
| POS Monitor | ~5 | 3 | 0 | — |
| Barkod skaner | 1 | 1 | 0 | — |

## Intake oqimi — qaysi bosqich ishlaydi
- 🟢 DRAFT → KARANTIN → QC → OMBOR: **to'liq REAL** (stok atomik o'zgaradi, warehouse_stock=25 qator)
- 🟡 AI_GL: **hisoblaydi + saqlaydi (pos_gl_postings), lekin asosiy moliyaga ulanmagan** (orol)
- ✅ Ma'lumot qayta yozilmaydi (bir marta kiritiladi, oxirigacha o'tadi)

## ⭐ INPUT-DATA VERDIKTI (egasi savoli)
**Odam nimani ROST kiritib saqlay oladi:** ombor, sana, ta'minotchi, shartnoma, material, miqdor, narx, partiya, muddat, izoh — bular asosiy ma'lumot, ROST saqlanadi va stokни o'zgartiradi. Kirim formasi yaxshi qurilgan.

**Ekranda ko'rinadi-yu, SAQLANMAYDI (egasi bilishi shart):** STIR/INN va valyuta to'liq yo'qoladi; per-qator og'irlik faqat jami bo'lib saqlanadi; 2-qatordan keyingi sertifikat yo'qoladi. Bu — "to'ldiraman, saqlayman, lekin yo'q bo'ladi" holati.

**Yomon ma'lumotdan himoya zaif:** narx 0/manfiy, og'irlik manfiy, miqdor cheksiz katta — o'tib ketadi (faqat "miqdor>0" va majburiy maydon bloklaydi).

## DB MUAMMOLARI (sodda)
- ❌ **pos_movements'da `supplier_tin` ustuni yo'q** → STIR/INN saqlanmaydi (baza)
- ⚠️ **`currency` ustuni BOR, lekin FE yubormaydi** → ekran va baza kelishmaydi (drift)
- ⚠️ **per-qator og'irlik/sertifikat uchun joy tor** — passport faqat jami og'irlik + 1 sertifikat saqlaydi (qator-darajasi yo'q)
- ⚠️ **AI_GL pos_gl_postings (POS-lokal)ga yozadi, asosiy moliya `gl_journal` yo'q** → moliyaga ulanmagan

## ⭐ ENG MUHIM 5 INPUT MUAMMOSI (egasi birinchi shularni tuzatsin)
1. 🔴 **STIR/INN yo'qoladi** — ta'minotchi soliq raqami ustun yo'qligi uchun saqlanmaydi (huquqiy hujjat uchun muhim)
2. 🔴 **Valyuta yo'qoladi** — ustun bor, lekin FE yubormaydi (USD/EUR kirim noto'g'ri yoziladi)
3. 🟡 **Per-qator og'irlik va sertifikat yo'qoladi** — har material uchun alohida og'irlik/sertifikat yozsangiz, faqat jami + 1-qator saqlanadi (rulon/sertifikat-muhim materiallar uchun jiddiy)
4. ⚠️ **Narx/og'irlik tekshiruvsiz** — 0 yoki manfiy narx o'tib ketadi (noto'g'ri qiymat → noto'g'ri GL summa)
5. 🟡 **AI_GL asosiy moliyaga ulanmagan** — kirim GL yozuvini hisoblaydi, lekin POS-lokal jadvalda qoladi

---

## XULOSA (egasiga)
POS Monitor kirim formasi — kutilganidan YAXSHI qurilgan. Asosiy ma'lumot (material, miqdor, narx, partiya, muddat) ROST saqlanadi, stok HAQIQATAN o'zgaradi (atomik — ya'ni ikki kishi bir vaqtda kirim qilsa ham xato bo'lmaydi), va intake oqimi (karantin→QC→ombor) ma'lumotni qayta yozdirmasdan oxirigacha olib o'tadi. Bu — mustahkam poydevor.

LEKIN bir nechta maydon "aldamchi": STIR/INN va valyutani yozasiz, saqlash bosasiz — yo'qoladi (birida ustun yo'q, birida FE yubormaydi). Per-qator og'irlik/sertifikat ham qisman yo'qoladi. Va narx/og'irlikda tekshiruv yo'q — 0 yoki manfiy qiymat o'tib ketadi. Oxirida AI_GL GL yozuvini hisoblaydi, lekin POS-ning o'z jadvalida qoladi (asosiy moliyaga ulanmagan).

Metafora: bu — yaxshi ishlaydigan qabul ombori. Tovarni skanерlaysiz, tarozida tortasiz, javonga qo'yasiz — hammasi daftarга to'g'ri yoziladi va miqdor aniq yangilanadi. Lekin daftarda ba'zi kataklar yo'q (STIR, valyuta) — u yerга yozganingiz ko'chmaydi; va og'irlik uchun faqat bitta umumiy katak bor (har quti uchun alohida emas). Tarozi manfiy ko'rsatsa ham qabul qilaveradi (tekshirgich yo'q). Va oxirgi buxgalteriya daftarига yozadi-yu, lekin u daftar bosh buxgalteriyaga ulanmagan.

> Hech narsa o'zgartirmadim (faqat o'qidim + bu hujjatni yozdim). Tuzatishni Agent 1 sizning qaroringiz bo'yicha qiladi.
