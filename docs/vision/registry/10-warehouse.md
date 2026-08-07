# Ombor / WMS — Yagona Vizyon Registri (EP-WMS) — 2026-08-07


> **Manbalar:** `decisions/10-warehouse.md` (134 qaror: v1=31, v2=103) · `FULL-ITEM-LEVEL [Module-10]` (121 item) · `FULL-VISION-EXTRACTION` QISM A (WMS 50 qaror) / QISM C (TASDIQ-2146 §10, 121 qator) / QISM D + **I2-OMBOR·POS·KASSIR·TA'MINOT intervyusi** (33 qator, egasining 1-4 iyun to'g'ridan javoblari) · `vision-1000-answers/10-warehouse.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida WMS/POS/MM/logistika kodiga tegan commitlar qayta tekshirildi va jonli kodda spot-verify qilindi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-WMS-001..134)** | **134** |
| **Qaror holati:** ✅ javoblangan | 76 |
| **Qaror holati:** 🔵 ochiq | 59 |
| **Qurilish:** Ha | 14 |
| **Qurilish:** Qisman | 46 |
| **Qurilish:** Yo'q | 21 |
| **Qurilish:** STALE-DOC | 7 |
| **Qurilish:** — (FULL-ITEM-LEVEL da mos item topilmadi) | 48 |
| 2026-07-11 dan beri o'zgargan (Δ) | 27 |
| ⚠️ Manbalar orasida ziddiyat | 30 |
| **II QISM (`VR-WMS-I01..I02`)** | **2** |

> **Eslatma (qamrov):** **I QISM** = 134 EP-kodli qaror (`grep -c "^### EP-WMS-"` → **134**).
> **II QISM** = I2-intervyudan va cross-cutting bo'shliqlardan kelgan, `decisions/` da EP-kodi
> BO'LMAGAN 2 vizyon-talab (`VR-WMS-I01..I02`). **III QISM** = raqamlash siljishi, manba-ziddiyat
> registri va metodologiya. Yuqoridagi jadval faqat I QISM sanog'i.
>
> **Eslatma (ikki o'q mustaqil):** «Qaror holati» = egasi javob berganmi (`decisions/`);
> «Qurilish holati» = kod yozilganmi (`FULL-ITEM-LEVEL`, 2026-07-11). Ular ARALASHTIRILMAYDI —
> masalan EP-WMS-062 (inventarizatsiya zona-muzlatish) qaror bo'yicha hamon 🔵 OCHIQ, lekin
> qurilish bo'yicha **STALE-DOC** (to'liq qurilgan va hard-gate sifatida ulangan);
> aksincha EP-WMS-013 (kunlik stok hisoboti) qaror bo'yicha ✅ JAVOBLANGAN, qurilish bo'yicha **Yo'q**.
>
> **Eslatma (mapping):** `FULL-ITEM-LEVEL` Item 1..50 = `vision-1000-answers` #1..#50 (EP-kodsiz,
> faqat mavzu bo'yicha ulanadi → `(taxminiy)`); Item 51..61 = `TASDIQ-2146 §10` #1..#11 = EP-WMS-032..042;
> Item 62..67 = TASDIQ #62..#67 = EP-WMS-093..098; Item 68..118 = TASDIQ #68..#118 = **EP-WMS-(Item+16)**
> = EP-WMS-084..134; Item 119/120/121 = EP-WMS-008+060 / 059 / 062. **TASDIQ §10 #12..#61
> (= EP-WMS-043..092) FULL-ITEM-LEVEL ga umuman kirmagan** — batafsil III QISM §1.
>
> **Eslatma (sanoq tekshiruvi):** `decisions/10-warehouse.md` o'z Xulosasida «JAVOBLANGAN 75 / OCHIQ 59»
> deydi; band-ma-band sanoq (`grep -c`) → 73 ta sof `✅ JAVOBLANGAN` + 2 ta `✅ JAVOBLANGAN (KONFLIKT…)`
> = **75 ✅** va **59 🔵**. Ya'ni bu faylning o'z Xulosasi TO'G'RI (farq yo'q) — III QISM §3.

---

## I QISM — EP-kodli qarorlar (EP-WMS-001..134)

### EP-WMS-001 · Qoldiq nima asosda hisoblanadi (kanonik zaxira jadvali)
- **Qaror holati:** ✅ JAVOBLANGAN (KONFLIKT-rails)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — bitta kanonik jadval, qolgani view. POS Q39 "Real-time (har harakat darhol PostgreSQL ga)". Memory: kanonik = `warehouse_stock`, `current_stock` = uning view'i; `stocks` parallel-dunyo (DROP/migratsiya egasi qaroriga).
- **Manba:** BARCHA_JAVOBLAR POS Q39 + memory `project_two_worlds_phase12` (warehouse_stock kanonik) + v1-A
- **Dalil (kod):** Item 1 — `grep -rn "FOR UPDATE" apps/api/src` → 5 fayl, hech biri `warehouse_stock`/WMS ga tegmaydi; `SERIALIZABLE` grep → 0. Lekin `e8c5a1f6` (2026-07-06) atomik guarded-UPDATE (RETURNING-asosli optimistik qulf) `reserveMaterial()`/`issueGoods()` uchun jonli — oversell TOCTOU yopilgan. QISM C #96: `current_stock` = view, POS ham WMS ham shu jadvalga yozadi.
- **Nima yetishmaydi:** WMS da literal `FOR UPDATE` pessimistik qulf yo'q; karantin tranzaksiyalari uchun `SERIALIZABLE` izolyatsiya yo'q edi (Δ ga qarang); `stocks` parallel-dunyosi hamon DROP qilinmagan.
- **Bog'liqlik:** EP-WMS-112 (POS↔WMS bir DB), EP-WMS-056 (manfiy qoldiq), VR-WMS-I22
- **action:** CREATE
- **⤳ Ta'sir:** Butun WMS, Finance (zaxira qiymati), MES, Hisobotlar
- **Xoch-havolalar:** `[Module-10] Item 1` *(taxminiy)* · `EXTRACTION QISM A #1` · `TASDIQ-2146 §10 #96` · `vision-1000 #1`
- **⚠️ ZIDDIYAT:** `decisions/` KONFLIKT-rails deb belgilagan: memory `warehouse_stock` kanonik ╳ `stocks` parallel-dunyo. QISM A Step-3 buni «Two-World: warehouse_stock vs warehouse_transactions … UNVERIFIABLE» deb ham qayd etadi. Yangi + kod-dalilli manba ustun: kanonik = `warehouse_stock`, `current_stock` = view.
- **Δ 2026-07-11→08-07:** `ee4ecc26` (2026-08-04) — `execPostGoodsReceiptStock` endi **SERIALIZABLE tranzaksiya + `SELECT FOR UPDATE`** ichida ishlaydi (vizyon-1000 #1 ning aynan talab qilgan mexanizmi, ilk marta jonli). `1753ed0d` (2026-08-04) — `pos_stock_ledger.balance_after` mustaqil yig'indi edi va `warehouse_stock` dan drift qilardi; endi kanonik `warehouse_stock` dan o'qiladi, `adjustStock()` esa (ilgari real zaxiraga umuman tegmaydigan jim no-op edi) `setCanonicalBalance()` orqali avval `warehouse_stock` ga yozadi.

### EP-WMS-002 · Ombor turlari ro'yxati (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — 6+ standart tur. POS Q29 aniq beradi: MAIN, QUARANTINE, PRODUCTION_*, FINISHED_GOODS, DEPARTMENT_* (30+), QC, DEFECTIVE.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + ShVB 7-otdeleniye (Administratsiya) + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #44 (EP-WMS-075): `warehouses` jadvalida **12 qator** jonli; `993c5175` commit-tanasi 2026-08-06 da «19/19 ombor» deydi. `wms-gateway-warehouses.controller.ts:102-107` jonli o'qildi — `type` filtri + `is_active` bor.
- **Nima yetishmaydi:** POS Q29 dagi 7 kanonik tur enum sifatida seed qilinganini tasdiqlovchi item yo'q; I2 intervyusi butunlay boshqa taksonomiya beradi (⚠️ ZIDDIYAT).
- **Bog'liqlik:** EP-WMS-075 (ko'p ombor), VR-WMS-I01, VR-WMS-I02, Qoida 22 (sidebar kanonik)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor Dashboard filtri, Hisobot, Org-7
- **Xoch-havolalar:** `TASDIQ-2146 §10 #44` · `I2-OMBOR #4/#32` · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** POS Q29 (6+ tur: MAIN/QUARANTINE/PRODUCTION_*/FINISHED_GOODS/DEPARTMENT_*/QC/DEFECTIVE) ╳ **I2-intervyu #4** (egasi: «Markaziy ombor YO'Q — 7 asosiy ombor: rulon / tayyor-mahsulot / hom-ashyo / xo'jalik / jihozlar / makulatura-brak / asbob-uskuna»). Ikkisi bir xil taksonomiya EMAS. I2 kechroq va egasining bevosita og'zaki javobi — lekin `decisions/` uni qamramagan; egasi imzosi kerak.
- **Δ 2026-07-11→08-07:** `993c5175` (2026-08-06) — `GET /wms/warehouses` faqat `deleted_at IS NULL`, POS ro'yxati esa faqat `is_active=true` bilan filtrlardi (ikki ekran turlicha son ko'rsatishi mumkin edi); ikkalasi endi `is_active=true AND deleted_at IS NULL`. `63ab63b0` (2026-08-05) — `warehouse-config.service.ts` ning 4 ta ro'yxat-so'rovi ham shu predikatga tekislandi. `9911a5d8` (2026-08-07) — gateway `GET /warehouse/warehouses` (WMSDashboard, Bins/Zones, GoodsIssue, InventoryCount, BarcodeSystem ishlatadi) `is_active` ni umuman e'tiborsiz qoldirardi va sidebar yuborgan `?isActive` ni jimgina tashlab yuborardi → faolsizlantirilgan ombor hamma FE sahifada ko'rinardi; endi default active-only, `isActive=false|all` bilan kengaytiriladi (jonli kodda tasdiqlandi: `:100-107`).

### EP-WMS-003 · Mol qabul qilish (kirim) jarayoni
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — to'liq qabul oqimi sifat darvozasi bilan. POS Q21 EXTERNAL_IN = 5 bosqich: DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL. POS Q30: barcha tashqi kirim avval karantinga.
- **Manba:** BARCHA_JAVOBLAR POS Q21 + Q30 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #17 (EP-WMS-048): `wms-quarantine-gate.service.ts:88-106` — BLOK real; `wms-quarantine.constants.ts` `QUARANTINE_TRANSITIONS` DRAFT→KARANTIN→{QC_PASS,REWORK,REJECT}→MAIN holat-mashinasi `updateStatusGuarded` bilan majburlanadi (Item 2 dalili).
- **Nima yetishmaydi:** 5-bosqichning oxirgi ikkisi (OMBOR_MENEJER imzosi, AI_GL) alohida bosqich sifatida holat-mashinada yo'q — GL EP-WMS-109 orqali alohida listener bilan boradi.
- **Bog'liqlik:** EP-WMS-016, EP-WMS-046, EP-WMS-048, EP-WMS-117
- **action:** CREATE
- **⤳ Ta'sir:** QC (sifat darvozasi), Finance (GL), MM (yetkazib beruvchi)
- **Xoch-havolalar:** `TASDIQ-2146 §10 #17` · `[Module-10] Item 2` *(taxminiy)* · `EXTRACTION QISM A #2`
- **Δ 2026-07-11→08-07:** `ee4ecc26` (2026-08-04) — MM tomonidagi `execPostGoodsReceiptStock` **karantin/QC ni butunlay chetlab o'tardi**: faqat `receipt.status !== 'received'` ni tekshirib to'g'ridan `warehouse_stock` ga yozardi, ya'ni DRAFT dan yoki REWORK/REJECT dan keyin ham nol QC bilan zaxiraga tushishi mumkin edi. Endi WMS ning o'z `normalizeStatus`/`QUARANTINE_STATUS` konstantalari bilan tekshiriladi va faqat `QC_PASS` da davom etadi (bloklanganda 409). `940d8f8c` (2026-07-11) — goods receipt uchun `'conditional'` statusi qo'shildi.

