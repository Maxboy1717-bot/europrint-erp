# Fantom jadvallar — kod so'raydi, bazada yo'q (2026-08-07)

> **Topilish usuli:** `apps/api/src` dagi barcha `FROM|JOIN|INTO|UPDATE <nom>` murojaatlari
> (833 nomzod) jonli `information_schema.tables` (1187 jadval) bilan solishtirildi; CTE nomlari,
> PG katalog obyektlari va PL/pgSQL o'zgaruvchilari chiqarib tashlandi; qolgani **fayl:satr bilan
> qo'lda tasdiqlandi** (izoh/DDL/`to_regclass` qo'riqchisi emasligi tekshirildi).
>
> **Natija: 21 ta jonli so'rov yo'li mavjud bo'lmagan jadvalga boradi.**
>
> **Holat 2026-08-07 kech: 16 tasi tuzatildi, 5 tasi ochiq (2 tasi — sxema qarori kutmoqda,
> 2 tasi — vizyon nomuvofiqligi, 1 tasi — seed skripti, ataylab tegilmadi). Takrorlanmasligi
> uchun pre-commit ratchet qo'shildi (pastda).**

## Nima uchun bu jim qoladi

Ikkala chaqiruv naqshi ham xatoni yutadi:
- `execSql<T>(sql\`...\`, fallback)` — xato bo'lsa `fallback` qaytaradi → bot **"ma'lumot yo'q"**
  deb javob beradi. Foydalanuvchi buni "hozircha bo'sh" deb tushunadi, "buzuq" deb emas.
- `.catch(() => ({ rows: [] }))` / `Result` ichida `Err` — chaqiruvchi ko'pincha bo'sh ro'yxatni
  "hech narsa topilmadi" deb talqin qiladi.

Bu Q-40 ning eng zararli shakli: **past qoldiq bor bo'lsa ham bot "Barcha materiallar yetarli"
deb yaxshi xabar aytadi.**

---

## ✅ Tuzatilgan (2026-08-07)

| Fayl | Fantom jadval | Kanonik manba | Commit |
|---|---|---|---|
| `bot-gateway/bots/ombor.bot.ts:27` | `warehouse_materials` | `warehouse_stock` + `material_cards` | `de9c4305` |
| `bot-gateway/bots/logistics.bot.ts:29` | `fleet_vehicles` | `mm_vehicles` (ustunlar aynan mos) | `de9c4305` |
| `bot-gateway/bots/crm.bot.ts:30` | `crm_opportunities` | `crm_deals` (VIEW; yozish → `deals`) | `de9c4305` |
| `pos/application/services/pos-fifo.service.ts:36` | `pos_materials` | `material_cards.shelf_life_days` | `5037cde1` |
| `pos/application/services/pos-fifo.service.ts:63` | `pos_batches` | `batch_lots` | `5037cde1` |
| `agents/production-agent.service.ts` | `production_operations` | `production_order_operations` | `a65a33ad` |
| `hr/telegram-bots/.../events.repo.ts:189` | `app_users` + fantom ustun `employees.is_department_head` | `users` + `org_departments.head_user_id` | `2a8d0591` |
| `agents/cashflow-agent.service.ts:81` | `ar_invoices` | `finance_invoices` (`invoice_type='sales'`, `payment_status`) | `2a8d0591` |
| `aisha/.../get-employee-info.tool.ts:56` | `hr_employees` | `employees` | `2a8d0591` |
| `aisha/.../get-financial-summary.tool.ts` | `fi_ap_invoices`, `fi_ar_invoices` + `fi_gl_documents` dagi fantom ustunlar | `finance_invoices` (AP/AR) + `gl_entries`⨝`accounts` (kassa) | `2a8d0591` |
| `agents/security-agent.service.ts:26` | `auth_audit_log` + hech qachon yozilmaydigan `login_failed` | `users.failed_login_attempts` / `locked_until` + `MAX_FAILED_LOGIN_ATTEMPTS` | `3f0052dc` |
| `general/services/legacy-warehouse.helpers.ts:227` | `material_lots` | `batch_lots` | `3f0052dc` |
| `ai-agents/mes/mes-monitor.service.ts:203` | `mes_work_orders` | ⛔ mos jadval YO'Q — kafolatlangan yiqiladigan so'rov olib tashlandi, aniq ogohlantirish qo'yildi | `3f0052dc` |
| `bot-gateway/bots/fin.bot.ts:32` | `finance_transactions` | `entries`⨝`accounts` (`account_type='REVENUE'/'EXPENSE'`, financial-reports bilan bir xil kanon) | `1d8d9f64` |
| `aisha/.../get-active-alerts.tool.ts:42` | `iot_sensor_alerts` | `iot_alerts` | `1d8d9f64` |
| `aisha/.../get-active-alerts.tool.ts:46` | `ai_agent_alerts` | `agent_alerts` (`AgentAlertService.send()` bilan bir xil jadval) | `1d8d9f64` |

---

## ⏳ Ochiq — 8 ta so'rov yo'li

### A. Kanonik manba aniq, faqat ko'chirish kerak

| Fayl:satr | Fantom | Taklif (tasdiqlash kerak) |
|---|---|---|
| `scripts/seed-sd-marketing.ts:112` | `sd_orders` | ⛔ **ATAYLAB TEGILMAYDI** — `sales_orders` ga ko'chirish MEXANIK jihatdan to'g'ri bo'lardi, lekin bu skript FULL COMPANY RESET (2026-07-11) dan oldingi NAMUNAVIY ma'lumot yozadi. Uni tuzatib ishga tushirish egasi qo'lda quryotgan real kompaniya ustiga uydirma buyurtma qo'shib qo'yardi. |

