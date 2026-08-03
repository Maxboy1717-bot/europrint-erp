# Modul 19 — POS / Kassa-monitor — MUSTAQIL TEKSHIRUV

- Manba doc: `docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md` satr 7308–7639
- Savollar: 82 | egasi-data: 6 | tekshiriladigan: 76
- Doc self-claim: **72%** | Qayta hisoblangan realPct: **81%**
- Claim aniqligi: CONFIRMED 66 / REFUTED 16
- Reality: bor 48 · qisman 27 · yoq 1 · egasi-data 6

## XULOSA
Modul kutilganidan KUCHLIROQ. Doc 16 ta savolni `❌ yo'q` deb belgilagan, lekin
jonli kodda real implementatsiya MAVJUD (asosan 2026-06-27 "ADDITIVE" kengaytirish:
4 yangi movement-tur, anomaliya-detektor, texkarta-gate, smena-topshirish 2-imzo,
variance-config, qaytariladigan-tara). Doc bu qo'shimchalardan OLDIN yozilgan ko'rinadi
yoki grep yetarli emas edi — shuning uchun realPct (81%) doc claim (72%) dan YUQORI.

## REFUTED CLAIMS (doc `yo'q` degan, lekin kod bor)
- **19.20** AI anomaliya — `pos-anomaly.service.ts` (310 q, 4 qoida) + listener + `pos_anomaly_flags`
- **19.32** Texkarta-material gate — `pos-techcard-gate.service.ts` wired @ `pos-movement.service.ts:151` + `pos_movement_techcard` jadval
- **19.36** Chiqindi/makulatura kirim — `WASTE_IN` movement-tur live
- **19.38** Poddon kuzatuvi — `pos_returnable_pallets` + `recordPallet()` (konversiya qisman)
- **19.39** Bo'sh poddon qaytishi — `getPalletBalance()` ketdi/qaytdi balansi
- **19.41** Prostoy signali — anomaliya `CANCELLED_IDLE` qoidasi
- **19.44** Norma-fakt — anomaliya `OVER_NORM_CONSUMPTION` qoidasi
- **19.49** Lab-namuna chiqim — `LAB_SAMPLE_OUT` movement-tur live
- **19.50** Smena 2-imzo akti — `pos_shift_handovers` (from/to_signed_at) + `pos-shift-handover.service.ts` 2-IMZO GATE + FE PosHandovers
- **19.52** Qisman qabul — `PARTIAL_RECEIPT` movement-tur live
- **19.62** Davalcheskoe — `CUSTOMER_MATERIAL` movement-tur live
- **19.64** Variance avto-tasdiq limiti — `pos-variance-config.service.ts` AUTO_APPROVE/ESCALATE + `pos_variance_config`
- **19.69** Foto-dalil — `pos_movements.photo_evidence_url` + pallets + passports.photos
- **19.76** Buyurtma o'zgarishi — `recheckOnOrderChange()` endpoint @ `movements.controller.ts:171`
- **19.77** Tungi anomaliya — anomaliya `NIGHT_LARGE_QTY` qoidasi (22:00–06:00 + miqdor)
- **19.81** Topshir↔qabul farqi — anomaliya `SEND_RECEIVE_MISMATCH` qoidasi

---

## 19.1 — [DOC: bor] → [bor] (confirmed)
- Savol: POS = zavod ombori harakatlari, kassa emas?
- Tekshiruv: `pos_movement_types`=11 qator (6 vizyon + INVENTORY_ADJUST + 4 yangi). 44+ FE sahifa material-harakat. ✓

## 19.2 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-auth.controller.ts` + `pos-auth.service.ts` mavjud; `pos_audit_log` 41 qator (user_id/action/ip_address/created_at). ✓

## 19.3 — [DOC: egasi-data] → [egasi-data] (confirmed)
- Tekshiruv: `department_warehouse_map`=0, `pos_warehouse_access`=0, `pos-department.guard.ts` mavjud. Mapping data kutilmoqda. ✓

## 19.4 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `quarantine-workflow.service.ts` STATUS_FLOW draft→pending→karantin→qc_review→approved→completed. ✓

## 19.5 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: 11 movement-tur; `pos_movements.return_reason` ustun mavjud; `movement-enums.ts`. ✓

## 19.6 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: FE `PosBarcodeScanner.tsx` + `pos-barcode.service.ts`; `pos_barcode_map`=0 (data kutadi). ✓

## 19.7 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `auto-barcode.service.ts` Code-128 + `pos_barcode_print_queue` + `generateForMovement()`. ✓

## 19.8 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos_movement_confirmations`=3; `pos-movement-status.service.ts` FINANCE APPROVED yo'li. ✓

## 19.9 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-movement-status.service.ts:199` FINANCE approve. ✓

