# MODUL 8 — OMBOR (WMS / POS Monitor) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Ombor tizimi — har materialning KIRIShi, CHIQIShi va omborlar orasida ko'chishini
> kuzatadi; do'kon skaneri kabi ishlaydi (POS Monitor). Markaziy ombor YO'Q — o'rniga ko'p ombor turi
> (hom ashyo, karantin, ishlab chiqarish, tayyor mahsulot, har bo'lim). Bu egasi vizyonining YURAGI
> (60 batafsil javob).

> ⭐⭐ **BIR JUMLALI XULOSA:** Bu — eng KUCHLI modul. Boshqalardan farqli o'laroq, asosiy amallar
> HAQIQATAN ishlaydi: material kiritsangiz/chiqarsangiz, **ombordagi raqam bazada haqiqatan o'zgaradi**;
> manfiy stok bloklanadi; rulon boshqaruvi (vazn/QR/FIFO) qurilgan. Asosiy kamchilik — javonlar hali
> bo'sh (data kam), ba'zi hisobot ekranlari tayyor emas, va stok ko'chganda pul yozuvi (buxgalteriya)
> avtomatik tushmaydi.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: ~30 ta ombor sahifasi topdim** (eng katta modul). Asosiylari:

| Guruh | Sahifalar |
|---|---|
| **Asosiy amal** | POS Monitor (/wms/pos-monitor), Kirim ustasi (/wms/kirim-new), Qabul (/warehouse/goods-receiving, /wms/grn), Chiqim, Inventarizatsiya (/warehouse/inventory-count, /wms/inventory) |
| **⭐ RULON** | Rulon boshqaruvi (/warehouse/rolls) |
| **Ombor turlari** | Omborlar (/wms/warehouses), Tur bo'yicha (/wms/warehouses/:type), Ombor stoki (/wms/warehouse-stock/:id) |
| **Sifat/karantin** | Karantin (/wms/quarantine), QC ko'rib chiqish (/wms/qc-review) |
| **Barcode** | Barcode tizimi (/warehouse/barcodes), Skaner (/wms/scanner), Barcode navbati (/wms/barcodes-queue) |
| **Xodim/passport** | Mening inventarim (/wms/employee-inventory), Inventar passporti (/wms/passports) |
| **Bron/rezerv** | Stok bron (/warehouse/reservations, /wms/reservation) |
| **Dashboard/hisobot** | Ombor paneli (/wms/overview), Eski panel (/wms/dashboard), KPI hub (/wms/kpi-hub), Hisobotlar (/wms/reports, /reports-all → 2 havola 1 sahifa), Audit jurnali, Bildirishnoma, Material balansi |
| **Boshqa** | Materiallar (/inventory/materials), Material kartochkalari (/material-cards), Hom ashyo (/raw-materials), Ijara (/wms/rental), Xarid (/wms/procurement) |

**⚠️ Jadval DATASI (boshqa modullardan farqli — bu yerda DATA BOR!):**
warehouse_stock=**25** · warehouses=**12** · warehouse_bins (joylar)=**126** · warehouse_types (turlar)=**9** · material_movements=**3** · warehouse_rolls (rulonlar)=0 · employee_inventory_ledger=0.

---

# 2-QADAM — HAR SAHIFA (asosiylari batafsil)

## 🟢 POS MONITOR — `/wms/pos-monitor` (PosMonitorPage) ⭐ ENG MUHIM
**Nima uchun:** Ombor xodimi uchun do'kon-skaner kabi ekran — material kirim/chiqim qiladi, barcode skanerlaydi.
**Tugma — HAQIQATAN ISHLAYDI:**
- "Chiqim (material berish)" → **STOK RAQAMINI HAQIQATAN KAMAYTIRADI** bazada (warehouse-config.service.ts:113-116: `UPDATE warehouse_stock SET quantity = quantity - X WHERE available_quantity >= X`). Bu xavfsiz — agar omborda yetarli bo'lmasa, chiqarmaydi (manfiy stok bloklanadi)
- "Kirim (material qabul)" → **STOK RAQAMINI HAQIQATAN OSHIRADI** bazada
- "Barcode skan" → materialni haqiqatan topadi
**Ma'lumot:** warehouse_stock (25 yozuv — HAQIQIY DATA BOR).
**Holat:** 🟢 (haqiqatan ishlaydi, data bilan).
**Foydalanuvchi nima qila olmaydi:** Hozircha asosiy amallar ishlaydi — faqat ba'zi eski yo'l orqali kirim qilinganda ombor jurnali to'liq yangilanmaydi (pastda).

## 🟢 ⭐ RULON BOSHQARUVI — `/warehouse/rolls` (RollManagementPage) — EuroPrint uchun maxsus
**Nima uchun:** Karton rulonlari (asosiy hom ashyo) — har rulonning vaznini (kg), QR kodini, qaysi rulon birinchi ishlatilishini (FIFO) kuzatadi.
**Tugma/funksiya — HAQIQATAN BOR:**
- Rulon balansi (vazn bo'yicha) → **REAL** (`/agents/inventory/rolls`, warehouse_rolls jadvalidan, remaining_weight_kg)
- FIFO navbati (qaysi rulon birinchi) → **REAL** (`/rolls/fifo`)
- Rulon skaner → **REAL** (`/rolls/scan`)
- Rulon ishlatish (vazn kamaytirish) → **REAL** (`/rolls/use`, atomik)
- QR kod → **REAL** (`/rolls/qr/:id`)
- Kam qoldiq ogohlantirish (kritik) → **REAL** (is_critical, "stock.critical" signali, inventory-agent.service.ts:90)
**Ma'lumot:** warehouse_rolls jadval bor, lekin **BO'SH (0 rulon)**.
**Holat:** 🟢 (funksiya REAL, lekin hali rulon kiritilmagan).
**Foydalanuvchi nima qila olmaydi:** Hozircha funksiya ishlaydi, lekin haqiqiy rulonlar kiritilmagani uchun ko'rsatadigan narsa yo'q. ⭐ **Bu vizyonning muhim qismi va u QURILGAN** (eski tahminga qarshi — kamchilik emas).

## 🟢 KARANTIN — `/wms/quarantine` (WarehouseQuarantine)
**Nima uchun:** Tashqaridan kelgan material avval karantinga tushadi, sifat tekshirilgach asosiy omborga o'tadi.
**Tugma:** Karantin harakatlari → **REAL** (`/pos/wh-features/quarantine`, `/movement`).
**Holat:** 🟢. **Vizyon (Q30 karantin):** ✅ ishlaydi.

## 🟢 QABUL (Goods Receiving) — `/warehouse/goods-receiving`, `/wms/grn` (2 havola→1)
**Nima uchun:** Ta'minotchidan kelgan materialni qabul qilish hujjati.
**Tugma:** Qabul + qatorlar → **REAL** (`/warehouse/goods-receipts`; qator qo'shish ham real — avval soxta edi, tuzatilgan).
**Holat:** 🟢.

## 🟢 INVENTARIZATSIYA — `/warehouse/inventory-count`, `/wms/inventory` (2→1)
**Nima uchun:** Omborni sanab, bazadagi raqam bilan solishtirish.
**Tugma:** Sanoq yaratish/qatorlar → **REAL** (`/warehouse/inventory-counts`).
**Holat:** 🟢.

## 🟢 KIRIM USTASI — `/wms/kirim-new` (WarehouseKirimWizard)
**Nima uchun:** Bosqichma-bosqich material kirim qilish.
**Tugma:** Kirim → **REAL** (`/pos/movements` — stokni haqiqatan o'zgartiradi).
**Holat:** 🟢.

## 🟢 OMBOR PANELI — `/wms/overview` (WarehouseDashboardPage)
**Nima uchun:** Ombor umumiy ko'rinishi — qoldiq, qiymat (real data 248 mln avval ko'rilgan).
**Tugma:** Ko'rish → **REAL** (`/warehouse`).
**Holat:** 🟢 (real data bilan).

## 🟢 OMBORLAR + TURLAR — `/wms/warehouses`, `/wms/warehouses/:type`
**Nima uchun:** 9 ombor turi (hom ashyo, karantin, tayyor mahsulot va h.k.).
**Holat:** 🟢 (warehouse_types=9, warehouses=12, joylar=126 — REAL DATA).
**Vizyon (Q29 ombor turlari):** 🟡 — 9 tur bor, vizyon 30+ bo'lim omborini ham xohlaydi (qisman).

## 🟡 MENING INVENTARIM — `/wms/employee-inventory` (EmployeeInventory)
**Nima uchun:** Xodimga berilgan materiallar (podotchet/javobgarlik).
**Tugma:** Ko'rish → **REAL** (`/pos/employees/me/inventory`), lekin xodim-inventar jadvali **BO'SH (0)**.
**Holat:** 🟡 (real, data yo'q). **Vizyon (Q47-51):** 🟡.

## 🟡 INVENTAR PASSPORTI — `/wms/passports` (WarehouseInventoryPassport)
**Nima uchun:** Har materialning to'liq tarixi (kirim/chiqim, narx, partiya).
**Holat:** 🟡 (sahifa bor, data kam). **Vizyon (Q40):** 🟡.

## 🟡 STOK BRON — `/warehouse/reservations`, `/wms/reservation` (2→1)
**Nima uchun:** Buyurtma uchun materialni band qilish.
**Tugma:** Bron → **REAL** (`/ai-reservation/*`). **Holat:** 🟡 (real, data yo'q).

## 🟡 Barcode tizimi/skaner/navbat, KPI hub, Audit jurnali, Material balansi, Bildirishnoma, Ijara, Xarid, Materiallar, Hisobotlar (2→1)
Asosan ko'rish/yordamchi sahifalar. Ko'pi real o'qiydi, ba'zilari bo'sh data. ⚠️ Materiallar sahifasi (WMSMaterials) — eski Tab importi bor (ehtimol render qilinmaydi — o'lik kod). Hisobotlardan ba'zilari "tayyor emas" (pos-stub: sales/daily, low-stock, movements, monthly-report). Hammasi 🟡.

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali (asosiylari)
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| POS Monitor | 🟢 | eski yo'l jurnali to'liqsiz | ~80 |
| **Rulon boshqaruvi** | 🟢 | funksiya bor, data yo'q | ~75 |
| Karantin | 🟢 | — | ✅ Q30 |
| Qabul (GRN) | 🟢 | — | ~80 |
| Inventarizatsiya | 🟢 | — | ~75 |
| Kirim ustasi | 🟢 | — | ~75 |
| Ombor paneli | 🟢 | — (real data) | ~80 |
| Omborlar + turlar | 🟢/🟡 | 9 tur (vizyon 30+) | ~65 |
| Mening inventarim | 🟡 | data yo'q | ~50 |
| Inventar passporti | 🟡 | data kam | ~45 |
| Stok bron | 🟡 | data yo'q | ~55 |
| Barcode/hisobot/yordamchi | 🟡 | ba'zi hisobot stub | ~50 |

**Jami (asosiy ~20): ~9 🟢 · ~10 🟡 · ~1 🔴 → taxminan ~65% haqiqatan ishlaydi (eng yuqori ko'rsatkich!).**

## ⭐ VIZYON — 60 javob bo'yicha asosiy qismlar
| Vizyon qismi | Q# | Holat | Sodda izoh |
|---|---|---|---|
| **Harakat turlari** (kirim/chiqim/ko'chirish) | Q21-28 | 🟢 | Kirim/chiqim/ko'chirish/karantin REAL; zarar/qaytarish qisman |
| **Ombor turlari** (markaziy yo'q, ko'p tur) | Q29 | 🟡 | 9 tur bor; vizyon 30+ bo'lim omborini xohlaydi |
| **Karantin oqimi** | Q30 | 🟢 | Ishlaydi |
| **FIFO/FEFO** (eski stok birinchi) | Q35-37 | 🟢 | Rulon FIFO real; umumiy FIFO qisman |
| **Manfiy stok bloki** | Q38 | 🟢 | Ishlaydi (yetmasa chiqarmaydi) |
| **⭐ RULON** (vazn/QR/ogohlantirish/FIFO) | maxsus | 🟢 | QURILGAN — vazn, QR, kritik ogohlantirish, FIFO real |
| **Barcode/skan** | Q15-20 | 🟢 | Skan real |
| **Inventar passporti** | Q40 | 🟡 | Sahifa bor, data kam |
| **Mening inventarim** (xodim javobgarligi) | Q47-51 | 🟡 | Real, ledger bo'sh |
| **Buxgalteriya yozuvi (GL)** | Q43 | 🔴 | Stok ko'chganda pul yozuvi avtomatik tushmaydi (o'lik) |

## ⭐ ZANJIR MUAMMOSI (sodda)
Ombor 4 tomon bilan bog'lanishi kerak:
1. 🟡 **Ta'minotdan qabul** — qabul oqimi real, lekin yuqori zanjir (Savdo→Reja→Xarid) uzilgan → kam haqiqiy kirim
2. 🟡 **Ishlab chiqarishga berish** — chiqim real, lekin sex ish olmaydi (7-modul) → kam haqiqiy chiqim
3. 🟡 **Tayyor mahsulotni qaytarib olish** — sexdan tayyor mahsulot kelishi to'liq ulanmagan
4. 🔴 **Buxgalteriyaga (GL)** — stok ko'chganda pul yozuvi avtomatik TUSHMAYDI (eski signal o'lik)

➡️ **Ombor MOTORI ishlaydi** (stok haqiqatan o'zgaradi), lekin atrofdagi modullar uzilgani uchun haqiqiy harakat kam, va pul tomoni avtomatik yozilmaydi.

## ⭐ RULON VERDIKTI (egasi maxsus so'ragan)
🟢 **Rulon boshqaruvi QURILGAN va REAL** — vazn (kg), QR kod, kam-qoldiq ogohlantirish (kritik), FIFO navbati, skaner, ishlatishda vazn kamaytirish — hammasi haqiqiy kod. **Bu kamchilik EMAS** (eski tahminga qarshi). Faqat hali haqiqiy rulonlar kiritilmagan (jadval bo'sh).

## JADVAL/TEXNIK MUAMMOLARI (sodda)
- ⚠️ **Ikki kirim/chiqim yo'li bor** — yangisi (POS Monitor) stokni to'g'ri o'zgartiradi; eskisi (avtomatik signal) **o'lik** — shuning uchun eski yo'l orqali ombor JURNALI to'liq yangilanmaydi (pos-wms-sync.service.ts:47, signal hech qachon yuborilmaydi)
- ⚠️ **Eski yo'lda yo'nalish qattiq yozilgan** — barcha harakat "kirim" deb belgilanadi (pos-wms-sync.service.ts:73) — chiqim ham "kirim" ko'rinadi (faqat eski yo'lda)
- 🔴 **Stok ko'chganda pul yozuvi (GL) avtomatik tushmaydi** — signal o'lik
- ✅ Asosiy jadvallar bor va DATA bilan (stok 25, ombor 12, joy 126, tur 9)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🟡 **Javonlar bo'sh** — motor ishlaydi, lekin haqiqiy material/rulon kiritilmagan + yuqori zanjir (Savdo→Reja→Xarid) uzilgani uchun kam kirim
2. ⚠️ **Ikki kirim/chiqim yo'li** — eski yo'l o'lik (ombor jurnali to'liqsiz). Faqat bitta to'g'ri yo'l qolishi kerak
3. 🔴 **Pul yozuvi (GL) avtomatik tushmaydi** — stok ko'chganda buxgalteriyaga o'tmaydi
4. 🟡 **Ombor turlari 9 ta** (vizyon 30+ bo'lim omborini xohlaydi) + ba'zi hisobot ekranlari "tayyor emas"

---

## XULOSA (egasiga)
Bu — **eng kuchli, eng tayyor modul** (vizyon yuragi va u haqiqatan qurilgan). Boshqa modullardan farqli o'laroq:
- **Asosiy amallar HAQIQATAN ishlaydi** — material kiritsangiz/chiqarsangiz, ombordagi raqam bazada to'g'ri o'zgaradi; yetmasa chiqarmaydi (manfiy stok bloki)
- **Rulon boshqaruvi QURILGAN** — vazn, QR, ogohlantirish, FIFO real
- **Haqiqiy DATA bor** (boshqa modullarda hammasi bo'sh edi)

Asosiy kamchiliklar texnik tozalash darajasida: ikki kirim/chiqim yo'lini bittaga keltirish, pul yozuvini (GL) ulash, javonlarni to'ldirish (yuqori zanjirni ulagach), va ba'zi hisobot ekranlarini tugatish.

Metafora: uyning bu xonasi DEYARLI tayyor — javonga haqiqatan narsa qo'yasiz, olasiz, va javondagi son to'g'ri yangilanadi. Faqat javonlar hali bo'shroq, va narsa olganingizda daftarchaga (buxgalteriya) avtomatik yozilmaydi.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