### EP-WMS-004 · Mol qabul → buyurtma (PO) bilan bog'lash (3-way match)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — avtomatik 3-tomonlama moslik (PO ↔ qabul akti ↔ schyot). ShVB nazorat ruhi mos; lekin tolerans % egasidan (v2 Q16/Q87 bilan bog'liq).
- **Manba:** v1-A (A-default) + ShVB 3-way nazorat
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #16 (EP-WMS-047, 2026-06-27): «PO FK bor, avto match+tolerans yo'q» → Qisman.
- **Nima yetishmaydi:** avtomatik 3-way match hisoblagichi; tolerans % egasi-DATA (EP-WMS-118 bilan bir).
- **Bog'liqlik:** EP-WMS-047 (dublikat), EP-WMS-118 (tolerans), EP-WMS-096 (avans)
- **action:** CREATE
- **⤳ Ta'sir:** MM (PO), Finance (kreditor), Таъминот
- **Xoch-havolalar:** `TASDIQ-2146 §10 #16` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-005 · Ichki ko'chirish (omborlar orasi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A/B aralash — POS Q25 INTERNAL_TRANSFER: bir xil tip = tezkor (tasdiqsiz), boshqa tip = menejer tasdiq. Yo'lda holat ko'rinishi A bilan to'ldiriladi.
- **Manba:** BARCHA_JAVOBLAR POS Q25 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #43 (EP-WMS-074): «internal request» — Ha (`wms-counts.dto.ts:17-23` + audit); QISM C #44 (EP-WMS-075): from/to warehouse — Ha.
- **Nima yetishmaydi:** «bir xil tip = tasdiqsiz / boshqa tip = menejer tasdiq» differensiatsiyasi kodda tasdiqlanmagan; «yo'lda» (in-transit) oraliq holat ichki ko'chirish uchun yo'q.
- **Bog'liqlik:** EP-WMS-006 (ruxsat), EP-WMS-074, EP-WMS-134 (ko'chirish izi)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor turlari, Audit-log, ichki logistika
- **Xoch-havolalar:** `TASDIQ-2146 §10 #43/#44` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-006 · Ko'chirishga ruxsat (kim tasdiqlaydi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — summaga/tipga qarab darajali. POS Q25: bir xil tip tasdiqsiz, boshqa tip ombor menejer; POS Q23 INTERNAL_ISSUE = menejer 1 imzo. ShVB matritsasiga mos.
- **Manba:** BARCHA_JAVOBLAR POS Q23 + Q25 + ShVB approval-matrix + v1-A
- **Dalil (kod):** Item 8 — summaga qarab darajali tasdiqlash matritsasi (kichik → ombor boshlig'i, yuqori → xarid boshlig'i + moliya, import hajmi → direktor) topilmadi. QISM C #26 (EP-WMS-057): «rol+audit bor, ikki-imzo yo'q».
- **Nima yetishmaydi:** summa-chegarali darajali matritsa umuman yo'q; chegara qiymatlari egasi-konfiguratsiya (business_settings CRUD).
- **Bog'liqlik:** EP-WMS-057 (ikki imzo), EP-WMS-102 (razryad matritsasi), EP-WMS-024
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC, Org-karta (razryad), ShVB matritsa
- **Xoch-havolalar:** `[Module-10] Item 8` *(taxminiy)* · `EXTRACTION QISM A #8` · `TASDIQ-2146 §10 #26` · `vision-1000 #8`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-007 · Inventarizatsiya (sanash) jarayoni
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A+B — POS Q52 "Tunda yoki dam olish kunida (ish to'xtatilmaydi)"; aylanma + to'liq sanash (v2 Q27/Q100 bilan). GSD aniqlik ko'rsatkichi ShVB dan.
- **Manba:** BARCHA_JAVOBLAR POS Q52 + Q53 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #27 (EP-WMS-058): «`inventory_counts` CRUD bor, chastota avto yo'q» → Qisman. Item 121 dalili: `wms-counts.service.ts`/`inventory_counts` infratuzilmasi jonli.
- **Nima yetishmaydi:** aylanma-vs-to'liq rejim avtomatik ajratilmaydi; chastota rejasi (EP-WMS-131 CRON) alohida.
- **Bog'liqlik:** EP-WMS-058, EP-WMS-062 (zona freeze), EP-WMS-131 (ABC chastota), VR-WMS-I12
- **action:** CREATE
- **⤳ Ta'sir:** Finance (zaxira tasdig'i), GSD ko'rsatkich, GL
- **Xoch-havolalar:** `TASDIQ-2146 §10 #27` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-008 · Inventarizatsiya aniqlik foizi (GSD ko'rsatkich)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik aniqlik% = (to'g'ri / jami)×100, har sanashdan keyin saqlanadi, trend. ShVB GSD ruhi mos; formula/saqlash modeli egasidan.
- **Manba:** v1-A (A-default) + ShVB GSD (haftalik statistika)
- **Dalil (kod):** Item 119 (TASDIQ #119 «v1 008/060») — «GSD formula + variance bor, gating oqim tasdiqlanmadi» → Qisman. Item 12 esa (vision-1000 #12, pozitsiya-asosli formula) → **Yo'q**.
- **Nima yetishmaydi:** «(farqsiz pozitsiya / jami pozitsiya)×100» pozitsiya-asosli formula (miqdor-asosli emas) kodda tasdiqlanmagan; ±1% → rahbar gating oqimi ulanmagan; omborchi kartasiga KPI sifatida tushishi yo'q.
- **Bog'liqlik:** EP-WMS-060 (og'ish chegarasi), EP-WMS-023 (ЦКП GSD), EP-WMS-119
- **action:** CREATE
- **⤳ Ta'sir:** GSD-panel, Org-karta (omborchi KPI), Director dashboard
- **Xoch-havolalar:** `[Module-10] Item 119` · `[Module-10] Item 12` *(taxminiy)* · `EXTRACTION QISM A #12` · `TASDIQ-2146 §10 #119`
- **⚠️ ZIDDIYAT:** Item 12 (vision-1000 #12) «Yo'q» ╳ Item 119 (TASDIQ #119) «Qisman — GSD formula bor». Ikkisi bir xil EP kodga tegadi. Farq izohi: Item 119 umumiy aniqlik-hisobni tasdiqlaydi, Item 12 esa aynan **pozitsiya-asosli** formula (vizyon talabi) yo'qligini aytadi. Registr yumshoqroq (Qisman) ni oladi, lekin vizyon-formulasi hamon qurilmagan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-009 · Inventarizatsiya farqini kim tasdiqlaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — farq akti → ombor boshlig'i + moliya tasdig'i, GL ga yoziladi. POS Q53: "Avtomatik, lekin moliya bo'limi tekshiradi va tasdiqlaydi".
- **Manba:** BARCHA_JAVOBLAR POS Q53 + v1-A
- **Dalil (kod):** Item 7 (vision-1000 #7) — farq darhol qayd etilishi qisman real; GL yozuvi faqat ombor boshlig'i + moliya tasdig'idan keyin bo'lishi kerak. QISM C #29 (EP-WMS-060): «variance saqlanadi, avto-tuzatish yo'q».
- **Nima yetishmaydi:** «smena akti imzolangan zahoti darhol qayd» + «GL faqat ikki tasdiqdan keyin» ikki bosqichli gating to'liq ulangan emas.
- **Bog'liqlik:** EP-WMS-060, EP-WMS-111 (mas'ul shaxs), EP-WMS-109 (GL)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (GL), Audit-iz, ombor boshlig'i
- **Xoch-havolalar:** `[Module-10] Item 7` *(taxminiy)* · `EXTRACTION QISM A #7` · `TASDIQ-2146 §10 #29` · `vision-1000 #7`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-010 · Kam-qoldiq darajalari (min/max/reorder)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — har material uchun 3 daraja (min/max/reorder), sarfga qarab avto-hisob. Qisman bor (`low_stock_alerts`); to'liq model + avto-hisob egasi tasdig'i bilan (v2 Q33-37).
- **Manba:** v1-A (A-default) + mavjud `low_stock_alerts`
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #33 (EP-WMS-064): «`min_stock_alerts` + `get-low-stock.handler.ts`» → **Ha**; #34 (EP-WMS-065): «rop/eoq servis bor, lead-time DATA yo'q»; #35 (EP-WMS-066): «`max_stock` bor, trigger tasdiqlanmadi».
- **Nima yetishmaydi:** uchala daraja bitta modelda birlashtirilmagan; sarfga qarab avto-qayta-hisob (EP-WMS-067 dinamik) yo'q.
- **Bog'liqlik:** EP-WMS-064/065/066/067 (v2 detallari), EP-WMS-012 (avto PR)
- **action:** CREATE
- **⤳ Ta'sir:** MM (xarid), MES (uzilish oldi), v2 Q33-37
- **Xoch-havolalar:** `TASDIQ-2146 §10 #33/#34/#35` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-011 · Kam-qoldiq ogohlantirish kimga boradi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — omborchi + xarid + ombor boshlig'iga, ilovada + Telegram. POS Q59 "To'liq Telegram Mini App (so'rov, xabar)"; HR Q140 "Hammasi, vaqtlari belgilash mumkin".
- **Manba:** BARCHA_JAVOBLAR POS Q59 + HR Q140 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #33: `min_stock_alerts` + `get-low-stock.handler.ts` jonli (signal manbai bor), lekin qabul-qiluvchilar ro'yxati (omborchi/xarid/boshliq) marshrutlash qatlami alohida tasdiqlanmagan.
- **Nima yetishmaydi:** kimga borishi (rol-asosli marshrut) + Telegram yetkazish yo'li tasdiqlanmagan; memory: Notif modulida `alert_thresholds` jadvali yo'q, Telegram `userId`-as-`chat_id` bug.
- **Bog'liqlik:** EP-WMS-031 (Telegram), EP-WMS-108 (proaktiv signal), Notif moduli
- **action:** EVENT
- **⤳ Ta'sir:** CC/NTF, Telegram bot, Таъминот
- **Xoch-havolalar:** `TASDIQ-2146 §10 #33` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-012 · Kam-qoldiq → avtomatik xarid arizasi (PR)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avtomatik PR (ZVS/ZNO) loyihasi, xarid faqat tasdiqlaydi. ShVB ZVS oqimiga ulanadi; avto-trigger egasidan.
- **Manba:** v1-A (A-default) + ShVB ZVS/xarid oqimi
- **Dalil (kod):** Item 4 — `grep -rln "purchase_request|purchaseRequest" apps/api/src` faqat `inventory-agent.service.ts` va generated schema faylini qaytaradi; ochiq PR miqdoriga WMS tomonidan "AI tavsiya belgisi" ogohlantirish-bayrog'i yo'q.
- **Nima yetishmaydi:** kam-qoldiq → PR loyihasi avto-yaratish zanjiri butunlay yo'q; MM `purchase_request` sxemasi kanonik deb tasdiqlangandan keyin sof qurilish vazifasi (owner-gated emas).
- **Bog'liqlik:** MM purchase-request moduli (kanonik sxema), EP-WMS-064/065, EP-WMS-120
- **action:** EVENT
- **⤳ Ta'sir:** Finance (ZVS), MM, Таъминот
- **Xoch-havolalar:** `[Module-10] Item 4` *(taxminiy)* · `EXTRACTION QISM A #4` · `vision-1000 #4`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-013 · Kunlik stok hisoboti
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avtomatik kunlik hisobot (kirim/chiqim/ko'chirish/qoldiq), ertalab rahbarga. POS Q57 "Ombor menejer (kunlik)"; kitob "кун якунида хисобот".
- **Manba:** BARCHA_JAVOBLAR POS Q57 + kitob (kunlik hisobot tartibi) + v1-A
- **Dalil (kod):** Item 47 (vision-1000 #47) — barcha ombor turlarini (bo'sh=0) qamragan kunlik hisobot yo'q. QISM A Step-3: «Kunlik ombor hisobot real-time push yo'q» (VISION-3340:783 SB0552, STILL-OPEN). QISM C #91 (EP-WMS-107): «dashboard endpoint bor, CRON writer yo'q».
- **Nima yetishmaydi:** CRON yozuvchi yo'q; recipient-ga qarab format (ombor boshlig'i = batafsil, Direktor = summary) yo'q; bo'sh omborni «0» bilan ko'rsatish qoidasi yo'q.
- **Bog'liqlik:** EP-WMS-107 (dublikat), CC/NTF moduli
- **action:** CRON
- **⤳ Ta'sir:** CC/NTF, Director dashboard, ShVB GSD
- **Xoch-havolalar:** `[Module-10] Item 47` *(taxminiy)* · `EXTRACTION QISM A #47` · `TASDIQ-2146 §10 #91` · `vision-1000 #47`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-014 · Rulon qoldig'i (qog'oz/karton rulonlari)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — har rulon alohida birlik (ID, boshlang'ich og'irlik/metr, joriy qoldiq), kesilganda yangilanadi. Kod `/warehouse/rolls` JONLI (memory). Karton zavodi yadrosi.
- **Manba:** memory (warehouse/rolls jonli) + vizyon (karton rulon) + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da bu v1-kodga mos item yo'q, lekin uning v2 detallashtirilgan ekvivalentlari qurilgan: Item 51 (EP-WMS-032, rulon o'lchov maydonlari) = **Ha**, Item 53 (EP-WMS-034, kg + uzunlik avto-hisob) = **Ha**, Item 55 (EP-WMS-036, noyob ID + QR) = **Ha** — `rulon_cards`, `rulon-card.service.ts:60-99,132-167` (`WmsRollCalc`).
- **Nima yetishmaydi:** «kesilganda yangilanadi» halqasi EP-WMS-129 (rulon→list) da hamon Qisman.
- **Bog'liqlik:** EP-WMS-032..039 (rulon kartochkasi), EP-WMS-129 (kesish), VR-WMS-I15
- **action:** CREATE
- **⤳ Ta'sir:** MES (kesish/sarf), v2 Q1-8 (rulon kartochkasi)
- **Xoch-havolalar:** `[Module-10] Item 51/53/55` *(taxminiy — v2 ekvivalent)* · `TASDIQ-2146 §10 #1/#3/#5` · `I2-OMBOR #9`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-015 · Rulon qoldig'i (ostatok) qayta ishlatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ostatok reestri (o'lcham/sifat), yangi buyurtmaga avto-taklif. ShVB kaizen/tejamkorlik mos; avto-taklif modeli egasidan (v2 Q52/Q94 bilan).
- **Manba:** v1-A (A-default) + ShVB kaizen + kitob (қолдиқ chiqarish)
- **Dalil (kod):** Item 24 (vision-1000 #24) — ostatok rulon taklifi PP rejalashtiruvchiga boradigan oqim yo'q; AI ustuvorlik (SD muddati yaqin + eng kam qoldiq sarflaydigan buyurtma birinchi) qurilmagan.
- **Nima yetishmaydi:** ostatok reestri → PP rejalashtiruvchi taklifi → AI ustuvorlik → PP boshlig'i tasdig'i zanjirining hech bir bo'g'ini yo'q.
- **Bog'liqlik:** EP-WMS-083 (obrezka), EP-WMS-125 (vtorichka), EP-WMS-035 (ochilgan rulon), VR-WMS-I09
- **action:** CREATE
- **⤳ Ta'sir:** MES (qoldiqdan kichik buyurtma), Finance (tejam)
- **Xoch-havolalar:** `[Module-10] Item 24` *(taxminiy)* · `EXTRACTION QISM A #24` · `vision-1000 #24`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-016 · Karantin (brak/tekshiruvdagi material)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — alohida karantin holati, QC qaror chiqarmaguncha bloklangan. POS Q30 "Barcha EXTERNAL_IN avval karantinga, QC tasdiqlasa → asosiy omborga".
- **Manba:** BARCHA_JAVOBLAR POS Q30 + Q29 (QUARANTINE ombori) + v1-A
- **Dalil (kod):** Item 2 — `wms-quarantine-gate.service.ts` to'liq o'qilgan: `canPostToMain()` (127-131) `QC_PASS` bo'lmaguncha MAIN ga yetishni qattiq bloklaydi; `QUARANTINE_TRANSITIONS` holat-mashinasi `updateStatusGuarded` (TOCTOU-guarded) bilan majburlanadi.
- **Nima yetishmaydi:** REJECTED/karantin uchun MES/PP reaksiya qiladigan alohida event-emission yo'li topilmadi (faqat holat-mashina o'tishining o'zi).
- **Bog'liqlik:** EP-WMS-017 (chiqish qarori), EP-WMS-048, EP-WMS-069..072, EP-WMS-117
- **action:** CREATE
- **⤳ Ta'sir:** QC, MES (karantin material berilmaydi)
- **Xoch-havolalar:** `[Module-10] Item 2` · `EXTRACTION QISM A #2` · `TASDIQ-2146 §10 #17/#38/#39` · `vision-1000 #2`
- **Δ 2026-07-11→08-07:** `ee4ecc26` (2026-08-04) — MM goods-receipt yo'li karantindan chetlab o'tardi, endi WMS holat-mashinasiga bo'ysunadi (409 blocked_quarantine). `9ea7c155` (2026-08-07) — `pos-quarantine-check` cron **ikkita** eskalatsiya yo'lini yuritardi; biri CRUD-sozlanadigan `pos.quarantine_escalation_hours` ni, ikkinchisi hardcoded 48 ni o'qirdi (egasi qiymatni o'zgartirsa desync); ikkalasi endi bir kalitni o'qiydi. Shu commit `POS_TELEGRAM_BOT_TOKEN` hech qayerda aniqlanmagani sababli «QC tekshiruv kerak» xabarlari **hech qachon yuborilmasligini** ham tuzatdi.

### EP-WMS-017 · Karantindan chiqish qarori
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — QC/sifat bo'limi qaror. POS Q31 aniq 3 qaror: QABUL → asosiy ombor | REWORK → MES | CHIQARISH → ta'minotchiga qaytish. Har qaror loglanadi.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #39 (EP-WMS-070): `wms-quarantine-gate.service.ts:56-71` `applyQcDecision` → **Ha**; #40 (EP-WMS-071): «3 yo'l REAL, past→arzon yo'q» → Qisman.
- **Nima yetishmaydi:** POS Q31 ning 3 qarori real, lekin v2 Q40 ning 4-yo'li («past sifat → arzon ishga») yo'q.
- **Bog'liqlik:** EP-WMS-070 (dublikat), EP-WMS-071, EP-WMS-106 (qaytarish)
- **action:** APPROVE
- **⤳ Ta'sir:** QC (yakuniy qaror), MES (rework), Таъминот (qaytarish)
- **Xoch-havolalar:** `TASDIQ-2146 §10 #39/#40` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-018 · Yaroqlilik muddati / partiya (FEFO)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — partiya + yaroqlilik sanasi, FEFO + ogohlantirish. POS Q37 "Muddatli → FEFO, muddatsiz → FIFO". Code-128 partiya barkodi (POS Q15).
- **Manba:** BARCHA_JAVOBLAR POS Q37 + Q15 + v1-A
- **Dalil (kod):** Item 13 (vision-1000 #13) — FIFO buyurtmasi saqlanadi, lekin «eskirish chegarasiga yaqin partiya MES buyurtmasiga biriktirilganda QC + operatorga ogohlantirish» yo'q. QISM C #48 (EP-WMS-079): `batch-selection.service.ts:116-131` FEFO **BLOK** → Ha; #24 (EP-WMS-055): `resolveStrategy` → Ha.
- **Nima yetishmaydi:** FEFO/FIFO tanlash va muddat-bloki real, lekin «chegaraga yaqin» proaktiv ogohlantirish (blok emas) qatlami yo'q.
- **Bog'liqlik:** EP-WMS-055 (FIFO/FEFO chiqim), EP-WMS-079, EP-WMS-126 (yosh signali)
- **action:** CREATE
- **⤳ Ta'sir:** QC (muddati o'tgan brak), Chiqim, v2 Q48
- **Xoch-havolalar:** `[Module-10] Item 13` *(taxminiy)* · `EXTRACTION QISM A #13` · `TASDIQ-2146 §10 #24/#48` · `vision-1000 #13`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-019 · Ombor-ijara (tashqi mijoz molini saqlash)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — to'liq ijara moduli (ijarachi/maydon/shartnoma/oylik haq), moliyaga ulanadi. Kod `wms-rental` bor; kitob "материалы заказчика (давальческий)" tushunchasi mavjud. To'liq biznes-model egasidan.
- **Manba:** v1-A (A-default) + kod `wms-rental` + kitob (заказчик materiali)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #117 (EP-WMS-133): «rental CRUD bor, GL-flag + CRON tasdiqlanmadi; tarif egasi-data» → Qisman.
- **Nima yetishmaydi:** shartnoma/maydon/oylik-haq modeli va uning Finance-ga ulanishi; tarif sxemasi egasi-DATA.
- **Bog'liqlik:** EP-WMS-020 (to'lov/GL), EP-WMS-123 (davalcheskiy), EP-WMS-133 (dublikat), VR-WMS-I08
- **action:** CREATE
- **⤳ Ta'sir:** Finance (daromad), SD, v2 Q92/Q102
- **Xoch-havolalar:** `TASDIQ-2146 §10 #117` · `I2-OMBOR #15` · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** `decisions/` «tarif modeli (hajm×kun / oylik fiks / poddon×kun) egasidan» deydi ╳ **I2-intervyu #15** egasi allaqachon aniq model bergan: «Tayyor mahsulot IJARA: **30 kun bepul → keyin kunlik m² ga pul → menejerga**; A2: SOZLANADIGAN (muhim mijozga moslash)». Ya'ni bu band aslida 🔵 OCHIQ emas, I2 bo'yicha JAVOBLANGAN — chegara (30 kun, m² tarifi) `business_settings` CRUD ga joylashtiriladi.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-020 · Ombor-ijara to'lovi va moliya (GL) bog'lanishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — oylik avtomatik schyot (maydon×tarif), debitorlik/GL ga. ShVB to'lanmagan schyotlar oqimiga mos; tarif modeli (hajm×kun/oylik fiks/poddon×kun) egasidan (v2 Q102 sub-savol).
- **Manba:** v1-A (A-default) + ShVB unpaid-aging
- **Dalil (kod):** Item 9 (vision-1000 #9) — `owner_type`/`owner_customer_id` ustunlari mavjud (VISION-3340:764 SB0533), lekin oylik-haq hisoblovchi CRON (har oy 1-kuni GL daromad kredit + debitorlik debet) tasdiqlanmagan.
- **Nima yetishmaydi:** oylik CRON hisoblovchi; GL hisob raqamlari (daromad/debitor) egasi + moliya bo'limidan; mas'ul menejer = SD bo'lim boshlig'i biriktiruvi.
- **Bog'liqlik:** EP-WMS-019, EP-WMS-133, EP-WMS-123, Finance/GL
- **action:** CREATE
- **⤳ Ta'sir:** Finance (GL daromad, debitor), SD
- **Xoch-havolalar:** `[Module-10] Item 9` *(taxminiy)* · `EXTRACTION QISM A #9` · `TASDIQ-2146 §10 #117` · `vision-1000 #9`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-021 · Ombor xaritasi / joylashuv (locator)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** B (POS realizatsiyasi) — POS Q33 bin location = Freeform (operator yozadi: A-3-12, Tokcha-5, istalgan matn). To'liq zona→qator→javon→yacheyka strukturasi v2 Q42 da OCHIQ qoladi.
- **Manba:** BARCHA_JAVOBLAR POS Q33 + v1
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #42 (EP-WMS-073): `warehouse_zones` + `warehouse_bins` → **Ha**. Item 5 dalili ham `information_schema.tables` bo'yicha ikkala jadval mavjudligini tasdiqlaydi (count=2).
- **Nima yetishmaydi:** freeform ╳ struktura tanlovi egasi qaroriga qolgan (EP-WMS-073); `bin_location_id` ustuni bor (VISION-3340:762 SB0531) lekin avto-joy algoritmi yo'q (EP-WMS-076).
- **Bog'liqlik:** EP-WMS-073 (topologiya), EP-WMS-076 (sig'im), EP-WMS-134 (ko'chirish izi)
- **action:** CREATE
- **⤳ Ta'sir:** Chiqim ko'rsatmasi, tsiklik sanash, v2 Q42-45
- **Xoch-havolalar:** `TASDIQ-2146 §10 #42` · `[Module-10] Item 5` *(taxminiy)* · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** POS Q33 «freeform» (hozirgi realizatsiya, B varianti) ╳ v2 Q42-A «Zona → Qator → Javon → Yacheyka» (to'liq struktura). Kod aslida **strukturaviy** yo'ldan ketgan (`warehouse_zones`+`warehouse_bins` jadvallari jonli), ya'ni qaror-hujjat (B) va qurilgan kod (A) bir-biriga zid. Egasi yakuniy tanlovi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-022 · Barkod / QR bilan ishlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — barcha amallar barkod orqali (tablet). POS Q15 EAN-13 + Code-128; Q16 dedicated scanner + AI kamera (ZXing.js); Q60 MVP-1 = barcode skan. Kod `wms-barcode` bor.
- **Manba:** BARCHA_JAVOBLAR POS Q15-17 + Q60 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. `wms-barcode.controller.ts` jonli o'qildi (bu sessiya) — `/warehouse/printer-config`, `/warehouse/material-kits` marshrutlari real. QISM C #5 (EP-WMS-036): `roll_code`+`qr_label` noyob → Ha; #116 (EP-WMS-132): «barcode/label infra bor, to'liq oqim tasdiqlanmadi».
- **Nima yetishmaydi:** «barcha amallar barkod orqali» to'liq qamrovi (kirim/chiqim/sanoq hammasi) uchidan-uchiga tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-036 (rulon yorlig'i), EP-WMS-132 (blanka+QR), EP-WMS-112 (POS tablet)
- **action:** CREATE
- **⤳ Ta'sir:** POS Monitor tablet, kirim/chiqim/sanash
- **Xoch-havolalar:** `TASDIQ-2146 §10 #5/#116` · `I2-OMBOR #27` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-023 · Ombor bo'limi GSD/ЦКП (karta-model integratsiyasi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — omborchi kartasiga 2-3 GSD (aniqlik%, kirim/chiqim tezligi, kam-qoldiq holatlari). Karta-modelga to'liq ulanadi; aniq GSD ro'yxati egasidan (v2 Q88 bilan).
- **Manba:** v1-A (A-default) + karta-model (har lavozim GSD) + ShVB
- **Dalil (kod):** Item 28 (vision-1000 #28) — aniqlik% trend grafigi Direktor dashboardida yo'q; <95% da darhol signal (CC+Telegram) yo'q; omborchi kartasiga KPI tushishi yo'q. QISM A Step-3: «Karta-model integratsiya (omborchi GSD + razryad→vakolat) MISSING» (VISION-3340:766 SB0535), sabab `CARD_PERMISSION_SOURCE_READY=false`.
- **Nima yetishmaydi:** karta-model ↔ WMS KPI bog'lanishining hech bir bo'g'ini yo'q; GSD ro'yxati egasi-DATA.
- **Bog'liqlik:** EP-WMS-008 (aniqlik%), EP-WMS-119 (ЦКП KPI), EP-WMS-024/102 (razryad), Org moduli
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (omborchi), AI-baho, oylik
- **Xoch-havolalar:** `[Module-10] Item 28` *(taxminiy)* · `EXTRACTION QISM A #28` · `TASDIQ-2146 §10 #103` · `vision-1000 #28`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-024 · Omborchi razryadi → vakolat darajasi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — razryadga bog'liq vakolat (past = oddiy kirim/chiqim, yuqori = inventarizatsiya/farq tuzatish). Karta-model razryad→talab→o'sish zanjiri; matritsa egasidan (v2 Q71).
- **Manba:** v1-A (A-default) + karta-model (razryad) + HR Q132 (orgsxemada belgilash)
- **Dalil (kod):** Item 50 (vision-1000 #50) — razryad ko'tarilganda vakolat darhol aktivlanishi (qo'shimcha tasdiqsiz) qurilmagan; razryad pasayganda DRAFT aktlarni yakunlash imkoniyati ham yo'q. QISM C #86 (EP-WMS-102): «`role_movement_permissions` bor, razryad-bog' yo'q».
- **Nima yetishmaydi:** `role_movement_permissions` ↔ razryad bog'lanishi yo'q; RBAC karta-manbasi OFF (`CARD_PERMISSION_SOURCE_READY=false`).
- **Bog'liqlik:** EP-WMS-102 (dublikat), EP-WMS-006 (tasdiqlash), Org karta-gate
- **action:** CREATE
- **⤳ Ta'sir:** HR/org-karta, RBAC, ombor xavfsizlik
- **Xoch-havolalar:** `[Module-10] Item 50` *(taxminiy)* · `EXTRACTION QISM A #50` · `TASDIQ-2146 §10 #86` · `vision-1000 #50`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-025 · Ombor ↔ ishlab chiqarish (MES) bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avtomatik rezerv + chiqim. POS Q58 "To'liq ERP integratsiya: MM, FI, MES, HR, QC — Real-time REST API"; POS Q39 real-time stok.
- **Manba:** BARCHA_JAVOBLAR POS Q58 + Q39 + v1-A
- **Dalil (kod):** Item 11 (vision-1000 #11) — MES kesish operatsiyasini WMS ga event orqali xabar qilishi va WMS ning bir tomonlama atomik yozuvi (rulon kg ↓ / list dona ↑) qurilmagan. QISM C #22 (EP-WMS-053): `goods-issue.handler.ts:35,85-90` `ppId` majburiy → **Ha** (chiqim tomoni real).
- **Nima yetishmaydi:** MES→WMS kesish eventi va ikki o'lchovli atomik tranzaksiya yo'q; QISM A Step-3: «MES↔WMS material chiqim norma link yo'q» (SB0555/SB0553), «MES→QC→WMS handoff QC-gate ustuni yo'q» (`production_orders` da `qc_gate` yo'q).
- **Bog'liqlik:** EP-WMS-053 (PP bog'lanish), EP-WMS-100 (rezerv), EP-WMS-129 (rulon→list), VR-WMS-I18
- **action:** EVENT
- **⤳ Ta'sir:** MES (material talab), real-time qoldiq, v2 Q22/Q69
- **Xoch-havolalar:** `[Module-10] Item 11` *(taxminiy)* · `EXTRACTION QISM A #11` · `TASDIQ-2146 §10 #22` · `vision-1000 #11`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-026 · Ombor ↔ tayyor mahsulot (FG) qabuli
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — MES tayyor mahsulot chiqarganda avtomatik kanonik FG omboriga kirim. POS Q29 FINISHED_GOODS ombori, Q34 "tayyor mahsulot bir xil POS da". Memory: `stocks`╳`warehouse_stock` ikkilanish → kanonik = `warehouse_stock`.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + Q34 + memory (FG kanonik) + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #46 (EP-WMS-077): `receive-fg.handler.ts` → **Ha**. Memory `project_batch3_fg_stock_split_complete`: `warehouse_stock` xom-ashyo / `warehouse_stock_fg` tayyor mahsulot ajratildi, 3 FG-yozuvchi qayta yo'naltirildi.
- **Nima yetishmaydi:** «faqat buyurtmaga, menejer javobgar» (I2 #13) shartlari FG kirim handleriga ulanganini tasdiqlovchi item yo'q.
- **Bog'liqlik:** EP-WMS-077 (FG zonasi), EP-WMS-097 (jo'natish), VR-WMS-I18
- **action:** EVENT
- **⤳ Ta'sir:** MES, SD (FG rezerv), Finance
- **Xoch-havolalar:** `TASDIQ-2146 §10 #46` · `I2-OMBOR #13` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-027 · ABC tahlil (qaysi material muhim)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — avtomatik ABC (aylanma/qiymat), tsiklik sanash chastotasini bog'laydi. POS Q56 hisobotlar ro'yxatida "ABC tahlil" bor. Kod `wms-catalog` da ABC bor.
- **Manba:** BARCHA_JAVOBLAR POS Q56 + kod `wms-catalog` + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #13 (EP-WMS-044): `abc_segment` + `abc-xyz.service.ts` → **Ha**.
- **Nima yetishmaydi:** ABC → tsiklik sanash chastotasi bog'lanishi EP-WMS-131 da hamon STALE-DOC/Qisman (CRON borligi Item 115 da qayta baholangan).
- **Bog'liqlik:** EP-WMS-044 (dublikat), EP-WMS-131 (ABC chastota), EP-WMS-058
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya chastotasi, Hisobot, v2 Q13/Q100
- **Xoch-havolalar:** `TASDIQ-2146 §10 #13` · `[Module-10] Item 115` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-028 · Sekin aylanuvchi / o'lik zaxira (dead stock)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — N kun harakatlanmagan material ro'yxati + ogohlantirish (sotish/qaytarish taklifi). ShVB tejamkorlik mos; N-chegara egasidan (v2 Q51/Q84/Q95).
- **Manba:** v1-A (A-default) + ShVB (muzlagan pul)
- **Dalil (kod):** Item 38 (vision-1000 #38) — toifaga qarab chegara (rulon/xom-ashyo 30 kun, yordamchi 60 kun, FG 15 kun) va AI tavsiyasi («chegirma bilan sotish» / «yetkazuvchiga qaytarish» → Moliya + SD boshlig'iga) qurilmagan. QISM C #51 (EP-WMS-082): «`last_movement_at` + aging bor, N-kun CRON yo'q».
- **Nima yetishmaydi:** toifa-bo'yicha N-chegara (30/60/15) egasi-DATA emas, `decisions/` uni egasidan so'raydi — lekin vizyon-1000 #38 aniq qiymatlarni bergan; CRON belgilovchi va AI tavsiya qatlami yo'q.
- **Bog'liqlik:** EP-WMS-082 (dublikat), EP-WMS-115 (turnover), EP-WMS-126 (yosh)
- **action:** CRON
- **⤳ Ta'sir:** Finance (zaxira qiymati), Sotuv (chegirma)
- **Xoch-havolalar:** `[Module-10] Item 38` *(taxminiy)* · `EXTRACTION QISM A #38` · `TASDIQ-2146 §10 #51` · `vision-1000 #38`
- **⚠️ ZIDDIYAT:** `decisions/` «N-chegara egasidan» (🔵 OCHIQ) ╳ vision-1000 #38 egasining aniq javobi bor: rulon/xom-ashyo **30 kun**, yordamchi **60 kun**, tayyor mahsulot **15 kun**. Chegaralar `business_settings` CRUD ga default bilan joylashtirilishi kerak (memory: threshold qiymatlar = doim CRUD).
- **Δ 2026-07-11→08-07:** —

### EP-WMS-029 · Ombor inspeksiyasi (ShVB inspektor-menejer)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — rejali inspeksiya (mezon + ball + buzilish + tuzatish), GSD ga. HR Q29 inspeksiya bo'limida "Ombor" bor; HR Q97-98 "har xona ideal rasm orqali AI nazorat (har 2 soatda)".
- **Manba:** BARCHA_JAVOBLAR HR Q29 + Q97-98 + ShVB inspektor-menejer + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q; QISM C da ham ombor-inspeksiya qatori yo'q (TASDIQ §10 bu bandni qamramaydi). Inspeksiya moduli HR/Nazorat tomonida.
- **Nima yetishmaydi:** WMS tomonidan hech qanday dalil yo'q — «ombor» inspeksiya-obyekti sifatida ro'yxatdan o'tganini tasdiqlash kerak (HR moduli registrida tekshiriladi).
- **Bog'liqlik:** HR/Inspeksiya moduli, EP-WMS-023 (GSD), IoT AI-kamera, VR-WMS-I20
- **action:** CREATE
- **⤳ Ta'sir:** Inspeksiya moduli, AI-kamera, GSD
- **Xoch-havolalar:** `I2-OMBOR #30` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-030 · Ombor harakatlari to'liq tarixi (audit izi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har amal o'zgarmas log (foydalanuvchi + vaqt + miqdor + sabab, faqat qo'shiladi). POS Q6 "To'liq: har klik, har o'zgarish, IP, timestamp"; Q7 7 yil retention; Q27 bekor faqat DRAFT, aks holda teskari harakat.
- **Manba:** BARCHA_JAVOBLAR POS Q6 + Q7 + Q27 + v1-A
- **Dalil (kod):** Item 14 (vision-1000 #14) — override hodisasi audit-logga tushishi qisman; lekin override beruvchining org-razryadi avtomatik tekshirilishi yo'q (RBAC karta-manba yo'q, `CARD_PERMISSION_SOURCE_READY=false`). QISM C #43 (EP-WMS-074): «internal request + audit» → Ha; #105 (EP-WMS-121): «transactions audit bor, avto-bayroq yo'q».
- **Nima yetishmaydi:** audit yozuvida `org-razryad` maydoni va razryad-asosli override tekshiruvi yo'q; 7 yillik retention siyosati tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-121 (ish vaqtidan tashqari), EP-WMS-102 (razryad), EP-WMS-134
- **action:** CREATE
- **⤳ Ta'sir:** Audit, Finance, nizo-isboti
- **Xoch-havolalar:** `[Module-10] Item 14` *(taxminiy)* · `EXTRACTION QISM A #14` · `TASDIQ-2146 §10 #105` · `vision-1000 #14`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-031 · Telegram orqali ombor so'rovlari (ShVB bot)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — ombor komandalar to'plami (qoldiq/kam-qoldiq/kunlik). POS Q59 "To'liq Telegram Mini App: barcode skan, so'rov, tarix, tasdiqlash". HR Q101 har modul uchun alohida bot.
- **Manba:** BARCHA_JAVOBLAR POS Q59 + HR Q101 + v1-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. `pos-telegram-ext.service.ts` mavjud, lekin Δ ga qarang — u amalda **jim o'lik** edi.
- **Nima yetishmaydi:** ombor komandalar to'plami (qoldiq / kam-qoldiq / kunlik) sifatida bot buyruqlari yo'q; memory: Notif modulida Telegram `userId`-as-`chat_id` bug hamon ochiq.
- **Bog'liqlik:** EP-WMS-011 (ogohlantirish), EP-WMS-107 (kunlik hisobot), Notif/CC moduli
- **action:** READ
- **⤳ Ta'sir:** CC/NTF, Telegram bot, operativ boshqaruv
- **Xoch-havolalar:** `I2-OMBOR #2` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `9ea7c155` (2026-08-07, T23B) — `pos-telegram-ext` **hech qayerda aniqlanmagan** `POS_TELEGRAM_BOT_TOKEN` ni o'qirdi, shu sababli «QC tekshiruv kerak» / «Tasdiqlash kutilmoqda» xabarlari ishlaydigan asosiy bot bo'lganda ham hech qachon yuborilmasdi; endi `TELEGRAM_BOT_TOKEN` ga fallback qiladi va jim no-op o'rniga ogohlantirish yozadi.

### EP-WMS-032 · Rulon kartochkasida asosiy o'lchov maydonlari (v2 Q1)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Kenglik (mm) + Diametr + Zichlik/gramaj (g/m²) + Og'irlik (kg) + Uzunlik (m). Karton zavodi yadrosi; kitob "грамаж" kalit ko'rsatkich.
- **Manba:** kitob (грамаж, rulon o'lchovlari) + vizyon (karton) + v2-A
- **Dalil (kod):** Item 51 — `rulon_cards` da `width`/`diameter`/`grammage`/`weight`; `rulon-card.controller.ts:58-116`. To'liq 5 o'lcham maydoni real.
- **Bog'liqlik:** EP-WMS-014 (v1 rulon), EP-WMS-033 (gramaj enum), EP-WMS-042 (birlik konvertatsiya)
- **action:** CREATE
- **⤳ Ta'sir:** MES (kesish/sarf), Sotuv (kg/m² narx), Finance
- **Xoch-havolalar:** `[Module-10] Item 51` · `EXTRACTION QISM C #1` · `TASDIQ-2146 §10 #1`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-033 · Gramaj (zichlik) o'lchov birligi va diapazoni (v2 Q2)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — g/m² tanlovli ro'yxat (80..300). Kitobda gramaj asosiy sifat ko'rsatkichi; standart ro'yxat xatoni kamaytiradi.
- **Manba:** kitob (грамаж sifat kaliti) + v2-A
- **Dalil (kod):** Item 52 — `grammage_gsm` erkin integer sifatida mavjud, enum/seed ro'yxati (80..300) yo'q.
- **Nima yetishmaydi:** 80..300 tanlovli ro'yxat (enum yoki seed jadval) — xato kiritishni oldini oladigan qism.
- **Bog'liqlik:** EP-WMS-091 (grammaj kirim tekshiruvi), EP-WMS-080 (partiya sifati)
- **action:** CREATE
- **⤳ Ta'sir:** master-data, QC, kirim tekshiruvi (v2 Q60)
- **Xoch-havolalar:** `[Module-10] Item 52` · `EXTRACTION QISM C #2` · `TASDIQ-2146 §10 #2`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-034 · Rulon qoldig'ini o'lchash usuli (v2 Q3)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — og'irlik (kg) asosiy + uzunlik avto-hisob (gramaj×kenglik). Tarozi-ulanish (qo'lda/avto) sub-savol egasidan.
- **Manba:** v2-A (A-default) + kitob (tarozi)
- **Dalil (kod):** Item 53 — `rulon-card.service.ts:132-167` `WmsRollCalc`: kg asosiy, uzunlik avtomatik hisoblanadi.
- **Nima yetishmaydi:** qurilish to'liq; ochiq qolgani faqat **tarozi-ulanish** (qo'lda kiritish ╳ avtomatik IoT tarozi) qarori — egasidan.
- **Bog'liqlik:** EP-WMS-063 (tarozi bilan sanoq), EP-WMS-129 (kesish)
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya (v2 Q32), MES sarf
- **Xoch-havolalar:** `[Module-10] Item 53` · `EXTRACTION QISM C #3` · `TASDIQ-2146 §10 #3`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-035 · Yarim rulon (ochilgan rulon) statusi (v2 Q4)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — status: To'liq / Ochilgan / Qoldiq; ochilganlar avval taklif. FIFO buzilmasligi uchun; model egasidan.
- **Manba:** v2-A (A-default) + FIFO mantiq
- **Dalil (kod):** Item 54 — `wms-rulon-card.constants.ts:13-27` (full/opened/remnant) + `rulon-card.service.ts:159-165` o'tish mantig'i.
- **Nima yetishmaydi:** qurilish to'liq; qaror bo'yicha «ochilganlar avval taklif qilinishi» qoidasining MES/chiqim tomonida majburiyligi egasi imzosini kutadi.
- **Bog'liqlik:** EP-WMS-055 (FIFO), EP-WMS-125 (vtorichka), EP-WMS-015 (ostatok)
- **action:** CREATE
- **⤳ Ta'sir:** MES (ochilgan rulon birinchi), FIFO
- **Xoch-havolalar:** `[Module-10] Item 54` · `EXTRACTION QISM C #4` · `TASDIQ-2146 §10 #4`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-036 · Rulonning noyob raqami (rulon ID/yorliq) (v2 Q5)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — har rulonga noyob ID + bosma yorliq (QR/barcode). POS Q19 "Label avtomatik (EXTERNAL_IN tasdiqlanganda) + qo'lda reprint, ZPL/EPL/PDF"; yorliqni ombor xodimi/avto.
- **Manba:** BARCHA_JAVOBLAR POS Q19 + Q15 + v2-A
- **Dalil (kod):** Item 55 — `rulon-card.service.ts:60-99`: `roll_code` + `qr_label` noyob, dublikatda 409 konflikt qaytaradi.
- **Bog'liqlik:** EP-WMS-022 (barkod), EP-WMS-078 (partiya), EP-WMS-132 (blanka chop)
- **action:** CREATE
- **⤳ Ta'sir:** Barkod, kuzatuv, partiya
- **Xoch-havolalar:** `[Module-10] Item 55` · `EXTRACTION QISM C #5` · `TASDIQ-2146 §10 #5`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-037 · Rulon manbasi (yetkazib beruvchi + sertifikat) (v2 Q6)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yetkazib beruvchi + ishlab chiqaruvchi + sertifikat + kelgan sana. POS Q40 "Inventar pasporti faqat EXTERNAL_IN da"; kitob Таъминот izlanuvchanlik.
- **Manba:** BARCHA_JAVOBLAR POS Q40 + kitob (Таъминот, sertifikat) + v2-A
- **Dalil (kod):** Item 56 — `supplier` / `certificate` / `received_date` ustunlari bor, **`manufacturer` alohida ustuni yo'q**.
- **Nima yetishmaydi:** ishlab chiqaruvchi (yetkazib beruvchidan farqli) alohida ustun sifatida yo'q — vositachi orqali kelgan qog'ozda izlanuvchanlik uziladi. QISM A Step-3: «Supplier TIN + Currency `warehouse_stock` da saqlanmaydi» (P0).
- **Bog'liqlik:** EP-WMS-043 (ko'p beruvchi), EP-WMS-094 (reyting), EP-WMS-095 (sertifikat fayl)
- **action:** CREATE
- **⤳ Ta'sir:** QC (reklamatsiya), Таъминот (reyting), v2 Q63
- **Xoch-havolalar:** `[Module-10] Item 56` · `EXTRACTION QISM C #6` · `TASDIQ-2146 §10 #6`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-038 · Rulon rangi/turi va qoplama (v2 Q7)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tur (kraft/test-layner/flyuting/beliy/makulatura) + qoplama maydoni. Kitobda топлайнер╳местный (makulatura) ajratimi aniq.
- **Manba:** kitob (топлайнер, местный/макулатура, gofra) + v2-A
- **Dalil (kod):** Item 57 — `roll_type` `varchar` sifatida REAL, lekin enum cheklovi va `coating` (qoplama) maydoni yo'q.
- **Nima yetishmaydi:** tur enum (erkin matn → xato/dublikat xavfi) va qoplama maydoni; топлайнер╳местный ajratimi ma'lumot darajasida majburlanmagan.
- **Bog'liqlik:** EP-WMS-090 (makulatura), EP-WMS-101 (substitute), EP-WMS-084 (texkarta moslik)
- **action:** CREATE
- **⤳ Ta'sir:** PP texkarta, QC, v2 Q59
- **Xoch-havolalar:** `[Module-10] Item 57` · `EXTRACTION QISM C #7` · `TASDIQ-2146 §10 #7`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-039 · Namlik va saqlash sharti maydoni (v2 Q8)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — namlik (%) + tavsiya etilgan saqlash zonasi. Qog'oz namlikka sezgir; IoT bilan (v2 Q96) bog'lanadi; chegaralar egasidan.
- **Manba:** v2-A (A-default) + vizyon (qog'oz namlik)
- **Dalil (kod):** Item 58 — `rulon-card.service.ts:109-110`: `humidity_pct` + `storage_zone` maydonlari real.
- **Nima yetishmaydi:** maydonlar bor, lekin **chegara qiymatlari** (qaysi % dan keyin signal) yo'q — `business_settings` CRUD ga qo'yilishi kerak; IoT bog'lanishi EP-WMS-127 da Qisman.
- **Bog'liqlik:** EP-WMS-127 (IoT signal), EP-WMS-128 (maxsus saqlash), EP-WMS-091
- **action:** CREATE
- **⤳ Ta'sir:** QC, IoT (v2 Q96), saqlash zona
- **Xoch-havolalar:** `[Module-10] Item 58` · `EXTRACTION QISM C #8` · `[Module-10] Item 6` *(taxminiy — IoT zona-xavf)* · `TASDIQ-2146 §10 #8`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-040 · Material asosiy toifalari (v2 Q9)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Xom-ashyo (rulon) / Yordamchi (kley/bo'yoq/skotch/sim) / Tayyor mahsulot / Yarim tayyor / Chiqindi. POS Q29 ombor turlari shu toifalarni qamraydi.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + kitob (material turlari) + v2-A
- **Dalil (kod):** Item 59 — `category` + `material_type` ustunlari bor, lekin 5-toifa qat'iy enum/seed tasdiqlanmadi.
- **Nima yetishmaydi:** 5 toifa qat'iy enum sifatida seed qilinmagan → toifa-bo'yicha hisobot va dead-stock chegarasi (EP-WMS-028) ishonchsiz.
- **Bog'liqlik:** EP-WMS-002 (ombor turlari), EP-WMS-028 (toifa-chegarasi), VR-WMS-I01
- **action:** CREATE
- **⤳ Ta'sir:** Finance (toifa qiymati), Hisobot
- **Xoch-havolalar:** `[Module-10] Item 59` · `EXTRACTION QISM C #9` · `TASDIQ-2146 §10 #9`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-041 · Material kodlash tizimi (artikul) (v2 Q10)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ma'noli kod (KR-125-1400) + avto-tartib raqam. Dublikat oldini oladi; kodlash sxemasi egasidan (v2 Q91 bilan).
- **Manba:** v2-A (A-default) + memory (master-data dublikat muammo)
- **Dalil (kod):** Item 60 — `roll_code` ma'noli, lekin **material** darajasidagi KR-sxema yo'q.
- **Nima yetishmaydi:** material artikul sxemasi (KR-125-1400 formati) va uni majburlaydigan generator; sxema egasi-DATA.
- **Bog'liqlik:** EP-WMS-122 (dublikat ogohlantirish), MM master-data, VR-WMS-I10
- **action:** CREATE
- **⤳ Ta'sir:** MM master-data, dublikat oldini olish
- **Xoch-havolalar:** `[Module-10] Item 60` · `EXTRACTION QISM C #10` · `TASDIQ-2146 §10 #10`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-042 · O'lchov birliklari va konvertatsiya (v2 Q11)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — asosiy birlik (kg) + avto-konvertatsiya (kg↔m↔m²) gramaj/kenglik orqali. POS Q36 "har qanday valyuta" narxni qamraydi; birlik konvertatsiya formulasi egasidan.
- **Manba:** v2-A (A-default) + kitob (qog'oz kg↔m²)
- **Dalil (kod):** Item 61 — rulon uchun kg→m konvertatsiya bor (`WmsRollCalc`), lekin **umumiy** kg↔m↔m² servisi yo'q.
- **Nima yetishmaydi:** rulon-dan tashqari materiallar uchun umumiy birlik-konvertatsiya servisi; formulani egasi tasdiqlashi kerak.
- **Bog'liqlik:** EP-WMS-032/034 (rulon o'lchov), EP-WMS-129 (rulon→list), Sotuv narxlash
- **action:** CREATE
- **⤳ Ta'sir:** MES (sarf), Sotuv (narxlash), Finance
- **Xoch-havolalar:** `[Module-10] Item 61` · `EXTRACTION QISM C #11` · `TASDIQ-2146 §10 #11`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-043 · Bir material — bir nechta yetkazib beruvchi (v2 Q12)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — bitta material kartasi, partiya/kirim darajasida yetkazib beruvchi saqlanadi. Kitob Таъминот bir nechta beruvchi bilan ishlaydi.
- **Manba:** kitob (Таъминот, etkazib beruvchilar) + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q (TASDIQ #12 qamrovdan tashqarida). QISM C #12: `material_supplier_ratings` + `batch_lots` → **Ha** (2026-06-27).
- **Nima yetishmaydi:** 2026-07-11 tekshiruvida qayta tasdiqlanmagan; QISM A Step-3 dagi «Supplier TIN `warehouse_stock` da yo'q» P0 bo'shlig'i shu bandga ta'sir qiladi.
- **Bog'liqlik:** EP-WMS-037 (rulon manbasi), EP-WMS-078 (partiya), EP-WMS-094 (reyting)
- **action:** CREATE
- **⤳ Ta'sir:** MM, partiya, v2 Q63 (reyting)
- **Xoch-havolalar:** `EXTRACTION QISM C #12` · `TASDIQ-2146 §10 #12` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-044 · ABC / muhimlik klassifikatsiyasi (v2 Q13)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — ABC avtomatik (yillik sarf×narx). POS Q56 ABC tahlil hisobotda bor; EP-WMS-027 bilan bir.
- **Manba:** BARCHA_JAVOBLAR POS Q56 + kod `wms-catalog` + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #13: `abc_segment` + `abc-xyz.service.ts` → **Ha** (2026-06-27).
- **Nima yetishmaydi:** «yillik sarf × narx» formulasi va uning ABC segmentiga yozilishi 2026-07-11 da qayta tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-027 (dublikat), EP-WMS-131 (sanoq chastotasi)
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya chastotasi, Hisobot
- **Xoch-havolalar:** `EXTRACTION QISM C #13` · `TASDIQ-2146 §10 #13` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-045 · Xavfli/maxsus materiallar belgisi (v2 Q14)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Yonuvchi/Kimyoviy/Maxsus saqlash" bayroqlari + alohida zona. Bo'yoq/kley/eritgich uchun; v2 Q97 bilan. Model egasidan.
- **Manba:** v2-A (A-default) + vizyon (yong'in xavfsizligi)
- **Dalil (kod):** Item 25 (vision-1000 #25) — kirim akti saqlashdan OLDIN xavfli material bayrog'ini tekshirish va «asosiy ombor» zonasiga yo'naltirishni **DB constraint darajasida** bloklash yo'q. QISM C #14: `hazard_zones` bor, lekin material bayrog'i yo'q.
- **Nima yetishmaydi:** material-darajali `is_flammable`/xavf-turi bayrog'i va DB-constraint blok (faqat FE emas, bypass yo'q).
- **Bog'liqlik:** EP-WMS-128 (maxsus saqlash zonasi), EP-WMS-073 (topologiya)
- **action:** CREATE
- **⤳ Ta'sir:** xavfsizlik, alohida zona (v2 Q97)
- **Xoch-havolalar:** `[Module-10] Item 25` *(taxminiy)* · `EXTRACTION QISM A #25` · `EXTRACTION QISM C #14` · `TASDIQ-2146 §10 #14` · `vision-1000 #25`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-046 · Kirim blankasi majburiy maydonlari (v2 Q15)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Sana + Yetkazib beruvchi + Hujjat raqami + Material + Miqdor + Birlik + Partiya + Qabul qiluvchi + Javon. POS Q41-42 harakat akti PDF maydonlari; Q21 EXTERNAL_IN 5-bosqich.
- **Manba:** BARCHA_JAVOBLAR POS Q41-42 + Q21 + v2-A
- **Dalil (kod):** Item 5 (vision-1000 #5) — `mm_goods_receipts` da «manzil majburiy» tasdiqlash-darvozasiga bog'langan NOT NULL zona/lokator ustuni yo'q; manzilsiz aktni tasdiqlashni bloklovchi tekshiruv topilmadi. QISM C #15: `mm_goods_receipts` to'liq ustunlar → **Ha** (2026-06-27).
- **Nima yetishmaydi:** «Javon/manzil» maydonining majburiyligi va uni tekshiradigan darvoza (DRAFT dan chiqishni bloklash) yo'q — vizyon fallback («Nomalum» zona) ni ham taqiqlaydi.
- **Bog'liqlik:** EP-WMS-021/073 (locator), EP-WMS-003 (kirim oqimi), EP-WMS-076
- **action:** CREATE
- **⤳ Ta'sir:** Finance (kreditor), MM (PO solishtirish)
- **Xoch-havolalar:** `[Module-10] Item 5` *(taxminiy)* · `EXTRACTION QISM A #5` · `EXTRACTION QISM C #15` · `TASDIQ-2146 §10 #15` · `vision-1000 #5`
- **⚠️ ZIDDIYAT:** QISM C #15 (2026-06-27) «`mm_goods_receipts` to'liq ustunlar → Ha» ╳ Item 5 (2026-07-11) «manzil-majburiy darvoza yo'q → Yo'q». Farq izohi: ustunlar mavjud, lekin **majburiylik darvozasi** yo'q. Yangi + kod-dalilli manba ustun → vizyon talabi bajarilmagan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-047 · Buyurtma (PO) bilan solishtirish (v2 Q16)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — PO bilan 3-tomonlama solishtirish, farq belgilanadi. ShVB nazorat; tolerans (±2%/±5%/0%) sub-savol egasidan (v2 Q87 bilan).
- **Manba:** v2-A (A-default) + ShVB 3-way + EP-WMS-004
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #16: «PO FK bor, avto match + tolerans yo'q» → Qisman.
- **Nima yetishmaydi:** avtomatik 3-way match; tolerans qiymatlari (vision-1000 #43 esa aniq beradi: 2% avto / 5% boshliq tasdig'i).
- **Bog'liqlik:** EP-WMS-004 (dublikat), EP-WMS-118 (tolerans), EP-WMS-050 (tarozi farqi)
- **action:** CREATE
- **⤳ Ta'sir:** MM, Finance (to'lov), v2 Q87
- **Xoch-havolalar:** `EXTRACTION QISM C #16` · `TASDIQ-2146 §10 #16` · `[Module-10] Item 43` *(bog'liq — tolerans)* · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-048 · Kirimda sifat tekshiruvi (QC) bog'lanishi (v2 Q17)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — avval karantin → QC OK → erkin zonaga. POS Q30 aynan shu; eng xavfsiz.
- **Manba:** BARCHA_JAVOBLAR POS Q30 + Q21 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da bu kod uchun alohida item yo'q (TASDIQ #17 qamrovdan tashqarida), lekin Item 2 (EP-WMS-016) dalili aynan shu darvozani tasdiqlaydi: `wms-quarantine-gate.service.ts:88-106` BLOK, `canPostToMain()` `QC_PASS` bo'lmaguncha MAIN ga yetishni to'sadi.
- **Nima yetishmaydi:** Δ dan oldin **ikkinchi yozuv yo'li** (MM goods-receipt) bu darvozani butunlay chetlab o'tardi — endi yopilgan; REJECTED uchun alohida event yo'li hamon yo'q.
- **Bog'liqlik:** EP-WMS-003, EP-WMS-016, EP-WMS-069..071, EP-WMS-117
- **action:** CREATE
- **⤳ Ta'sir:** QC (kirim inspeksiyasi), MES (faqat OK material)
- **Xoch-havolalar:** `EXTRACTION QISM C #17` · `TASDIQ-2146 §10 #17` · `[Module-10] Item 2` *(bog'liq)*
- **Δ 2026-07-11→08-07:** `ee4ecc26` (2026-08-04) — `execPostGoodsReceiptStock` faqat `receipt.status !== 'received'` bilan darvozalanib to'g'ridan `warehouse_stock` ga yozardi va WMS ning DRAFT→KARANTIN→QC_PASS/REWORK/REJECT→MAIN holat-mashinasini **hech qachon o'qimasdi**: akt DRAFT dan yoki REWORK/REJECT dan keyin ham nol QC bilan zaxiraga tushishi mumkin edi. Endi SERIALIZABLE + `SELECT FOR UPDATE` ichida, WMS ning o'z `normalizeStatus`/`QUARANTINE_STATUS` konstantalari bilan tekshiriladi; faqat `QC_PASS` da davom etadi, aks holda servis 409 `blocked_quarantine` qaytaradi.

### EP-WMS-049 · Qisman qabul (kam/buzuq kelgan tovar) (v2 Q18)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — qabul qilingan/rad etilgan miqdor alohida + rad sababi. ShVB nazorat ruhi mos; model egasidan (v2 Q74 foto bilan).
- **Manba:** v2-A (A-default) + kitob (qisman qabul)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #18: «`qc_passed_items` bor, to'liq model yo'q» → Qisman.
- **Nima yetishmaydi:** qabul/rad miqdorlarini alohida saqlaydigan to'liq model + rad sababi ro'yxati; vision-1000 #43: qolgan miqdor uchun da'vo MM orqali **qo'lda** yuboriladi (avtomatik emas).
- **Bog'liqlik:** EP-WMS-105 (foto-dalil), EP-WMS-118 (tolerans), EP-WMS-106 (qaytarish)
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот (reyting), Finance (faqat qabul uchun to'lov)
- **Xoch-havolalar:** `EXTRACTION QISM C #18` · `TASDIQ-2146 §10 #18` · `[Module-10] Item 43` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `940d8f8c` (2026-07-11) — goods receipt uchun `'conditional'` (shartli qabul) statusi `mm.dto.ts` ga qo'shildi; bu qisman-qabul modelining birinchi bo'g'ini, lekin qabul/rad miqdorlarini ajratmaydi.

### EP-WMS-050 · Kirim tarozi vazni va farq (v2 Q19)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — hujjat vazni + tarozi vazni + farq (kg va %) avtomatik. Qog'oz vazn bo'yicha; tolerans egasidan (v2 Q87).
- **Manba:** v2-A (A-default) + kitob (vazn nazorati)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #19: «`checkWeightTolerance` ±2% bor, blanka alohida emas» → Qisman.
- **Nima yetishmaydi:** hujjat-vazn ╳ tarozi-vazn ikkalasini alohida saqlab, farqni kg va % da ko'rsatadigan blanka; tarozi IoT ulanishi (EP-WMS-034 sub-savoli).
- **Bog'liqlik:** EP-WMS-118 (tolerans), EP-WMS-063 (tarozi sanoq), EP-WMS-047
- **action:** CREATE
- **⤳ Ta'sir:** Finance (pul nazorati), v2 Q87
- **Xoch-havolalar:** `EXTRACTION QISM C #19` · `TASDIQ-2146 §10 #19` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-051 · Kim kirim qila oladi (huquq) (v2 Q20)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — faqat ombor mas'uli/qabul qiluvchi roli. POS Q12 "Faqat o'sha bo'lim xodimlari chiqim qila oladi"; rol ERP dan (Q10).
- **Manba:** BARCHA_JAVOBLAR POS Q12 + Q10 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #20: `rulon-card.controller.ts:41-45` `RolesGuard` → **Ha** (2026-06-27). Memory: `RolesGuard` case-insensitive + fail-closed (Magic-Numbers M8 tekshiruvi).
- **Nima yetishmaydi:** rol tekshiruvi bor, lekin razryad-asosli darajalash (EP-WMS-024/102) yo'q.
- **Bog'liqlik:** EP-WMS-024/102 (razryad), EP-WMS-006 (tasdiqlash)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Rollar, Audit (kim kiritdi)
- **Xoch-havolalar:** `EXTRACTION QISM C #20` · `TASDIQ-2146 §10 #20` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-052 · Chiqim sababi (turlari) (v2 Q21)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — Ishlab chiqarishga / Sotuvga / Brak / Sinov / Qaytarish / Ichki ko'chirish. POS Q21-26 movement turlari aynan shu sabablarni qamraydi (INTERNAL_ISSUE/EXTERNAL_OUT/DAMAGE/RETURN/TRANSFER).
- **Manba:** BARCHA_JAVOBLAR POS Q21-26 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #21: `material_movements` + `wms_transactions` → **Ha** (to'liq sabab ro'yxati).
- **Nima yetishmaydi:** «namuna/probnik» alohida sabab kodi hamon yo'q (EP-WMS-130).
- **Bog'liqlik:** EP-WMS-103 (spisaniye), EP-WMS-130 (namuna), EP-WMS-125 (vtorichka)
- **action:** CREATE
- **⤳ Ta'sir:** MES (sarf), Finance (xarajat), Hisobot
- **Xoch-havolalar:** `EXTRACTION QISM C #21` · `TASDIQ-2146 §10 #21` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `b225479e` (2026-07-11) — favqulodda (rejadan tashqari) chiqim uchun `is_unplanned` bayrog'i + **sabab majburiy** + Telegram push qo'shildi (`pos-movements-unplanned-issue-2026-07-11.sql`, `movement.dto.ts`, `pos-movement.service.ts`), i18n uz/ru/uz-cyr bilan.

### EP-WMS-053 · Ishlab chiqarish buyurtmasiga bog'lash (v2 Q22)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — chiqim ishlab chiqarish buyurtmasiga majburiy bog'lanadi. POS Q58 to'liq MES integratsiya; kitob "техкарта мослиги" (v2 Q53).
- **Manba:** BARCHA_JAVOBLAR POS Q58 + kitob (texkarta) + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #22: `goods-issue.handler.ts:35,85-90` — `ppId` majburiy → **Ha**.
- **Nima yetishmaydi:** bog'lanish majburiy, lekin norma bilan solishtirish (EP-WMS-054/104) hamon Yo'q.
- **Bog'liqlik:** EP-WMS-084 (texkarta moslik), EP-WMS-054/104 (norma), EP-WMS-100 (rezerv)
- **action:** EVENT
- **⤳ Ta'sir:** MES (BOM/sarf), Finance (buyurtma tannarxi)
- **Xoch-havolalar:** `EXTRACTION QISM C #22` · `TASDIQ-2146 §10 #22` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `f318bbfe` (2026-08-07, T13a) — planshet `POST /iot/production-sessions/:id/start` (FE chaqiradigan **yagona** start yo'li) material-akt imzo-darvozasini umuman chaqirmasdi (darvoza `POST /mes/sessions/:id/start` da yashardi, uni hech bir sahifa chaqirmaydi); endi planshet marshruti ham sessiyaning ishlab-chiqarish buyurtmasiga tegishli komplektlarni tekshiradi va tasdiqlanmagani bo'lsa 422 BLOCKED qaytaradi (komplekt umuman bo'lmasa — o'tkazadi, NULL-pass naqshi).

### EP-WMS-054 · Norma bilan solishtirish (rejadagi sarf) (v2 Q23)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — norma vs haqiqiy farq foizda, ortiqcha bo'lsa ogohlantirish. Kitob texkarta normasi mavjud; chegara egasidan (v2 Q73 bilan).
- **Manba:** v2-A (A-default) + kitob (texkarta norma)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #23: «texkarta gate bor, og'ish % yo'q» → Qisman. Uning EP-WMS-104 dublikati (Item 88) esa **Yo'q**: `material_norms` bor, taqqoslovchi reader yo'q.
- **Nima yetishmaydi:** norma/fakt og'ishini hisoblovchi reader va chegara-signali; chegara `business_settings` CRUD ga qo'yilishi kerak.
- **Bog'liqlik:** EP-WMS-104 (dublikat), EP-WMS-089 (chiqindi), MES
- **action:** CREATE
- **⤳ Ta'sir:** MES (sarf normasi), QC (chiqindi sababi), v2 Q73
- **Xoch-havolalar:** `EXTRACTION QISM C #23` · `TASDIQ-2146 §10 #23` · `[Module-10] Item 88` *(dublikat kod EP-WMS-104)*
- **Δ 2026-07-11→08-07:** —

### EP-WMS-055 · Chiqimda FIFO/FEFO qoidasi (v2 Q24)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — FIFO standart, kley/bo'yoqqa FEFO. POS Q37 aynan: muddatli → FEFO, muddatsiz → FIFO.
- **Manba:** BARCHA_JAVOBLAR POS Q37 + v2-A
- **Dalil (kod):** Item 3 — `batch-selection.service.ts` to'liq o'qilgan: real FIFO/FEFO `order()` metodi `receivedAt` (FIFO) yoki `expiryDate` (FEFO) bo'yicha saralaydi; `resolveStrategy()` partiyada muddat bo'lsa FEFO ni avtomatik tanlaydi (sof domen servisi, unit-test qilinadigan).
- **Nima yetishmaydi:** faqat QC-dan o'tgan («erkin») partiyalar bu selektorga tushishi mustaqil tasdiqlanmagan — QC-darvoza va partiya-tanlash alohida servislar, ular bitta o'tishda «erkin emas» filtri bilan birlashtirilgani tekshirilmagan.
- **Bog'liqlik:** EP-WMS-016/048 (QC darvoza), EP-WMS-018/079 (muddat), EP-WMS-110 (FIFO narx)
- **action:** CREATE
- **⤳ Ta'sir:** QC (muddati o'tgan brak), partiya
- **Xoch-havolalar:** `[Module-10] Item 3` *(taxminiy)* · `EXTRACTION QISM A #3` · `EXTRACTION QISM C #24` · `TASDIQ-2146 §10 #24` · `vision-1000 #3`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-056 · Manfiy qoldiqdan himoya (v2 Q25)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — POS Q38 aniq: Aktivlar → TO'LIQ BLOK; iste'mol materiallar → OGOHLANTIRISH + ruxsat.
- **Manba:** BARCHA_JAVOBLAR POS Q38 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #25: `batch-selection.service.ts:150-154` manfiy BLOK → **Ha**. Ammo QISM A Step-3 zid: «Minus saldo BLOK mexanizmi (`INSUFFICIENT_STOCK`) yo'q» (VISION-3340:774 SB0543, **P0**).
- **Nima yetishmaydi:** aktivlar ╳ iste'mol materiallar ajratimi (to'liq blok ╳ ogohlantirish+ruxsat) kodda tasdiqlanmagan — bitta qattiq blok bor.
- **Bog'liqlik:** EP-WMS-001 (kanonik zaxira), EP-WMS-117 (brak blok), EP-WMS-100 (rezerv)
- **action:** CREATE
- **⤳ Ta'sir:** Aniq hisob, MES, Finance
- **Xoch-havolalar:** `EXTRACTION QISM C #25` · `TASDIQ-2146 §10 #25` · `EXTRACTION QISM A Step-3 (SB0543 P0)` · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** QISM C #25 «manfiy BLOK → Ha» ╳ QISM A Step-3 «Minus saldo BLOK mexanizmi yo'q (P0)». Ikkalasi ham 2026-06-08/06-27 sanali. Farq izohi: blok **partiya-tanlash** yo'lida bor (`batch-selection`), lekin barcha yozuv yo'llarida (`adjustStock`, MM goods-receipt) emas — `1753ed0d` aynan shunday jim no-op yo'lni topgan.
- **Δ 2026-07-11→08-07:** `1753ed0d` (2026-08-04) — `adjustStock()` («qo'lda zaxira tuzatish») ilgari **faqat ledger qatorini yozardi va `warehouse_stock` ga umuman tegmasdi** — real zaxira ustida jim no-op edi; endi `setCanonicalBalance()` orqali avval `warehouse_stock` ga yozadi. Bu manfiy-saldo himoyasining chetlab o'tiladigan yo'lini yopdi.

### EP-WMS-057 · Chiqimni tasdiqlash (ikki imzo) (v2 Q26)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — belgilangan summadan yuqori chiqim rahbar tasdig'i. POS Q22 EXTERNAL_OUT = ombor menejer + moliya + AI; Q23 INTERNAL_ISSUE = menejer 1 imzo. Chegara sub-savol (A-toifa/summa) v2 Q101.
- **Manba:** BARCHA_JAVOBLAR POS Q22-23 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #26: «rol + audit bor, ikki-imzo yo'q» → Qisman. Item 8 (vision-1000 #8) ham summaga qarab darajali matritsani **Yo'q** deb topgan.
- **Nima yetishmaydi:** summa-chegarali darajalash (chegara qiymatlari `business_settings` CRUD ga); AI 5-bosqichi (POS Q22).
- **Bog'liqlik:** EP-WMS-006 (ruxsat), EP-WMS-132 (blanka+ikki imzo), EP-WMS-102
- **action:** APPROVE
- **⤳ Ta'sir:** nazorat, Finance, v2 Q101
- **Xoch-havolalar:** `EXTRACTION QISM C #26` · `TASDIQ-2146 §10 #26` · `[Module-10] Item 8` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `f318bbfe` (2026-08-07, T13b) — **haqiqiy ikki-imzo ilk marta majburlandi**: `PATCH /warehouse/material-kits/:id/status` ilgari istalgan erkin-matn statusni qabul qilardi va `confirmed_by` ni hech qachon yozmasdi — bitta shaxs to'g'ridan `'confirmed'` ga o'tkaza olardi. Endi status `material_kits_status_chk` lug'ati bilan cheklangan, har bosqich o'z aktyorini shtamplaydi (`prepared_by`/`delivered_by`/`confirmed_by` + timestamp), va **`'confirmed'` tayyorlovchining o'z komplektini tasdiqlashini rad etadi**. Jonli kodda tasdiqlandi: `wms-barcode.controller.ts:213-231` (`prepared_by` o'qiladi, `preparedBy === userId` bo'lsa xato). FE tomonda `WarehouseDailyView` tugmalari DB CHECK taqiqlagan `'preparing'`/`'ready'` qiymatlarini yuborardi va Confirm tugmasi umuman yo'q edi → zanjir endi `pending→prepared→delivered→confirmed`.

### EP-WMS-058 · Inventarizatsiya turi va chastotasi (v2 Q27)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — aylanma sanoq (A-toifa tez-tez) + yiliga 1 to'liq. POS Q52 "tunda/dam olishda, ish to'xtatilmaydi"; ABC chastota (v2 Q100).
- **Manba:** BARCHA_JAVOBLAR POS Q52 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #27: «`inventory_counts` CRUD bor, chastota avto yo'q» → Qisman. Item 115 (EP-WMS-131) esa ABC-chastota CRON ning endi mavjudligini va ishlaganini aniqlagan (STALE-DOC).
- **Nima yetishmaydi:** aylanma ╳ to'liq rejimni ajratuvchi tur-maydoni va yillik to'liq sanoq rejasi.
- **Bog'liqlik:** EP-WMS-007 (v1), EP-WMS-131 (ABC chastota), EP-WMS-062 (freeze), VR-WMS-I12
- **action:** CREATE
- **⤳ Ta'sir:** Finance (zaxira tasdig'i), ABC
- **Xoch-havolalar:** `EXTRACTION QISM C #27` · `TASDIQ-2146 §10 #27` · `[Module-10] Item 115` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** `decisions/` A-varianti «A-toifa tez-tez» deydi ╳ **I2-intervyu #31** egasi aniqroq: «rulon/hom-ashyo **haftalik**, qolgani **oylik**; tunda/dam kuni, zona muzlatiladi». Ya'ni chastota ABC bo'yicha emas, **material toifasi** bo'yicha — EP-WMS-131 (ABC-chastota) bilan potentsial zid. Egasi tanlovi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-059 · Sanoq usuli (ko'r sanoq) (v2 Q28)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ko'r sanoq (raqam yashirin). Halol natija; usul egasidan.
- **Manba:** v2-A (A-default) + ShVB (halol inventarizatsiya)
- **Dalil (kod):** Item 120 — `blind.?count|ko'?r.?sanoq|blindCount` (katta-kichik harfsiz) grep butun `apps/api/src` bo'ylab **nol moslik** qaytardi, jadvaldagi «grep=0» da'vosini tasdiqladi.
- **Nima yetishmaydi:** «ko'r rejim» (tizim kutgan miqdorni sanoqchidan yashirish) mavjud `wms-counts` moduliga qo'shilishi kerak; vision-1000 #19: ±1% dan oshsa **2-sanoqchi majburiy**, ikkinchisi ham oshsa ombor boshlig'i qarori (avtomatik 3-sanoq YO'Q) — bu ham qurilmagan.
- **Bog'liqlik:** EP-WMS-007/058 (inventarizatsiya), EP-WMS-060 (og'ish chegarasi), EP-WMS-008
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya aniqligi (GSD), audit
- **Xoch-havolalar:** `[Module-10] Item 120` · `[Module-10] Item 19` *(taxminiy — 2-sanoqchi)* · `EXTRACTION QISM C #28/#120` · `TASDIQ-2146 §10 #120` · `vision-1000 #19`
- **⚠️ ZIDDIYAT:** `decisions/` «usul egasidan» (🔵 OCHIQ) ╳ vision-1000 #19 egasi allaqachon to'liq usulni bergan (±1% → 2-sanoqchi majburiy → rahbar qarori, avto 3-sanoq yo'q). Qaror amalda javoblangan; `decisions/` yangilanmagan. Item 120 esa egasidan faqat **UX** qarorini so'raydi (ko'r-sanoq har sessiyada ixtiyoriymi / hamma tsiklik sanoqda majburiymi / faqat A-segmentdami).
- **Δ 2026-07-11→08-07:** —

### EP-WMS-060 · Og'ish (farq) chegarasi va tasdiqlash (v2 Q29)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ±1% gacha avto-tuzatish, undan yuqori rahbar tasdig'i + sabab. POS Q53 moliya tasdiqlaydi; aniq % egasidan.
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q53 (moliya tasdiq)
- **Dalil (kod):** Item 119 (TASDIQ #119 «v1 008/060») — «GSD formula + variance bor, gating oqim tasdiqlanmadi» → Qisman. QISM C #29: «variance saqlanadi, avto-tuzatish yo'q».
- **Nima yetishmaydi:** ±1% avto-tuzatish; undan yuqorida rahbar+moliya gating; sabab majburiyligi (EP-WMS-061).
- **Bog'liqlik:** EP-WMS-008 (aniqlik%), EP-WMS-009 (kim tasdiqlaydi), EP-WMS-061 (sabab), EP-WMS-111
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (zarar/foyda), v2 Q80
- **Xoch-havolalar:** `[Module-10] Item 119` · `EXTRACTION QISM C #29/#119` · `TASDIQ-2146 §10 #119` · `vision-1000 #19` *(±1% chegarasi)*
- **⚠️ ZIDDIYAT:** `decisions/` «aniq % egasidan» ╳ vision-1000 #19 ham, v2-A ham **±1%** ni nomlaydi. Chegara amalda kelishilgan — `business_settings` CRUD ga default `1.0` bilan qo'yilishi kerak (memory: threshold = doim CRUD).
- **Δ 2026-07-11→08-07:** —

### EP-WMS-061 · Og'ish sababi ro'yxati (v2 Q30)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — sabab majburiy ro'yxatdan (o'lchov xatosi / o'g'irlik / namlik / chiqindi yozilmagan / hujjat xatosi). Takror sabab tahlili; ro'yxat egasidan.
- **Manba:** v2-A (A-default)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #30: «`variance-reason` enum yo'q» → **Yo'q** (2026-06-27), QISM C Step-3 da ham ochiq savol sifatida qayd etilgan.
- **Nima yetishmaydi:** sabab enum/lug'at jadvali va uning majburiyligi; takror-sabab tahlili hisoboti.
- **Bog'liqlik:** EP-WMS-060 (og'ish), EP-WMS-111 (mas'ul), EP-WMS-009
- **action:** CREATE
- **⤳ Ta'sir:** QC/Audit (takror sabab tahlili)
- **Xoch-havolalar:** `EXTRACTION QISM C #30` · `TASDIQ-2146 §10 #30` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-062 · Inventarizatsiya vaqtida harakatni muzlatish (v2 Q31)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — sanalayotgan zona muzlatiladi, tugagach ochiladi. POS Q52 ish to'xtatilmaydi (zona-darajali muzlatish mos); model egasidan.
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q52
- **Dalil (kod):** Item 121 — jadval «Yo'q, grep=0; freeze yo'q» deydi, **jonli kod esa buni rad etadi**: `inventory-freeze.service.ts` to'liq o'qilgan — `checkExitAllowed(warehouseId, materialId)` `IInventoryFreezeRepo.findActiveFreeze()` ni so'raydi va aktiv muzlatish bo'lsa `blockCode: 'BLOCK_ZONE_FROZEN'` qaytaradi. O'lik kod EMAS: `goods-issue.handler.ts:93-98` da `private readonly freeze: InventoryFreezeService` inject qilingan va har chiqimdan oldin **qattiq darvoza** sifatida chaqiriladi. To'liq CRUD ham bor (`freezeZone`, `releaseZone`, `listFreezes`).
- **Nima yetishmaydi:** qurilish bo'yicha yetishmayotgani yo'q; vision-1000 #16 (muzlatilgan zonadan MES so'rovi **kutish navbatiga** tushishi va muzlatish tugagach avto-qayta urinishi) — bu qismi Item 16 bo'yicha «Ha» deb baholangan. **Qaror** darajasida esa vision-1000 #45 (PP rezervi muzlatishdan USTUN) hamon Yo'q.
- **Bog'liqlik:** EP-WMS-007/058 (inventarizatsiya), EP-WMS-100 (PP rezerv), EP-WMS-025 (MES)
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya aniqligi, MES
- **Xoch-havolalar:** `[Module-10] Item 121` · `[Module-10] Item 16` *(taxminiy)* · `[Module-10] Item 45` *(taxminiy — PP ustunligi)* · `EXTRACTION QISM C #31/#121` · `TASDIQ-2146 §10 #121` · `vision-1000 #16/#45`
- **⚠️ ZIDDIYAT:** QISM C #31 va #121 (2026-06-27) «freeze mexanizm yo'q, grep=0» ╳ Item 121 (2026-07-11) «to'liq qurilgan va hard-gate sifatida ulangan». Yangi + kod-o'qilgan manba ustun → **STALE-DOC**. Item 121 ning o'zi ham ogohlantiradi: Step-3 dagi «zona/material muzlatish … freeze mexanizm yo'q (EP-WMS-062)» ochiq-savol qatori endi eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-063 · Tarozi bilan rulon sanog'i (v2 Q32)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — ochilgan rulonlar tortiladi, to'liq rulonlar kartochka vazni bo'yicha. Balansli; usul egasidan.
- **Manba:** v2-A (A-default) + kitob (tarozi)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #32: «`updateWeight` bor, ajratuvchi sanoq yo'q» → Qisman.
- **Nima yetishmaydi:** sanoq paytida «ochilgan → tortiladi / to'liq → kartochka vazni» ajratuvchi mantiq; usul egasi tasdig'ini kutadi.
- **Bog'liqlik:** EP-WMS-035 (ochilgan status), EP-WMS-034 (o'lchash usuli), EP-WMS-007
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya aniqligi, rulon qoldiq
- **Xoch-havolalar:** `EXTRACTION QISM C #32` · `TASDIQ-2146 §10 #32` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-064 · Minimal qoldiq (signal nuqtasi) (v2 Q33)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — har materialga min qoldiq + tushganda avto-ogohlantirish. Qisman bor (`low_stock_alerts`); to'liq model egasidan (EP-WMS-010 bilan).
- **Manba:** v2-A (A-default) + mavjud `low_stock_alerts`
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #33: `min_stock_alerts` + `get-low-stock.handler.ts` → **Ha** (2026-06-27).
- **Nima yetishmaydi:** min qiymatlar egasi-DATA (har materialga); ogohlantirish marshruti (EP-WMS-011) tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-010 (v1), EP-WMS-011 (kimga), EP-WMS-065/066/067
- **action:** CREATE
- **⤳ Ta'sir:** MM (avto-zayavka), MES (uzilish oldi)
- **Xoch-havolalar:** `EXTRACTION QISM C #33` · `TASDIQ-2146 §10 #33` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-065 · Reorder (qayta buyurtma) nuqtasi va miqdori (v2 Q34)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — reorder nuqtasi + tavsiya miqdor (sarf tezligi × lead time). Aqlli; formula egasidan (v2 Q37/Q83 bilan).
- **Manba:** v2-A (A-default)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #34: «rop/eoq servis bor, lead-time DATA yo'q» → Qisman. QISM A Step-3: «MRP parametrlar (safety-stock/lead-time/lot-sizing) DB da emas, **IN-MEMORY**» (`run-mrp.handler` command input, VISION-3340:373 SB0278).
- **Nima yetishmaydi:** MRP parametrlarini DB da saqlash; lead-time DATA (egasi); vision-1000 #39: lead-time o'zgarsa reorder **event-driven** darhol qayta hisoblanadi + PR loyihasi AVTO — bu Item 39 bo'yicha Yo'q.
- **Bog'liqlik:** EP-WMS-068 (lead time), EP-WMS-114 (min partiya), EP-WMS-012 (avto PR), EP-WMS-120
- **action:** CREATE
- **⤳ Ta'sir:** MM (avto-zayavka loyihasi), v2 Q37/Q83
- **Xoch-havolalar:** `EXTRACTION QISM C #34` · `TASDIQ-2146 §10 #34` · `[Module-10] Item 39` *(bog'liq)* · `EXTRACTION QISM A Step-3 (SB0278)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-066 · Maksimal qoldiq (ortiqcha zaxira) (v2 Q35)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — max qoldiq + oshganda ogohlantirish. Muzlatilgan kapital/joy nazorati; qiymat egasidan.
- **Manba:** v2-A (A-default) + ShVB (muzlatilgan kapital)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #35: «`max_stock` bor, trigger tasdiqlanmadi» → Qisman.
- **Nima yetishmaydi:** max oshganda ogohlantirish triggeri; qiymatlar egasi-DATA (`business_settings`/master-data CRUD).
- **Bog'liqlik:** EP-WMS-010, EP-WMS-115 (turnover), EP-WMS-116 (zona to'lganlik)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (muzlatilgan kapital)
- **Xoch-havolalar:** `EXTRACTION QISM C #35` · `TASDIQ-2146 §10 #35` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-067 · Mavsumiy / dinamik min-max (v2 Q36)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — dinamik (oxirgi 3-6 oy sarfiga avto-qayta hisob). Karton mavsumiy; AI/avto model egasidan.
- **Manba:** v2-A (A-default)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #36: «statik formula bor, dinamik yo'q» → **Yo'q** (2026-06-27); QISM C Step-3 da ochiq savol.
- **Nima yetishmaydi:** 3-6 oylik sarfga qarab min/max ni qayta hisoblaydigan CRON; model egasidan.
- **Bog'liqlik:** EP-WMS-064/065/066, EP-WMS-108 (prognoz), AI moduli
- **action:** CRON
- **⤳ Ta'sir:** MM, AI (prognoz)
- **Xoch-havolalar:** `EXTRACTION QISM C #36` · `TASDIQ-2146 §10 #36` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-068 · Yetkazib berish muddati (lead time) hisobi (v2 Q37)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har beruvchiga lead time + xavfsizlik zaxirasi reorder hisobida. Kitob Таъминот import lead-time uzun; model egasidan (v2 Q62 import bilan).
- **Manba:** v2-A (A-default) + kitob (Таъминот, import muddati)
- **Dalil (kod):** Item 39 (vision-1000 #39) — lead time o'zgarganda reorder nuqtasini **event-driven** darhol qayta hisoblash va (natija reorder nuqtasidan past bo'lsa) PR loyihasini AVTO yaratish yo'q. QISM C #37: «formula bor, DATA kiritilmagan» → **egasi-data**.
- **Nima yetishmaydi:** lead-time qiymatlari egasi-DATA; event-driven qayta-hisob va avto-PR-loyiha qurilmagan; MRP parametrlar IN-MEMORY.
- **Bog'liqlik:** EP-WMS-065 (reorder), EP-WMS-093 (import lead-time), EP-WMS-012 (avto PR), EP-WMS-114
- **action:** CREATE
- **⤳ Ta'sir:** MM (beruvchi muddati), v2 Q62
- **Xoch-havolalar:** `[Module-10] Item 39` *(taxminiy)* · `EXTRACTION QISM A #39` · `EXTRACTION QISM C #37` · `TASDIQ-2146 §10 #37` · `vision-1000 #39`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-069 · Karantin sabablari ro'yxati (v2 Q38)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Sifat kutilmoqda / Brak shubhasi / Namlik / Reklamatsiya / Muddat o'tgan / Hujjat yo'q. POS Q30 karantin + Q31 QC qaror oqimini qamraydi.
- **Manba:** BARCHA_JAVOBLAR POS Q30-31 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #38: `wms-quarantine.constants.ts:53-77` — sabab holat-mashinasi → **Ha**.
- **Nima yetishmaydi:** olti sababning hammasi lug'atda borligi 2026-07-11 da qayta sanalmagan.
- **Bog'liqlik:** EP-WMS-016, EP-WMS-070/071/072, EP-WMS-091 (grammaj → karantin)
- **action:** CREATE
- **⤳ Ta'sir:** QC (qaror), MES (karantin berilmaydi)
- **Xoch-havolalar:** `EXTRACTION QISM C #38` · `TASDIQ-2146 §10 #38` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-070 · Karantindan chiqarish (kim va qanday) (v2 Q39)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — faqat sifat nazorati roli qaror bilan (OK/Brak/Qaytarish). POS Q31 aynan QC 3-qaror.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #39: `wms-quarantine-gate.service.ts:56-71` `applyQcDecision` → **Ha**.
- **Nima yetishmaydi:** «faqat QC roli» cheklovi RolesGuard darajasida tasdiqlanmagan (rol matritsasi EP-WMS-051/102 bilan bog'liq).
- **Bog'liqlik:** EP-WMS-017 (v1 dublikat), EP-WMS-071, EP-WMS-106
- **action:** APPROVE
- **⤳ Ta'sir:** QC (yakuniy qaror)
- **Xoch-havolalar:** `EXTRACTION QISM C #39` · `TASDIQ-2146 §10 #39` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-071 · Karantin natijasi (qaror variantlari) (v2 Q40)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — OK→erkin / Past→arzon ishga / Brak→chiqindi / Qaytarish→beruvchiga. POS Q31 (QABUL/REWORK/CHIQARISH) + Q26 DAMAGE→QC.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + Q26 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #40: «3 yo'l REAL, past→arzon yo'q» → Qisman.
- **Nima yetishmaydi:** 4-yo'l — «past sifat → arzon ishga» (makulatura/местный yo'nalishi, EP-WMS-090 bilan bog'liq) yo'q.
- **Bog'liqlik:** EP-WMS-070, EP-WMS-090 (makulatura), EP-WMS-106 (qaytarish), EP-WMS-103
- **action:** CREATE
- **⤳ Ta'sir:** Finance (qaytarish→kredit), Таъминот (reklamatsiya)
- **Xoch-havolalar:** `EXTRACTION QISM C #40` · `TASDIQ-2146 §10 #40` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-072 · Karantinda turish muddati (v2 Q41)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — belgilangan kundan oshsa rahbarga ogohlantirish. Unutilgan karantin oldini oladi; muddat egasidan.
- **Manba:** v2-A (A-default)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #41: «max-muddat trigger yo'q; muddat egasi-DATA» → **Yo'q** (2026-06-27), QISM C Step-3 da ochiq savol.
- **Nima yetishmaydi:** Δ dan keyin muddat-eskalatsiya JONLI va CRUD-sozlanadigan — bu band aslida qurilgan; «rahbarga» marshruti (kimga) hamon tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-016 (karantin), EP-WMS-011 (ogohlantirish), Notif/CC
- **action:** CRON
- **⤳ Ta'sir:** karantin zona, muzlatilgan pul
- **Xoch-havolalar:** `EXTRACTION QISM C #41` · `TASDIQ-2146 §10 #41` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `4d7422fc` (2026-08-06) — `quarantine-workflow.repository.ts` `escalateExpiredQuarantine()` ichida `INTERVAL '48 hours'` raw-SQL literal edi; endi `business_settings` `'pos.quarantine_escalation_hours'` (default 48) dan o'qiladi, parametrlangan interval bilan (SQL-injection xavfsiz), jonli DB da tasdiqlangan. `9ea7c155` (2026-08-07, T23A) — cron **ikkita** eskalatsiya yo'lini yuritardi, biri CRUD kalitni, ikkinchisi hardcoded 48 ni o'qirdi (egasi qiymatni o'zgartirsa desync); ikkalasi endi bir kalitni o'qiydi. Ya'ni «muddat egasidan» talabi endi chatda so'ralmaydi — CRUD orqali sozlanadi.

### EP-WMS-073 · Ombor topologiyasi (zona/qator/javon) (v2 Q42)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Zona → Qator → Javon → Yacheyka (A-12-3-2). POS Q33 hozir freeform; to'liq struktura keyingi bosqich, egasi tanlovi (freeform╳struktura).
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q33 (freeform = hozirgi)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #42: `warehouse_zones` + `warehouse_bins` → **Ha**; Item 5 dalili ham `information_schema.tables` bo'yicha ikkala jadval mavjudligini tasdiqlaydi (count=2).
- **Nima yetishmaydi:** 4-daraja (Zona→Qator→Javon→Yacheyka) ierarxiyasi to'liq modellashtirilganmi — 2 jadval bilan 4 daraja tasdiqlanmagan; freeform╳struktura yakuniy tanlovi egasidan.
- **Bog'liqlik:** EP-WMS-021 (v1 locator), EP-WMS-076 (sig'im), EP-WMS-116, EP-WMS-134
- **action:** CREATE
- **⤳ Ta'sir:** Chiqim ("qaysi javondan"), v2 Q45/Q103
- **Xoch-havolalar:** `EXTRACTION QISM C #42` · `TASDIQ-2146 §10 #42` · `[Module-10] Item 5` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** EP-WMS-021 (POS Q33, **freeform** = tasdiqlangan realizatsiya) ╳ EP-WMS-073 (**strukturaviy** 4 daraja, 🔵 ochiq). Kod strukturaviy yo'ldan ketgan (`warehouse_zones`+`warehouse_bins` jonli). Ikki band bir-biriga zid qaror beradi — egasi yakuniy imzosi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-074 · Ichki ko'chirish blankasi (v2 Q43)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — ko'chirish harakati (manba + maqsad + miqdor + xodim + sana). POS Q25 INTERNAL_TRANSFER harakat turi; Q6 to'liq audit.
- **Manba:** BARCHA_JAVOBLAR POS Q25 + Q6 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #43: `wms-counts.dto.ts:17-23` + audit → **Ha** (internal request).
- **Nima yetishmaydi:** blanka chop etish (EP-WMS-132) va ikki imzo qismi alohida bandda Qisman.
- **Bog'liqlik:** EP-WMS-005 (v1 ko'chirish), EP-WMS-134 (ko'chirish izi), EP-WMS-132
- **action:** CREATE
- **⤳ Ta'sir:** locator, audit, v2 Q103
- **Xoch-havolalar:** `EXTRACTION QISM C #43` · `TASDIQ-2146 §10 #43` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-075 · Bir nechta ombor / filial (v2 Q44)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi) *(2026-08-07 Δ)*
- **Talab:** A — har ombor alohida, ombor-aro ko'chirish harakat sifatida. POS Q29 ko'p ombor turi (PRODUCTION_*, DEPARTMENT_* 30+); Q32 faqat doimiy omborlar.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + Q32 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #44: `warehouses` **12 qator** jonli; from/to warehouse internal-request → **Ha**. `993c5175` commit-tanasi (2026-08-06): «bugun 19/19 ombor `deleted_at IS NULL` + `is_active=true`».
- **Nima yetishmaydi:** audit tavsiya qilgan «22 dublikat DEPT-* omborni `is_active=false` qilish» amali hali bajarilmagan (`993c5175` tanasi).
- **Bog'liqlik:** EP-WMS-002 (ombor turlari), EP-WMS-005/134 (ko'chirish), Qoida 22
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (ombor bo'yicha qoldiq)
- **Xoch-havolalar:** `EXTRACTION QISM C #44` · `TASDIQ-2146 §10 #44` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `993c5175` (2026-08-06) — WMS va POS ombor-ro'yxati predikatlari nomuvofiq edi (WMS faqat `deleted_at IS NULL`, POS faqat `is_active=true`) → ikki ekran turlicha son ko'rsatishi mumkin edi; ikkalasi endi bir xil. Bonus: `get-warehouses.handler.ts` da **copy-paste xato** topildi — `isActive` filtri `warehouses.isFreeStorage` ustuniga solishtirilardi, ya'ni aniq `isActive` so'rovi jimgina noto'g'ri ustunni filtrlardi; `is_active` SELECT ro'yxatiga ham qo'shildi (jonli kodda tasdiqlandi: `get-warehouses.handler.ts:29-41,53`). `63ab63b0` (2026-08-05) — `warehouse-config.service.ts` ning 4 ta ro'yxat-so'rovi ham tekislandi. `9911a5d8` (2026-08-07) — gateway ro'yxati `is_active` ni e'tiborsiz qoldirardi.

### EP-WMS-076 · Yacheyka sig'imi va band/bo'sh holati (v2 Q45)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — sig'im + band/bo'sh + avto-joy taklifi. Tartibli ombor; model egasidan (v2 Q85 to'lganlik% bilan).
- **Manba:** v2-A (A-default)
- **Dalil (kod):** Item 40 (vision-1000 #40) — `bin_location_id` ustuni bor (VISION-3340:762 SB0531), lekin sig'im yetmasa bo'sh yacheykani avtomatik taklif qilish algoritmi yo'q. QISM C #45: «`max_weight`/`occupancy` bor, algoritm yo'q».
- **Nima yetishmaydi:** avto-joy taklif algoritmi (sig'im + toifa mos); mos yacheyka topilmasa ko'chirishni bloklash; omborchi tanlagan joyning sig'im tekshiruvidan o'tishi.
- **Bog'liqlik:** EP-WMS-073 (topologiya), EP-WMS-116 (to'lganlik%), EP-WMS-046 (manzil majburiy)
- **action:** CREATE
- **⤳ Ta'sir:** kirim joy taklifi, v2 Q85
- **Xoch-havolalar:** `[Module-10] Item 40` *(taxminiy)* · `EXTRACTION QISM A #40` · `EXTRACTION QISM C #45` · `TASDIQ-2146 §10 #45` · `vision-1000 #40`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-077 · Tayyor mahsulot zonasi alohida (v2 Q46)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — tayyor mahsulot ombori alohida, sotuvga shu yerdan. POS Q29 FINISHED_GOODS alohida tur; Q22 EXTERNAL_OUT faqat tayyor mahsulot ombori.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + Q22 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #46: `receive-fg.handler.ts` → **Ha**. Memory `project_batch3_fg_stock_split_complete`: `warehouse_stock_fg` + `fg_scrap_log` yaratildi, 3 FG-yozuvchi qayta yo'naltirildi, kontaminatsiya-himoyasi qo'yildi.
- **Nima yetishmaydi:** «EXTERNAL_OUT faqat FG omboridan» cheklovi kodda majburlanganini tasdiqlovchi item yo'q.
- **Bog'liqlik:** EP-WMS-026 (FG qabuli), EP-WMS-097 (jo'natish), EP-WMS-123 (mijoz moli)
- **action:** CREATE
- **⤳ Ta'sir:** Sotuv (FG rezerv), MES (FG topshirish)
- **Xoch-havolalar:** `EXTRACTION QISM C #46` · `TASDIQ-2146 §10 #46` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-078 · Partiya (batch) raqami (v2 Q47)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — har kirim = partiya, chiqim partiyaga bog'lanadi (oldinga/orqaga izlash). POS Q15 Code-128 partiya uchun; Q40 inventar pasporti EXTERNAL_IN da.
- **Manba:** BARCHA_JAVOBLAR POS Q15 + Q40 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #47: `goods-issue.handler` `decrementBatchLot` → **Ha** (batch bog'lanish).
- **Nima yetishmaydi:** «oldinga/orqaga izlash» (traceability) so'rovi/ekrani sifatida tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-080 (partiya sifati), EP-WMS-081 (aralashtirish), EP-WMS-055 (FIFO)
- **action:** CREATE
- **⤳ Ta'sir:** QC (reklamatsiya izlash), MES (qaysi partiya qaysi buyurtma)
- **Xoch-havolalar:** `EXTRACTION QISM C #47` · `TASDIQ-2146 §10 #47` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-079 · Yaroqlilik muddati (kley/bo'yoq/kimyo) (v2 Q48)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — yaroqlilik sanasi + N kun oldin ogohlantirish + o'tganda bloklash. POS Q37 FEFO muddatli materialga. Ogohlantirish kuni (30/15/7) sub-savol egasidan.
- **Manba:** BARCHA_JAVOBLAR POS Q37 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #48: `batch-selection.service.ts:116-131` FEFO **BLOK** → **Ha**. Item 13 (vision-1000 #13) esa «chegaraga yaqin ogohlantirish» qismini Qisman deb topgan.
- **Nima yetishmaydi:** N kun oldin ogohlantirish (30/15/7) — chegara qiymatlari `business_settings` CRUD ga qo'yilishi kerak; blok qismi real.
- **Bog'liqlik:** EP-WMS-018 (v1 FEFO), EP-WMS-055, EP-WMS-126 (yosh signali)
- **action:** CREATE
- **⤳ Ta'sir:** QC, Chiqim (muddati o'tgan bloklanadi)
- **Xoch-havolalar:** `EXTRACTION QISM C #48` · `TASDIQ-2146 §10 #48` · `[Module-10] Item 13` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **⚠️ ZIDDIYAT:** `decisions/` faylining o'z sarlavhasida (§13-qator) «KONFLIKT belgilangan: EP-WMS-079/EP-WMS-110 (narxlash)» deyilgan, lekin EP-WMS-079 aslida **yaroqlilik muddati** bandi, narxlash EMAS. Narxlash konflikti faqat EP-WMS-110 ga tegishli. Bu `decisions/` sarlavhasidagi **kod-xatosi** (ehtimol v2 Q79 ↔ EP-WMS-110 aralashuvi: v2 Q79 = EP-WMS-110). III QISM §3 da qayd etilgan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-080 · Partiya bo'yicha sifat ko'rsatkichi (v2 Q49)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — partiyaga QC natijalari (gramaj/namlik/mustahkamlik) biriktiriladi. Kitob grammaj/sifat kalit; partiya pasporti modeli egasidan.
- **Manba:** v2-A (A-default) + kitob (грамаж, сифат)
- **Dalil (kod):** Item 37 (vision-1000 #37) — partiya sifat pasporti PDF avtomatik generatsiya (UZ+EN i18n, BullMQ navbati, SD jo'natma hujjatiga ilinishi) qurilmagan. QISM C #49: «`quality_status` bor, to'liq model yo'q» → Qisman.
- **Nima yetishmaydi:** partiya pasporti modeli (gramaj/namlik/mustahkamlik qiymatlari); PDF generatsiya + ikki tilli i18n + BullMQ navbat; SD buyurtmasida «sertifikat tili» maydoni.
- **Bog'liqlik:** EP-WMS-033 (gramaj), EP-WMS-091 (grammaj tekshiruvi), EP-WMS-097 (jo'natish), QC moduli
- **action:** CREATE
- **⤳ Ta'sir:** QC (partiya pasporti), MES
- **Xoch-havolalar:** `[Module-10] Item 37` *(taxminiy)* · `EXTRACTION QISM A #37` · `EXTRACTION QISM C #49` · `TASDIQ-2146 §10 #49` · `vision-1000 #37`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-081 · Partiyalarni aralashtirishga ruxsat (v2 Q50)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — imkon qadar bitta partiyadan, kerak bo'lsa ogohlantirish bilan ruxsat. Rang/gramaj tafovuti; qoida egasidan.
- **Manba:** v2-A (A-default) + kitob (gramaj/rang farqi)
- **Dalil (kod):** Item 17 (vision-1000 #17) — bir paletga ikki xil partiyadan material terilganda ogohlantirish (blok emas), QC + ishlab chiqarish boshlig'iga signal, sertifikatda ikkala partiya raqami — qurilmagan. QISM C #50: «`buildPlan` span qiladi, biznes-qoida yo'q» → Qisman.
- **Nima yetishmaydi:** `buildPlan` bir nechta partiyani qamrab olsa ham hech qanday ogohlantirish/«aralash» belgisi chiqarmaydi; QC final inspeksiyada partiyalarni alohida ko'rsatish yo'q.
- **Bog'liqlik:** EP-WMS-078 (partiya), EP-WMS-080 (sifat pasporti), EP-WMS-055
- **action:** CREATE
- **⤳ Ta'sir:** QC, MES (bir buyurtma = bir partiya tavsiyasi)
- **Xoch-havolalar:** `[Module-10] Item 17` *(taxminiy)* · `EXTRACTION QISM A #17` · `EXTRACTION QISM C #50` · `TASDIQ-2146 §10 #50` · `vision-1000 #17`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-082 · Eski/harakatsiz zaxira (dead stock) (v2 Q51)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — N kundan harakatsiz "o'lik zaxira" + hisobot. EP-WMS-028 bilan bir; N-chegara egasidan.
- **Manba:** v2-A (A-default) + ShVB (muzlagan pul)
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #51: «`last_movement_at` + aging bor, N-kun CRON yo'q» → Qisman.
- **Nima yetishmaydi:** N-kun belgilovchi CRON; N qiymati toifaga qarab (vision-1000 #38: 30/60/15) — `business_settings` CRUD ga.
- **Bog'liqlik:** EP-WMS-028 (dublikat), EP-WMS-115 (turnover), EP-WMS-126 (yosh)
- **action:** CRON
- **⤳ Ta'sir:** Finance (zaxira kamaytirish), Sotuv (chegirma)
- **Xoch-havolalar:** `EXTRACTION QISM C #51` · `TASDIQ-2146 §10 #51` · `[Module-10] Item 38` *(bog'liq)* · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-083 · Qoldiq/oraliq kesindi (obrezka) hisobi (v2 Q52)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — foydalanish mumkin obrezka qoldiq sifatida qayta kirimga. Kitob ichki logistika "қолдиқлар чиқариш" rasmiy vazifa; INTERNAL_RETURN (POS Q24).
- **Manba:** kitob (қолдиқ chiqarish) + BARCHA_JAVOBLAR POS Q24 + v2-A
- **Dalil (kod):** FULL-ITEM-LEVEL da mos item yo'q. QISM C #52: «`remnant` + `INTERNAL_RETURN` bor, avto-oqim yo'q» → Qisman.
- **Nima yetishmaydi:** obrezka → qayta-kirim avtomatik oqimi; qoldiqni yangi buyurtmaga taklif qilish (EP-WMS-015).
- **Bog'liqlik:** EP-WMS-015 (ostatok), EP-WMS-089 (chiqindi/qoldiq), EP-WMS-125 (vtorichka), VR-WMS-I09
- **action:** CREATE
- **⤳ Ta'sir:** MES (qoldiqdan kichik buyurtma), Finance (chiqindi kamayadi)
- **Xoch-havolalar:** `EXTRACTION QISM C #52` · `TASDIQ-2146 §10 #52` · `[Module-10] — (mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-084 · Texkarta-material mosligi tekshiruvi (v2 Q53)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — texkarta material kodi ≠ chiqarilayotgan kod bo'lsa chiqim bloklanadi. Kitob aniq misol: топлайнер kerak, омборчи местный (макулатура) tayyorlagan → brak. Override sub-savol (faqat IchLog/ishlab chiqarish boshlig'i+sabab).
- **Manba:** kitob (топлайнер╳местный texkarta mosligi) + v2-A
- **Dalil (kod):** Item 68 — `outbound-enforcement.service.ts:104-131` BOM-mismatch **BLOK** real; `checkIssueAllowed` `goods-issue` yo'lida chaqiriladi (QISM C #53).
- **Nima yetishmaydi:** qurilish to'liq; **override** (faqat IchLog / ishlab chiqarish boshlig'i + sabab) qismi ochiq sub-savol va vision-1000 #14 bo'yicha razryad-tekshiruvi hamon yo'q.
- **Bog'liqlik:** EP-WMS-085 (gofra qavat), EP-WMS-101 (substitute), EP-WMS-030 (override audit)
- **action:** EVENT
- **⤳ Ta'sir:** PP (texkarta) ↔ WMS ↔ MES
- **Xoch-havolalar:** `[Module-10] Item 68` · `EXTRACTION QISM C #53/#68` · `TASDIQ-2146 §10 #68`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-085 · Gofra qavatini aralashtirishdan himoya (3╳5 qavat) (v2 Q54)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — har chiqim buyurtma+texkartaga bog'lanadi; boshqa buyurtmaga skanlasa ogohlantirish. Kitob misol: 5-qavat va 3-qavat gofra aralashtirilgan → reja buzilgan.
- **Manba:** kitob (3/5 qavat gofra aralashish) + v2-A
- **Dalil (kod):** Item 69 — `outbound-enforcement.service.ts:106-116` layer-mismatch **BLOK**; `goods-issue.handler.ts:40,66` (QISM C #54).
- **Nima yetishmaydi:** qurilish to'liq. Vision-1000 #27 qo'shimcha talab qiladi: tekshiruv **PP/MES texkarta tayyorlash bosqichida HAM proaktiv** bo'lsin — bu proaktiv qism tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-084 (texkarta moslik), PP texkarta, MES
- **action:** EVENT
- **⤳ Ta'sir:** PP, MES, ichki logistika
- **Xoch-havolalar:** `[Module-10] Item 69` · `[Module-10] Item 27` *(taxminiy — proaktiv tekshiruv)* · `EXTRACTION QISM C #54/#69` · `TASDIQ-2146 §10 #69` · `vision-1000 #27`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-086 · Poddon (palet) birligini hisobga olish (v2 Q55)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)* — *(2026-08-07 Δ)*
- **Talab:** A — poddon = qadoq/transport birligi, har poddonda dona/kg, ikki birlikda ko'rsatadi. Kitob ichki logistika "поддонлар, ярим тайёр маҳсулотлар"ni participalarga yetkazadi.
- **Manba:** kitob (поддон, ichki logistika) + v2-A
- **Dalil (kod):** Item 70 — jadval «Yo'q, grep pallet=0; `ow_pallet_recoveries` o'qilmaydi» deydi, **jonli holat esa boshqacha**: `pallet_unit_qty` ustuni endi mavjud va API ga ulangan.
- **Nima yetishmaydi:** «ikki birlikda ko'rsatish» (dona ╳ kg) konversiyasi (QISM C #55: «`ow_pallet_recoveries` bor, konversiya yo'q»).
- **Bog'liqlik:** EP-WMS-097 (jo'natish), EP-WMS-042 (birlik konvertatsiya), ichki logistika
- **action:** CREATE
- **⤳ Ta'sir:** ichki logistika, MES qadoqlash
- **Xoch-havolalar:** `[Module-10] Item 70` · `[Module-10] Item 31` *(taxminiy — butun son)* · `EXTRACTION QISM C #55/#70` · `TASDIQ-2146 §10 #70` · `vision-1000 #31`
- **⚠️ ZIDDIYAT:** QISM C #55 «`ow_pallet_recoveries` bor, konversiya yo'q → Qisman» ╳ QISM C #70 «grep pallet=0, o'qilmaydi → Yo'q» ╳ Item 70 «`pallet_unit_qty` ustuni endi mavjud va API-ga ulangan → STALE-DOC». Uchta manba uch xil. Eng yangi + kod-dalilli → STALE-DOC.
- **Δ 2026-07-11→08-07:** `9bdd5817` (2026-07-11) — vision-1000 **#31** («poddon birligi DOIM butun son — fraksional 0.5 poddon bo'lmaydi») bevosita amalga oshirildi: `material-life.controller.ts` + `wms-pallet-qty-integer-2026-07-11.sql` migratsiyasi bilan poddon soni butun songa cheklandi.

### EP-WMS-087 · Ichki transport so'rovi (rohler chaqirish) + kechikish izi (v2 Q56)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — sex "material kerak" so'rovi → rohlerchiga vazifa → bajarildi belgisi → kechikish ko'rinadi. Kitob: ichki logistika boshlig'i "рохлерчиларга аниқ вазифалар"; бекор туриш eng katta yo'qotish. Eskalatsiya sub-savol (IchLog boshlig'i/smena/Coordination).
- **Manba:** kitob (рохлер, бекор туриш) + v2-A
- **Dalil (kod):** Item 71 — `internal-requests` CRUD bor, **eskalatsiya timing yo'q** (QISM C #56/#71).
- **Nima yetishmaydi:** vision-1000 #32 aniq bergan eskalatsiya zinapoyasi qurilmagan: **15 daq → IchLog boshlig'i, 30 daq → smena boshlig'i, 60 daq → Direktor**; bekor turish daqiqalari MES downtime hisobiga «material-logistika» sabab kodi bilan avtomatik yozilishi ham yo'q.
- **Bog'liqlik:** EP-WMS-088 (bekor turish KPI), EP-WMS-119 (ЦКП KPI), MES downtime, Coordination
- **action:** EVENT
- **⤳ Ta'sir:** ichki logistika, MES (bekor turish), Coordination
- **Xoch-havolalar:** `[Module-10] Item 71` · `[Module-10] Item 32` *(taxminiy — eskalatsiya)* · `EXTRACTION QISM C #56/#71` · `TASDIQ-2146 §10 #71` · `vision-1000 #32`
- **⚠️ ZIDDIYAT:** `decisions/` «eskalatsiya sub-savol (IchLog boshlig'i / smena / Coordination) egasidan» ╳ vision-1000 #32 egasi **uchalasini ham** ketma-ket zinapoyada bergan (15/30/60 daq). Qaror amalda javoblangan; muddatlar `business_settings` CRUD ga.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-088 · "Bekor turish" sababini ombor-yetishmasligiga bog'lash (KPI) (v2 Q57)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — downtime sabab kodida "material yetishmovchiligi (logistika)" alohida, oyiga hisoblanadi. Kitob statistika: "Ички логистика сабабли юзага келган кечикишлар сони".
- **Manba:** kitob (ichki logistika KPI, бекор туриш) + v2-A
- **Dalil (kod):** Item 72 — `warehouse_kpi_cache` bor, lekin **reader yo'q** (QISM C #72); #57: «event bor, KPI hisob MES-da».
- **Nima yetishmaydi:** `warehouse_kpi_cache` ni o'qiydigan kod yo'q — kesh yoziladi, hech kim ishlatmaydi; oylik agregatsiya yo'q.
- **Bog'liqlik:** EP-WMS-087 (rohler), EP-WMS-119 (ЦКП KPI), MES downtime, IoT
- **action:** EVENT
- **⤳ Ta'sir:** MES, ichki logistika KPI, IoT, v2 Q88
- **Xoch-havolalar:** `[Module-10] Item 72` · `EXTRACTION QISM C #57/#72` · `TASDIQ-2146 §10 #72`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-089 · Chiqindi va qoldiqni ajratib hisobga olish (v2 Q58)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ikki turga: qayta ishlatiladigan qoldiq (omborga/makulatura) ╳ chiqindi (utilizatsiya). Kitob: ichki logistika boshlig'i "чиқиндилар ва қолдиқларни белгиланган тартибда чиқариш" rasmiy vazifa; makulatura daromad.
- **Manba:** kitob (чиқинди/қолдиқ chiqarish) + v2-A
- **Dalil (kod):** Item 73 — `INTERNAL_RETURN` bor, lekin **ajratish yo'q** (QISM C #58/#73: «`remnant` + makulatura bor, ajratuvchi hisob yo'q»).
- **Nima yetishmaydi:** ikki turni (qayta-ishlatiladigan qoldiq ╳ utilizatsiya chiqindisi) alohida hisoblaydigan model va hisobot.
- **Bog'liqlik:** EP-WMS-083 (obrezka), EP-WMS-090 (makulatura), EP-WMS-125 (vtorichka), EP-WMS-103
- **action:** CREATE
- **⤳ Ta'sir:** ichki logistika, Finance (makulatura savdosi), MES brak
- **Xoch-havolalar:** `[Module-10] Item 73` · `EXTRACTION QISM C #58/#73` · `TASDIQ-2146 §10 #73`
- **Δ 2026-07-11→08-07:** `4241faa0` (2026-07-13) — makulatura qayta-sotish daromadi endi **o'z GL hisobiga** (9820, 9810 farzandi) tushadi, ilgari valyuta-farqi daromadi bilan aralashardi; yangi **`WASTE_OUT`** harakat turi + mapping mavjud `WASTE_IN` naqshini aks ettiradi. Bu «makulatura daromad» tomonini ajratdi (chiqindi ╳ qoldiq ajratimining Finance yarmi).

### EP-WMS-090 · Местный (makulatura) qog'ozni alohida zaxira boshqarish (v2 Q59)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — alohida kartochka + ruxsat etilgan mahsulotlar ro'yxati. Kitob: местный = toplaynerga arzon past-sifatli muqobil, faqat ruxsat etilgan buyurtmalarga.
- **Manba:** kitob (местный/макулатура ruxsat) + v2-A
- **Dalil (kod):** Item 74 — `material_category_dept_rules` bor, lekin **allow-list yo'q** (QISM C #59/#74).
- **Nima yetishmaydi:** material → ruxsat etilgan mahsulot/buyurtma allow-list; bu bo'lmasa omborchi o'zicha местный chiqarib brak keltirib chiqarishi mumkin (kitob misoli).
- **Bog'liqlik:** EP-WMS-101 (substitute), EP-WMS-084 (texkarta moslik), EP-WMS-038 (rulon turi)
- **action:** CREATE
- **⤳ Ta'sir:** PP texkarta, QC, v2 Q70
- **Xoch-havolalar:** `[Module-10] Item 74` · `EXTRACTION QISM C #59/#74` · `TASDIQ-2146 §10 #74`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-091 · Grammaj bo'yicha kirim tekshiruvi (v2 Q60)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — namuna grammaji o'lchanadi, ±tolerans, oshsa karantin. Kitob: grammaj texkarta kaliti ("унинг грамажи, сифати"); xato grammaj = butun partiya noto'g'ri.
- **Manba:** kitob (грамаж sifat kaliti) + v2-A
- **Dalil (kod):** Item 75 — ±2% **vazn** tolerantligi bor, lekin **grammaj-maxsus** tekshiruv yo'q (QISM C #60/#75). Item 36 (vision-1000 #36) — «namuna grammaji chegaradan chiqsa BUTUN PARTIYA karantinga» qismi Qisman.
- **Nima yetishmaydi:** grammajga xos tolerans; chegaradan chiqqanda **butun partiyani** (faqat namunali rulonni emas) karantinga o'tkazish; har rulondan namuna olish tavsiyasi.
- **Bog'liqlik:** EP-WMS-033 (gramaj diapazoni), EP-WMS-080 (partiya sifati), EP-WMS-016 (karantin), EP-WMS-118
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, QC, karantin
- **Xoch-havolalar:** `[Module-10] Item 75` · `[Module-10] Item 36` *(taxminiy)* · `EXTRACTION QISM C #60/#75` · `TASDIQ-2146 §10 #75` · `vision-1000 #36`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-092 · Import xom-ashyo yo'lda (in-transit) holati (v2 Q61)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)* — *(2026-08-07 Δ)*
- **Talab:** A — import buyurtmasi bosqichli holat (jo'natildi/bojxona/keldi) + taxminiy kelish sanasi. Kitob: Таъминот boshlig'i "импорт хом ашёларни етказиб келиш"ga mas'ul.
- **Manba:** kitob (Таъминот, импорт хом ашё) + v2-A
- **Dalil (kod):** Item 76 — jadval «Qisman, kiruvchi in-transit yo'q» deydi, jonli holat esa **kiruvchi in-transit endi Ha**.
- **Nima yetishmaydi:** qurilish yopildi; qolgani — vision-1000 #44 ning «jo'natilgan lekin tasdiqlanmagan mol alohida GL hisobida» chiquvchi tomoni (Item 44 → Yo'q edi, Δ ga qarang).
- **Bog'liqlik:** EP-WMS-093 (import lead-time), EP-WMS-095 (GTD), EP-WMS-099 (yetkazish tasdig'i), Finance/GL
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, PP/MRP (lead-time), Finance (avans)
- **Xoch-havolalar:** `[Module-10] Item 76` · `[Module-10] Item 44` *(bog'liq — yo'ldagi mol GL)* · `EXTRACTION QISM C #61/#76` · `TASDIQ-2146 §10 #76` · `vision-1000 #44`
- **⚠️ ZIDDIYAT:** QISM C #61 «transit/eta/customs ustuni yo'q → **Yo'q**» ╳ QISM C #76 «chiquvchi deliveries bor, kiruvchi yo'q → **Qisman**» ╳ Item 76 «kiruvchi in-transit endi **Ha**» — STALE-DOC. Eng yangi manba ustun.
- **Δ 2026-07-11→08-07:** `4241faa0` (2026-07-13) — «yo'ldagi mol» (in-transit) endi **real GL yozuvi** beradi: jo'natma `arrived` holatiga o'tganda Dr Materiallar / Cr «Yo'lda tovar» (1020). Ilgari logistika holat-mashinasi to'liq edi, lekin **buxgalteriya tomoni umuman yo'q edi**. Chet-el valyutasidagi jo'natmalar sababi loglanib o'tkazib yuboriladi (konvertatsiyani to'qib chiqarmaslik uchun kurs manbai yo'q — Q-40).

### EP-WMS-093 · Import lead-time va valyuta narxi (v2 Q62)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman (egasi-data) *(2026-07-11)*
- **Talab:** A — "import/mahalliy" bayroq + lead-time + valyuta, reorder import uchun ertaroq. POS Q36 "har qanday valyuta"; lead-time modeli egasidan.
- **Manba:** v2-A (A-default) + kitob (import) + BARCHA_JAVOBLAR POS Q36
- **Dalil (kod):** Item 62 va Item 77 (bir xil EP kod, ikki marta qamralgan) — EOQ/ROP formulalari bor, lekin **DATA to'ldirilmagan** (QISM C #62/#77: «formula bor, DATA yo'q»).
- **Nima yetishmaydi:** lead-time va valyuta qiymatlari egasi-DATA; vision-1000 #23: bayram kunida kurs MB API dan oxirgi ish kunining kursi olinadi (avtomatik), API muvaffaqiyatsiz bo'lsagina buxgalter qo'lda kiritadi + audit-log — bu qism Item 23 bo'yicha Qisman.
- **Bog'liqlik:** EP-WMS-068 (lead time), EP-WMS-065 (reorder), EP-WMS-092 (in-transit), Finance valyuta
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MRP, Finance
- **Xoch-havolalar:** `[Module-10] Item 62` · `[Module-10] Item 77` *(dublikat)* · `[Module-10] Item 23` *(taxminiy — valyuta kursi)* · `EXTRACTION QISM C #62/#77` · `TASDIQ-2146 §10 #62/#77` · `vision-1000 #23`
- **⚠️ ZIDDIYAT:** FULL-ITEM-LEVEL bu EP kodni **ikki marta** qamragan (Item 62 va Item 77) — Item 77 o'zi «duplicate of item 62» deb tan oladi. TASDIQ §10 jadvalidagi #62/#77 dublikatidan kelib chiqqan. III QISM §1 ga qarang.
- **Δ 2026-07-11→08-07:** `363cf909` — PO uchun Incoterms / yetkazish shartlari (`delivery_terms`) maydoni qo'shildi (MM 11.25); bu import-shartlari master-datasining bir bo'lagi, lekin lead-time/valyuta DATA sini to'ldirmaydi.

### EP-WMS-094 · Yetkazib beruvchi ishonchliligi reytingi (v2 Q63)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — har kirim avtomatik reytingga ta'sir (kechikdi/brak) → reyting ko'rinadi. Kitob Таъминот bir nechta beruvchi bilan ishlaydi → ishonchlilik kerak.
- **Manba:** kitob (Таъминот, етказиб берувчилар) + v2-A
- **Dalil (kod):** Item 63 va Item 78 (bir xil EP kod) — jadval «Qisman / avto-hisob yo'q» va «Yo'q / hech kod yozmaydi-o'qimaydi» deydi, jonli holat esa **Ha**.
- **Nima yetishmaydi:** qurilish bo'yicha yopilgan; vision-1000 #22 ning formulasi (og'irlikli o'rtacha, har kirim = bir ovoz; brak kirim alohida «inkident»; past reytingda PO ogohlantirish bilan **o'tadi**, bloklanmaydi) kodda tasdiqlanmagan — Item 22 bo'yicha Qisman.
- **Bog'liqlik:** EP-WMS-043 (ko'p beruvchi), EP-WMS-049 (qisman qabul), EP-WMS-120 (tender), EP-WMS-106
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MM, Finance
- **Xoch-havolalar:** `[Module-10] Item 63` · `[Module-10] Item 78` *(dublikat)* · `[Module-10] Item 22` *(taxminiy — formula)* · `EXTRACTION QISM C #63/#78` · `TASDIQ-2146 §10 #63/#78` · `vision-1000 #22`
- **⚠️ ZIDDIYAT:** Uchta manba, uch xil holat: QISM C #63 «Qisman — `ratings` jadval bor, avto-hisob yo'q» ╳ QISM C #78 «**Yo'q** — jadval bor, hech kod yozmaydi/o'qimaydi» ╳ Item 63/78 «aslida **Ha**». Eng yangi + kod-o'qilgan → STALE-DOC. Memory: vendor rating two-world (MASTER-STATUS-BOARD:420 A11 60%) — parallel-dunyo xavfi hamon bor.
- **Δ 2026-07-11→08-07:** `02cc4a70` — vendor QQS to'lovchi (`is_vat_payer`) bayrog'i qo'shildi (MM 11.44); beruvchi profilining kengayishi, reyting formulasiga bevosita ta'sir qilmaydi.

### EP-WMS-095 · Import partiyasiga bojxona/sertifikat hujjat biriktirish (v2 Q64)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — har import partiyasiga fayl (GTD/sertifikat/invoys) biriktiriladi va qidiriladi. Kitob importda hujjat majburiy; model egasidan.
- **Manba:** v2-A (A-default) + kitob (import hujjat)
- **Dalil (kod):** Item 64 va Item 79 (bir xil EP kod) — jadval «Yo'q / GTD attachment yo'q» va «Qisman / import-bog' tasdiqlanmadi» deydi, jonli holat esa **Ha**.
- **Nima yetishmaydi:** qurilish yopilgan; vision-1000 #10 ning siyosiy qismi qurilmagan: GTD yo'q bo'lsa **ogohlantirish bilan o'tkaziladi** + «hujjat kutilmoqda» bayrog'i (blok EMAS), **14 kalendar kun** o'tsa Tasnif+Moliya boshliqlariga eskalatsiya (muddat konfiguratsiyada) — Item 10 bo'yicha **Yo'q**.
- **Bog'liqlik:** EP-WMS-092 (in-transit), EP-WMS-096 (avans), EP-WMS-105 (foto), Finance
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, Finance, QC
- **Xoch-havolalar:** `[Module-10] Item 64` · `[Module-10] Item 79` *(dublikat)* · `[Module-10] Item 10` *(taxminiy — GTD siyosati)* · `EXTRACTION QISM C #64/#79` · `TASDIQ-2146 §10 #64/#79` · `vision-1000 #10`
- **⚠️ ZIDDIYAT:** QISM C #64 «**Yo'q** — GTD attachment yo'q» ╳ QISM C #79 «**Qisman** — passports+storage infra bor, import-bog' tasdiqlanmadi» ╳ Item 64/79 «aslida **Ha**». Eng yangi + kod-o'qilgan → STALE-DOC. Alohida: `decisions/` «model egasidan» deydi, lekin vision-1000 #10 modelni allaqachon bergan (ogohlantirish + bayroq + 14 kun eskalatsiya).
- **Δ 2026-07-11→08-07:** —

### EP-WMS-096 · Avans to'lov va yetkazib berish bog'lanishi (v2 Q65)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)* — *(2026-08-07 Δ)*
- **Talab:** A — buyurtma → avans (Finance) → kirim solishtiriladi, yopilmagan avanslar ro'yxati. Kitob import avans bilan; ShVB unpaid-aging mos; model egasidan.
- **Manba:** v2-A (A-default) + kitob (import avans) + ShVB unpaid
- **Dalil (kod):** Item 65 va Item 80 (bir xil EP kod) — QISM C #65: «bog'lanish yo'q → **Yo'q**»; QISM C #80: «Finance infra bor, WMS-ko'rinish yo'q → **Qisman**». Item 80 «duplicate of item 65».
- **Nima yetishmaydi:** avans ↔ kirim solishtirish; «yopilmagan avanslar» ro'yxati WMS/Таъминот ko'rinishida.
- **Bog'liqlik:** EP-WMS-004/047 (3-way match), EP-WMS-092 (import), EP-WMS-095 (GTD), Finance
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, Finance
- **Xoch-havolalar:** `[Module-10] Item 65` · `[Module-10] Item 80` *(dublikat)* · `EXTRACTION QISM C #65/#80` · `TASDIQ-2146 §10 #65/#80`
- **⚠️ ZIDDIYAT:** QISM C #65 «**Yo'q**» ╳ QISM C #80 «**Qisman**» — bir xil EP kod uchun ikki xil baho (TASDIQ jadvalidagi 53-67 ╳ 68-82 dublikat blokidan kelib chiqqan). Registr yumshoqroq (Qisman) ni oladi.
- **Δ 2026-07-11→08-07:** `79a342f6` — «supplier invoicing was entirely 501» (MM); yetkazib beruvchi schyot-fakturasi oqimi endi real, bu avans↔kirim solishtirishning Finance yarmiga poydevor beradi, lekin WMS-ko'rinishini yaratmaydi.

### EP-WMS-097 · Tayyor mahsulotni mijozga jo'natish (отгрузка) hujjati (v2 Q66)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)* — *(2026-08-07 Δ)*
- **Talab:** A — jo'natish hujjati buyurtmaga bog'lanib avtomatik (mijoz/mahsulot/miqdor/haydovchi/mashina). POS Q22 EXTERNAL_OUT + Q41 harakat akti PDF; kitob Элтиб бериш boshlig'i "логистика ва транспорт".
- **Manba:** BARCHA_JAVOBLAR POS Q22 + Q41 + kitob (Элтиб бериш) + v2-A
- **Dalil (kod):** Item 81 — `deliveries` + `dispatch-delivery.handler` (n=1) → **Ha** (QISM C #81). QISM C #66 esa eskiroq: «EXTERNAL_OUT bor, to'liq hujjat A-yarmda yo'q → Qisman».
- **Nima yetishmaydi:** ishlab chiqarish ma'lumoti yupqa (n=1 jonli qator) — jarayon real, lekin amalda ishlatilmagan.
- **Bog'liqlik:** EP-WMS-098 (haydovchi/mashina), EP-WMS-099 (yetkazish tasdig'i), EP-WMS-077, SD
- **action:** CREATE
- **⤳ Ta'sir:** SD, Элтиб бериш, Finance
- **Xoch-havolalar:** `[Module-10] Item 81` · `[Module-10] Item 66` *(dublikat)* · `EXTRACTION QISM C #66/#81` · `TASDIQ-2146 §10 #81`
- **⚠️ ZIDDIYAT:** QISM C #66 «Qisman» ╳ QISM C #81 «Ha» — bir xil EP kod uchun ikki baho. Item 66 buni «STALE-DOC (jadval Qisman deydi — asosan Ha, lekin ishlab chiqarish ma'lumoti yupqa)» deb hal qiladi. Registr Item 81 ni (Ha) oladi.
- **Δ 2026-07-11→08-07:** `567ce6f8` (2026-08-04) — POS `EXTERNAL_OUT` chiqimi SD/logistika moduliga hech qanday event yubormasdi: `PosMovementCreatedEvent` umumiy signal edi va POS/WMS dan tashqarida hech kim unga obuna bo'lmagan, mijoz konteksti ham yo'q edi. Yangi `pos-external-out-created.event.ts` + SD tomonida `pos-external-out-sd.listener.ts` — mijozning biriktirilgan menejerini (`sd_customers.manager_id`) xabardor qiladi. Ya'ni rasmiy SD-jo'natma oqimidan TASHQARIDA ketgan tovar endi SD ga ko'rinadi.

### EP-WMS-098 · Haydovchi va mashinani jo'natishga biriktirish (v2 Q67)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)* — *(2026-08-07 Δ)*
- **Talab:** A — haydovchi + mashina raqami + chiqish vaqti + yetkazildi belgisi. Kitob Элтиб бериш boshlig'i "хайдовчилар" bilan ishlaydi.
- **Manba:** kitob (Элтиб бериш, хайдовчилар) + v2-A
- **Dalil (kod):** Item 82 — `delivery.aggregate.ts:102`; `assign-driver.handler` → **Ha** (QISM C #82). QISM C #67 eskiroq: «WMS modulida yo'q → Yo'q».
- **Nima yetishmaydi:** funksiya `modules/logistics` da, `modules/wms` da emas — Item 67 buni STALE-DOC deb belgilaydi («funksiya mavjud, faqat boshqa modulda»).
- **Bog'liqlik:** EP-WMS-097 (jo'natish), EP-WMS-099 (tasdiq), SD/Logistika
- **action:** CREATE
- **⤳ Ta'sir:** Элтиб бериш, SD, CC
- **Xoch-havolalar:** `[Module-10] Item 82` · `[Module-10] Item 67` *(dublikat, STALE-DOC)* · `EXTRACTION QISM C #67/#82` · `TASDIQ-2146 §10 #82`
- **⚠️ ZIDDIYAT:** QISM C #67 «WMS modulida yo'q → **Yo'q**» ╳ QISM C #82 «`delivery.aggregate.ts:102` → **Ha**». Farq — modul chegarasi, funksiya emas. Registr «Ha» ni oladi, modul joylashuvi izoh sifatida qoladi.
- **Δ 2026-07-11→08-07:** `2bf1bbab` (2026-07-13) — `fleet/deliveries` ning 3 endpointi controller ichida `notImplemented()` chaqirardi (501), holbuki orqadagi `mm_deliveries` jadvali va mos Zod insert-sxemasi allaqachon mavjud, faqat hech bir yozuvchi unga qaratilmagan edi; `LogisticsDashboard.tsx` va `MMExtended.tsx` (3 marshrut) esa aynan shu ustunlarni kutib chaqirardi. Uchala stub real Drizzle/SQL handlerlar bilan almashtirildi.

### EP-WMS-099 · Yetkazib berishni tasdiqlash (mijoz qabul qildi) (v2 Q68)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)* — *(2026-08-07 Δ)*
- **Talab:** A — haydovchi qaytganda "yetkazildi/qaytdi/qisman" + sabab → sikl yopiladi. Jo'natish ≠ yetkazish; model egasidan.
- **Manba:** v2-A (A-default) + kitob (Элтиб бериш)
- **Dalil (kod):** Item 83 — `DELIVERED`/`FAILED` bor, lekin **qisman + imzo** yo'q (QISM C #83).
- **Nima yetishmaydi:** «qisman yetkazildi» holati va haydovchi qaytganda imzo/dalil; vision-1000 #44: jo'natilgan lekin tasdiqlanmagan mol **72 soat**da SD + Элтиб бериш boshliqlariga, **120 soat**da Direktorga eskalatsiya — Item 44 bo'yicha **Yo'q**.
- **Bog'liqlik:** EP-WMS-097/098, EP-WMS-092 (in-transit GL), SD, QC (reklamatsiya)
- **action:** UPDATE
- **⤳ Ta'sir:** Элтиб бериш, SD, reklamatsiya (QC)
- **Xoch-havolalar:** `[Module-10] Item 83` · `[Module-10] Item 44` *(taxminiy — yo'ldagi mol/eskalatsiya)* · `EXTRACTION QISM C #83` · `TASDIQ-2146 §10 #83` · `vision-1000 #44`
- **Δ 2026-07-11→08-07:** `086fb5db` (2026-07-11) — yuk topshirishda **nizo holati (`DISPUTED`)** qo'shildi (`pos-movement-status.service.ts`, `stock-ledger.service.ts`, `movement.dto.ts` + `item131-pos-handover-dispute-2026-07-11.sql`); «yetkazildi ╳ qaytdi» ikkiligi endi uchinchi — nizoli — holat bilan to'ldirildi. `4241faa0` (2026-07-13) — «yo'lda tovar» GL hisobi (1020) yaratildi va jo'natma `arrived` bo'lganda provodka yoziladi.

### EP-WMS-100 · Material rezervatsiyasi (buyurtmaga band qilish) (v2 Q69)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — reja material bandlaydi (mavjud−band=erkin), erkin qoldiq ko'rinadi. Ikki buyurtma to'qnashuvini oldini oladi; model egasidan (PP/MRP bilan).
- **Manba:** v2-A (A-default) + kitob (reja, бекор туриш)
- **Dalil (kod):** Item 84 — `reserved_quantity` ustuni bor, lekin mantiq to'liq emas; `stock_reservations` **bo'sh** (QISM C #84). Item 21 (vision-1000 #21) — rezerv alohida `material_reservations` jadvalida + DB trigger sinxronizatsiyasi: rezervatsiya yo'lagi bor (`StockReservation` i18n done), lekin trigger tasdiqlanmagan.
- **Nima yetishmaydi:** rezerv ↔ `warehouse_stock.reserved_qty` DB-trigger sinxronizatsiyasi; «mavjud − band = erkin» ni real vaqtda ko'rsatuvchi PP/MRP ko'rinishi; vision-1000 #45: PP rezervi inventarizatsiya muzlatishidan **USTUN** (muzlatish faqat yangi harakatlarni bloklaydi) — Item 45 bo'yicha **Yo'q**.
- **Bog'liqlik:** EP-WMS-062 (freeze ustunligi), EP-WMS-025 (MES), EP-WMS-108, PP/MRP
- **action:** CREATE
- **⤳ Ta'sir:** PP/MRP, SD, ichki logistika
- **Xoch-havolalar:** `[Module-10] Item 84` · `[Module-10] Item 21` *(taxminiy)* · `[Module-10] Item 45` *(taxminiy — PP ustunligi)* · `EXTRACTION QISM C #84` · `TASDIQ-2146 §10 #84` · `vision-1000 #21/#45`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-101 · Material almashtirish (substitute) ruxsati (v2 Q70)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — har materialga "ruxsat etilgan analog" ro'yxati; faqat shulardan, tasdiq bilan. Kitob: omborchi o'zicha местный chiqarsa nazoratsiz brak; analog oldindan belgilanadi. Model egasidan.
- **Manba:** v2-A (A-default) + kitob (toplayner/местный almashish)
- **Dalil (kod):** Item 85 — jadval «Yo'q; grep=0; `material_substitutions` jadval yo'q» deydi, jonli holat esa: **jadval nomi boshqacha va u to'liq CRUD bilan mavjud**.
- **Nima yetishmaydi:** vision-1000 #18: almashtirishda PP texkartasi AVTOMATIK yangilanmaydi — WMS «analog ishlatildi» hodisasini PP ga event bilan yuboradi, PP rejalashtiruvchi qo'lda yangilaydi, mos kelmaslik «texkarta-fakt tafovuti» hisobotida ko'rinadi — bu event/hisobot Item 18 bo'yicha Qisman.
- **Bog'liqlik:** EP-WMS-090 (makulatura allow-list), EP-WMS-084 (texkarta moslik), PP
- **action:** CREATE
- **⤳ Ta'sir:** PP texkarta, QC, ichki logistika
- **Xoch-havolalar:** `[Module-10] Item 85` · `[Module-10] Item 18` *(taxminiy)* · `EXTRACTION QISM C #85` · `TASDIQ-2146 §10 #85` · `vision-1000 #18`
- **⚠️ ZIDDIYAT:** QISM C #85 «`material_substitutions` jadval yo'q, grep=0 → Yo'q» ╳ Item 85 «jadval nomi farq qiladi va u endi to'liq CRUD bilan mavjud → STALE-DOC». Auditning grep'i **noto'g'ri jadval nomini** qidirgani uchun soxta-manfiy bergan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-102 · Omborchi razryadi → ruxsat etilgan amal darajasi (v2 Q71)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — razryad → vakolat matritsasi (kirim/chiqim/inventarizatsiya/spisaniye alohida). Karta-model razryad asosli; matritsa egasidan (EP-WMS-024 bilan).
- **Manba:** v2-A (A-default) + karta-model (razryad)
- **Dalil (kod):** Item 86 — `role_movement_permissions` bor, lekin **razryad-bog' yo'q** (QISM C #86). QISM A Step-3: RBAC karta-manbasi OFF (`CARD_PERMISSION_SOURCE_READY=false`, VISION-3340:1537).
- **Nima yetishmaydi:** razryad ↔ `role_movement_permissions` bog'lanishi; vision-1000 #14: override beruvchining org-razryadi avtomatik tekshirilishi (past razryadda xato qaytariladi).
- **Bog'liqlik:** EP-WMS-024 (dublikat), EP-WMS-051 (kirim huquqi), EP-WMS-030 (override audit), Org karta-gate
- **action:** CREATE
- **⤳ Ta'sir:** HR/org-karta, ombor xavfsizlik
- **Xoch-havolalar:** `[Module-10] Item 86` · `[Module-10] Item 14/50` *(taxminiy)* · `EXTRACTION QISM C #86` · `TASDIQ-2146 §10 #86` · `vision-1000 #14/#50`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-103 · Material hisobdan chiqarish (spisaniye) jarayoni (v2 Q72)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — spisaniye akti (material+sabab+miqdor+tasdiqlovchi → Finance zarariga). POS Q26 DAMAGE → QC moduliga avtomatik; auditga ochiq.
- **Manba:** BARCHA_JAVOBLAR POS Q26 + v2-A
- **Dalil (kod):** Item 87 — `write_off_acts` jadvali bor (**n=0**, jonli qator yo'q), GL oqimi tasdiqlanmadi (QISM C #87).
- **Nima yetishmaydi:** akt → GL zarar provodkasi uchidan-uchiga tasdiqlanmagan; jadval bo'sh.
- **Bog'liqlik:** EP-WMS-089 (chiqindi), EP-WMS-109 (GL), EP-WMS-111 (mas'ul), QC
- **action:** CREATE
- **⤳ Ta'sir:** Finance (zarar), QC, audit
- **Xoch-havolalar:** `[Module-10] Item 87` · `EXTRACTION QISM C #87` · `TASDIQ-2146 §10 #87`
- **Δ 2026-07-11→08-07:** `4241faa0` (2026-07-13) — brak/zarar (`DAMAGE` + `INVENTORY_ADJ_MINUS`) endi maxsus «Ishlab chiqarish zarari» (**9520**) hisobiga tushadi; ilgari aloqasiz boshqa-xarajat provodkalari bilan 9500 ni bo'lishardi. Ikkala jonli GL-yozuv yo'li (`gl_account_mappings` + `auto-gl-posting.service.ts` dagi hardcoded konstanta) bir-biriga moslashtirildi.

### EP-WMS-104 · Sarfni norma bilan og'ish tahlili (pere-raskhod) (v2 Q73)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har buyurtma yopilganda norma/fakt og'ishi % , chegaradan oshsa signal. Kitob texkarta norma mavjud; EP-WMS-054 bilan bir; chegara egasidan.
- **Manba:** v2-A (A-default) + kitob (texkarta norma)
- **Dalil (kod):** Item 88 — `material_norms` bor, lekin **taqqoslovchi reader yo'q** (QISM C #88). QISM A Step-3: «MES↔WMS material chiqim norma link yo'q» (SB0555/SB0553).
- **Nima yetishmaydi:** norma/fakt og'ishini hisoblaydigan reader; buyurtma yopilganda trigger; chegara `business_settings` CRUD ga.
- **Bog'liqlik:** EP-WMS-054 (dublikat), EP-WMS-089 (chiqindi), EP-WMS-110 (tannarx), MES
- **action:** EVENT
- **⤳ Ta'sir:** PP norma, MES, Finance, QC
- **Xoch-havolalar:** `[Module-10] Item 88` · `EXTRACTION QISM C #88/#23` · `TASDIQ-2146 §10 #88`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-105 · Tovar qabulda foto-dalil (v2 Q74)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "shikast bor" belgilansa foto majburiy → reklamatsiyaga. POS Q16-17 AI kamera mavjud; HR Q129 inspeksiya foto (dalil/before-after) madaniyati.
- **Manba:** BARCHA_JAVOBLAR POS Q16-17 + HR Q129 + v2-A
- **Dalil (kod):** Item 89 — storage infratuzilmasi bor, lekin **validatsiya oqimi yo'q** (QISM C #89). QISM A Step-3: `photo_urls` ustuni `warehouse_stock` da yo'q (P0, SB0568).
- **Nima yetishmaydi:** «shikast bor» belgilanganda fotoni majburiy qiladigan validatsiya; foto → reklamatsiya zanjiri.
- **Bog'liqlik:** EP-WMS-049 (qisman qabul), EP-WMS-106 (qaytarish), EP-WMS-094 (reyting), IoT AI-kamera
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, QC, Finance
- **Xoch-havolalar:** `[Module-10] Item 89` · `EXTRACTION QISM C #89` · `TASDIQ-2146 §10 #89` · `EXTRACTION QISM A Step-3 (SB0568 P0)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-106 · Yetkazib beruvchiga qaytarish (vozvrat) jarayoni (v2 Q75)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — qaytarish hujjati → zaxira kamayadi + Finance kreditor kamayadi. POS Q31 CHIQARISH → ta'minotchiga qaytish; kirimning teskarisi.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + v2-A
- **Dalil (kod):** Item 90 — CHIQARISH + qaror oqimi bor, lekin **Finance bog'lanishi tasdiqlanmadi** (QISM C #90).
- **Nima yetishmaydi:** «zaxira ↓ + kreditor ↓» atomik juftligi; vision-1000 #43: qolgan miqdor uchun da'vo MM orqali **qo'lda** yuboriladi (reklamatsiya qo'shimcha hujjat talab qiladi).
- **Bog'liqlik:** EP-WMS-017/070/071 (karantin qarori), EP-WMS-049, EP-WMS-109 (GL), Finance
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, Finance, QC
- **Xoch-havolalar:** `[Module-10] Item 90` · `EXTRACTION QISM C #90` · `TASDIQ-2146 §10 #90` · `vision-1000 #43`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-107 · Kunlik qoldiq hisoboti rahbarga avtomatik (v2 Q76)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik kunlik hisobot (qoldiq + harakat + signal) → CC orqali rahbarga. POS Q57 ombor menejer kunlik; kitob "кун якунида хисобот". EP-WMS-013 bilan bir.
- **Manba:** BARCHA_JAVOBLAR POS Q57 + kitob (kunlik hisobot) + v2-A
- **Dalil (kod):** Item 91 — dashboard endpoint bor, lekin **CRON yozuvchi yo'q** (QISM C #91). QISM A Step-3: «Kunlik ombor hisobot real-time push yo'q» (SB0552, STILL-OPEN).
- **Nima yetishmaydi:** CRON + CC orqali yuborish; vision-1000 #47: barcha ombor turlari alohida, bo'sh ombor «0» bilan, recipient-ga qarab format — Item 47 bo'yicha **Yo'q**.
- **Bog'liqlik:** EP-WMS-013 (dublikat), EP-WMS-031 (Telegram), EP-WMS-011, CC/NTF
- **action:** CRON
- **⤳ Ta'sir:** CC, NTF, director dashboard
- **Xoch-havolalar:** `[Module-10] Item 91` · `[Module-10] Item 47` *(taxminiy)* · `EXTRACTION QISM C #91` · `TASDIQ-2146 §10 #91` · `vision-1000 #47`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-108 · Kritik material yetishmasligi proaktiv signal (v2 Q77)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — reja sarfi vs joriy qoldiq → "X material Y kunda tugaydi" prognoz + signal. PP/MRP bilan; signal-oluvchi sub-savol (Таъминот+IchLog / faqat ombor / Coordination) egasidan.
- **Manba:** v2-A (A-default) + kitob (бекор туриш oldini olish)
- **Dalil (kod):** Item 92 — domen formulasi bor, lekin **CRON-signal tasdiqlanmadi** (QISM C #92). Item 15 (vision-1000 #15) — formula `(joriy_qoldiq − rezervlangan) / kunlik_o'rtacha_sarf_oxirgi30kun` va kunlik ertalabki CRON — Qisman.
- **Nima yetishmaydi:** kunlik ertalabki prognoz CRON; sarf normasi **MES texkartasidan emas, oxirgi 30 kunning haqiqiy sarfidan** olinishi; signal-oluvchi ro'yxati egasidan.
- **Bog'liqlik:** EP-WMS-100 (rezerv), EP-WMS-065 (reorder), EP-WMS-011 (kimga), PP/MRP
- **action:** CRON
- **⤳ Ta'sir:** PP/MRP, Таъминот, CC
- **Xoch-havolalar:** `[Module-10] Item 92` · `[Module-10] Item 15` *(taxminiy — formula)* · `EXTRACTION QISM C #92` · `TASDIQ-2146 §10 #92` · `vision-1000 #15`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-109 · Ombor harakatining buxgalteriyaga (GL) avtomatik o'tishi (v2 Q78)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — har harakat GL provodkasi (zaxira debet/kredit). POS Q43 "Avtomatik — har harakatda Debit/Credit (5-bosqich: AI hisoblaydi)". Memory: GL kanonik = `gl_entries`.
- **Manba:** BARCHA_JAVOBLAR POS Q43 + memory (gl_entries kanonik) + v2-A
- **Dalil (kod):** Item 93 — `finance/wms-goods-issued.listener.ts:48-101` → **Ha** (QISM C #93). Item 26 (vision-1000 #26) — GL provodkasi muvaffaqiyatsiz bo'lsa `warehouse_stock` orqaga qaytmasligi (outbox retry + exponential backoff) Qisman: WMS→FIN listenerlar bor, `entries` = 7 qator (kam).
- **Nima yetishmaydi:** outbox retry (exponential backoff) va «GL kechikmoqda» ogohlantirishi tasdiqlanmagan; jonli GL yozuvlari juda kam.
- **Bog'liqlik:** EP-WMS-103 (spisaniye), EP-WMS-110 (narx), EP-WMS-092 (in-transit), Finance/GL
- **action:** EVENT
- **⤳ Ta'sir:** Finance/GL, audit
- **Xoch-havolalar:** `[Module-10] Item 93` · `[Module-10] Item 26` *(taxminiy — outbox)* · `EXTRACTION QISM C #93` · `TASDIQ-2146 §10 #93` · `vision-1000 #26`
- **Δ 2026-07-11→08-07:** `4241faa0` (2026-07-13) — WMS harakat turlariga **5 ta yangi GL hisobi** ulandi: 9520 (ishlab chiqarish zarari — `DAMAGE`+`INVENTORY_ADJ_MINUS`), 9820 (makulatura daromadi + yangi `WASTE_OUT` turi), 9210 (marketing xarajati), 9220 (referral bonusi — hisob yaratildi, ulanmagan, Q-40 bo'yicha to'qib chiqarilmadi), 1020 (yo'lda tovar). Ikkala jonli GL-yozuv yo'li (mapping jadvali + hardcoded konstanta) bir-biriga moslashtirildi.

### EP-WMS-110 · Material narxini hisoblash usuli (FIFO/o'rtacha) (v2 Q79)
- **Qaror holati:** ✅ JAVOBLANGAN (KONFLIKT)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** ⚠️ KONFLIKT — POS Q35 aniq "FIFO narxi (partiya narxi bo'yicha)" deydi; v2 Q79-A esa "o'rtacha tortilgan" tavsiya qiladi. ⭐ POS-javob ustun = **FIFO** (egasi 2026-04-12 da javob bergan). Import valyuta kursi muzlatish (kelgan kun/oy oxiri) sub-savol egasidan.
- **Manba:** BARCHA_JAVOBLAR POS Q35 (FIFO) ╳ v2 Q79-A (o'rtacha) — POS ustun
- **Dalil (kod):** Item 94 — partiya FIFO bor, lekin **GL narxi `material_cards.unit_price` dan olinadi, partiyadan emas** (QISM C #94). Item 94 buni «jadvalning o'z iqtibosidan boyroq» deb belgilaydi.
- **Nima yetishmaydi:** FIFO partiya narxining GL provodkasiga chinakam yetib borishi — hozir zaxira qiymati partiya narxi bilan emas, material kartochkasidagi yagona narx bilan hisoblanadi. Bu vizyon-qarorning (FIFO) amalda buzilishi.
- **Bog'liqlik:** EP-WMS-055 (FIFO tanlash), EP-WMS-109 (GL), EP-WMS-078 (partiya), Finance tannarx
- **action:** CREATE
- **⤳ Ta'sir:** Finance, PP tannarx
- **Xoch-havolalar:** `[Module-10] Item 94` · `EXTRACTION QISM C #94` · `TASDIQ-2146 §10 #94`
- **⚠️ ZIDDIYAT:** (1) Qaror darajasida: POS Q35 **FIFO** ╳ v2 Q79-A **o'rtacha tortilgan** — `decisions/` POS ni ustun deb hal qilgan (egasi 2026-04-12). (2) Qurilish darajasida: partiya-tanlash FIFO bo'yicha ishlaydi, **lekin GL narxi partiya narxi emas** — ya'ni kod hech qaysi variantni to'liq bajarmayapti (Q-40: «ishlaydi ≠ to'g'ri»). (3) Import valyuta kursini muzlatish (kelgan kun ╳ oy oxiri) hamon egasi-qaroriga.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-111 · Inventarizatsiya kamomadini mas'ul shaxsga bog'lash (v2 Q80)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har zona/material mas'ul shaxsga (материально-ответственное лицо) biriktiriladi; kamomad o'shanga. ShVB javobgarlik ruhi mos; model egasidan.
- **Manba:** v2-A (A-default) + ShVB (mas'uliyat)
- **Dalil (kod):** Item 95 — `warehouse_employees` + variance bor, lekin **avto-bog' yo'q** (QISM C #95). Item 33 (vision-1000 #33) — mas'ul ketsa/ta'tilda bo'lsa org-sxema bo'yicha o'rinbosar AVTO tayinlanishi **Yo'q** (org `head_user_id` = 0%, VISION-3340:707).
- **Nima yetishmaydi:** zona/material → mas'ul avto-bog'lanishi; kamomadni mas'ulga yozish; HR ta'til/safar buyrug'i tasdiqlanganda WMS ning avtomatik xabardor bo'lishi; mas'ulsiz zonada kamomad → oxirgi mas'ul + bevosita rahbari.
- **Bog'liqlik:** EP-WMS-060 (og'ish), EP-WMS-009, EP-WMS-124 (peresmenka), HR/Org
- **action:** CREATE
- **⤳ Ta'sir:** HR, Finance, ombor xavfsizlik
- **Xoch-havolalar:** `[Module-10] Item 95` · `[Module-10] Item 33` *(taxminiy)* · `EXTRACTION QISM C #95` · `TASDIQ-2146 §10 #95` · `vision-1000 #33`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-112 · Ombor ↔ POS Monitor (zavod tableti) rol ajratimi (v2 Q81)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — POS Monitor = tezkor sex-pol amallari (skan kirim/chiqim/sanoq) → bir DB; WMS = to'liq boshqaruv/hisobot. Bitta haqiqat manbai. POS Q1 "ERP ichida modul, ERP DB ning bir qismi"; memory: kanonik = `warehouse_stock`.
- **Manba:** BARCHA_JAVOBLAR POS Q1 + memory `project_pos_monitor_purpose` (zavod ombori tableti) + v2-A
- **Dalil (kod):** Item 96 — `current_stock` = view; POS ham WMS ham shu jadvalga yozadi → **Ha** (QISM C #96). Qoida 22 (CLAUDE.md) sidebar-darajasida ham buni qotirgan: POS = yagona `pos-monitor` yozuvi.
- **Nima yetishmaydi:** «bitta haqiqat manbai» tamoyili doim ushlanmasdi — Δ dagi ikki commit aynan shu drift'ni topgan.
- **Bog'liqlik:** EP-WMS-001 (kanonik zaxira), EP-WMS-002/075 (ombor ro'yxati), Qoida 22, VR-WMS-I22
- **action:** CREATE
- **⤳ Ta'sir:** POS, WMS, Finance
- **Xoch-havolalar:** `[Module-10] Item 96` · `EXTRACTION QISM C #96` · `TASDIQ-2146 §10 #96` · `I2-OMBOR Step-3 (POS↔Ombor birlashtirish)`
- **Δ 2026-07-11→08-07:** `1753ed0d` (2026-08-04) — `pos_stock_ledger.balance_after` mustaqil yig'ilgan yugurib boruvchi jami edi va ~15 boshqa yozuvchi (WMS goods-receipt, karantin release, delivery fulfillment) `warehouse_stock` ni bu ledger'ga tegmasdan yangilagani uchun drift qilishi mumkin edi; endi kanonik `warehouse_stock` dan o'qiydi. `993c5175` + `63ab63b0` + `9911a5d8` (2026-08-05..07) — WMS ╳ POS ombor-ro'yxati predikatlari uch joyda farqlanardi, hammasi bir konvensiyaga (`is_active=true AND deleted_at IS NULL`) tekislandi.

### EP-WMS-113 · Material "kim uchun kritik" teskari ko'rinish (v2 Q82)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — material → "ishlatiladigan mahsulotlar/buyurtmalar" teskari ko'rinish. Yetishmovchilik ta'sirini darhol baholash; model egasidan.
- **Manba:** v2-A (A-default) + kitob (texkarta material bog'liqligi)
- **Dalil (kod):** Item 97 — `tech_card_bom` bor (**n=0**, bo'sh), **endpoint yo'q** (QISM C #97).
- **Nima yetishmaydi:** teskari READ endpoint; BOM jadvalida jonli ma'lumot yo'q (master-data bo'shligi).
- **Bog'liqlik:** EP-WMS-108 (proaktiv signal), EP-WMS-084 (texkarta), PP
- **action:** READ
- **⤳ Ta'sir:** PP, ichki logistika, prioritet
- **Xoch-havolalar:** `[Module-10] Item 97` · `EXTRACTION QISM C #97` · `TASDIQ-2146 §10 #97`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-114 · Yetkazib beruvchi minimal partiya / qadoqlash birligi (v2 Q83)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman (egasi-data) *(2026-07-11)*
- **Talab:** A — min partiya + qadoqlash birligi → reorder yaxlitlanadi. Real buyurtma uchun; model egasidan (EP-WMS-065 bilan).
- **Manba:** v2-A (A-default) + kitob (Таъминот qadoqlash)
- **Dalil (kod):** Item 98 — `supplier_price_tiers` bor, lekin **qiymat to'ldirilmagan** (QISM C #98) → egasi-DATA.
- **Nima yetishmaydi:** min partiya va qadoqlash birligi qiymatlari (master-data CRUD orqali kiritilishi kerak); reorder miqdorini shu birlikka yaxlitlash mantiqi.
- **Bog'liqlik:** EP-WMS-065 (reorder), EP-WMS-068 (lead time), EP-WMS-120 (tender), EP-WMS-086 (poddon)
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MM, MRP
- **Xoch-havolalar:** `[Module-10] Item 98` · `EXTRACTION QISM C #98` · `TASDIQ-2146 §10 #98`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-115 · Zaxira aylanma tezligi (turnover days) ko'rsatkichi (v2 Q84)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — aylanma kunlari + signal (juda sekin/tez). EP-WMS-028/082 dead-stock dan farqli; chegaralar egasidan.
- **Manba:** v2-A (A-default) + ShVB (zaxira optimallashtirish)
- **Dalil (kod):** Item 99 — `inventory-turnover.service` + `reports/turnover` → **Ha** (QISM C #99). Item 34 (vision-1000 #34) — formula `(o'rtacha_zaxira_30kun / kunlik_sarf_30kun) × 1 kun`, 90/365 kunlik qo'shimcha ko'rsatkich — Qisman.
- **Nima yetishmaydi:** «juda tez» (xom-ashyo tugash xavfi → Tasnif+MM) va «juda sekin» (muzlatilgan kapital → Finance+Direktor) signal-marshrutlari; chegaralar `business_settings` CRUD ga.
- **Bog'liqlik:** EP-WMS-028/082 (dead-stock), EP-WMS-066 (max qoldiq), EP-WMS-126
- **action:** CREATE
- **⤳ Ta'sir:** Finance, Таъминот, director KPI
- **Xoch-havolalar:** `[Module-10] Item 99` · `[Module-10] Item 34` *(taxminiy — formula)* · `EXTRACTION QISM C #99` · `TASDIQ-2146 §10 #99` · `vision-1000 #34`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-116 · Ombor zonasi sig'imi to'lganlik foizi (import oldidan) (v2 Q85)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — zona sig'imi + band hajm → to'lganlik %; kirim oldidan tekshiriladi. Import katta partiyaga joy; model egasidan (EP-WMS-076 bilan).
- **Manba:** v2-A (A-default) + kitob (import partiya)
- **Dalil (kod):** Item 100 — **iqtibos nomuvofiqligi**: jadval `wms-overflow.service` ga havola qiladi, lekin bu servis butunlay boshqa funksiyani amalga oshiradi. Ya'ni QISM C #100 dagi «`wms-overflow.service` bor, sig'im to'ldirilmagan» dalili noto'g'ri servisga ishora qiladi.
- **Nima yetishmaydi:** to'lganlik% hisoblovchi; vision-1000 #35: **95%** da ogohlantirish (blok emas), **100%** da import PO **BLOKLANADI**, ombor boshlig'i qo'shimcha zona ko'rsatib override bera oladi (audit-logga tushadi) — Item 35 bo'yicha **Yo'q**.
- **Bog'liqlik:** EP-WMS-076 (yacheyka sig'imi), EP-WMS-073 (topologiya), EP-WMS-092 (import)
- **action:** READ
- **⤳ Ta'sir:** Таъминот, ichki logistika
- **Xoch-havolalar:** `[Module-10] Item 100` · `[Module-10] Item 35` *(taxminiy)* · `EXTRACTION QISM C #100` · `TASDIQ-2146 §10 #100` · `vision-1000 #35`
- **⚠️ ZIDDIYAT:** QISM C #100 `wms-overflow.service` ni dalil sifatida keltiradi ╳ Item 100 bu servis **aloqasiz funksiyani** bajarishini aniqlagan → iqtibos xato (STALE-DOC / citation mismatch). Chegaralar (95%/100%) esa `decisions/` da «egasidan» deyilgan, vision-1000 #35 da esa aniq berilgan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-117 · Brak/karantin materialni sexga chiqishini qattiq bloklash (v2 Q86)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — brak/karantin statusli material chiqimda qat'iy bloklanadi (tizim ruxsat bermaydi). POS Q30 karantin bloklash + Q38 minus/blok mantiq; kitob brak oldini olish.
- **Manba:** BARCHA_JAVOBLAR POS Q30 + Q38 + v2-A
- **Dalil (kod):** Item 101 — `wms-quarantine-gate.service.ts:84-101` `canPostToMain` BLOK → **Ha** (QISM C #101). Item 46 (vision-1000 #46) — blok BE service **va DB trigger** (ikki qatlam) bo'lishi kerak: Qisman.
- **Nima yetishmaydi:** ikkinchi himoya qatlami — DB trigger + CHECK constraint (IT texnik to'g'ridan SQL yozsa ham ushlab qolish) tasdiqlanmagan.
- **Bog'liqlik:** EP-WMS-016/048 (karantin darvoza), EP-WMS-056 (manfiy saldo), EP-WMS-084
- **action:** EVENT
- **⤳ Ta'sir:** QC, MES, ichki logistika
- **Xoch-havolalar:** `[Module-10] Item 101` · `[Module-10] Item 46` *(taxminiy — ikki qatlam)* · `EXTRACTION QISM C #101` · `TASDIQ-2146 §10 #101` · `vision-1000 #46`
- **Δ 2026-07-11→08-07:** `ee4ecc26` (2026-08-04) — blokning **ikkinchi chetlab-o'tish yo'li** yopildi: MM goods-receipt yozuvi karantin holat-mashinasini o'qimasdan to'g'ridan `warehouse_stock` ga yozardi. Endi ikkala yozuv yo'li bir holat-mashinani baham ko'radi (WMS ning `normalizeStatus`/`QUARANTINE_STATUS` sof funksiyalari orqali, DI bog'liqligisiz), SERIALIZABLE + `FOR UPDATE` ichida. Vision-1000 #46 ning «DB trigger» ikkinchi qatlami hamon yo'q.

### EP-WMS-118 · Yetkazib beruvchidan kam/ortiq kelganda tolerantlik (v2 Q87)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — ±% tolerantlik (masalan ±2%) ichida avto-qabul, tashqarisida tasdiqlash. Rulon vazni aniq emas; aniq % egasidan (EP-WMS-047/050 bilan).
- **Manba:** v2-A (A-default) + kitob (rulon vazn farqi)
- **Dalil (kod):** Item 102 — `quarantine-gate.service.ts:126-157` tolerans mexanizmi → **Ha** (aniq % egasi-DATA). Item 43 (vision-1000 #43) — tolerans **MIQDOR (kg)** asosida: 2% avto-qabul, 5% ombor boshlig'i tasdig'i — Qisman (`receiptQtyOutOfTolerance` i18n bor).
- **Nima yetishmaydi:** aniq % qiymatlari `business_settings` CRUD ga (default 2% / 5%); qolgan miqdor uchun da'vo MM orqali **qo'lda** (avtomatik emas).
- **Bog'liqlik:** EP-WMS-047 (3-way match), EP-WMS-050 (tarozi), EP-WMS-049 (qisman qabul), EP-WMS-091
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, kirim, Finance
- **Xoch-havolalar:** `[Module-10] Item 102` · `[Module-10] Item 43` *(taxminiy)* · `EXTRACTION QISM C #102` · `TASDIQ-2146 §10 #102` · `vision-1000 #43`
- **⚠️ ZIDDIYAT:** `decisions/` «aniq % egasidan» (🔵 OCHIQ) ╳ vision-1000 #43 egasi aniq bergan: **2% avto / 5% boshliq tasdig'i, MIQDOR (kg) asosida**. Qaror amalda javoblangan; qiymatlar `business_settings` CRUD ga qo'yilishi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-119 · Ombor/ichki logistika ЦКП KPI (bekor turish + kechikishlar) (v2 Q88)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ombor KPI paneli (logistika kechikishlari + reja bajarilishi% + bekor turish daqiqalari). Kitob aniq statistikalar: "Ички логистика сабабли кечикишлар сони", "режа бажарилиш даражаси (%)". Karta-AI baho sub-savol (IchLog boshlig'i kartasiga / faqat bo'lim).
- **Manba:** kitob (ichki logistika statistikalari) + karta-model + v2-A
- **Dalil (kod):** Item 103 — `warehouse_kpi_cache` bor, lekin **AI-baho bog'lanishi to'liq emas** (QISM C #103). QISM A Step-3: «Karta-model integratsiya (omborchi GSD + razryad→vakolat) MISSING» (SB0535/SB0577).
- **Nima yetishmaydi:** KPI keshini o'qiydigan panel; karta-AI baho bog'lanishi (`CARD_PERMISSION_SOURCE_READY=false`); qaysi kartaga (IchLog boshlig'i ╳ butun bo'lim) — egasi sub-savoli.
- **Bog'liqlik:** EP-WMS-023 (GSD), EP-WMS-088 (bekor turish), EP-WMS-087 (rohler), Org karta-model
- **action:** CREATE
- **⤳ Ta'sir:** org-karta KPI, MES, director
- **Xoch-havolalar:** `[Module-10] Item 103` · `EXTRACTION QISM C #103` · `TASDIQ-2146 §10 #103` · `EXTRACTION QISM A Step-3 (SB0535/SB0577)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-120 · Reorderda bir nechta beruvchiga tender (taklif solishtirish) (v2 Q89)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — reorder → 2-3 beruvchiga so'rov → taklif solishtirish → tanlash. Kitob Таъминот ko'p beruvchi bilan; narx optimal; model egasidan (ShVB ZVS bilan).
- **Manba:** v2-A (A-default) + kitob (Таъминот) + ShVB
- **Dalil (kod):** Item 104 — tender oqimi **topilmadi** (QISM C #104). Item 48 (vision-1000 #48) — reorder signalida ERP ichida so'rovnoma + email; yetkazuvchi N kun (standart **3 ish kuni**) javob bermasa **KEYINGI YETKAZUVCHIGA** o'tiladi; javob bermaganning reytingiga «javob kechikdi» salbiy ball — **Yo'q**.
- **Nima yetishmaydi:** tender oqimining hech bir bo'g'ini yo'q; N kun chegarasi `business_settings` CRUD ga (default 3 ish kuni).
- **Bog'liqlik:** EP-WMS-065 (reorder), EP-WMS-094 (reyting), EP-WMS-012 (avto PR), MM
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MM, Finance
- **Xoch-havolalar:** `[Module-10] Item 104` · `[Module-10] Item 48` *(taxminiy)* · `EXTRACTION QISM C #104` · `TASDIQ-2146 §10 #104` · `vision-1000 #48`
- **⚠️ ZIDDIYAT:** `decisions/` «model egasidan» ╳ vision-1000 #48 modelni to'liq bergan (so'rovnoma+email, 3 ish kuni, keyingi yetkazuvchiga o'tish, reytingga salbiy ball). Qaror amalda javoblangan.
- **Δ 2026-07-11→08-07:** —

### EP-WMS-121 · Ish vaqtidan tashqari ombor amali nazorati (v2 Q90)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ish vaqtidan tashqari amal alohida belgilanadi (sabab + tasdiq). POS Q6 to'liq audit (timestamp); HR Q108/Q112 ish vaqtidan tashqari harakat hujjat+sabab madaniyati; kitob qat'iy smena/tanaffus.
- **Manba:** BARCHA_JAVOBLAR POS Q6 + HR Q108/Q112 + kitob (smena) + v2-A
- **Dalil (kod):** Harakat yozuvlarida `created_at` bor (POS Q6 auditi bajarilgan), lekin uni **smena jadvaliga solishtirib** "ish vaqtidan tashqari" deb belgilaydigan mantiq topilmadi; sabab+tasdiq talab qiluvchi gate ham yo'q.
- **Nima yetishmaydi:** Smena oynasi bilan solishtirish + tashqari-amal uchun sabab/tasdiq darvozasi. ⚠️ Smena oynasi `business_settings` orqali CRUD bo'lishi kerak (`1e263329` naqshi).
- **Bog'liqlik:** HR (smena jadvali), audit
- **action:** EVENT
- **⤳ Ta'sir:** HR (smena), audit, xavfsizlik
- **Xoch-havolalar:** `TASDIQ-2146 §10 #90` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-122 · Yangi material kartochkasi ochish huquqi + dublikat ogohlantirish (v2 Q91)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — yangi kartochka faqat MM roli + tasdiq + o'xshash nom ogohlantirishi. POS Q18 "skanlashda topilmasa → yangi kartochka yaratish"; HR Q51 dublikat oldini olish (pasport+INPS+telefon) — material uchun analog mantiq.
- **Manba:** BARCHA_JAVOBLAR POS Q18 + HR Q51 (dublikat) + memory (master-data dublikat) + v2-A
- **Dalil (kod):** `drizzle-material.repo.ts:141` — "B11 duplicate-prevention: `material_cards.kod` already has a DB-level" (kod bo'yicha qattiq dublikat-taqiq **bor**).
- **Nima yetishmaydi:** **O'xshash NOM ogohlantirishi yo'q** — faqat aynan kod takrorlanishi bloklanadi, "Qog'oz 120g" ╳ "Qogoz 120 g" kabi yaqin nomlar o'tib ketadi. Yaratish uchun MM-roli tasdig'i ham alohida gate sifatida topilmadi.
- **Bog'liqlik:** MM (master-data egaligi), EP-WMS-045
- **action:** CREATE
- **⤳ Ta'sir:** MM, master-data, barcha modullar
- **Xoch-havolalar:** `TASDIQ-2146 §10 #91` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-123 · Material kim uchun: bizniki ╳ mijoz moli (davalcheskiy) (v2 Q92)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — har zaxiraga "egasi" (biz/mijoz X), mijoz materiali faqat o'sha mijoz buyurtmasiga. Kitob "материалы заказчика" (давальческий) tushunchasi mavjud.
- **Manba:** kitob (материалы заказчика/давальческий) + v2-A
- **Dalil (kod):** `information_schema` — `warehouse_stock`/`material_cards` da egalik ustunlari (`owner_type`/`owner_customer_id`/`is_customer_owned` naqshi bo'yicha) **3 ta topildi**, ya'ni egalik modeli qisman mavjud.
- **Nima yetishmaydi:** Egalik **majburlanmaydi** — mijoz materialini boshqa mijoz buyurtmasiga chiqarishni to'sadigan gate topilmadi. Belgi bor, qoida yo'q.
- **Bog'liqlik:** EP-WMS-133 (ijara), SD, Finance
- **action:** CREATE
- **⤳ Ta'sir:** SD, ichki logistika, Finance (mulk emas)
- **Xoch-havolalar:** `TASDIQ-2146 §10 #92` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-124 · Smenalararo qoldiq topshirish (peresmenka akti) (v2 Q93)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — smena oxirida kalit materiallar qoldig'i qayd etilib keyingi smenaga topshiriladi (elektron akt). Kitob "3 сменалик" ishlab chiqarish; javobgarlik smenaga; model egasidan.
- **Manba:** v2-A (A-default) + kitob (3 смена)
- **Dalil (kod):** Ombor tomonida smena-topshirish akti topilmadi. ⚠️ MES tomonida smena-handover **bor** (`iot-tablet.controller.ts` `tablet/handover`, `submitHandover`), lekin u ishlab-chiqarish sessiyasiga tegishli, ombor qoldig'iga emas.
- **Nima yetishmaydi:** Ombor peresmenka akti entiteti. ⚠️ Qaror ham ochiq: qaysi materiallar "kalit" deb hisoblanadi — model egasidan.
- **Bog'liqlik:** HR (smena), MES (handover naqshi qayta ishlatilishi mumkin), inventarizatsiya
- **action:** CREATE
- **⤳ Ta'sir:** HR (smena), MES, inventarizatsiya
- **Xoch-havolalar:** `TASDIQ-2146 §10 #93` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-125 · Material qaytib ishlatish (vtorichka) — chala rulon/kesindi qaytishi (v2 Q94)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — yaroqli qoldiq "ikkilamchi" sifatida qaytadi (sifati past belgisi). Kitob qoldiq chiqarish vazifasi; POS Q24 INTERNAL_RETURN (sabab majburiy).
- **Manba:** kitob (қолдиқ) + BARCHA_JAVOBLAR POS Q24 + v2-A
- **Dalil (kod):** `pos-warehouse-integration-movement.service.ts:20` — `INTERNAL_RETURN` harakat turi **mavjud** va `:10` izohiga ko'ra DRAFT holatida (tasdiq talab qilmaydi).
- **Nima yetishmaydi:** Qaytgan material uchun **"ikkilamchi/past sifat" belgisi yo'q** — u asl material bilan bir xil zaxiraga qo'shiladi, keyin FIFO uni yangi material kabi tanlaydi. Sifat-darajasi maydonisiz vizyon talabi bajarilmaydi.
- **Bog'liqlik:** QC (sifat darajasi), FIFO/FEFO tanlash, Finance
- **action:** CREATE
- **⤳ Ta'sir:** ichki logistika, Finance, QC
- **Xoch-havolalar:** `TASDIQ-2146 §10 #94` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-126 · Material yoshi (saqlanish vaqti) eskirish signali (v2 Q95)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — kirim sanasidan yosh, ogohlantirish chegarasi (masalan 6 oy); eski material avval ishlatiladi. Qog'oz namlik tortadi; chegara egasidan.
- **Manba:** v2-A (A-default) + vizyon (qog'oz eskirishi)
- **Dalil (kod):** `warehouse_stock` da `received_at`/`shelf_life_days`/`expiry_date`/`manufactured_at` ustunlaridan **hech biri yo'q** (`information_schema` → 0). Ya'ni materialning yoshini hisoblash uchun sana manbasi umuman mavjud emas.
- **Nima yetishmaydi:** Kirim sanasi ustuni (⚠️ **Q-35 — yangi ustun, egasi ruxsati kerak**) + eskirish cron'i + chegara (`business_settings` CRUD orqali, egasidan qiymat).
- **Bog'liqlik:** FIFO (EP-WMS-027), dead-stock, QC
- **action:** CRON
- **⤳ Ta'sir:** FIFO, dead-stock, QC
- **Xoch-havolalar:** `TASDIQ-2146 §10 #95` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-127 · Namlik/harorat sharoiti buzilganda signal (IoT) (v2 Q96)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — IoT datchik → chegaradan chiqsa signal + log. Qog'oz namlikka sezgir; signal-oluvchi (ombor+QC / faqat ko'rinish) sub-savol egasidan.
- **Manba:** v2-A (A-default) + memory (IoT mavjud, anomaly stub)
- **Dalil (kod):** IoT telemetriya infratuzilmasi bor (`mes_telemetry`, `record-sensor-reading.handler.ts`), lekin **jismoniy namlik/harorat datchigi o'rnatilmagan** — avtomatik push qiluvchi manba yo'q, faqat qo'lda HTTP ingest.
- **Nima yetishmaydi:** Jismoniy datchik (⚠️ **egasi-CAPEX qarori**) + chegara-qoidasi + signal marshruti. Kod tomoni datchik kelgach qurilishi mumkin.
- **Bog'liqlik:** IoT (jismoniy uskuna), QC, MM
- **action:** EVENT
- **⤳ Ta'sir:** IoT, QC, MM
- **Xoch-havolalar:** `TASDIQ-2146 §10 #96` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-128 · Bo'yoq/kley/lak maxsus saqlash sharti va zona (v2 Q97)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — maxsus materialga "saqlash sharti" + "xavf turi" maydoni, alohida zona. Bosma/karton zavodi yong'in xavfi; EP-WMS-045 bilan; model egasidan.
- **Manba:** v2-A (A-default) + vizyon (bo'yoq/kley xavfi)
- **Dalil (kod):** Zona infratuzilmasi mavjud (`warehouse_zones`, `WarehouseZonesPage.tsx`), lekin materialga "saqlash sharti"/"xavf turi" maydoni va zonaga majburlash qoidasi topilmadi.
- **Nima yetishmaydi:** Xavf-turi maydoni (⚠️ Q-35 — yangi ustun) + zona-moslik gate. ⚠️ Qaror ham ochiq: xavf tasnifi (yong'in/zaharli/muzlash) egasidan.
- **Bog'liqlik:** EP-WMS-045 (zona), QC, xavfsizlik
- **action:** CREATE
- **⤳ Ta'sir:** MM, QC, xavfsizlik
- **Xoch-havolalar:** `TASDIQ-2146 §10 #97` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-129 · Rulondan kesilgan formatlar (list) zaxirasi (v2 Q98)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — kesish operatsiyasi rulon (kg) ni kamaytirib list (dona) zaxirasini yaratadi (ikki o'lchov bog'lanadi). MES kesish bilan; model egasidan.
- **Manba:** v2-A (A-default) + kitob (kesish/sex zaxirasi)
- **Dalil (kod):** Kesish operatsiyasi natijasida bir zaxira turini ikkinchisiga aylantiruvchi (kg→dona) konversiya-yozuv topilmadi. `unit_of_measures` bor, lekin operatsiya-darajasidagi transformatsiya yo'q.
- **Nima yetishmaydi:** Kesish→zaxira-transformatsiya hodisasi va ikki o'lchov o'rtasidagi bog'lanish. ⚠️ Konversiya formulasi (rulon eni/uzunligi→list soni) egasidan.
- **Bog'liqlik:** MES (kesish operatsiyasi), EP-WMS-027 (FIFO)
- **action:** CREATE
- **⤳ Ta'sir:** MES (kesish), ichki logistika
- **Xoch-havolalar:** `TASDIQ-2146 §10 #98` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-130 · Material namuna/probnik chiqimini alohida hisoblash (v2 Q99)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — "namuna chiqimi" alohida sabab kodi, kichik miqdor — kamomad emas, izlanadi. POS Q21 sabab-kodli chiqimga mos; model egasidan.
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q21 (sabab-kod)
- **Dalil (kod):** Sabab-kodli chiqim mexanizmi **mavjud** (POS harakat turlari + reason-code naqshi, `pos_movements`), ya'ni poydevor bor.
- **Nima yetishmaydi:** "Namuna/probnik" alohida sabab kodi seed qilinmagan va u inventarizatsiya farqidan (kamomad) ajratilmaydi.
- **Bog'liqlik:** EP-WMS-131 (inventarizatsiya), QC, dizayn
- **action:** CREATE
- **⤳ Ta'sir:** QC, dizayn, Finance
- **Xoch-havolalar:** `TASDIQ-2146 §10 #99` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-131 · Inventarizatsiyani ABC bo'yicha chastotaga ajratish (sikl sanoq) (v2 Q100)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ABC ga qarab sanoq chastotasi (A-haftalik, B-oylik, C-yillik). POS Q52 aylanma inventarizatsiya + POS Q56 ABC tahlil → birgalikda; EP-WMS-027/058 bilan.
- **Manba:** BARCHA_JAVOBLAR POS Q52 + Q56 + v2-A
- **Dalil (kod):** `wms-cycle-count-generator.cron.ts` **mavjud** va `count-accuracy-alert.cron.ts:49` izohiga ko'ra "06:00 cycle-count generatoridan keyin" ishlaydi — sikl-sanoq generatori real va ulangan.
- **Nima yetishmaydi:** Generator **ABC sinfiga qarab chastotani ajratadimi** — tasdiqlanmadi. ABC tahlili alohida mavjud (`wms-catalog` ABC), lekin ikkalasining bog'lanishi (A→haftalik, B→oylik, C→yillik) kodda ko'rinmadi.
- **Bog'liqlik:** EP-WMS-027/058, ABC tahlili
- **action:** CRON
- **⤳ Ta'sir:** inventarizatsiya, Finance, ABC
- **Xoch-havolalar:** `TASDIQ-2146 §10 #100` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-132 · Kirim/chiqim blankasini chop etish va ikki imzo (v2 Q101)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — tizim blanka chop etadi (QR), ikki imzo, skani biriktiriladi. POS Q41 harakat akti PDF + Q19 label chop; HR Q77/Q104 har hujjat ERP da yoziladi + pechat + imzo statusi.
- **Manba:** BARCHA_JAVOBLAR POS Q41 + Q19 + HR Q77/Q104 + v2-A
- **Dalil (kod):** POS tomonida harakat-akti chiqarish infratuzilmasi bor (`pos.events.ts`, `pos-event.repository.ts`). ⭐ **Ikki-imzo naqshi bugun material-kit uchun haqiqiy qurildi** (`f318bbfe`): `confirmed_by` yoziladi va `prepared_by === confirmed_by` bo'lsa rad etiladi — ya'ni bitta odam ikkala imzoni qo'ya olmaydi.
- **Nima yetishmaydi:** Shu naqsh **umumiy kirim/chiqim blankasiga tarqatilmagan** — hozircha faqat material-kit oqimida. Skan biriktirish ham topilmadi.
- **Bog'liqlik:** EP-WMS-134 (audit izi), Finance, EP-MES-080 (2-imzo naqshi)
- **action:** EXPORT
- **⤳ Ta'sir:** audit, Finance, ombor
- **Xoch-havolalar:** `TASDIQ-2146 §10 #101` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** `f318bbfe` — ikki-imzoli tasdiqlash naqshi (`confirmed_by` + o'z-tasdiqlash taqig'i) material-kit oqimida real qurildi; bu band uchun qayta ishlatiladigan poydevor.

### EP-WMS-133 · Ombor ijarasi (mijoz molini saqlash) hisobi va to'lov (v2 Q102)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — mijoz moli alohida belgi, qiymatsiz (bizniki emas) + ijara Finance'ga oylik. Kitob давальческий + kod `wms-rental`; tarif (hajm×kun / oylik fiks / poddon×kun) sub-savol egasidan.
- **Manba:** v2-A (A-default) + kitob (заказчик moli) + kod `wms-rental`
- **Dalil (kod):** `wms-rental` havolasi **2 faylda topildi** (`director-extended.controller.ts`, `receive-fg.handler.ts`) — tushuncha kodda mavjud. Egalik ustunlari ham bor (EP-WMS-123).
- **Nima yetishmaydi:** Ijara **hisob-kitobi va Finance'ga oylik yozuvi** topilmadi. ⚠️ Tarif modeli (hajm×kun / oylik fiks / poddon×kun) — **egasi qarori**, fabrikatsiya qilinmaydi.
- **Bog'liqlik:** EP-WMS-019/020/123, Finance (daromad)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (daromad), SD, ombor
- **Xoch-havolalar:** `TASDIQ-2146 §10 #102` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **Δ 2026-07-11→08-07:** —

### EP-WMS-134 · Ombor ichida ko'chirish (peremeshcheniye) izi (v2 Q103)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — har ko'chirish (eski→yangi joy + kim) qayd etiladi, joriy joy doim aniq. POS Q25 INTERNAL_TRANSFER + Q6 to'liq audit (har o'zgarish); EP-WMS-074 bilan.
- **Manba:** BARCHA_JAVOBLAR POS Q25 + Q6 + v2-A
- **Dalil (kod):** `pos-warehouse-integration-movement.service.ts:20` — `INTERNAL_TRANSFER` turi **mavjud**, `:33` da `OUTBOUND_TYPES` ro'yxatiga kiritilgan (zaxiradan chiqim sifatida hisoblanadi).
- **Nima yetishmaydi:** Ko'chirish **eski→yangi joy juftligini** saqlaydimi — tasdiqlanmadi; `OUTBOUND_TYPES` ga kiritilgani shuni ko'rsatadiki, ko'chirish chiqim sifatida yoziladi, ya'ni **kirim tomoni (yangi joy) alohida yozilmasligi mumkin**. Bu holda "joriy joy doim aniq" talabi bajarilmaydi.
- **Bog'liqlik:** EP-WMS-074 (locator), audit
- **action:** CREATE
- **⤳ Ta'sir:** locator, audit, ichki logistika
- **Xoch-havolalar:** `TASDIQ-2146 §10 #103` · `— (FULL-ITEM-LEVEL da mos item topilmadi)`
- **⚠️ ZIDDIYAT:** Qaror "har ko'chirish eski→yangi joy bilan qayd etiladi" deydi, lekin kod ko'chirishni faqat **chiqim** (`OUTBOUND_TYPES`) sifatida ko'radi — juft yozuv (chiqim+kirim) mexanizmi tasdiqlanmadi.
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz bandlar

> `vision-1000-answers/10-warehouse.md` va **I2 OMBOR·POS·KASSIR·TA'MINOT intervyusi**dan
> kelgan, EP-kodi berilmagan bandlar.

### VR-WMS-I01 · `FULL-ITEM-LEVEL` WMS bo'limi EP-WMS-121..134 ni qamramaydi
- **Qaror holati:** — (metodologik topilma)
- **Qurilish holati:** — (qo'llanilmaydi)
- **Talab:** Har vizyon-bandi kamida bitta kod-tekshiruviga ega bo'lishi kerak.
- **Dalil (kod):** `[Module-10]` bo'limida 121 item bor; `TASDIQ-2146 §10 #90..#103` (= EP-WMS-121..134) uchun mos item **topilmadi**. 14 band uchun 2026-07-11 sanali tekshiruv mavjud emas.
- **Nima yetishmaydi:** Shu sababli 14 bandning qurilish holati **2026-08-07 da jonli koddan qayta aniqlandi** (har birida `(2026-08-07, jonli tekshiruv)` deb belgilangan).
- **⤳ Ta'sir:** Bir xil qamrov teshigi QC (`EP-QC-121..134`, 13 band) va PP (`EP-PP-051..065`, 15 band) da ham topilgan — **tizimli, bitta modulga xos emas**.

### VR-WMS-I02 · Ikki-imzo naqshi endi mavjud, lekin faqat bitta oqimda
- **Qaror holati:** ✅ JAVOBLANGAN (EP-WMS-132 orqali)
- **Qurilish holati:** Qisman *(2026-08-07)*
- **Talab:** Ombor hujjatlarida ikki shaxs tasdig'i — bitta odam ikkala imzoni qo'ya olmasligi kerak.
- **Dalil (kod):** `f318bbfe` — `PATCH /warehouse/material-kits/:id/status` endi `confirmed_by` yozadi va `prepared_by === confirmed_by` bo'lsa rad etadi. Bu — loyihadagi **birinchi haqiqiy ikki-imzo majburlashi**.
- **Nima yetishmaydi:** Umumiy kirim/chiqim blankasi (EP-WMS-132), inventarizatsiya yopilishi va boshqa ombor hujjatlarida shu naqsh qo'llanilmagan.
- **⤳ Ta'sir:** EP-WMS-132, EP-MES-080, inventarizatsiya

---

## III QISM — Xoch-havola va raqamlash

### 3.1 Raqamlash siljishi

| Manba | Diapazon | EP-WMS ga moslik |
|---|---|---|
| `decisions/10-warehouse.md` I QISM (v1) | Q1..Q30 | `EP-WMS-001..030` (1:1) |
| `decisions/10-warehouse.md` II QISM (v2) | Q1..Q103 | `EP-WMS-031..134` (`EP = 31 + Qn − 1`) |
| `TASDIQ-2146 §10` | #1..#103 | v2 bilan bir xil tartib |
| `FULL-ITEM-LEVEL [Module-10]` | Item 1..121 | EP-WMS-121..134 uchun **mos item yo'q** (VR-WMS-I01) |
| `vision-1000-answers/10-warehouse.md` | #1..#50 | EP-kodsiz, mavzu bo'yicha |

### 3.2 Bu sessiyada aniqlangan qurilish holati (14 band)

| EP | Qurilish | Asosiy dalil |
|---|---|---|
| 121 | Yo'q | smena-oynasi bilan solishtirish yo'q |
| 122 | Qisman | kod-dublikat DB-darajada bloklangan; **o'xshash nom** ogohlantirishi yo'q |
| 123 | Qisman | egalik ustunlari (3) bor; majburlash gate yo'q |
| 124 | Yo'q | ombor peresmenka akti yo'q (MES handover boshqa narsa) |
| 125 | Qisman | `INTERNAL_RETURN` bor; **"ikkilamchi sifat" belgisi yo'q** |
| 126 | Yo'q | `warehouse_stock` da kirim-sana ustuni **umuman yo'q** (Q-35) |
| 127 | Yo'q | jismoniy datchik yo'q (egasi-CAPEX) |
| 128 | Yo'q | xavf-turi maydoni yo'q |
| 129 | Yo'q | kg→dona transformatsiya yo'q |
| 130 | Qisman | sabab-kod mexanizmi bor; "namuna" kodi seed qilinmagan |
| 131 | Qisman | `wms-cycle-count-generator.cron.ts` real; ABC↔chastota bog'lanishi tasdiqlanmadi |
| 132 | Qisman | akt-infratuzilmasi bor; ikki-imzo faqat material-kitda |
| 133 | Qisman | `wms-rental` tushunchasi kodda bor; ijara hisobi yo'q |
| 134 | Qisman | `INTERNAL_TRANSFER` bor; juft (chiqim+kirim) yozuv tasdiqlanmadi |

### 3.3 Kesishuvchi bloklovchilar

- **BL-WMS-01 — `warehouse_stock` da kirim/ishlab-chiqarilgan sana ustuni yo'q.** EP-WMS-126 (eskirish signali) butunlay shunga tayanadi, EP-WMS-027 (FIFO) ham sanaga muhtoj. ⚠️ **Q-35 — yangi ustun, egasi ruxsati kerak.**
- **BL-WMS-02 — sifat-darajasi maydoni yo'q.** EP-WMS-125 (ikkilamchi material) qurilmaydi: qaytgan qoldiq yangi material bilan bir xil zaxiraga tushadi va FIFO uni ajratmaydi.
- **BL-WMS-03 — jismoniy datchik yo'q.** EP-WMS-127 — sof **egasi-CAPEX** qarori, kod tomoni tayyor bo'lishi mumkin.
- **BL-WMS-04 — tarif/konversiya modellari egasidan.** EP-WMS-133 (ijara tarifi), EP-WMS-129 (rulon→list formulasi), EP-WMS-124 ("kalit material" ta'rifi), EP-WMS-126 (eskirish chegarasi), EP-WMS-128 (xavf tasnifi) — beshtasi ham **fabrikatsiya qilinmaydigan biznes-qiymatlar**. ⚠️ Memory qoidasiga ko'ra bular chatda so'ralmaydi: `business_settings` ga default bilan qo'shilib, CRUD orqali sozlanadi.
