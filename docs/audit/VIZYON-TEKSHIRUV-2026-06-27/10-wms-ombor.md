# Modul 10 — WMS / Ombor — Mustaqil tekshiruv (adversarial)

**Sana:** 2026-06-27
**Manba doc:** docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md (satr 3840-4327)
**Savollar:** 121 | Doc self-claim: **60%** vizyon | Qayta hisoblangan realPct: **65%**

## Umumiy natija
- CONFIRMED (Isbot to'g'ri): **106**
- REFUTED (Isbot xato/eskirgan/o'ta past baholangan): **15**
- Real status: bor=**43**, qisman=**67**, yoq=**7**, egasi-data=**4**
- realPct = round(100×(43 + 0.5×67) / (121−4)) = round(7650/117) = **65%**

> ⚠️ DIQQAT: bu modulda refutatsiyalarning DEYARLI HAMMASI doc'ning **o'ta past baholashi** —
> Isbot "grep = 0 natija / qurilmagan / jadval YO'Q" deydi, ammo jonli kodda funksiya REAL mavjud.
> Sabab: doc grep'lari `material-life`, `inventory-freeze`, `supplier-rating`, blind-count, deviation-reason
> modullari qo'shilishidan OLDIN yozilgan ko'rinadi. Demak modul vizyoni **60% emas, ~65%**.

## REFUTED CLAIMS (doc xato / eskirgan)
- **10.14** — Isbot "material-darajada hazard bayroq YO'Q" → `material_cards.hazard_class` + `material-life` getHazardStock REAL.
- **10.28** — Isbot "ko'r-sanoq qurilmagan, grep topilmadi" → `wms-counts` blind param + `WmsCountsService.listInventoryCounts` system_qty MASKALAYDI.
- **10.30** — Isbot "variance-reason enum/majburiy ro'yxat YO'Q" → `count_deviation_reasons` jadval (8 qator) + `recordCountLine` majburiy validatsiya.
- **10.31** — Isbot "muzlatish mexanizmi qurilmagan, grep=0" → `inventory_freeze_zones` jadval + `InventoryFreezeService` goods-issue hard-gate'iga ULANGAN.
- **10.67** — Isbot "haydovchi/mashina biriktirish WMS'da topilmadi" → `deliveries.driver_id/vehicle_number/plate_number` + `assign-driver.handler` (10.82 bilan bir xil, u ✅).
- **10.70** — Isbot "grep poddon|pallet = 0 natija" → `material_cards.pallet_unit_qty` + `material-life` updateLife palletUnitQty.
- **10.78** — Isbot "reyting hisoblovchi yo'q, hech kim yozmaydi" → `supplier-rating.service` + `SupplierRatingListener`(@EventsHandler) + `vendor_performance_metrics` UPSERT (on_time/late/defect).
- **10.85** — Isbot "grep substitut/analog=0; material_substitutions jadval YO'Q (SQL-XATO)" → `material_substitutes` jadval REAL + `material-life` to'liq CRUD (add/list/remove substitute, EP-WMS-101).
- **10.107** — Isbot "warehouse_stock'da owner/customer ustun YO'Q" → `warehouse_stock.owner_type + owner_customer_id` + `material_cards.owner_type` + material-life ownerType editable.
- **10.109** — Isbot "grep ikkilamchi|vtorichka|secondary=0" → `material_cards.is_recyclable` + `warehouse_stock.recycled_grade` + `pos-secondary-events.handler`.
- **10.110** — Isbot "grep material.age|yosh=0" → `material_cards.age_alert_days` + material-life `GET aging-alerts` endpoint REAL.
- **10.112** — Isbot "grep hazard|flammable topilmadi, maydon-oqimi YO'Q" → `material_cards.hazard_class/storage_condition` + material-life `GET hazard-stock`.
- **10.114** — Isbot "grep probnik|sample=0" → `material_cards.is_sample` + material-life updateLife isSample.
- **10.120** — Isbot "grep blind|ko'r-sanoq=0" → blind count REAL (10.28 bilan bir xil).
- **10.121** — Isbot "grep freeze|muzlat=0" → freeze REAL (10.31 bilan bir xil).

---

## Per-savol

## 10.1 — [DOC ✅] → [bor] (confirmed)
rulon_cards: width_mm, diameter_mm, grammage_gsm, initial_weight_kg, current_weight_kg, estimated_length_m — DB'da TASDIQ. rulon-card.service create() real.

## 10.2 — [DOC 🟡] → [qisman] (confirmed)
grammage_gsm integer real saqlanadi; standart 80..300 enum/seed topilmadi — to'g'ri.

## 10.3 — [DOC ✅] → [bor] (confirmed)
rulon-card.service.ts:132-167 updateCurrentWeight() WmsRollCalcService bilan uzunlikni qayta hisoblaydi; manfiy/initial-oshiq BLOK. To'g'ri.

## 10.4 — [DOC ✅] → [bor] (confirmed)
wms-rulon-card.constants.ts:13-26 FULL/OPENED/REMNANT + ALLOWED_STATUS_TRANSITIONS; service full→opened avto (159-161). To'g'ri.

## 10.5 — [DOC ✅] → [bor] (confirmed)
rulon_cards.roll_code+qr_label; generateRollCode RULON-yil-6xona; UNIQUE 409 (service:60-93). To'g'ri.

## 10.6 — [DOC 🟡] → [qisman] (confirmed)
rulon_cards.supplier/certificate/received_date bor; alohida manufacturer ustuni yo'q. To'g'ri.

## 10.7 — [DOC 🟡] → [qisman] (confirmed)
roll_type varchar majburiy; enum-cheklov + coating maydoni yo'q. To'g'ri.

## 10.8 — [DOC ✅] → [bor] (confirmed)
rulon_cards.humidity_pct + storage_zone DB'da; service saqlaydi (109-110). To'g'ri.

## 10.9 — [DOC 🟡] → [qisman] (confirmed)
material_cards.category + material_type bor; 5-toifa qat'iy enum yo'q. To'g'ri.

## 10.10 — [DOC 🟡] → [qisman] (confirmed)
material_cards.barcode/kod bor; KR-125-1400 ma'noli sxema yo'q (egasi-data). To'g'ri.

## 10.11 — [DOC 🟡] → [qisman] (confirmed)
warehouse_stock.unit_of_measure/unit; WmsRollCalc kg→m; umumiy kg↔m² servisi yo'q. To'g'ri.

## 10.12 — [DOC ✅] → [bor] (confirmed)
material_supplier_ratings jadval mavjud; batch_lots partiya-darajasi beruvchi (supplier_id). To'g'ri.

## 10.13 — [DOC ✅] → [bor] (confirmed)
material_cards.abc_segment + analytics/abc-xyz.service.ts mavjud. To'g'ri.

## 10.14 — [DOC 🟡] → [bor] (REFUTED)
Doc: material-darajada hazard bayroq YO'Q. Reality: `material_cards.hazard_class` USTUN bor + `material-life` getHazardStock endpoint + updateLife hazardClass. Material-darajasi belgisi QURILGAN.

## 10.15 — [DOC ✅] → [bor] (confirmed)
mm_goods_receipts: receipt_number/date, supplier_id/name, warehouse_id, purchase_order_id, status, qc_required_items, received_by — DB TASDIQ.

## 10.16 — [DOC 🟡] → [qisman] (confirmed)
mm_goods_receipts.purchase_order_id FK bor; avto 3-way tolerans% yo'q. To'g'ri.

## 10.17 — [DOC ✅] → [bor] (confirmed)
wms-quarantine-gate.service.ts:88-106 releaseToMain faqat QC_PASS o'tadi (canPostToMain BLOK). REAL enforcement.

## 10.18 — [DOC 🟡] → [qisman] (confirmed)
qc_passed_items/qc_required_items bor; to'liq qabul/rad-miqdor + sabab alohida emas. To'g'ri.

## 10.19 — [DOC 🟡] → [qisman] (confirmed)
quarantine-gate checkWeightTolerance ±2% real; alohida tarozi-blanka qaydi yo'q. To'g'ri.

## 10.20 — [DOC ✅] → [bor] (confirmed)
wms-goods-issue.controller.ts:59-114 @Roles(WAREHOUSE_KEEPER, SUPER_ADMIN, DIRECTOR) + RolesGuard. (doc warehouse_manager ham deydi — kichik drift, ammo rol-himoya REAL.)

## 10.21 — [DOC ✅] → [bor] (confirmed)
material_movements + wms_transactions (OUT/IN) + pos_movement_types + recordWmsTransaction goods-issue.handler:201. Real.

## 10.22 — [DOC ✅] → [bor] (confirmed)
GoodsIssueCommand.ppId + WmsGoodsIssuedEvent ppId (goods-issue.handler:101-106); recordIssue ppId saqlaydi. To'g'ri.

## 10.23 — [DOC 🟡] → [qisman] (confirmed)
texkarta tech_card_bom gate bor (outbound-enforcement); norma-vs-fakt og'ish% signal yo'q. To'g'ri.

## 10.24 — [DOC ✅] → [bor] (confirmed)
batch-selection.service.ts:56-91 resolveStrategy FEFO/FIFO; order() expiry/received ASC. To'g'ri.

## 10.25 — [DOC ✅] → [bor] (confirmed)
issueFromWarehouseStock guarded; buildPlan:150-154 "Partiyalarda yetarli qoldiq yo'q". To'g'ri.

## 10.26 — [DOC 🟡] → [qisman] (confirmed)
rol-himoya + audit bor; summa-chegarali ikki-imzo yo'q (egasi-data). To'g'ri.

## 10.27 — [DOC 🟡] → [qisman] (confirmed)
inventory_counts.count_type/variance + wms-counts.controller; aylanma-chastota avtomatikasi yo'q. To'g'ri.

## 10.28 — [DOC ❌] → [bor] (REFUTED)
Doc: ko'r-sanoq qurilmagan, grep topilmadi. Reality: wms-counts.controller `blind` param (57-63) + WmsCountsService:33-43 HIDDEN=[system_qty,...] MASKALAYDI. KO'R-SANOQ REAL.

## 10.29 — [DOC 🟡] → [qisman] (confirmed)
inventory_counts.total_variance bor; ±1% avto-tuzatish/rahbar-tasdiq mantiqi yo'q (deviation-reason majburiy bor, lekin auto-correct emas). To'g'ri.

## 10.30 — [DOC ❌] → [bor] (REFUTED)
Doc: variance-reason enum/majburiy ro'yxat topilmadi. Reality: `count_deviation_reasons` jadval (8 qator, code/name/name_ru) + WmsCountsService.recordCountLine:55-66 system≠counted → deviation_reason_code MAJBURIY + katalog validatsiya. GET count-deviation-reasons endpoint bor.

## 10.31 — [DOC ❌] → [bor] (REFUTED)
Doc: muzlatish mexanizmi qurilmagan, grep=0. Reality: `inventory_freeze_zones` jadval + InventoryFreezeService freezeZone/releaseZone/checkExitAllowed; goods-issue.handler:83-93 muzlatilgan zona chiqimni BLOK (BLOCK_ZONE_FROZEN). REAL.

## 10.32 — [DOC 🟡] → [qisman] (confirmed)
rulon current_weight_kg + updateWeight tortishni qo'llaydi; ochilgan→tortish/to'liq→kartochka ajratuvchi sanoq yo'q. To'g'ri.

## 10.33 — [DOC ✅] → [bor] (confirmed)
material_cards.min_stock + warehouse_stock.reorder_point + min_stock_alerts/low_stock_alerts + get-low-stock.handler.ts. To'g'ri.

## 10.34 — [DOC 🟡] → [qisman] (confirmed)
reorder_point + rop/eoq/safety-stock servislar bor; lead-time DATA egasidan. To'g'ri.

## 10.35 — [DOC 🟡] → [qisman] (confirmed)
material_cards.max_stock + warehouse_stock.max_stock bor; oshsa-ogohlantirish trigger yo'q. To'g'ri.

## 10.36 — [DOC ❌] → [yoq] (confirmed)
dinamik 3-6 oy avto-qayta hisob cron/AI topilmadi. To'g'ri.

## 10.37 — [DOC 🔑] → [egasi-data] (confirmed)
safety-stock/rop lead-time formula bor; har-beruvchi lead-time qiymati yo'q. To'g'ri.

## 10.38 — [DOC ✅] → [bor] (confirmed)
wms-quarantine.constants.ts:73 QC_DECISION_TO_STATUS (QABUL/REWORK/CHIQARISH) + 5-bosqich holat-mashina. To'g'ri.

## 10.39 — [DOC ✅] → [bor] (confirmed)
applyQcDecision faqat KARANTIN'da; resolveQcDecision validatsiya (gate-service:56-71). To'g'ri.

## 10.40 — [DOC 🟡] → [qisman] (confirmed)
QC_PASS→MAIN, REWORK→MES, REJECT→beruvchi 3 yo'l; "past sifat→arzon" 4-yo'l yo'q. To'g'ri.

## 10.41 — [DOC ❌] → [yoq] (confirmed)
karantin maksimal-muddat + oshsa-ogohlantirish cron yo'q. To'g'ri.

## 10.42 — [DOC ✅] → [bor] (confirmed)
warehouse_zones (code/zone_type/capacity) + warehouse_bins (bin_code/row/shelf/level/zone_id) — DB TASDIQ.

## 10.43 — [DOC ✅] → [bor] (confirmed)
WmsCreateInternalRequestSchema:17-20 material_id/quantity/from_warehouse_id/to_warehouse_id. To'g'ri.

## 10.44 — [DOC ✅] → [bor] (confirmed)
warehouses=12 qator; warehouse_stock.warehouse_id; internal-request from/to. To'g'ri.

## 10.45 — [DOC 🟡] → [qisman] (confirmed)
warehouse_bins.max_weight/max_volume/current_occupancy bor; avto-joy-taklif algoritmi yo'q. To'g'ri.

## 10.46 — [DOC ✅] → [bor] (confirmed)
warehouses FINISHED_GOODS + receive-fg.handler; warehouse_stock FG. To'g'ri.

## 10.47 — [DOC ✅] → [bor] (confirmed)
batch_lots/batches/material_batches/batch_lot_movements; goods-issue decrementBatchLot (handler:149). To'g'ri.

## 10.48 — [DOC ✅] → [bor] (confirmed)
batch_lots.expiry_date; buildPlan:116-131 muddati o'tgan BLOK. To'g'ri.

## 10.49 — [DOC 🟡] → [qisman] (confirmed)
batch_lots.quality_status + inventory_passports; gramaj/namlik/mustahkamlik biriktirish to'liq emas. To'g'ri.

## 10.50 — [DOC 🟡] → [qisman] (confirmed)
buildPlan ko'p partiya span qiladi; "imkon qadar bitta + ogohlantirish" qoidasi yo'q. To'g'ri.

## 10.51 — [DOC 🟡] → [qisman] (confirmed)
warehouse_stock.last_movement_at + abc-aging-expiry.service; N-kun dead-stock cron egasi-data. To'g'ri.

## 10.52 — [DOC 🟡] → [qisman] (confirmed)
warehouse_roll_usage + rulon remnant + INTERNAL_RETURN; avto-oqim alohida emas. To'g'ri.

## 10.53 — [DOC ✅] → [bor] (confirmed)
outbound-enforcement.service.ts:104-131 BLOCK_TECH_CARD_MISMATCH; goods-issue.handler:65-79 hard-gate. To'g'ri.

## 10.54 — [DOC ✅] → [bor] (confirmed)
outbound-enforcement:106-116 bom_layer≠issuedLayer→BLOCK_GOFRA_LAYER_MISMATCH; handler issuedLayer uzatadi. To'g'ri.

## 10.55 — [DOC 🟡] → [qisman] (confirmed)
ow_pallet_recoveries + material_cards.pallet_unit_qty (material-life) bor; chiqimda ikki-birlik konvertatsiya to'liq emas. To'g'ri.

## 10.56 — [DOC 🟡] → [qisman] (confirmed)
WmsCreateInternalRequestSchema + wms_internal_requests; rohler-vazifa+kechikish-iz alohida emas. To'g'ri.

## 10.57 — [DOC 🟡] → [qisman] (confirmed)
WmsGoodsIssuedEvent PP/MES'ga; downtime-logistika KPI MES tomonda. To'g'ri.

## 10.58 — [DOC 🟡] → [qisman] (confirmed)
remnant + INTERNAL_RETURN + makulatura turi; daromad-makulatura╳utilizatsiya ajratuvchi hisob yo'q. To'g'ri.

## 10.59 — [DOC 🟡] → [qisman] (confirmed)
material_cards alohida kartochka + texkarta-gate; ruxsat-etilgan-mahsulot allow-list `material_substitutes` orqali qisman (EP-WMS-101). To'g'ri/qisman.

## 10.60 — [DOC 🟡] → [qisman] (confirmed)
checkWeightTolerance ±2% (umumiy vazn); gramaj-spetsifik g/m² namuna o'lchov yo'q. To'g'ri.

## 10.61 — [DOC ❌] → [yoq] (confirmed)
import in-transit (transit/eta/customs) ustun mm_goods_receipts'da yo'q. To'g'ri. (deliveries.estimated_arrival = chiquvchi).

## 10.62 — [DOC 🔑] → [egasi-data] (confirmed)
rop/safety-stock lead-time formula; import/mahalliy bayroq + valyuta-kurs qiymati yo'q. To'g'ri.

## 10.63 — [DOC 🟡] → [qisman] (confirmed)
material_supplier_ratings + supplier-rating.service + SupplierRatingListener struktura REAL; har-kirim avto on-time%/brak% delivery-event'ga bog'liq (n=0 data). To'g'ri/qisman.

## 10.64 — [DOC ❌] → [yoq] (confirmed)
import-partiya GTD/invoys fayl-biriktirish (attachment) modeli yo'q. To'g'ri.

## 10.65 — [DOC ❌] → [yoq] (confirmed)
avans↔kirim + yopilmagan-avans WMS'da yo'q (Finance). To'g'ri.

## 10.66 — [DOC 🟡] → [qisman] (confirmed)
EXTERNAL_OUT + FG chiqim bor; to'liq отгрузка-hujjat SD/logistics tomonda. To'g'ri.

## 10.67 — [DOC ❌] → [bor] (REFUTED)
Doc: haydovchi/mashina biriktirish WMS'da topilmadi. Reality: `deliveries.driver_id/driver_name/vehicle_number/plate_number/dispatched_at` + `assign-driver.handler.ts` + delivery.aggregate.assign(). 10.82 (bir xil savol) ✅ deb baholangan — ziddiyat.

## 10.68 — [DOC ✅] → [bor] (confirmed)
outbound-enforcement:104-131 tech_card_bom BLOCK_TECH_CARD_MISMATCH; tech_card_bom DB (n=0, fail-open honest). To'g'ri.

## 10.69 — [DOC ✅] → [bor] (confirmed)
outbound-enforcement:106-116 BLOCK_GOFRA_LAYER_MISMATCH. To'g'ri.

## 10.70 — [DOC ❌] → [qisman] (REFUTED)
Doc: grep poddon|pallet=0 natija; ow_pallet_recoveries yozilmaydi. Reality: `material_cards.pallet_unit_qty` + material-life updateLife palletUnitQty + pos-shift-handover pallet. Atribut REAL; chiqim ikki-birlik konvertatsiya hali yo'q → qisman.

## 10.71 — [DOC 🟡] → [qisman] (confirmed)
wms_internal_requests (urgency/status/approved_by) CRUD; rohler-eskalatsiya 15/30/60 timing yo'q. To'g'ri.

## 10.72 — [DOC 🟡] → [qisman] (confirmed)
warehouse_kpi_cache bor; material-logistika downtime→KPI reader yo'q. To'g'ri.

## 10.73 — [DOC 🟡] → [qisman] (confirmed)
INTERNAL_RETURN + ow_pallet_recoveries; chiqindi╳qoldiq ajratuvchi hisob alohida emas. To'g'ri.

## 10.74 — [DOC 🟡] → [qisman] (confirmed)
material_cards (n=31) + material_category_dept_rules; ruxsat-etilgan-mahsulot bog'lanish `material_substitutes` orqali qisman. To'g'ri.

## 10.75 — [DOC 🟡] → [qisman] (confirmed)
checkWeightTolerance ±2% real; gramaj-maxsus + "butun partiya karantin" avto-oqim alohida emas. To'g'ri.

## 10.76 — [DOC 🟡] → [qisman] (confirmed)
deliveries.estimated_arrival/actual_arrival/status (chiquvchi); kiruvchi import in-transit yo'q. To'g'ri.

## 10.77 — [DOC 🔑] → [egasi-data] (confirmed)
EOQ/ROP servis bor; import/mahalliy bayroq + lead-time qiymati yo'q. To'g'ri.

## 10.78 — [DOC ❌] → [qisman] (REFUTED)
Doc: reyting hisoblovchi yo'q, hech kim yozmaydi. Reality: `supplier-rating.service.ts` + `SupplierRatingListener`(@EventsHandler SupplierQualityFailEvent) + repo `vendor_performance_metrics` UPSERT (total_orders/on_time/late) + `vendors.rating` UPDATE + wms-supplier-rating.controller. Mexanizm REAL (n=0 data) → qisman.

## 10.79 — [DOC 🟡] → [qisman] (confirmed)
inventory_passports + storage infra; import-partiya↔GTD fayl bog'lanish alohida emas. To'g'ri.

## 10.80 — [DOC 🟡] → [qisman] (confirmed)
Finance/GL infra; import-buyurtma↔avans↔kirim WMS-ko'rinishi yo'q. To'g'ri.

## 10.81 — [DOC ✅] → [bor] (confirmed)
deliveries (delivery_number/sales_order_id/customer/driver_name/vehicle_number/status) + dispatch handler (n=1). To'g'ri.

## 10.82 — [DOC ✅] → [bor] (confirmed)
delivery.aggregate.ts:102 assign(driverId,vehicleNumber); assign-driver.handler; deliveries.driver_id/vehicle_id/plate_number/dispatched_at DB. To'g'ri.

## 10.83 — [DOC 🟡] → [qisman] (confirmed)
delivery.aggregate complete()→DELIVERED, fail()→FAILED; "qisman qabul"+mijoz-imzo yo'q. (doc deliver()→ method nomi complete(), kichik drift). To'g'ri.

## 10.84 — [DOC 🟡] → [qisman] (confirmed)
warehouse_stock.reserved_quantity DB bor; stock_reservations (n=0); reserved_qty yangilash to'liq emas. To'g'ri.

## 10.85 — [DOC ❌] → [bor] (REFUTED)
Doc: grep substitut/analog=0; material_substitutions jadval YO'Q (SQL-XATO). Reality: `material_substitutes` jadval REAL (material_id/substitute_id/priority/is_approved) + material-life.controller addSubstitute/listSubstitutes/removeSubstitute (EP-WMS-101) to'liq CRUD, modulda registratsiya. Doc xato jadval-nomini tekshirgan.

## 10.86 — [DOC 🟡] → [qisman] (confirmed)
role_movement_permissions + razryad org-strukturada; razryad→ombor-amal matritsasi ulanmagan. To'g'ri.

## 10.87 — [DOC 🟡] → [qisman] (confirmed)
employee_write_off_acts/_lines (n=0) + DAMAGE→QC movement; to'liq spisaniye→GL-zarar oqimi alohida emas. To'g'ri.

## 10.88 — [DOC ❌] → [yoq] (confirmed)
material_norms (n=0) + material_consumption (n=0); WMS/MES'da norma-fakt taqqoslovchi reader yo'q (pos-anomaly boshqa kontekst). To'g'ri.

## 10.89 — [DOC 🟡] → [qisman] (confirmed)
storage foto-infra + POS AI-kamera; goods-receipt "shikast→foto majburiy" validatsiya yo'q. To'g'ri.

## 10.90 — [DOC 🟡] → [qisman] (confirmed)
CHIQARISH→ta'minotchi + resolveQcDecision; vozvrat→Finance kreditor↓ atomik yo'q. To'g'ri.

## 10.91 — [DOC 🟡] → [qisman] (confirmed)
daily_warehouse_plans + wms-analytics; kunlik CRON→CC/rahbar avto yo'q. To'g'ri.

## 10.92 — [DOC 🟡] → [qisman] (confirmed)
safety-stock/rop + low_stock_alerts; kunlik CRON-prognoz signal oqimi yo'q. To'g'ri.

## 10.93 — [DOC ✅] → [bor] (confirmed)
finance/wms-goods-issued.listener.ts:78-87 Dr COGS(9100)/Cr Inventory(1000) → entries; narx yo'q bo'lsa SKIP (honest, Q-40). To'g'ri.

## 10.94 — [DOC 🟡] → [qisman] (confirmed)
batch-selection FIFO/FEFO real; GL listener narxni material_cards.unit_price'dan oladi (partiya-FIFO-narx EMAS). To'g'ri.

## 10.95 — [DOC 🟡] → [qisman] (confirmed)
warehouse_employees + inventory_count_lines.counted_by/variance; zona→mas'ul→kamomad-javobgar avto yo'q. To'g'ri.

## 10.96 — [DOC ✅] → [bor] (confirmed)
warehouse_stock kanonik (current_stock=view); pos+wms ikkalasi yozadi; issueFromWarehouseStock kanonik dekrement. To'g'ri.

## 10.97 — [DOC 🟡] → [qisman] (confirmed)
tech_card_bom teskari so'rov MUMKIN (n=0); material→buyurtmalar teskari READ endpoint yo'q. To'g'ri.

## 10.98 — [DOC 🔑] → [egasi-data] (confirmed)
EOQ/ROP + supplier_price_tiers; min-partiya/qadoqlash qiymatlari yo'q. To'g'ri.

## 10.99 — [DOC ✅] → [bor] (confirmed)
inventory-turnover.service + stock-turnover.service + wms-catalog reports/turnover. To'g'ri.

## 10.100 — [DOC 🟡] → [qisman] (confirmed)
warehouse_zones/bins + wms-overflow.service; to'lganlik% import-oldi gating qiymatlar bilan to'liq emas. To'g'ri.

## 10.101 — [DOC ✅] → [bor] (confirmed)
wms-quarantine-gate:88-106 canPostToMain faqat QC_PASS; karantindagi BLOK. To'g'ri.

## 10.102 — [DOC ✅] → [bor] (confirmed)
checkWeightTolerance ±2% → auto-qabul/requiresApproval (gate-service). To'g'ri.

## 10.103 — [DOC 🟡] → [qisman] (confirmed)
warehouse_kpi_cache + wms-analytics; bekor-turish daqiqa→ichki-logistika-karta AI-baho to'liq emas. To'g'ri.

## 10.104 — [DOC ❌] → [yoq] (confirmed)
EOQ/ROP + supplier_price_tiers; ko'p-beruvchi tender/taklif-solishtirish oqimi yo'q. To'g'ri.

## 10.105 — [DOC 🟡] → [qisman] (confirmed)
warehouse_transactions audit + HR smena; "ish-vaqtidan-tashqari" avto-bayroq yo'q. To'g'ri.

## 10.106 — [DOC 🟡] → [qisman] (confirmed)
material_cards + material_card_suggestions; AI-semantik-dublikat ogohlantirish yo'q. To'g'ri.

## 10.107 — [DOC ❌] → [qisman] (REFUTED)
Doc: warehouse_stock'da owner/customer ustun YO'Q (faqat reserved_quantity). Reality: `warehouse_stock.owner_type + owner_customer_id` USTUNLAR bor + `material_cards.owner_type` + material-life updateLife ownerType (MATERIAL_OWNER_TYPES enum). Bayroq REAL; "faqat o'sha mijoz buyurtmasiga" enforcement to'liq emas → qisman.

## 10.108 — [DOC 🟡] → [qisman] (confirmed)
mes-shifts-stats + iot-tablet handover; peresmenka-akt→warehouse_stock solishtirish WMS'da yo'q. To'g'ri.

## 10.109 — [DOC ❌] → [qisman] (REFUTED)
Doc: grep ikkilamchi|vtorichka|secondary=0. Reality: `material_cards.is_recyclable` + `warehouse_stock.recycled_grade` + material-life isRecyclable + `pos-secondary-events.handler`. Belgi REAL; to'liq qaytib-ishlatish oqimi qisman.

## 10.110 — [DOC ❌] → [qisman] (REFUTED)
Doc: grep material.age|yosh=0. Reality: `material_cards.age_alert_days` USTUN + material-life `GET aging-alerts` endpoint (getAgingAlerts) REAL. Chegara qiymati egasi-data → qisman.

## 10.111 — [DOC 🟡] → [qisman] (confirmed)
iot record-sensor-reading + thresholds bor; namlik-anomaliya→ombor-zaxira "xavf ostida" ulanish to'liq emas. To'g'ri.

## 10.112 — [DOC ❌] → [qisman] (REFUTED)
Doc: grep hazard|flammable topilmadi, maydon-oqimi YO'Q. Reality: `material_cards.hazard_class/storage_condition/storage_conditions` + material-life `GET hazard-stock` + updateLife hazardClass/storageCondition. Maydon+oqim REAL; alohida-zona bog'lanish qisman.

## 10.113 — [DOC 🟡] → [qisman] (confirmed)
rulon-card.service real + warehouse_roll_usage; kesish→list-zaxira-yaratish handler to'liq emas. To'g'ri.

## 10.114 — [DOC ❌] → [qisman] (REFUTED)
Doc: grep probnik|sample=0. Reality: `material_cards.is_sample` USTUN + material-life updateLife isSample. Belgi REAL; "namuna chiqimi alohida sabab-kod" to'liq emas → qisman.

## 10.115 — [DOC 🟡] → [qisman] (confirmed)
abc-xyz + abc-aging-expiry + reports/abc-analysis; ABC→sanoq-chastota CRON yo'q. To'g'ri.

## 10.116 — [DOC 🟡] → [qisman] (confirmed)
wms-barcode.controller + POS label + inventory_barcode_assignments; PDF+ikki-imzo+skan to'liq oqim yo'q. To'g'ri.

## 10.117 — [DOC 🟡] → [qisman] (confirmed)
warehouse-rental.controller.ts records/summary/settings/close/mark-paid CRUD REAL + warehouse_rental_records/settings (n=0); GL-flag+oylik CRON to'liq emas; tarif egasi-data. To'g'ri.

## 10.118 — [DOC ✅] → [bor] (confirmed)
warehouse_transfers + stock_transfers/stock_transfer_lines + INTERNAL_TRANSFER + warehouse_transactions audit. To'g'ri.

## 10.119 — [DOC 🟡] → [qisman] (confirmed)
warehouse-kpi GSD formula + inventory_count_lines.variance/variance_percent/reason; ±1% avto-tuzatish→rahbar-tasdiq gating yo'q. To'g'ri.

## 10.120 — [DOC ❌] → [bor] (REFUTED)
Doc: grep blind|ko'r-sanoq=0. Reality: blind count REAL (10.28 ko'rsatilgan — wms-counts blind param + system_qty maskalash). REFUTED.

## 10.121 — [DOC ❌] → [bor] (REFUTED)
Doc: grep freeze|muzlat=0. Reality: inventory_freeze_zones + InventoryFreezeService + goods-issue.handler:83-93 zona-freeze chiqim BLOK (10.31). REFUTED.
