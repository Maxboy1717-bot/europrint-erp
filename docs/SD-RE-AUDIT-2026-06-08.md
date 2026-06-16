# SD (#04) — Faza-0 RE-AUDIT (read-only): 435 route, ~30% REAL

> **Bajaruvchi 🟢 MASSIV | READ-ONLY | 2026-06-13 | 6-o'lchovli Workflow, hammasi jonli DB-proof (Q-29)**
> Kanonik: orders=`sales_orders` (sd_sales_orders=VIEW), stock=`warehouse_stock`, GL=`entries` (gl_journal_entries TEGMA). C6 — parallel dunyo yo'q.
> ⭐ XULOSA: SdModule 435 route ro'yxatdan o'tgan, lekin ko'pchiligi STUB/CRASH/FAKE. CRUD-ning bir qismi REAL; biznes-logika (narx, GL, aging, KPI, avtomatlashtirish) deyarli YO'Q. DB bo'sh (sd_customers=9, sales_orders=12 seed, qolgani ~0).

## 0. CLAUDE.md STALE da'vosi tuzatildi
"sd-customers.controller.ts:111/152/184/204 = 4 empty-object stub" — **YOLG'ON/eskirgan**. Controller qayta yozilgan, o'sha satrlar REAL (list/getById/get360/update). Customer CRUD haqiqiy.

## 1. GAP XARITASI (status bo'yicha)

### REAL (ishlaydi)
- Customer CRUD + 360 view (contacts/interactions/NPS) + CSV export · Order CREATE (atomik, #03 HOP-0 customer_id/items/avans-70 saqlangan, lekin hech qachon jonli ishlamagan) · advance confirm/bypass (idempotent+optimistic-lock) · invoice create · payment list/debitors/rentals · contract sign · complaint list/resolve · KPI team aggregate · price-formula settings admin (sd_price_formulas upsert).

### STUB/CRASH/FAKE (eng kritik — surgical fix kerak)
| Feature | Muammo | Fix | Effort |
|---------|--------|-----|--------|
| Quotation create/update (EP-SD-050) | INSERT/UPDATE `title`+`items` — DB'da YO'Q ustun → **DB_ERROR** | live ustunlarga moslash + items→sd_quotation_items | M |
| Payment create (EP-SD-023) | `payments.id` uuid NOT NULL default-siz → **23502 crash** (0 row sababi) | gen_random_uuid() DDL yoki INSERT'da explicit id | M |
| Contracts list (EP-SD-057) | Drizzle stub fantom ustun (start_date/total_amount...) → **500** | stub'dan fantom ustunlarni olib tashlash | S |
| Complaint create (EP-SD-081) | INSERT `subject` — DB'da YO'Q → **crash** | subject→description/complaint_type | S |
| Contract create (EP-SD-058) | total_amount/start_date/payment_terms DROP qilinadi → **fake-create** | DDL + repo write | S |
| Leaderboard (EP-SD-016) | join `assigned_to(uuid)=employees.id(int)` → **crash** | manager_id(int) bo'yicha join | M |
| calculate-price (EP-SD-037) | hardcoded 100k base, sd_price_formulas O'QILMAYDI → **FAKE narx** | real formula engine (FIFO+boyoq+op+markup+VAT) | L |
| Quota dashboard target | `0::numeric AS target` hardcoded → metrikalar 0 | sd_manager_quotas.quota_amount o'qish | S |
| KPI targets (EP-SD) | GET hardcoded Ok([]); PATCH sd_kpi_targets jadval YO'Q → crash | jadval (DDL) yoki sd_manager_quotas | M |
| Order status-machine (EP-SD-054) | FE stage-nomlari (sales/design/...) ≠ BE VALID_TRANSITIONS; FE `{status}` ≠ BE `{newStatus}` → **har PATCH 400** | FE/BE shartnoma moslash | M |
| Order cancel | FE `PATCH /sd/orders/:id/cancel` route YO'Q → **404** | route qo'shish | S |
| Maket checkpoint (EP-SD-056) | approveTechCheckpoint flag'lar **saqlanmaydi** (update faqat status) | repo update kengaytirish | M |
| Delivery status (EP-SD-021) | FE enum (PICKING/PACKING) ≠ BE (pending/in_transit) → **400** | enum moslash | M |
| Payments export | FE `/sd/payments/export` route YO'Q → **404** | CSV route qo'shish | S |

### MISSING (umuman yo'q — yangi qurish)
- Duplicate check (EP-SD-075) · manager-assignment+RBAC scope (EP-SD-018/114) · segmentation persist (EP-SD-136) · discount tiers/approval (EP-SD-004/006/046/111) · floor-price (EP-SD-047) · price-expiry (EP-SD-051) · KP→PDF (EP-SD-109) · GL posting (EP-SD-030) · auto-close (EP-SD-022 — listener bor, emit yo'q) · debitor aging buckets (EP-SD-013/112) · credit-limit enforce (EP-SD-060/061/062) · 100%-avans-5% (EP-SD-130) · payment templates (EP-SD-059/128) · delivery dual-approval (EP-SD-138) · cron/Monday-digest (EP-SD-028) · lost-orders (EP-SD-024) · bonus (EP-SD-027/077) · reklamatsiya→QC (EP-SD-134) · repeat-order (EP-SD-025/063) · change-journal (EP-SD-079/132) · cancellation-penalty (EP-SD-069) · catalog+material-dict (EP-SD-032/096) · archive (EP-SD-065).

## 2. ⚠️ C6 RISK: parallel order dunyo
`order-workflow` moduli (app.module'da ro'yxatda) o'z `ow_orders`+`ow_order_status_history`+2-chi OrderStatusChangedEvent+2-chi status-machine bilan yashaydi. sales_orders bilan IKKI order dunyo. Birlashtiriladi (keyin, ehtiyot — katta).

## 3. QURISH REJASI (MASSIV — surgical-first, keyin feature)
**Avval CRASH/FAKE fixlar (DDL'siz, har biri DB-proof):** quotation create/update column-drift · contracts-list stub-drift · complaint subject · quota target read · leaderboard join · order cancel route · payments export · delivery enum · status-machine FE/BE shartnoma. → keyin **DDL-gated**: payment.id default, contract money cols, sd_kpi_targets, customer bank cols, duplicate unique-idx. → keyin **L-feature**: pricing engine (EP-SD-037), GL posting (EP-SD-030), aging, KPI-card, cron/digest, catalog.

DDL chiqsa egasi SQL ko'radi (rail 1). Har fix DB-proof + commit. Modul katta → bosqichma-bosqich isbot bilan.

*Manba: 6-o'lchovli read-only Workflow (701k token) + grounding. [[reference_sd_module_already_wired]] (435 route TASDIQLANDI lekin stub) · [[project_two_worlds_phase12_2026_06_04]] (ow_orders parallel) · [[reference_live_db_location]].*