### B. Manba umuman yo'q — jadval ham, hisob ham qurilmagan

| Fayl:satr | Fantom | Nega ko'chirib bo'lmaydi |
|---|---|---|
| `aisha/.../get-active-alerts.tool.ts:38` | `security_alerts` | ⚠️ Endi izolyatsiya qilingan (`1d8d9f64`) — o'zi bo'sh qaytadi, lekin `iot`/`ai_agents` manbalarini endi BLOKLAMAYDI. Bazada 4 xil nomzod bor (`system_alerts`, `ai_alerts`, `hr_tz2_security_alerts`, `sos_alerts`) — qaysi biri kanonik ekani **egasi qarori** (Q-34) |
| `hr/telegram-bots/telegram-bots/profile.repo.ts:127` | `inventory_items` + `pos_inventory_items` (IKKALASI HAM) | Xodimga biriktirilgan inventar uchun mos jadval bazada YO'Q. `asset_items` (assigned_to bor) — asosiy vosita hisobi, miqdor/birlik ustuni yo'q; `position_equipment` — lavozim bo'yicha TALAB QILINADIGAN uskuna ro'yxati (master-data), xodimga real biriktirilgan narsani kuzatmaydi. Ikkalasi ham `getEmployeeInventory()` semantikasiga to'g'ri kelmaydi — yangi jadval kerak (Q-35) |
| `bot-gateway/bots/qc.bot.ts:53` | `qc_dpmo_stats` | DPMO **hisoblanmaydi** — jadval ham, hisoblovchi kod ham yo'q. `qc_defects` dan hisoblash kerak (yangi ish, ko'chirish emas) |
| `aisha/.../get-production-status.tool.ts:41` | `iot_oee_metrics` | OEE agregat jadvali yo'q; `production-agent.calculateOEE()` mavjud, lekin `performance`/`quality` hamon placeholder (`estimated: true`) |
| `pp/infrastructure/repositories/drizzle-pp.repo.ts:213` | `bom_components` | `bom_items` / `bom_headers` / `boms` / `tech_card_bom` — **to'rtta** nomzod; ADR-006 `technology_cards` ni kanonik deydi, moslashtirish kerak |
| `hr/telegram-bots/telegram-bots/profile.repo.ts:112` | `employee_kpi` | KPI agregat jadvali yo'q; `employee-kpi.handler.ts` hisoblaydi, lekin saqlamaydi |
| `aisha/.../schedule-meeting.tool.ts:75` | `telegram_user_links` | Kanonik manba `employees.telegram_chat_id` (`CreateNotificationHandler` shuni ishlatadi) — ⚠️ lekin jonli bazada **0 qator** |

### C. ⚠️ Vizyon nomuvofiqligi — ko'chirish yechim emas

| Fayl:satr | Fantom | Muammo |
|---|---|---|
| `bot-gateway/bots/pos.bot.ts:30` | `pos_sales` | **"Bugungi Sotuv"** so'raydi, lekin loyihada **POS Monitor = zavod ombori kirim/chiqim, KASSIR EMAS** (`project_pos_monitor_purpose`). Kassa/pul → Finance. Ya'ni bu buyruqning o'zi noto'g'ri modelda — jadval nomini almashtirish muammoni hal qilmaydi, **egasi bu bot nimani ko'rsatishi kerakligini aytishi lozim**. |
| `bot-gateway/bots/pos.bot.ts:41` | `pos_inventory` | Yuqoridagi bilan bir xil ildiz; `warehouse_stock` ga ko'chirish mumkin, lekin avval bot maqsadi aniqlanishi kerak |

---

## Tavsiya etilgan tartib

1. **A guruhi — bo'sh.** Yagona qolgan (`sd_orders`) ataylab tegilmaydi (yuqorida sabab).
2. **B guruhi (6 ta)** — har biri uchun avval **kanonik manbani belgilash** kerak (4 ta alohida
   egasi-savoli: security-alert lug'ati, xodim-inventar jadvali, BOM kanoni, KPI saqlanadimi).
3. **C guruhi (2 ta)** — POS botining maqsadi vizyon bilan solishtirilishi kerak.

## ✅ Takrorlanmasligi uchun — ratchet qo'shildi (`17c298ac`)

`scripts/check-phantom-tables.mjs` + `scripts/db-tables.snapshot.json` (1187 jadval) endi
pre-commit'da ishlaydi va **commitni bloklaydi**. Staged `.ts` fayllarga qo'shilgan qatorlardagi
`FROM|JOIN|INTO|UPDATE <jadval>` murojaatlari snapshot bilan solishtiriladi.

Ikki tomonlama sinovdan o'tkazildi: mavjud bo'lmagan jadvalni ushlaydi, izohdagi eslatishni
(`// ilgari FROM pos_batches edi`) o'tkazib yuboradi. CTE nomlari, PG katalog obyektlari,
migratsiya/seed yo'llari chiqarib tashlanadi.

**Yangi jadval qo'shgach:** migratsiya qo'llangandan KEYIN snapshotni yangilang (usuli skript
sarlavhasida). Snapshot ataylab qo'lda yangilanadi — "jadval qo'shdim" qadami commit tarixida
ko'rinib tursin.