## 19.10 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-balance-guard.service.ts` asset→BadRequestException, consumable→warning; `material_cards.material_type`. ✓

## 19.11 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos-low-stock.job.ts` notification+telegram; avto purchase-requisition YO'Q. ✓ qisman to'g'ri.

## 19.12 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-movement-status.service.ts:199-222` INLINE GL → `gl_posting_log`; `pos_gl_posting_log`=2. ✓ (doc 203-222 dedi, ~199 dan boshlanadi).

## 19.13 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `GL_PAIRS` code-based (`pos-gl-auto.service.ts`), BHMS kodlar. ✓

## 19.14 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-fifo.service.ts` FIFO/FEFO; `pos_movements.currency/exchange_rate/total_amount_base` ustunlar mavjud. ✓

## 19.15 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-inventory-count.service.ts` + `pos_inventory_counts`=6 + lines + variances + FE PosInventory. ✓

## 19.16 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-secondary-events.handler.ts` onInventoryCompleted; `pos_inventory_variances` jadval. ✓

## 19.17 — [DOC: egasi-data] → [egasi-data] (confirmed)
- Tekshiruv: `pos_inventory_plans`=0 (struktura bor, davriylik data kutadi). ✓

## 19.18 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `INTERNAL_TRANSFER` direction='transfer'; `pos_movements.from/to_warehouse_id`. ✓

## 19.19 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: GL qoidaviy (AI emas); zakaz-tavsiya POS ichida jonli emas. ✓

## 19.20 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "anomaliya-detektor servisi topilmadi".
- Tekshiruv: `pos-anomaly.service.ts` (310 q) — 4 qoida (NIGHT_LARGE_QTY/SEND_RECEIVE_MISMATCH/OVER_NORM/CANCELLED_IDLE) → `pos_anomaly_flags` + notification + socket; `pos-anomaly.listener.ts` @OnEvent `pos.movement.data.completed/cancelled`; controller. To'liq wired.

## 19.21 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-sync.service.ts`; `pos_offline_queue`; `pos_movements.is_offline_sync/offline_queue_id`; FE PosOfflineBanner. ✓

## 19.22 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: STATUS_FLOW cancelled tranziya; `pos_movements_archive` jadval. ✓

## 19.23 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `DAMAGE` direction='adjustment'; `pos-secondary-events.handler` damage→qc; `pos_damage_qc_links`. ✓

## 19.24 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: FG/WIP omborlar live; `goods-receipt.service.ts`; `goods_receipts`=0. ✓

## 19.25 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-fifo.service.ts` FEFO/FIFO; `batch_lot_movements` jadval; FE PosLotTraceability. ✓

## 19.26 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: FE `PosMonitorApp.tsx` + `PosLayout.tsx`; ko'p sahifa. ✓

## 19.27 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-reports.service.ts`; `pos_shift_audit` jadval (0 qator); `pos_audit_log` 41; FE PosReports. ✓

## 19.28 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos_movement_types`=**11** qator (doc "7" dedi — eskirgan; aslida ko'proq). Master-data bor. ✓ (raqam drift, claim to'g'ri).

## 19.29 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `warehouse-kpi.service.ts` + `pos_warehouse_stock_view`; 3-ko'rsatkich formulasi grep'da topilmadi. ✓

## 19.30 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `warehouse_stock`=37 (kanonik); `current_stock` VIEW. ✓

## 19.31 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `INTERNAL_TRANSFER`; WIP-MAIN/PRODUCTION_OFFSET/FLEXO omborlar live. ✓

## 19.32 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "grep techcard → 0 natija; texkarta-mosligi YO'Q".
- Tekshiruv: `pos-techcard-gate.service.ts` `checkLines()` → WMS `OutboundEnforcementService.checkIssueAllowed` (tech_card_bom↔material); wired @ `pos-movement.service.ts:151`; `pos_movement_techcard` jadval (movement_id/technology_card_id/gate_result). Chiqimdan oldin blok REAL.

## 19.33 — [DOC: egasi-data] → [egasi-data] (confirmed)
- Tekshiruv: `material_cards` barcode qo'llab-quvvatlaydi; gofra-qavat kartalari master-data kutadi. ✓

## 19.34 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `quarantine-workflow.service.ts` moveToQuarantine → QC-HOLD ombori live; `pos_movements.quarantine_required`. ✓

## 19.35 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: STATUS_FLOW rejected; SCRAP-MAIN ombori live; `pos_movements.return_reason`. ✓

## 19.36 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "grep makulatura|waste → 0; alohida chiqindi-harakat turi yo'q".
- Tekshiruv: `pos_movement_types` `WASTE_IN` = "Chiqindi/Qoldiq kirim (makulatura)" direction='in' live; `movement-enums.ts` WASTE_IN.

