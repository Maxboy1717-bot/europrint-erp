# 06 — SD / Sotuv — Mustaqil tekshiruv (2026-06-27)

**Auditor:** adversarial verifier (independent re-check vs live `europrint` DB + source).
**Slice:** doc lines 2112–2543, 107 savol (06.1–06.107).

## Aggregate
- Doc self-claim: **48% vizyon**.
- Doc flag taqsimoti: **bor=10, qisman=49, yoq=42, egasi-data=6**.
- Tekshiruvdan keyin (mening qayta-bahom): **borReal=10, qismanReal=49, yoqReal=42, egasiData=6** — doc bilan mos.
- **realPct (verifiable only, egasi-data chiqarib): round(100*(10 + 0.5*49)/101) = 34%.**
  (Doc'ning 48% "vizyon coverage" o'lchovi egasi-data + qisman'ni boshqacha vaznlaydi; kod-ijro % = 34%.)
- **Claim accuracy: confirmed=106, refuted=1.** Doc favqulodda aniq va o'z-o'ziga tanqidiy — deyarli har Isbot jonli DB/kodga to'g'ri keldi.

## REFUTED / overstated CLAIMS
- **06.44 (Q-GL/EP-SD-030)** — Doc: "non-fatal log+**retry** (soxta emas)". Kodda RETRY YO'Q — `markPaymentPaid` faqat `logger.warn` qiladi (sd-quotations.service.ts:257), qayta-urinish mexanizmi yo'q. Asosiy da'vo (GL posting REAL, non-fatal) TO'G'RI — faqat "retry" so'zi ortiqcha. Flag (bor) o'rinli.

Boshqa hech bir savolda Isbot da'vosi yolg'on/ortiqcha topilmadi. Barcha "yo'q" da'volari (yetishmayotgan ustun/jadval) information_schema bilan tasdiqlandi; barcha "bor" da'volari (jadval/ustun/servis-metod) jonli topildi.

---

## Jonli tasdiqlangan poydevor (DB + kod)
- **sales_orders** (13 qator): total_amount, paid_amount, balance_due_amount, advance_paid_amount, delivery_date, requested_delivery_date, payment_terms, advance_percent, advance_due_date, balance_due_date, tax_amount, net_value, changed_by, version, design_flag, sample_flag, tech_card_approved, tech_approved_by, tech_approved_at, assigned_to, abc_class — HAMMASI mavjud. YO'Q: folder_number, order_1c/zakaz_1c, packaging_type, pallet_qty, gruzopodyomnost, napravlenie, davalcheskoe.
- **sales_order_items** (2 qator; order 56 = 2 item → ko'p-qator REAL): unit, net_price, delivery_date, order_quantity, confirmed_quantity, delivered_quantity, open_quantity. O'lcham (L×W×H) YO'Q (faqat sd_quotation_items'da).
- **sd_quotation_items**: length_mm/width_mm/height_mm, product_type, paper_type, print_colors, lamination, special_coating, is_new_die, cost_price mavjud. YO'Q: napravlenie/ofset, tisnenie/kongrev, die_cut_method, skleyka, print_sides, layer_count, marka/profil, film_thickness.
- **sd_customers** (15 qator): inn, stir, phone, email, address, legal_address, actual_address, customer_code, customer_type, credit_limit, payment_terms_days, abc_class, segment, discount_rate, manager_id, open_debt, is_blocked, block_reason, last_order_date, churn_risk_pct.
- **sd_quotations**=0, **sd_contracts**=0, **deliveries**=1, **crm_leads**=13, **sd_lead_activities**=0, **ow_tech_cards/ow_molds/ow_order_samples**=0 — doc data-da'volari mos.
- **sd_price_formulas** (1 qator): seed paper_b=**4200**, print_4color=**38000**, markup=**35**, die_new=**1.8M** — doc bilan AYNAN mos.
- **invoice_number_seq** SEQUENCE mavjud. **order_cancellation_rules / unit_conversion_rules / tax_rates** jadvallari YO'Q — "yo'q" da'volari to'g'ri.
- Kod: calculatePrice (RSC geometry L87, die new/existing L103, labour qty/1000 L107), customer-abc computeAbc + recompute, getCreditStatus (L72, EP-SD-061 flag), get360View (L92), convertToOrder (L161), updateQuotation versioning (L193), cancelOrder (L240), markPaymentPaid→gl.postCustomerPayment (L256), update-order-status handler avans-gate (L40-52) + atomik outbox golden-thread (L72-110), orders.constants (INGLIZ statuslar), GlPostingService.postCustomerPayment (DR Cash/CR AR) — HAMMASI jonli.

---

## Per-question (qisqa)

### Narx-dvigatel va buyurtma (06.1–06.39)
- **06.1 [qisman→qisman] confirmed** — sales_orders/items boy; o'lcham items'da yo'q (faqat narx-inputda). To'g'ri.
- **06.2 [qisman→qisman] confirmed** — paperType enum bor, ~15 toifa katalog jadvali yo'q (product_type erkin matn).
- **06.3 [egasi→egasi] confirmed** — RSC geometry calculatePrice:87 jonli (GLUE_FLAP=40); priklad% egasidan.
- **06.4 [qisman→qisman] confirmed** — sales_order_items.unit bor; avto birlik-tanlash yo'q.
- **06.5 [qisman→qisman] confirmed** — delivery_date + requested_delivery_date ikkalasi DB'da; CRP-ulanish isbotlanmagan.
- **06.6 [yoq→yoq] confirmed** — MOQ/kichik-partiya ustama yo'q.
- **06.7 [bor→bor] confirmed** — calculatePrice REAL (paper+print+die+labour+delivery→markup→VAT), seed qiymatlar mos.
- **06.8 [qisman→qisman] confirmed** — paper narx config-jadvaldan; FIFO avto-ulanish yo'q.
- **06.9 [qisman→qisman] confirmed** — print rang soniga qarab (L97-100); qoplama% (zalivka) formula'da yo'q.
- **06.10 [qisman→qisman] confirmed** — productionCost=hourly_rate×qty/1000 (L107), marshrut-ajratish yo'q.
- **06.11 [qisman→qisman] confirmed** — lamination/embossing/perforation_price ustun BOR lekin calculatePrice QO'SHMAYDI (L111 faqat 5 komponent).
- **06.12 [egasi→egasi] confirmed** — dieCost new/existing (L103); die_cost_new=1.8M; egalik egasidan.
- **06.13 [yoq→yoq] confirmed** — bulk-discount/tiraj-pog'ona calculatePrice'da yo'q.
- **06.14 [yoq→yoq] confirmed** — chegirma-turlari mexanizmi yo'q; faqat discount_rate.
- **06.15 [yoq→yoq] confirmed** — chegirma-shift cap yo'q.
- **06.16 [qisman→qisman] confirmed** — RBAC approve bor; foizga-bog'liq eskalatsiya yo'q.
- **06.17 [yoq→yoq] confirmed** — margin qaytadi, floor-blok yo'q.
- **06.18 [bor→bor] confirmed** — computeAbc + recompute REAL (Pareto A≤80/B≤95/C); CUSTOMER_ABC_CUMULATIVE konstanta.
- **06.19 [egasi→egasi] confirmed** — abc_class/credit_limit/discount_rate/payment_terms_days ustunlar; paket-qiymat egasidan.
- **06.20 [qisman→qisman] confirmed** — sd_quotations + convertToOrder REAL; PDF yo'q; 0 qator.
- **06.21 [qisman→qisman] confirmed** — valid_until ustun; avto-expire cron yo'q.
- **06.22 [qisman→qisman] confirmed** — sendQuotation→sent, approveQuotation→approved (L179-191) + sanalar; 6-bosqich to'liq emas.
- **06.23 [bor→bor] confirmed** — convertToOrder (L161) + convert endpoint + AuditInterceptor; converted_to_order_id/order_id.
- **06.24 [qisman→qisman] confirmed** — orders.constants INGLIZ; live status=cancelled/closed/confirmed/delivered/in_progress; rus yo'q.
- **06.25 [qisman→qisman] confirmed** — avans-gate FORBIDDEN (handler L40-52); maket/kredit gate'lari birlashmagan.
- **06.26 [qisman→qisman] confirmed** — design_flag/sample_flag; avto bloklovchi darvoza emas.
- **06.27 [qisman→qisman] confirmed** — sd_contracts + template_type; 0 qator; ikki-daraja modellanmagan.
- **06.28 [yoq→yoq] confirmed** — sd_contracts'da to'lov/valyuta/jarima/penya ustun YO'Q (psql tasdiq).
- **06.29 [qisman→qisman] confirmed** — payment_terms/advance_percent/due_date; enum-shablon yo'q.
- **06.30 [egasi→egasi] confirmed** — getCreditStatus (repo:72) REAL; qiymat egasidan.
- **06.31 [egasi→egasi] confirmed** — flag matnida "direktor tasdig'i (EP-SD-061)" (repo:88); oqim egasidan.
- **06.32 [qisman→qisman] confirmed** — open_debt/is_blocked/block_reason; prosrochka→avto-gate yo'q.
- **06.33 [qisman→qisman] confirmed** — total_orders/last_order_date + convert pattern; "qayta buyurtma" tugma yo'q.
- **06.34 [qisman→qisman] confirmed** — calculatePrice qayta hisoblaydi; eski-vs-yangi solishtirish yo'q.
- **06.35 [qisman→qisman] confirmed** — get360View (repo:92); dizayn-arxiv strukturasi yo'q.
- **06.36 [bor→bor] confirmed** — sales_order_items FK + per-line narx; order 56=2 item JONLI.
- **06.37 [qisman→qisman] confirmed** — deliveries FK + delivered/open_quantity; deliveries=1, zanjir minimal.
- **06.38 [yoq→yoq] confirmed** — confirmed/delivered_quantity; +/-N% og'ish qoidasi yo'q.
- **06.39 [qisman→qisman] confirmed** — cancelOrder (L240); bosqichli jarima-foiz yo'q.

### KPI / Lead / Golden-thread / Customer (06.40–06.48)
- **06.40 [qisman→qisman] confirmed** — getKpiTeam/getKpiTargets/getFunnelReport jonli; sd_manager_quotas/sales_targets jadvallar; haftalik izolyatsiya to'liq emas.
- **06.41 [qisman→qisman] confirmed** — sd-leads.controller to'liq CRUD+convert+activities; crm_leads=13; sd_lead_activities=0.
- **06.42 [qisman→qisman] confirmed** — assigned_to/manager_id; bonus=marjadan logikasi yo'q.
- **06.43 [bor→bor] confirmed** — handler L72-110 atomik UPDATE+outbox 'sd.order.status_changed'; OrderStatusChangedEvent publish.
- **06.44 [bor→bor] confirmed (lekin "retry" overstated — REFUTED detail)** — gl.postCustomerPayment REAL (DR Cash/CR AR); non-fatal warn (L257); RETRY yo'q.
- **06.45 [bor→bor] confirmed** — sd_customers to'liq rekvizit; 15 qator.
- **06.46 [qisman→qisman] confirmed** — inn/phone ustun; avto-dublikat tekshiruv isbotlanmagan.
- **06.47 [bor→bor] confirmed** — updateQuotation yangi versiya (L193-216) + getRevisions; sd_quotation_revisions; AuditInterceptor.
- **06.48 [qisman→qisman] confirmed** — class-level @UseGuards(Jwt,Roles)+@Roles; row-scope/margin-mask isbotlanmagan.

### EP-SD-100..137 vizyon-gap blok (06.49–06.107)
- **06.49 [yoq] confirmed** — rus statuslar yo'q; orders.constants ingliz.
- **06.50 [yoq] confirmed** — MaterialRequiredEvent/Ta'minot signal grep=0; status enum yo'q.
- **06.51 [yoq] confirmed** — napravlenie/ofset ustun yo'q (psql).
- **06.52 [yoq] confirmed** — mashina-format modeli yo'q.
- **06.53 [qisman] confirmed** — unit ustun; unit_conversion_rules jadval YO'Q (psql).
- **06.54 [yoq] confirmed** — davalcheskoe/material_owner yo'q.
- **06.55 [qisman] confirmed** — sd_customer_documents bor; ow_order_samples=0, ulanmagan.
- **06.56 [qisman] confirmed** — ow_tech_cards=0 + tech_card_approved; avto-event yo'q.
- **06.57 [yoq] confirmed** — gruzopodyomnost ustun yo'q.
- **06.58 [yoq] confirmed** — PDF/generatePdf endpoint yo'q.
- **06.59 [yoq] confirmed** — signed_by/komdir ustun yo'q (psql).
- **06.60 [qisman] confirmed** — approve endpoint bor; method-level komdir @Roles ko'rinmaydi.
- **06.61 [yoq] confirmed** — debt-collector roli yo'q; open_debt ustun bor.
- **06.62 [qisman] confirmed** — sd_customer_interactions + endpoint; korporativ-raqam integratsiyasi yo'q.
- **06.63 [yoq] confirmed** — interactions REAL lekin NO-2/korporativ telefon yo'q → vizyon yo'q.
- **06.64 [qisman] confirmed** — sd-leads + sd_lead_activities (0 qator); voronka yuza.
- **06.65 [yoq] confirmed** — mavsumiy cron yo'q.
- **06.66 [yoq] confirmed** — ~15 toifa katalog jadvali yo'q.
- **06.67 [yoq] confirmed** — product_type erkin matn, lookup emas.
- **06.68 [yoq] confirmed** — ml/diametr shablon yo'q.
- **06.69 [bor→bor] confirmed** — total/paid/balance/advance_paid jonli ustunlar.
- **06.70 [qisman] confirmed** — requested+delivery_date; atp-check bor lekin CRP hisobi to'liq emas.
- **06.71 [qisman] confirmed** — ikki sana; kechikish-sabab mantiq yo'q.
- **06.72 [yoq] confirmed** — packaging_type yo'q; ow_packaging_records=0.
- **06.73 [yoq] confirmed** — pallet_qty/size yo'q.
- **06.74 [egasi] confirmed** — ow_molds=0 (order_id/vendor/status/photo); egalik+muddat ustun yo'q (psql).
- **06.75 [qisman] confirmed** — margin/cost/markup qaytadi; cost_price; margin<floor qizil yo'q.
- **06.76 [qisman] confirmed** — cost/margin qaytadi; forRole mask yo'q.
- **06.77 [qisman] confirmed** — payment_terms; shablon-enum yo'q.
- **06.78 [qisman] confirmed** — balance_due_date + delivered_at; shipped+N listener yo'q.
- **06.79 [yoq] confirmed** — 100%→5% chegirma mantiq yo'q.
- **06.80 [qisman] confirmed** — priceBeforeVat+vatRate(12) + tax_amount/net_value; tax_rates jadval YO'Q (psql).
- **06.81 [qisman] confirmed** — approve endpoint; method-level komdir @Roles isbotlanmagan.
- **06.82 [qisman] confirmed** — sd_order_timeline + revisions + changed_by/version; field-level diff emas.
- **06.83 [qisman] confirmed** — design/sample/tech_card_approved/tech_approved_by/at; hard-gate yuza.
- **06.84 [yoq] confirmed** — EmployeeDeactivated→reassign yo'q; manager_id bor.
- **06.85 [qisman] confirmed** — abc_class/CustomerAbcService + last_order_date/churn/segment; avto faollik-cron yuza.
- **06.86 [qisman] confirmed** — sales_orders.id PK + FK'lar; to'liq event-zanjir yuza.
- **06.87 [bor→bor] confirmed** — deliveries driver/vehicle/dispatched/delivered/arrival; real INSERT; 1 qator.
- **06.88 [yoq] confirmed** — tisnenie/kongrev ustun yo'q (embossing_price bitta tarif).
- **06.89 [yoq] confirmed** — folga_color/zoloto/serebro yo'q.
- **06.90 [yoq] confirmed** — lamination ustun BOR lekin boolean/erkin (enum yo'q).
- **06.91 [yoq] confirmed** — special_coating bitta belgi; lak-turi/coverage% yo'q.
- **06.92 [yoq] confirmed** — kashirovka belgisi yo'q.
- **06.93 [yoq] confirmed** — die_cut_method yo'q; is_new_die boolean.
- **06.94 [yoq] confirmed** — skleyka turi/tarif yo'q.
- **06.95 [yoq] confirmed** — print_sides yo'q; print bir-tomonlama.
- **06.96 [yoq] confirmed** — makro/mikro gofra turi yo'q.
- **06.97 [yoq] confirmed** — layer_count yo'q; thickness_mm qatlam emas.
- **06.98 [yoq] confirmed** — banderol pozitsiya yo'q.
- **06.99 [yoq] confirmed** — Latok SKU katalog yo'q.
- **06.100 [yoq] confirmed** — avto-matn funksiya yo'q.
- **06.101 [yoq] confirmed** — marka/profil lug'at yo'q.
- **06.102 [yoq] confirmed** — plyonka mikron yo'q.
- **06.103 [qisman] confirmed** — sd_contracts.papka_no BOR; sales_orders.folder_number YO'Q (psql).
- **06.104 [yoq] confirmed** — order_1c/zakaz_1c ustun YO'Q (psql).
- **06.105 [qisman] confirmed** — deliveries + delivered/open_quantity + sd_invoices; partial avto-GL to'liq emas.
- **06.106 [qisman] confirmed** — invoice_number_seq SEQUENCE jonli; service-darajasi to'liq tasdiq kerak.
- **06.107 [yoq] confirmed** — cancelOrder faqat status; order_cancellation_rules jadval YO'Q (psql).

---

## Xulosa
Doc 06 — SD/Sotuv moduli **favqulodda halol va aniq**: 107 da'voning 106'si jonli DB/kod bilan tasdiqlandi; faqat 06.44'dagi "retry" so'zi ortiqcha (asosiy GL-da'vo to'g'ri). Hech bir "bor" da'vo soxta/echo emas; hech bir "yo'q" da'vo noto'g'ri-salbiy emas. Kod-ijro realPct=**34%** (verifiable savollar), doc'ning 48% "vizyon" o'lchovidan past, chunki vizyonning katta qismi (poligrafiya-spetsifik atributlar EP-SD-083..097) qurilmagan — buni doc o'zi to'g'ri belgilagan.
