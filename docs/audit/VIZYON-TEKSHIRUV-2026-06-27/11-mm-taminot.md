# 11 — MM / Ta'minot — Mustaqil Tekshiruv (2026-06-27)

**Modul:** 11 — MM / Ta'minot
**Savollar:** 68 (11.1–11.68)
**Doc self-claim (vizyon):** 43%
**Recomputed realPct (bor=1, qisman=0.5, yoq=0; egasi-data denominatordan chiqarilgan):** 25%

## Aggregat
- bor (real): 2  (11.4, 11.41)
- qisman (real): 29
- yoq (real): 35
- egasi-data: 2  (11.67, 11.68)
- Verifiable (qTotal − egasiData): 66
- realPct = round(100 × (2 + 0.5×29) / 66) = round(1650/66) = **25%**

## Umumiy xulosa
Bu modulning **per-savol Isbot da'volari juda aniq** — DB ustunlari, satr raqamlari,
enum'lar, qator soni va event-wiring jonli tekshirildi va deyarli barchasi to'g'ri
chiqdi (66/68 to'liq tasdiqlandi, 2 ta kichik enumeratsiya/overstatement nuance).
LEKIN **modul sarlavhasidagi "43% vizyon" raqami formula bo'yicha (bor=1/qisman=0.5)
qayta hisoblaganda ~25% ga tushadi** — ya'ni qisman'lar ko'p, lekin haqiqiy "bor" atigi 2 ta
(reyting-formula + ko'p-qatorli PO). Qolgan "qisman"lar asosan: jadval/ustun strukturasi
mavjud, AMMO 0 qator + wiring/gate/CRON yo'q.

## REFUTED / Overstated da'volar
- **11.15** — Doc: "listPos pending_amount = PO-qabul hisoblaydi". Reality:
  `pending_amount = total_amount − SUM(purchase_order_items.quantity*unit_price)`
  (mm-purchase-orders.controller.ts:64) — bu PO header-summasini O'Z qator-itemlari bilan
  solishtiradi, **kelgan tovar (goods receipt) bilan EMAS**. mm_goods_receipts=0 qator, demak
  haqiqiy qabul-solishtirish yo'q. Umumiy "qisman" bahosi to'g'ri, lekin "qabul hisoblaydi"
  iborasi adashtiradi.
- **11.1** — Doc mm_vendors ustunlari ro'yxatida `inn` ni keltiradi; jonli sxemada `inn`
  ustuni YO'Q (faqat `tax_id` + `tin` bor). Xulosa (MFO/bank/yuridik-manzil yo'q, majburiy-blok
  yo'q) to'g'ri; faqat ustun nomenklaturasi kichik xato.

---

## 11.1 — Q1 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: refuted-minor)
- Savol: Yetkazuvchi majburiy rekvizitlar, majburiysiz saqlash blok?
- Doc Isbot: mm_vendors faqat name/tin/inn/phone/email/address/payment_terms/currency/contact_person; MFO/bank/legal-addr yo'q; MmCreateVendorSchema faqat name majburiy.
- Tekshiruv: mm_vendors cols = address,code,contact_person,currency,email,is_active,name,name_ru,payment_terms,phone,rating,tax_id,tin,vendor_code. **`inn` ustuni YO'Q** (tax_id+tin bor). MFO/bank/yuridik-manzil yo'q — TASDIQ. mm.dto.ts:72-78 MmCreateVendorSchema: name min(1) majburiy, inn/phone/email/address optional — TASDIQ. Xulosa to'g'ri, `inn` enumeratsiyasi xato.

## 11.2 — Q2 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yetkazuvchi turi 6 oldindan belgilangan tur?
- Doc Isbot: mm_vendors da type/category/classification YO'Q.
- Tekshiruv: mm_vendors ustunlarida type/category/classification yo'q — TASDIQ. DTO da tur maydoni yo'q.

## 11.3 — Q3 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 5 holat, qora-ro'yxat buyurtma blok?
- Doc Isbot: MmUpdateVendorSchema:87 status enum 3 (active/inactive/blacklisted); mm_vendors da status ustuni yo'q faqat is_active; blok-guard yo'q.
- Tekshiruv: mm.dto.ts:87 enum aynan 3 ta — TASDIQ. mm_vendors da `status` ustuni yo'q, `is_active` bool bor — TASDIQ. createPo da vendor-status tekshiruvi yo'q (handler ko'rildi) — TASDIQ.

## 11.4 — Q4 [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Reyting 5 mezon sifat40/muddat30/narx20/hujjat10?
- Doc Isbot: mm-vendor-rating.service.ts:81-90 + constants MM_VR_DEFAULT_WEIGHTS 0.4/0.3/0.2/0.1; vendor-performance endpoint:67-78 SQL.
- Tekshiruv: mm-vendor-rating.constants.ts:30-50 MM_VR_WEIGHT_* = 0.40/0.30/0.20/0.10 — TASDIQ. service.ts:81-90 weighted contributions — TASDIQ. mm-vendors-pr.controller.ts:67-78 SQL formula 0.4/0.3/0.2/0.1 — TASDIQ. (Eslatma: vizyon "5 mezon" deydi, kod 4 faktor — lekin keltirilgan og'irliklar 4 ta, koddan mos.)

## 11.5 — Q5 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Reyting avtomatik qayta hisoblanadimi?
- Doc Isbot: supplier-quality-fail.listener.ts JONLI; satr 32 currentRating=5 placeholder; mm_vendor_ratings=7 qator.
- Tekshiruv: listener @EventsHandler(SupplierQualityFailEvent), handle()→updateVendorRating — JONLI ulangan TASDIQ. **satr 32: `const currentRating = 5; // placeholder`** — aynan TASDIQ. mm_vendor_ratings=7 qator — TASDIQ.

## 11.6 — Q6 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Shartnoma (raqam/sana/skan) + 30 kun ogohlantirish?
- Doc Isbot: mm_vendors da contract_number/expiry/scan yo'q; vendor-contract jadvali yo'q; CRON yo'q.
- Tekshiruv: mm_vendors da shartnoma ustunlari yo'q — TASDIQ. MM da vendor-contract jadval/CRON topilmadi.

## 11.7 — Q7 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: To'lov sharti majburiy + Finance avto qarz muddati?
- Doc Isbot: mm_vendors.payment_terms varchar bor lekin tarkibsiz; avto-qarz hisobi yo'q.
- Tekshiruv: mm_vendors.payment_terms ustuni mavjud — TASDIQ. Tarkibli emas (predoplata%/kechikish ajratilmagan), avto-qarz-muddat hisobi MM da yo'q.

## 11.8 — Q8 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yetkazadigan materiallar ro'yxati + per-material narx-tarix?
- Doc Isbot: supplier_price_tiers (supplier_id/material_id/narx) 0 qator; vendor↔material link yo'q.
- Tekshiruv: supplier_price_tiers cols = supplier_id,material_id,unit_price,min_qty,max_qty; **0 qator** — TASDIQ. mm_vendors da material-ro'yxat bog'lanishi yo'q.

## 11.9 — Q9 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Xarid arizasini kim yaratadi, manba belgilanadimi?
- Doc Isbot: mm_purchase_requisitions + CRUD (controller:147-200); requested_by/mrp_run_id; 0 qator; manba-tur yo'q.
- Tekshiruv: mm-vendors-pr.controller.ts:147-200 requisition CRUD (list/get/create/update/delete) — TASDIQ. DB ustunlar requested_by, mrp_run_id, mrp_result_id mavjud — TASDIQ. mm_purchase_requisitions=0 qator — TASDIQ. 'Manba turi' ajratilgan maydon yo'q.

## 11.10 — Q10 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ariza 7 maydon, kerak-sana+miqdor majburiy?
- Doc Isbot: MmCreateRequisitionSchema:91 title majburiy; needed_by/priority/items optional; item da kerak-sana/sabab yo'q.
- Tekshiruv: mm.dto.ts:91-102 — title min(1) majburiy, needed_by/priority/items optional — TASDIQ. item = material_id+quantity+unit_of_measure; kerak-sana/sabab/qaysi-buyurtma/taxminiy-narx item-darajada yo'q — TASDIQ.

## 11.11 — Q11 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ariza tasdiq summaga qarab 3 bosqich?
- Doc Isbot: create-purchase-order.handler.ts:54 PO_MAX_AMOUNT_UZS → director gate; faqat 1 chegara; ariza-3-pog'ona yo'q.
- Tekshiruv: handler.ts:54 `if (totalAmount > PO_MAX_AMOUNT_UZS)` → PoRequiresDirectorApprovalEvent — TASDIQ. Faqat 1 chegara (50mln), <5mln/5-50mln yo'naltirish yo'q — TASDIQ. Konstanta (sozlama emas).

## 11.12 — Q12 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Rad sababi majburiy, qayta yuborish (Qaytarilgan)?
- Doc Isbot: MmUpdateRequisitionSchema status enum draft/pending/approved/rejected/cancelled — 'returned' yo'q; rad-sabab majburiy emas.
- Tekshiruv: mm.dto.ts:107 enum aynan shu 5 ta, 'returned/qaytarilgan' YO'Q — TASDIQ. Majburiy rad-sabab maydoni yo'q (notes optional).

## 11.13 — Q12b [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Arizadan PO yaratish tugmasi (avto-ko'chirish)?
- Doc Isbot: requisitions.purchase_order_id bor; ariza→PO konvertatsiya yo'q; createPo:196 requisition-id qabul qilmaydi.
- Tekshiruv: mm_purchase_requisitions.purchase_order_id ustuni bor — TASDIQ. createPo (controller:196-213) dto = {supplierId, items, createdBy} — requisition-id YO'Q — TASDIQ. Konvertatsiya handler topilmadi (grep bo'sh).

## 11.14 — Q13 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: PO 7 holat, 'Qisman keldi' alohida?
- Doc Isbot: purchase-order.aggregate.ts:13 PoStatus 6 (DRAFT/APPROVED/RECEIVED/INVOICED/CLOSED/CANCELLED); partial alohida yo'q.
- Tekshiruv: aggregate.ts:13-20 enum aynan 6 ta — TASDIQ. recordGoodsReceipt (satr 112-119) to'liq yetganda RECEIVED, qisman holatda APPROVED da qoladi — TASDIQ. Alohida 'partial' status yo'q.

## 11.15 — Q14 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: refuted-overstated)
- Savol: Har kirim PO ga bog'lanib miqdor solishtiriladimi?
- Doc Isbot: mm_goods_receipts.purchase_order_id + recordGoodsReceipt; listPos pending_amount=PO-qabul; 0 qator; over/under yo'q.
- Tekshiruv: mm_goods_receipts.purchase_order_id mavjud, recordGoodsReceipt(quantity) aggregate:112 — TASDIQ. mm_goods_receipts=0 qator — TASDIQ. **AMMO** listPos pending_amount (controller:64) = `total_amount − SUM(purchase_order_items)` — bu kelgan-tovar bilan EMAS, PO o'z qator-itemlari bilan solishtirish. "PO-qabul hisoblaydi" iborasi adashtiradi. Over/under dopusk yo'q — TASDIQ.

## 11.16 — Q15 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Narx-farq 3% dan oshsa to'lov blok?
- Doc Isbot: goods-receipt.handler.ts:40 validateThreeWayMatch + ThreeWayMatchFailedEvent; three_way_matched bool; tolerans-% yo'q.
- Tekshiruv: handler.ts:40 validateThreeWayMatch(poId), satr 75 ThreeWayMatchFailedEvent publish — TASDIQ. mm_purchase_orders.three_way_matched bool ustuni bor — TASDIQ. matched/difference binar, 3% konfig kodda ko'rinmadi — TASDIQ.

## 11.17 — Q16 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Material narx-tarix jadvali + grafik?
- Doc Isbot: material_price_history (material_id/unit_price/currency/supplier_name/purchase_date/movement_id) 0 qator; yozuvchi yo'q.
- Tekshiruv: material_price_history cols AYNAN shu 6 + id/created_at — TASDIQ. **0 qator** — TASDIQ. Yozuvchi yo'q: faqat pos/material-360.service.ts:120 SELECT (o'qiydi), INSERT topilmadi — TASDIQ.

## 11.18 — Q17 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Asl valyuta + MB kursi so'mga, ikkalasi?
- Doc Isbot: mm_purchase_orders.currency + mm_vendors.currency bor; kurs-tarix/so'm-ekvivalent ustuni yo'q.
- Tekshiruv: ikkala jadvalda currency ustuni bor — TASDIQ. mm_purchase_orders da som-ekvivalent/kurs ustuni yo'q — TASDIQ. Avto-aylantirish MM da topilmadi.

## 11.19 — Q18 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Narx oshishi 10% sariq/25% qizil + xabar?
- Doc Isbot: narx-oshish event/listener yo'q; material_price_history bo'sh.
- Tekshiruv: MM da narx-oshish ogohlantirish event topilmadi; price-history 0 qator — TASDIQ.

## 11.20 — Q19 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tender / 3+ yetkazuvchi taqqoslash?
- Doc Isbot: RFQ/tender jadval/endpoint yo'q.
- Tekshiruv: MM da rfq/tender/so'rovnoma grep=0 — TASDIQ.

## 11.21 — Q20 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 5-ustun taqqoslash + umumiy ball?
- Doc Isbot: tender yo'qligi sabab 5-ustun ham yo'q.
- Tekshiruv: Taqqoslash jadvali topilmadi — TASDIQ.

## 11.22 — Q21 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qimmatroq tanlansa sabab majburiy?
- Doc Isbot: tanlov-sabab maydoni/tender yo'q.
- Tekshiruv: Sabab maydoni topilmadi — TASDIQ.

## 11.23 — Q22 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yo'l varaqasi (mashina/haydovchi/masofa/yuk/yoqilg'i)?
- Doc Isbot: mm_deliveries (driver/vehicle/distance/weight/cost/loading_point/shipping_point); 1 qator; chiqish-yetkazish.
- Tekshiruv: mm_deliveries cols = driver_id/driver_name/vehicle_id/distance/weight/total_weight/cost/loading_point/shipping_point + sales_order_id/customer_id — TASDIQ. **1 qator** — TASDIQ. Sales/chiqish-yo'naltirilgan — TASDIQ.

## 11.24 — Q23 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Transport turi (O'z/Yetkazuvchi/Yollangan)?
- Doc Isbot: MmCreateFleetVehicleSchema:117 type enum own/rent/truck; delivery-darajada 3-tur yo'q; mm_deliveries.delivery_type bor lekin semantika tasdiqlanmadi.
- Tekshiruv: mm.dto.ts:117 type enum aynan own/rent/truck — TASDIQ. mm_deliveries.delivery_type ustuni bor — TASDIQ. Yetkazish-darajada 3-tur ajratish tasdiqlanmadi.

## 11.25 — Q24 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Yetkazib berish sharti' (Incoterms)?
- Doc Isbot: mm_purchase_orders da delivery-terms/incoterms ustuni yo'q.
- Tekshiruv: mm_purchase_orders ustunlarida incoterms/delivery_terms yo'q (delivery_date/expected_date bor, lekin "term" emas); grep incoterm=0 — TASDIQ.

## 11.26 — Q25 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yoqilg'i norma l/100km, normativ vs real?
- Doc Isbot: mm_vehicle_fuel_logs (liters/mileage/cost_per_liter); norma ustuni yo'q; 0 qator.
- Tekshiruv: fuel_logs cols = liters,mileage,cost_per_liter,total_cost,station,date,vehicle_id,driver_id,plate_number — TASDIQ. l/100km norma ustuni yo'q — TASDIQ. mm_vehicles=0, fuel_logs=0 qator — TASDIQ.

## 11.27 — Q26 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: +10% og'ish qizil + haydovchi reyting?
- Doc Isbot: norma yo'q → og'ish yo'q; haydovchi-reyting yo'q.
- Tekshiruv: Norma yo'qligi 11.26 da TASDIQ; haydovchi-reyting jadval topilmadi.

## 11.28 — Q27 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Talon/karta nazorat + oy oxiri balans?
- Doc Isbot: fuel_logs har quyish (vehicle/date/liters/station); talon-balans yo'q; 0 qator.
- Tekshiruv: fuel_logs ustunlari quyish yozadi — TASDIQ. talon/karta-balans ustuni yo'q — TASDIQ. 0 qator.

## 11.29 — Q28 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Joriy qarz + aging (0-30/31-60/60+)?
- Doc Isbot: GL Finance-da; MM vendor-darajada aging endpoint topilmadi.
- Tekshiruv: mm-dashboard repository da aging/0-30/days_overdue grep=0 — TASDIQ. MM vendor-kartada aging ko'rsatish yo'q.

## 11.30 — Q29 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qarz 3 kun qolganda + direktor xabar (CRON)?
- Doc Isbot: vendor-payment-due CRON/listener yo'q.
- Tekshiruv: MM da to'lov-muddat CRON topilmadi — TASDIQ.

## 11.31 — Q30 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: To'lov muddati kirim sanasidan?
- Doc Isbot: kirim-sana asosida hisob yo'q; payment_terms tarkibsiz.
- Tekshiruv: Boshlanish-nuqta hisobi MM da topilmadi — TASDIQ.

## 11.32 — Q31 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Avans PO ga bog'lanib material kelganda yopiladimi?
- Doc Isbot: avans/prepayment jadval yoki PO-avans bog'lanishi yo'q.
- Tekshiruv: MM da avans/prepayment topilmadi — TASDIQ.

## 11.33 — Q32 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Min zaxiradan tushsa avto ariza (max−joriy)?
- Doc Isbot: material_cards.min_stock/max_stock/reorder_point; mrp_run_id link; avto-generatsiya tasdiqlanmadi; 0 qator.
- Tekshiruv: material_cards da min_stock/max_stock/reorder_point + current_stock/available_stock mavjud — TASDIQ. mm_purchase_requisitions.mrp_run_id/mrp_result_id bor — TASDIQ. Avto-generatsiya event/CRON tasdiqlanmadi; requisitions=0 qator.

## 11.34 — Q33 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Lead time + rejali ogohlantirish?
- Doc Isbot: lead_time maydoni topilmadi (grep=0).
- Tekshiruv: MM modulda lead_time/leadtime grep=0 — TASDIQ.

## 11.35 — Q34 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Brak belgilanadi, qarz qabul-miqdorga, brak→reyting+reklamatsiya?
- Doc Isbot: supplier-quality-fail listener JONLI; rating placeholder; qarz-korreksiya+reklamatsiya to'liq emas; qc_passed cols 0 qator.
- Tekshiruv: listener wired — TASDIQ. currentRating=5 placeholder — TASDIQ. mm_goods_receipts.qc_passed_items/qc_required_items/qc_by ustunlari bor, 0 qator — TASDIQ. Reklamatsiya hujjati yo'q.

## 11.36 — Q35 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kritik material kirim-QC, tasdiqsiz PP ga berilmaydi (karantin)?
- Doc Isbot: qc_supplier_quality + mm_goods_receipts qc_* cols; PP-blok guard yo'q; pp-released boshqa yo'nalish; 0 qator.
- Tekshiruv: qc_supplier_quality cols (batch_number/pass_rate/quality_score/...) 0 qator — TASDIQ. mm_goods_receipts.qc_* cols bor — TASDIQ. pp-released.listener.ts PpReleasedEvent→stock_reservations INSERT (rezerv, QC-blok EMAS) — TASDIQ. Qabul→QC-gate→PP-blok zanjiri yo'q.

## 11.37 — Q36 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 1 asosiy + zaxira yetkazuvchi, asosiy yo'q bo'lsa zaxira?
- Doc Isbot: material_cards.supplier_name bitta matn; asosiy/zaxira rol yo'q; preferred_supplier grep=0.
- Tekshiruv: material_cards.supplier_name (single text) — TASDIQ. preferred_supplier/backup_supplier grep=0 — TASDIQ.

## 11.38 — Q37 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Prays-list + PO ga avto + muddat ogohlantirish?
- Doc Isbot: supplier_price_tiers (min_qty/max_qty/unit_price) 0 qator + amal-muddat yo'q; avto-tortish yo'q.
- Tekshiruv: supplier_price_tiers cols = min_qty/max_qty/unit_price, amal-muddat (valid_until) ustuni yo'q, 0 qator — TASDIQ.

## 11.39 — Q38 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Import xarajat (landed cost) taqsimoti?
- Doc Isbot: landed-cost jadval/hisob yo'q; PO da qo'shimcha-xarajat ustunlari yo'q.
- Tekshiruv: landed/landed_cost grep=0; mm_purchase_orders da boj/broker ustunlari yo'q — TASDIQ.

## 11.40 — Q39 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yetkazuvchiga qaytarish + ombor chiqim + kredit-nota?
- Doc Isbot: mm_goods_issues bor (chiqim umumiy); vendor-return+kredit-nota+qarz-korreksiya yo'q.
- Tekshiruv: mm_goods_issues/mm_goods_issue_items jadvallari bor (0 qator) — issues=ishlab-chiqarishga chiqim. credit_note/vendor_return grep=0 — TASDIQ.

## 11.41 — Q40 [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: PO qatorlardan jami avto?
- Doc Isbot: mm_purchase_order_items (raw_material_id/quantity/unit_price/total_price) + getTotalPrice()+getTotalAmount() reduce; 8 qator.
- Tekshiruv: aggregate.ts:27 getTotalPrice = quantity*unitPrice; :75-77 getTotalAmount reduce — TASDIQ. mm_purchase_order_items=**8 qator** — TASDIQ. Ko'p-qatorli PO ishlaydi.

## 11.42 — Q41 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Qator-darajada buyurtma/kelgan/qolgan, Qisman holat?
- Doc Isbot: listPos (controller:62-64) PO-darajada received/pending; qator-darajada yo'q; Qisman status yo'q.
- Tekshiruv: controller:62-64 receipt_count/received_amount/pending_amount PO-darajada — TASDIQ. Qator-darajada kelgan/qolgan kuzatuv yo'q; recordGoodsReceipt header _receivedQuantity yig'adi — TASDIQ.

## 11.43 — Q42 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Hujjatlar skani + sertifikat muddat ogohlantirish?
- Doc Isbot: mm_vendors da hujjat/skan/attachment ustunlari yo'q; vendor-document jadval yo'q.
- Tekshiruv: mm_vendors da attachment/scan/document ustuni yo'q — TASDIQ.

## 11.44 — Q43 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: NDS-to'lovchi belgisi + NDS-hisobga taqqoslash?
- Doc Isbot: mm_vendors da nds/vat/is_vat_payer yo'q.
- Tekshiruv: mm_vendors ustunlarida nds/vat/is_vat_payer yo'q — TASDIQ.

## 11.45 — Q44 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Oylik xarid byudjeti + 90%/100% gate?
- Doc Isbot: procurement budget jadval/guard yo'q; faqat PO>50mln gate (mutlaq summa).
- Tekshiruv: MM da byudjet jadval/guard topilmadi; faqat PO_MAX_AMOUNT_UZS — TASDIQ.

## 11.46 — Q45 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yetkazuvchi statistika tab?
- Doc Isbot: material_supplier_ratings (total_orders/on_time/late/qc_approved/qc_rejected/avg_price) 0 qator; vendor-tab endpoint tasdiqlanmadi.
- Tekshiruv: material_supplier_ratings cols AYNAN shu + total_quantity/total_amount — TASDIQ. **0 qator** — TASDIQ. Vendor-darajada stat-tab endpoint to'liq tasdiqlanmadi.

## 11.47 — Q46 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Sverka akti avto + PDF?
- Doc Isbot: reconciliation akti endpoint yo'q.
- Tekshiruv: MM da sverka/reconciliation topilmadi — TASDIQ.

## 11.48 — Q47 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Mashina/haydovchi davriy hisobot?
- Doc Isbot: mm_vehicles/fuel_logs 0 qator; norma-fakt hisobot yo'q.
- Tekshiruv: mm_vehicles=0, mm_vehicle_fuel_logs=0 — TASDIQ. Davriy-hisobot endpoint yo'q.

## 11.49 — Q48 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Muloqot jurnali (CRM-ga o'xshash)?
- Doc Isbot: vendor-interaction/communication jurnal jadval yo'q.
- Tekshiruv: MM da vendor-interaction jurnal topilmadi — TASDIQ.

## 11.50 — Q49 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Asosiy birlik + konvertatsiya koeffitsient avto-aylantirish?
- Doc Isbot: unit_of_measures seed + PO/requisition item 'unit'; konvertatsiya-koeffitsient+avto-aylantirish yo'q.
- Tekshiruv: material_cards.unit_of_measure + pallet_unit_qty bor; umumiy konvertatsiya-koeffitsient (1 rulon=N kg) + avto-aylantirish kodda topilmadi — TASDIQ (qisman: birlik bor, konvertatsiya yo'q).

## 11.51 — Q50 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 'Yaratdi/tasdiqladi/yubordi' izlari?
- Doc Isbot: created_by/approved_by/approved_at/goods_received_by/at cols + SoD (approve-handler:36); 'yubordi' alohida iz yo'q.
- Tekshiruv: mm_purchase_orders da created_by/approved_by/approved_at/goods_received_by/goods_received_at ustunlari bor — TASDIQ. SoD: aggregate.ts:91-95 approvedBy===createdBy bloklaydi — TASDIQ. 'Yubordi' alohida iz yo'q — TASDIQ.

## 11.52 — Q51 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 'Shoshilinch' tezkor tasdiq + keyin hujjatlash?
- Doc Isbot: MmCreateRequisitionSchema.priority 'urgent' (dto:94); urgent→qisqartirilgan-yo'l guard yo'q.
- Tekshiruv: mm.dto.ts:94 priority enum low/medium/high/urgent — TASDIQ. urgent→workflow-farqi guard kodda topilmadi — TASDIQ.

## 11.53 — Q52 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Bank rekvizit o'zgarsa alohida tasdiq + eski tarix?
- Doc Isbot: mm_vendors da bank-rekvizit ustuni yo'q → workflow yo'q; updateVendor to'g'ridan tahrirlaydi.
- Tekshiruv: mm_vendors da bank-rekvizit ustuni yo'q (11.1); updateVendor controller:125 to'g'ridan PATCH — TASDIQ.

## 11.54 — Q55 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Laboratoriya (РД-5) tasdig'isiz PP ga chiqmaslik?
- Doc Isbot: qc_lab_tests bor (0 qator); kirim↔lab-gate↔PP-blok zanjiri yo'q; namlik/граммаж mm_goods_receipts da yo'q.
- Tekshiruv: qc_lab_tests=0 qator; moisture/namlik/grammaj grep MM=0 — TASDIQ. Gate zanjiri yo'q.

## 11.55 — Q56 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Rulon namligi chegaradan oshsa karantin+claim?
- Doc Isbot: moisture maydoni/chegara/karantin-trigger yo'q (grep=0).
- Tekshiruv: moisture/namlik/vlazhnost grep MM=0 — TASDIQ.

## 11.56 — Q57 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Граммаж texkartaga ±dopusk?
- Doc Isbot: граммаж o'lchov+texkarta-solishtirish yo'q (grep=0).
- Tekshiruv: grammaj grep MM=0 — TASDIQ.

## 11.57 — Q58 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Топлайнер ╳ местный kross-tekshiruv?
- Doc Isbot: qog'oz-sinf atributi + topliner/mestny kross yo'q (grep=0).
- Tekshiruv: topliner grep MM=0 — TASDIQ.

## 11.58 — Q59 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Gofra ECT + qavat moslik texkartaga?
- Doc Isbot: ECT/qavat atribut+moslik yo'q; layer-formula.service.ts bor lekin ECT-kirim emas.
- Tekshiruv: layer-formula.service.ts mavjud (gofra sloy) — ECT kirim-nazorati emas — TASDIQ.

## 11.59 — Q60 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Shartli ruxsat (o'tdi/shartli/rad) 3 holat?
- Doc Isbot: mm_goods_receipts.status draft/pending/approved/rejected — shartli yo'q.
- Tekshiruv: MmUpdateGoodsReceiptSchema:47 enum draft/pending/approved/rejected — 'conditional' YO'Q — TASDIQ.

## 11.60 — Q61 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Partiya izlanuvchanlik (kirim→ombor→chiqim→PP)?
- Doc Isbot: wms_supplier_traceability mavjud; batch_number qc_supplier_quality da (0 qator); zanjir jonli ulanmagan.
- Tekshiruv: wms_supplier_traceability jadval mavjud (0 qator); qc_supplier_quality.batch_number ustuni bor (0 qator) — TASDIQ. To'liq zanjir jonli ulanmagan.

## 11.61 — Q62 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Brak sabab tahlil jurnali?
- Doc Isbot: brak-sabab-tahlil jadval yo'q; supplier-quality-fail faqat reyting.
- Tekshiruv: Sabab-jurnal jadval MM da topilmadi — TASDIQ.

## 11.62 — Q63 [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Reytingga laboratoriya o'tish % alohida?
- Doc Isbot: material_supplier_ratings.qc_approved/qc_rejected (o'tish-% mumkin) 0 qator; formulaga ulanmagan; placeholder.
- Tekshiruv: qc_approved/qc_rejected ustunlari bor, 0 qator — TASDIQ. Reyting formulaga (40/30/20/10) lab-% alohida ulanmagan — TASDIQ.

## 11.63 — Q64 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Texkarta kompozitsiya laborant gate?
- Doc Isbot: PP/texkarta domeni, MM da yo'q.
- Tekshiruv: MM da texkarta-laborant-gate topilmadi — TASDIQ.

## 11.64 — Q65 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Etalon namuna saqlanib kirim solishtiriladimi?
- Doc Isbot: reference-sample jadval/foto yo'q.
- Tekshiruv: Etalon-namuna jadval MM/QC da topilmadi — TASDIQ.

## 11.65 — Q66 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yangi yetkazuvchi sinovda→tasdiqlangan (onboarding)?
- Doc Isbot: vendor status enum 3, 'trial/sinovda' yo'q.
- Tekshiruv: mm.dto.ts:87 enum active/inactive/blacklisted — 'trial' YO'Q — TASDIQ.

## 11.66 — Q67 [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Manfaatlar to'qnashuvi (aloqador shaxs) bayrog'i?
- Doc Isbot: mm_vendors da related-party/conflict ustuni yo'q (grep=0); gate yo'q.
- Tekshiruv: conflict_of_interest/related_party/aloqador grep MM=0 — TASDIQ.

## 11.67 — EP-MM-025 [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Ariza summa-chegaralarini kim belgilaydi (sozlamada)?
- Doc Isbot: PO_MAX_AMOUNT_UZS konstanta (app.constants.ts) kodda qattiq; sozlama-UI yo'q.
- Tekshiruv: create-purchase-order.handler.ts:11 import PO_MAX_AMOUNT_UZS from app.constants — kodda — TASDIQ. Sozlama-oynasi yo'q; chegara-qiymat egasi qaroriga bog'liq — egasi-data.

## 11.68 — EP-MM-040 [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Reyting og'irliklarini egasi tasdiqlaydimi?
- Doc Isbot: MM_VR_DEFAULT_WEIGHTS 0.4/0.3/0.2/0.1 default + override (computeRating weights); yakuniy og'irlik egasi tasdig'i.
- Tekshiruv: constants.ts:45 MM_VR_DEFAULT_WEIGHTS; service.ts:65-70 computeRating(metrics, weights?) override-merge — TASDIQ. Default kodda, yakuniy qiymat egasi-data.