## 19.37 — [DOC: yo'q] → [yoq] (confirmed)
- Tekshiruv: `warehouses.type` 11 tur (MAIN/raw_material/finished_goods/wip/scrap/quarantine/tools/household/mro/PRODUCTION_*) — makulatura ALOHIDA ombor-turi YO'Q. Doc to'g'ri (WASTE_IN movement-tur bor, lekin ombor-turi yo'q).

## 19.38 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "poddon birligi/konversiyasi topilmadi".
- Tekshiruv: `pos_returnable_pallets` jadval + `pos-shift-handover.service.ts` `recordPallet()` (palletType/direction/quantity). Poddon birligi kuzatiladi; 1 poddon=N rulon avto-konversiya aniq emas → qisman.

## 19.39 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "Tara-aylanma jadval/servis topilmadi".
- Tekshiruv: `pos_returnable_pallets` + `recordPallet()`/`getPalletBalance()` (ketdi/qaytdi balansi) + DTO + controller. Real.

## 19.40 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `daily_warehouse_plans` jadval; 0 qator; PP→POS push event jonli tasdiqlanmadi. ✓

## 19.41 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "Prostoy signal servisi topilmadi".
- Tekshiruv: `pos-anomaly.service.ts` `CANCELLED_IDLE` qoidasi (bekor/bo'sh-turish signali) — listener cancelled event'da ishlaydi. "Material kutyapman" tugmasi yo'q → qisman.

## 19.42 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-requisition-workflow.service.ts` + `pos_material_requests`/lines + FE PosRequests/RequisitionDetail. ✓

## 19.43 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos_movements.purchase_order_id` ustun mavjud; jonli data 2 movement — to'liq emas. ✓

## 19.44 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "Norma-fakt taqqoslash guard'i topilmadi".
- Tekshiruv: `pos-anomaly.service.ts` `OVER_NORM_CONSUMPTION` (sarf > norma×POS_OVER_NORM_FACTOR). Post-hoc aniqlash bor; "qizil + chiqimdan oldin sabab so'rash" pre-blok yo'q → qisman.

## 19.45 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-auth` ERP login; RFID ajratilgan. ✓

## 19.46 — [DOC: egasi-data] → [egasi-data] (confirmed)
- Tekshiruv: A-System ko'prik/import kodi yo'q; egasi qarori. ✓

## 19.47 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: WIP-MAIN + PRODUCTION_OFFSET/FLEXO omborlar live; INTERNAL_TRANSFER. ✓

## 19.48 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos_inventory_passport` + `pos_material_passports`(0) + `pos-inventory-passport.service.ts`. FG↔pasport data yo'q. ✓

## 19.49 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "Lab-namuna chiqim sababi/turi topilmadi".
- Tekshiruv: `pos_movement_types` `LAB_SAMPLE_OUT` = "Laboratoriya namunasi (chiqim)" direction='out' live.

## 19.50 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "2-imzo topshirish akti YO'Q".
- Tekshiruv: `pos_shift_handovers` (from_user_id/to_user_id/from_signed_at/to_signed_at/status); `pos-shift-handover.service.ts` 2-IMZO GATE ('closed' faqat ikki imzoda); controller + FE `PosHandovers.tsx`. To'liq.

## 19.51 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos_movements.act_pdf_path/invoice_pdf_path/supplier_id`; `pos-pdf.service.ts`; `pos_three_way_match` jadval. ✓

## 19.52 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "qisman-qabul oqimi topilmadi".
- Tekshiruv: `pos_movement_types` `PARTIAL_RECEIPT` = "Qisman qabul (kam/buzuq)" live. Tur bor; received<ordered ochiq-qoldiq oqimi to'liq tasdiqlanmadi → qisman.

## 19.53 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: POS application/ ichida 5S kodi yo'q (to'g'ri chegara). ✓

## 19.54 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos_audit_log` IP+ts qaydlaydi; maxsus harakatsizlik-signal detektori yo'q. ✓

## 19.55 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: POS ichida energiya kodi yo'q (to'g'ri chegara). ✓

## 19.56 — [DOC: egasi-data] → [egasi-data] (confirmed)
- Tekshiruv: `warehouse-kpi.service.ts` bor; 3-ko'rsatkich formula aniqlanmagan. ✓

## 19.57 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: valyuta konversiya bor; rulon↔kg o'lchov-birligi konversiya jadvali tasdiqlanmadi. ✓

## 19.58 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `INTERNAL_RETURN` is_receipt=true; `return_reason` majburiy. ✓

## 19.59 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `supplier_id`+`return_reason`+rejected; alohida supplier-return tur + kredit-nota event yo'q. ✓

## 19.60 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-fifo.service.ts` hasExpiry→FEFO; `pos-quarantine-check.job`+low-stock ogohlantirish. ✓

## 19.61 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos_movement_lines.bin_id` ustun mavjud. ✓

## 19.62 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "grep davalchesk → 0; davальческое material turi yo'q".
- Tekshiruv: `pos_movement_types` `CUSTOMER_MATERIAL` = "Mijoz-mol (davalcheskoe) kirim" live. Tur bor; qiymat-GL'siz ajratish to'liq emas → qisman.

## 19.63 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos_inventory_plans` + tunda/dam kuni qarori; zona-freeze talab emas. ✓

## 19.64 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "avto-tasdiq limit chegarasi (±N%) kodi topilmadi".
- Tekshiruv: `pos-variance-config.service.ts` VarianceDecision AUTO_APPROVE/ESCALATE + autoApproveQtyPct/autoApproveValueUzs; `pos_variance_config`=1; wired `pos-inventory-count.service.ts`. Real.

## 19.65 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos-low-stock.job.ts` faqat notification+telegram; avto requisition INSERT yo'q. ✓

## 19.66 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `stock-reservation.service.ts` reserved_qty; `pos_stock_reservations`(0); FE PosReservations. ✓

## 19.67 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: chiqim sabab majburiy; rejadan-tashqari maxsus oqim + avto boshliq-xabar yo'q. ✓

## 19.68 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: FIFO qisman allocation; ochiq-rulon oqimi aniq emas (`warehouse_rolls`/`warehouse_roll_usage` jadvallar bor lekin tasdiqlanmadi). ✓

## 19.69 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "movement/brak/inventar foto-dalil biriktirish YO'Q".
- Tekshiruv: `pos_movements.photo_evidence_url`, `pos_returnable_pallets.photo_evidence_url`, `pos_material_passports.photos` ustunlar MAVJUD. Majburiy-foto enforcement aniq emas → qisman.

## 19.70 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos-sync.service.ts` conflicts++ + ConflictException; "tekshirilsin→boshliq" rezolyutsiya to'liq emas. ✓

## 19.71 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos-telegram.service.ts` + `pos-secondary-events.handler` role-based; `pos_telegram_routes`=0 (matritsa data). ✓

## 19.72 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `EXTERNAL_OUT` tur; FINANCE approve; FG-MAIN; `pos_movements.invoice_id/three_way_matched`. ✓

## 19.73 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos-pdf.service.ts` + `pos-pdf-inventory.service.ts`; `pos_pdf_templates`; printer-config service. ✓

## 19.74 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos-department.guard.ts` + role-based tasdiq; razryad-darajali harakat-huquqi ajratilmagan. ✓

## 19.75 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos-reports.service.ts` + warehouse-kpi kesimlar; manager_id vertikal avto-oqim jonli tasdiqlanmadi. ✓

## 19.76 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "Buyurtma-o'zgarish trigger/listener topilmadi".
- Tekshiruv: `pos-techcard-gate.service.ts` `recheckOnOrderChange()` (yangi texkartaga qayta-solishtirish → mos kelmaganlarni qaytaradi) + endpoint `movements.controller.ts:171`. Manual endpoint (avto event-listener emas) → qisman.

## 19.77 — [DOC: yo'q] → [bor] (REFUTED)
- Doc Isbot: "vaqt+miqdor anomaliya-detektori YO'Q".
- Tekshiruv: `pos-anomaly.service.ts` `NIGHT_LARGE_QTY` (22:00–06:00 + POS_NIGHT_LARGE_QTY/VALUE_THRESHOLD) → flag + boshliq notification. Real.

## 19.78 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: pos-barcode/mini-app yangi karta + admin telegram; MM-tasdiq workflow jonli emas; `pos_barcode_map`=0. ✓

## 19.79 — [DOC: egasi-data] → [egasi-data] (confirmed)
- Tekshiruv: `pos_inventory_counts` struktura bor; boshlang'ich-qoldiq import strategiyasi aniqlanmagan. ✓

## 19.80 — [DOC: bor] → [bor] (confirmed)
- Tekshiruv: `pos_audit_log` (user_id/action/old_value/new_value/ip_address/created_at) 41 qator; FE PosMyInventory; `pos-audit.service.ts`. ✓

## 19.81 — [DOC: yo'q] → [qisman] (REFUTED)
- Doc Isbot: "topshir↔qabul farq-nizo rezolyutsiya oqimi YO'Q".
- Tekshiruv: `pos-anomaly.service.ts` `SEND_RECEIVE_MISMATCH` (e'lon qty ≠ ledger) flag + boshliq signal; `pos_movement_confirmations` + `pos_shift_handovers` 2-imzo. "Nizo holati" rasmiy rezolyutsiya-oqimi to'liq emas → qisman.

## 19.82 — [DOC: qisman] → [qisman] (confirmed)
- Tekshiruv: `pos_movement_types.name_ru` + `warehouses.name_ru` i18n; uchinchi til (kirill) egasi qarori. ✓
