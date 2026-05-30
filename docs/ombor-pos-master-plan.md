# EuroPrint — Ombor + Moliya nazorat tizimi — TO'LIQ MASTER REJA

> Sana: 2026-05-30 · Manba: Maxboy bilan 74+ savolli intervyu + vizyon + mavjud kod tahlili.
> Holat: FAZA 0 + FAZA 1 (P2P yadro) + FE boshlanishi BAJARILDI; qolgani quyida batafsil.
> Bu hujjat — yagona haqiqat manbai (single source of truth) butun qurilish uchun.

---

## 0. KONTEKST VA MAQSAD

Bu shunchaki "POS modul" EMAS — **moliya tomonidan to'liq nazorat qilinadigan, ko'p-omborli,
barcode-asosli material nazorat tizimi**. Har narsa (eng kichigigacha — "piyozgacha") barcode/QR
oladi; har xarid ombordan prixod + kassadan rasxod bo'lib o'tadi; xodim/ta'minotchi **podotchet**
bilan javobgar; bo'limlar tur-omborlardan oladi va nimaga ishlatganini (zakazga bog'lab) yozadi.

**Muammo:** mavjud ombor (ERP WMS) va POS Monitor **interfeysi rasvo**; data-model qisman, P2P
zanjiri ulanmagan, concurrency zaif. **Yechim:** yangi toza tizim qurish (config-driven), mavjud
real kodni qayta ishlatib, eski rasvo UI'ni bosqichma-bosqich almashtirish.

---

## 1. ASOSIY TAMOYILLAR (har qadamda amal qilinadi)

1. **Moliya markazda** — markaziy ombor YO'Q; o'rniga moliya rahbari dashboard. Har harakat → GL.
2. **Config-driven (kengaytiriladigan)** — ombor turi/akt/bildirishnoma/dashboard config jadval orqali;
   yangi tur = 1 qator (kod o'zgartmasdan). "hammasi + yana qo'shamiz" → `rules` JSONB.
3. **Toza boshlash** — eski ombor data arxivlanadi; yangi tuzilma erkin quriladi.
4. **Mavjudni qayta ishlatish (DUPLIKAT YO'Q)** — yangi jadval faqat mavjud mos kelmasa.
5. **Verify-don't-trust** — har da'vo jonli kod/DB bilan tasdiqlanadi (audit/xotira yetarli emas).
6. **Additive (buzmaslik)** — har o'zgarish qo'shimcha; schema ADD-ONLY; mavjud ishlaydigan kod buzilmaydi.
7. **Yarim ish YO'Q** — har increment = aniq reja → to'liq bajarish → BE/FE tsc 0 → jonli test → commit.
8. **Rasvo qaytmasin** — har FE sahifa EP dizayn-tizim komponentlari + token (Qoida 21) + tLabel i18n.
9. **DB jarayoni** — Maxboy ruxsat beradi → migration .sql + jonli DB qo'llash. Branch: chore/schema-convergence (selective add).

---

## 2. ARXITEKTURA

### 2.1 Ombor taksonomiyasi (config-driven — `warehouse_types` jadval)
| Tur (code) | Nomi | Kirim | Chiqim | Maxsus |
|---|---|---|---|---|
| raw_material | Hom ashyo | P2P→karantin→QC | ishlab chiqarishga | — |
| paper_rolls | Rulon qog'oz | P2P→karantin→QC | ishlab chiqarishga | **har rulon QR, kg** |
| household_mro | Ho'jalik | P2P | iste'mol (podotchet) | sarflanadi |
| finished_goods | Tayyor mahsulot | MES→QC | sotuv-buyurtmaga + faktura | make-to-order |
| production | Ishlab chiqarish | i.ch.+brak | rework/utilizatsiya | brak ko'rinadi |
| defective | Brak/defekt | QC rad | rework/utilizatsiya/qaytarish | akt |
| waste_paper | Makulatura | i.ch. chiqindisi | sotish/qayta ishlash | qiymati moliyaga |
| tools_equipment | Asbob-uskuna | P2P | kichik→Inventarlarim; katta→akt | qaytariladi |
| department_warehouse | Bo'lim ombori | tur-ombordan transfer | zakazga sarf | org-sxema, norma |

Karantin = oraliq HOLAT (alohida ombor emas). Markaziy ombor YO'Q → Moliya dashboard.

### 2.2 P2P xarid-to'lov zanjiri (YADRO)
```
1. SO'ROV   — Ichki ta'minotchi (snabjenets, maxsus rol): nima/qancha/qayerdan/qachon → Kommunikatsiya markazi
2. TASDIQ   — Org-sxema bo'yicha DIREKTORGACHA; oradagi HAR rahbar ketma-ket (summaga qarab daraja)
3. PUL      — Kassir: avans (podotchet) YOKI o'z puli→reimburse (rahbar/moliya belgilaydi)
4. XARID    — Ta'minotchi tashqi vendordan (qo'lda tanlaydi) + logistika (narx→tannarx)
5. CHEK-BOT — Telegram: chek rasmi + AI/OCR → 3-tomonlama solishtiruv (chek+summa+kirim)
6. KIRIM    — Ombor prixod (tegishli tur) + barcode/QR avto + chop
7. RECONCILE— Ombor kirimdan keyin ta'minotchi podotchetidan pul yechiladi (yopiladi)
```
Har bosqich Moliya GL'ga aks etadi. Bu zanjir HAMMA omborda bir xil.

### 2.3 Cross-cutting
- **Barcode/QR:** hammasiga; kirimda avto + termal printer (ZPL/EPL); tur-maxsus shablon. Skan: USB/BT + kamera.
- **Podotchet:** xodim/ta'minotchi balansida (qaytar/hisob berguncha). Kichik asbob→Inventarlarim; katta→akt.
- **Moliya:** auto GL (Debit/Credit, AI tavsiya nostandartga) → moliya tasdiq; FIFO tannarx; bo'lim byudjet/norma (AI tavsiya); ko'p-valyuta (original+UZS).
- **Inventarizatsiya:** davriy to'liq + kunlik cycle; farq → moliya tasdiq + GL.
- **Hujjat:** PDF aktlar (kirim/chiqim+faktura/utilizatsiya/asbob/dalolatnoma) — config-driven. Raqam: Ombor+Tur+Yil+ketma-ket.
- **Dashboard:** ombor qoldiq+qiymat · bo'lim rasxodi · podotchet qarz · kassa · real-time.
- **Auth:** ERP SSO/JWT + offline (skan+kirim/chiqim local→sync). Ruxsat: ombor/bo'lim + org-sxema ierarxiyasi.
- **Tasdiq delegatsiyasi:** rahbar ta'til/kasal → org-sxema o'rinbosari.
- **Tayyor mahsulot:** make-to-order, AI rejalashtiradi (BOM+rezerv+i.ch.→buyurtmaga).
- **Material 360:** har inventar to'liq profil (qoldiq/qiymat/tarix/narx/QR/QC/podotchet).
- **Telegram Mini App = web bilan teng.**

### 2.4 Ta'minot (ichki + tashqi)
- **Ichki ta'minotchi** = bizning xodim (maxsus rol). **Tashqi yetkazuvchi (vendor)** = to'liq reyestr + AI reyting + chek arxivi.
- To'lov vendorga: naqd(avans)/bank/kreditor. Import: bojxona→tannarx. Narx: shartnoma/spot/AI kuzatuv. Takroriy: AI bashorat→avto-so'rov.
- Logistika ta'minot ichida (yetkazuvchi/o'z transport/3-tomon; narx→tannarx).

---

## 3. MAVJUD KOD INVENTARI (qayta ishlatiladi — duplikat YO'Q)

### P2P data-model reuse
| P2P bosqich | Mavjud jadval | Fayl |
|---|---|---|
| Ko'p-bosqichli tasdiq (summa+level) | `approvalMatrixConfig`+`approvalRequests`+`multiLevelApprovalHistory` | security-ops-schema.ts, core-ai-reports.ts |
| Avans/podotchet | `advancePayments` / `cashAdvances` | fi-expenses.ts, payroll.ts |
| Tashqi vendor + reyting | `vendors` + `vendorPerformanceMetrics` | mm-raw-materials.ts, mm-logistics.ts |
| Vendor chek/invoice | `vendorInvoices` | mm-mro.ts |
| Xarid buyurtma | `purchaseOrders` | mm-raw-materials.ts |
| Bo'lim ichki so'rov | `internalRequests` | wms-schema.ts |

### Mavjud real servislar (60-band auditdan — HAQIQIY, stub emas)
`apps/api/src/modules/pos/`: pos-movement.service (8 harakat turi), pos-movement-status.constants
(VALID_TRANSITIONS: draft→karantin→qc→pending→approved→ai_processing→completed), pos-fifo.service
(FIFO/FEFO), quarantine-workflow.service, pos-gl-auto.listener (avto-GL), pos-audit, requisition-workflow
+ employee-ledger (podotchet asosi), mini-app (Telegram), auto-barcode, label.service (ZPL/EPL).
FE: `pos-monitor/` (PosBarcodeScanner+useHardwareScanner, useOfflineSync).

### Audit topgan bo'shliqlar (FAZA 4 da yopiladi)
band 5 concurrency (transaction/locking yo'q) · band 41 faktura 2-PDF yo'q · band 7 retention yo'q ·
band 17 OpenCV fallback yo'q · band 57 role-based analytics yo'q.

---

## 4. HOLAT — BAJARILGAN (2026-05-30)

**FAZA 0 — Poydevor ✅**
- `934d39f3` ombor tip taksonomiyasi (paper_rolls/waste_paper + jonli DB superset)
- `7a2b38a5` `warehouse_types` config-registri (9 tur seed, jonli DB)

**FAZA 1 — P2P xarid-to'lov zanjiri YADRO ✅ (1.1–1.6, jonli test)**
- `7dce6365`+`fccc204f` org-sxema tasdiq-zanjir resolver (CTE: dept→direktorgacha) + PosModule
- `2cedcf63` GET /api/pos/procurement/approval-chain/:employeeId
- `5d4bdc25` POST /requests + GET /requests/:id (procurement_requests+items+approvals, 3 jadval)
- `e897c2c2` POST /requests/:id/decide (approve/reject zanjir bo'ylab)
- `74133cd5` avans/podotchet to'liq tasdiqda (advance_payments)
- `67903637` POST /requests/:id/receive (chek + podotchet reconcile)

**FE boshlanishi ✅**
- `efee483c` lib/api/procurement.api.ts (typed client)
- `e3c58186` ProcurementPage (/wms/procurement) — toza UI (EP+token+tLabel)

> Avval (shu sessiya): Ombor+POS sidebar kanonik tozalash (7 commit) + 60-band audit + dead-file cleanup.

---

## 5. BATAFSIL ROADMAP (qolgani — har increment: aniq reja → to'liq → commit)

### FAZA 1 — P2P qoldiq (yadro yopildi; kengaytirish)
- **1.7** So'rov yaratish FE formasi (ProcurementPage'ga) + sidebar yozuvi (Telegram-teng).
- **1.8** Tasdiq qadami FE (rahbar approve/reject) + qabul FE (chek + reconcile).
- **1.9** Chek-bot AI/OCR integratsiya (Telegram) — 3-way match (mavjud mini-app + vendorInvoices).
- **1.10** Vendor tanlash + AI reyting (vendors+vendorPerformanceMetrics) FE.
- **1.11** Summa-based tasdiq darajasi (`approvalMatrixConfig` integratsiya — kichik→1, katta→direktor).

### FAZA 2 — Per-ombor kirim/chiqim oqimlari
- **2.1** Qabulda **haqiqiy ombor EXTERNAL_IN harakati** — `pos-movement.createMovement` reuse (tovar inventarga, FIFO/passport/barcode). P2P→kirim ulanishi.
- **2.2** Hom ashyo/rulon: P2P→karantin→QC→ombor (rulon QR: kg/o'lcham/partiya).
- **2.3** Tayyor mahsulot: MES→QC→ombor; chiqim sotuv-buyurtmaga + faktura (make-to-order, AI BOM).
- **2.4** Ho'jalik: iste'mol chiqim (podotchet). Asbob: kichik→Inventarlarim, katta→rahbar+akt.
- **2.5** Bo'lim ombori: so'rov→bo'lim menejer tasdiq→tur-ombordan transfer→zakazga sarf→rasxod moliyaga + norma (AI).
- **2.6** Brak→i.ch. ombori (ko'rinadi)→rework/utilizatsiya/qaytarish (QC tanlaydi). Makulatura: chiqindi→sotish.
- **2.7** Omborlararo transfer (yuboruvchi+qabul tasdiq). Internal return (sabab majburiy).
- **2.8** Per-tur ombor FE sahifalari (`warehouse_types` config'dan — yangi tur qo'shsa sahifa o'zi paydo).

### FAZA 3 — Moliya integratsiyasi + dashboard
- **3.1** Auto GL (Debit/Credit + AI tavsiya) → moliya tasdiq (AWAITING_REVIEW), har harakatga.
- **3.2** FIFO tannarx + ko'p-valyuta (original+UZS kirim kursida).
- **3.3** Bo'lim byudjet/norma (AI tavsiya tarixdan) + limit oshsa ogohlantirish/blok.
- **3.4** Kassa (Moliya bilan to'liq integratsiya: ko'p kassir+balans, z-hisobot, naqd limit, naqd+bank).
- **3.5** **Moliya rahbari Dashboard** (toza FE): KPI+grafik · ombor qoldiq+qiymat+drill · bo'lim rasxodi · podotchet qarz · kassa · real-time + alert.
- **3.6** Material 360 (har inventar to'liq profil) — toza FE (mavjud PosMaterial360 qayta ishlatish/yangilash).

### FAZA 4 — Hujjat + ishonchlilik + bo'shliqlar
- **4.1** PDF aktlar (kirim/chiqim+**faktura** [band 41]/utilizatsiya/asbob/dalolatnoma) — config-driven; raqam Ombor+Tur+Yil.
- **4.2** **Concurrency** [band 5]: pos-movement.createMovement → `db.transaction` + `FOR UPDATE` + harakat raqami SEQUENCE.
- **4.3** **7-yil retention** [band 7]: cron arxivlash (o'chirmaslik).
- **4.4** Bildirishnomalar (config-driven): kam qoldiq/muddat(FEFO)/byudjet/podotchet/har kirim-chiqim hodisasi.
- **4.5** Inventarizatsiya (davriy+cycle, farq→moliya GL). Hisobotlar (PDF+Excel/CSV).
- **4.6** Offline mustahkamlash (skan+kirim/chiqim local→sync, konflikt). Telegram Mini App to'liq.

### FAZA 5 — FE TO'LIQ TOZA UI (eski rasvo'ni almashtirish)
- **5.1** Per-tur ombor sahifalari (config-driven) — yangi toza UI.
- **5.2** P2P to'liq sahifalar (so'rov ro'yxati/yaratish/tasdiq/qabul) + Telegram.
- **5.3** Moliya dashboard + Material 360 + hisobotlar — toza.
- **5.4** Eski rasvo sahifalarni o'chir/redirect: WMS* extended sahifalar, pos-monitor/ eski sahifalar.
- **5.5** Sidebar qayta tashkil (ombor moduli config'dan; regress-guard saqlanadi — Qoida 22).

---

## 6. CROSS-CUTTING ESLATMALAR
- **i18n:** har FE matn `tLabel('common.namespace.key', 'Default')` (i18n-leak guard bloklaydi aks holda).
- **Dizayn:** EP/ui komponentlar + semantic token; raw hex/rgb TAQIQ (Qoida 21 guard).
- **DB:** migration .sql `apps/api/src/shared/db/migrations/` → qo'lda/ruxsat bilan jonli DB; ADD-ONLY.
- **Guard:** pre-commit (BE/FE tsc, dup-routes, sidebar regress, i18n leak, schema-dup ratchet, no-stubs).
- **Commit:** har increment alohida + selective `git add` (branch boshqa agentlar bilan umumiy).

## 7. RISK / OCHIQ
- Auth/ruxsat (P2P direktorgacha) — to'g'ri org-sxema mapping (head_user_id) majburiy tekshiruv.
- Concurrency (30+ terminal) — FAZA 4.2 gacha zaif; kritik.
- Mayda detallar (GL schyot raqamlari, qo'shimcha akt turlari) — config-driven, qurish davomida.
- Hajm: ko'p-haftalik ish. Har faza alohida + jonli tekshiruv. Yadro (P2P) allaqachon ishlaydi.
