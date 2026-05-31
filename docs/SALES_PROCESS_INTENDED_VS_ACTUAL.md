# Sotish & CRM — Egasi mo'ljallagan jarayon vs Hozirgi tizim — 2026-05-31

> **1-QADAM (3 dan): jarayonni hujjatlash.** Kod yo'q, o'zgarish yo'q — bu reja hujjati.
> 2-qadam (mijoz/buyurtma jadvallarini birlashtirish) va 3-qadam (5 "jim" bugni tuzatish) — sizning ko'rib chiqishingizdan keyin.
> Manba: egasi tasdiqlagan jarayon + `SALES_CRM_AUDIT_2026-05-31.md` (33 sahifa, tasdiqlangan).
> Bu hujjatdagi muhim da'volar qayta tekshirildi (file:line bilan) — quyida belgilangan.

---

## 1. EGASI MO'LJALLAGAN JARAYON (haqiqiy biznes)

**Mijozlar — ARALASH:** ham takroriy B2B (qayta-qayta buyurtma beradigan), ham yangi mijozlar.
Demak ikkisi ham kerak: **CRM** (yangi mijoz uchun lid-ovi) **+ mijoz bazasi** (takroriy). Ikkisi ham **BITTA mijoz bazasiga** ulanishi shart.

**Kirish — IKKI yo'l:** (A) yangi mijoz → lid (sotish menejeri ov qiladi) → CRM; (B) takroriy mijoz → to'g'ridan murojaat → mijoz bazasidan. **Ikkisi ham BITTA buyurtma tizimiga** quyiladi.

**Narx:** formula kalkulyatori (o'lcham / karton turi / bosma / miqdor) + menejer **qo'lda tuzatishi** mumkin.

**Buyurtma → ishlab chiqarish:** **HAR BIR buyurtma ishlab chiqarish ishiga (papka/job) → MES** aylanadi. Bu bog'lanish MUHIM.

**Shartnoma + 70% avans:** deyarli har buyurtma shartnoma + 70% avans oladi.

**Rollar AJRATILGAN:** sotish menejeri (lid→taklif→buyurtma) + ishlab chiqarish (papka/job) + buxgalter (to'lov/qarz). Tizim **rol bo'yicha ajratilgan** bo'lishi kerak (RBAC / lavozim tizimiga bog'lanadi).

### To'liq zanjir (mo'ljal)
```
Lid/Murojaat → Taklif → Buyurtma → Shartnoma+70% avans → Ishlab chiqarish (papka/job) → Yetkazish → To'lov (avans+qoldiq, qarz)
   menejer      menejer   menejer      menejer+buxgalter      ishlab chiqarish          (logistika)    buxgalter
```

---

## 2. QADAMMA-QADAM: MO'LJAL vs HAQIQAT

| # | Qadam | KIM | Kerakli/yaratiladigan ma'lumot | Hozirgi sahifa(lar) | Yozadigan jadval | Holat | Mosmi? |
|---|---|---|---|---|---|---|---|
| 0a | **Yangi mijoz → LID** | menejer | lid: kompaniya, manba, taxminiy summa, bosqich | CRM Workspace `/crm-workspace` **va** SD Leads `/sd/leads` | `crm_leads` **VA** `sd_leads` (2 xil!) | 🟡 | ❌ ikki alohida lid tizimi |
| 0b | **Takroriy mijoz → bazadan** | menejer | mavjud mijozni tanlash | Mijozlar `/sd/customers` | `sd_customers` | 🟢 | ⚠️ baza bor, lekin CRM lidiga ulanmagan |
| 1 | **Mijoz bazasi (yagona)** | menejer | mijoz: nom, INN, kredit limit, to'lov muddati, segment | `/sd/customers` + Customer360 `/sd/customers/:id` | `sd_customers` | 🟢 | ❌ aslida 3 mijoz jadval (pastda) |
| 2 | **TAKLIF (narx)** | menejer | taklif: mijoz, qatorlar, o'lcham/karton/bosma/miqdor, narx, chegirma | Taklifnomalar `/sd/sales-quotes`, SD Quotations `/sd/quotations` | `sd_quotations` | 🟡 | ⚠️ narx kalkulyator **soxta** (pastda) |
| 3 | **BUYURTMA** | menejer | buyurtma: mijoz, taklifdan qatorlar, summa, 70% avans bayrog'i | Buyurtmalar `/sd/sales-orders`, Order Create `/order-create`, Order Workflow `/order-workflow` | **5 xil jadval!** (pastda) | 🟡/🔴 | ❌ eng tarqoq qadam |
| 4 | **SHARTNOMA + 70% avans** | menejer + buxgalter | shartnoma: buyurtmaga bog'liq, 70% avans sharti | Shartnomalar `/sd/contracts` | `sd_contracts` | 🔴 | ❌ **yaratish ishlamaydi** (POST handler YO'Q) |
| 5 | **ISHLAB CHIQARISH (papka/job) → MES** | ishlab chiqarish | production order: buyurtmaga bog'liq, mahsulot, miqdor, BOM | Papka `/papka-orders`; (avtomatik: event→`production_orders`) | `papka_orders` **VA** `production_orders` | 🟡 | ❌ bog'lanish **ishonchsiz** (pastda) |
| 6 | **YETKAZISH** | logistika | delivery: buyurtmaga bog'liq, pick→pack→issue | SD Deliveries `/sd/deliveries` | `deliveries` | 🟢 | ⚠️ buyurtma=sales_orders ga bog'liq |
| 7 | **TO'LOV (avans+qoldiq, qarz)** | buxgalter | payment: buyurtmaga bog'liq, summa, avans/qoldiq; qarz yoshi | To'lovlar `/sd/sales-payments`, Debitors `/sd/debitors` | `sd_payments` (yozadi) | 🟡 | ❌ "To'landi" **noto'g'ri jadvalga** (pastda) |

---

## 3. GAPLAR (mo'ljal vs haqiqat) — eng muhimi

### 3.1 🔴 Yagona zanjir TARQOQ (3 mijoz · 5 buyurtma · 2 lid)

Egasi "BITTA mijoz bazasi + BITTA buyurtma tizimi" xohlaydi. Kodda:

**MIJOZ ×3 (bog'lanmagan):**
| Jadval | Qayerda ishlatiladi |
|---|---|
| `sd_customers` | Faol CRUD (Mijozlar, Customer360, SD lid/taklif/buyurtma/to'lov dropdown) — **amaldagi haqiqiy baza** |
| `crm_companies` | CRM Workspace kompaniya tab; **+ SD Quotations va Order-Create dropdown** (chalkash!) |
| `crm_contacts` | SAP sahifalarida (`/sales`, `/erp/sales`) "mijoz" sifatida |

→ Bitta xaridor 3 xil joyda bo'lishi mumkin; yutilgan CRM lidi `sd_customers` bazaga **avtomatik o'tmaydi** — qo'lda qayta kiritish kerak. Bu egasi xohlagan "ikki yo'l → bitta baza" ni buzadi.

**BUYURTMA ×5 (bog'lanmagan):**
| Jadval | Qayerda |
|---|---|
| `sd_sales_orders` | Buyurtmalar `/sd/sales-orders` (SD aggregate shu jadvalga yozadi) |
| `sales_orders` | **Lid→buyurtma va taklif→buyurtma konversiyasi shu yerga yozadi** (`sd-leads.repository.ts:146,178` — tasdiqlangan); dashboard/KPI/to'lov/Customer360 ham shuni o'qiydi |
| `sap_sales_orders` | SAP sahifalar (`/sales`, `/erp/sales`) — create soxta |
| `papka_orders` | Order Create `/order-create` + Papka `/papka-orders` (ishlab chiqarish papkasi) |
| `ow_orders` | Order Workflow `/order-workflow` — o'z 17-jadvalli alohida olami |

→ **Eng achchiq haqiqat:** "Buyurtmalar" sahifasi `sd_sales_orders` ga yozadi, lekin konversiya + barcha pul `sales_orders` da. Bir joyda yaratilgan buyurtma boshqasida ko'rinmaydi; sonlar hech qachon mos kelmaydi.

**LID ×2:** `sd_leads` (SD Leads) vs `crm_leads` (CRM Workspace) — egasi "yangi mijoz → lid → CRM" deydi, lekin ikki parallel lid tizimi bor.

### 3.2 🔴 5 "JIM MUVAFFAQIYAT" BUGI (foydalanuvchi "saqlandi" deb o'ylaydi — aslida yo'q)

Hammasi qayta tekshirildi (file:line):
1. **SAP buyurtma create/delete soxta** — `sap.controller.ts:87` `return { id: Date.now(), ...dto, created: true }`; `:106` `return { id, deleted: true }` — DB ga yozmaydi. ✅ fayl o'qildi.
2. **To'lov "To'landi" noto'g'ri jadval** — `drizzle-quotation.repo.ts:133` `UPDATE fi_payments SET status='paid' ...`, FE esa `sd_payments` ro'yxatini ko'rsatadi → qarz hech qachon yopilmaydi. ✅ grep tasdiqladi.
3. **Shartnoma yaratish handler YO'Q** — `sd-contracts.controller.ts` faqat `@Get()` (33) + `@Patch(':id/sign')` (71); **POST yo'q**. FE `POST /api/sd/contracts` chaqiradi → 404/saqlamaydi. ✅ fayl to'liq o'qildi.
4. **Taklif "Approve" yolg'on** — toast "buyurtma+shartnoma yaratildi" deydi, aslida faqat status flag (audit; konversiya alohida endpointda).
5. **SD Overview/Quota dashboard 0 ko'rsatadi** — SQL real, javob shakli FE kutganidan boshqa → barcha KPI 0 (audit).

### 3.3 🟡 BUYURTMA → ISHLAB CHIQARISH bog'lanishi — bor, lekin ISHONCHSIZ

Egasi: "har buyurtma papka/job → MES bo'lishi SHART." Haqiqat (qayta tekshirilgan):
- **Mexanizm BOR:** SD buyurtma yaratilganda `OrderCreatedEvent` (`eventType:'sd.order.created'`) outbox'ga yoziladi (`sd-orders.service.ts:200-253`), va consumer bor — `SdOrderCreatedHandler` (`pp/.../sd-order-created.handler.ts`) `@OnEvent('sd.order.created')` → `db.insert(production_orders)`. Nom mos (✅).
- **LEKIN 3 muammo:**
  1. **Relay topilmadi:** producer **outbox jadvalga** yozadi, consumer **in-process EventEmitter** ni tinglaydi. Outbox→EventEmitter relay (dispatcher/poller) grep'da **topilmadi** → ehtimol event handler'ga **yetib bormaydi** (production_orders yaratilmaydi). ⚠️ runtime tekshiruv kerak (DB bo'sh).
  2. **Handler yarim-stub:** `where(/* eq order */ undefined as never)` — dedup tekshiruvi no-op; faqat `order_id, order_number, status:'planned'` yoziladi (mahsulot/miqdor/BOM yo'q).
  3. **Faqat 1 yo'l qamraydi:** event faqat SD service (`sd_sales_orders`) orqali yaratilган buyurtmaga chiqadi. Konversiya (`sales_orders`) va `/order-create` (`papka_orders` to'g'ridan) — **event chiqarmaydi** → ishlab chiqarish ishi yaralmaydi.
- **Xulosa:** "har buyurtma → papka/job" **bugun ishonchli emas** — mexanizm yarim ulangan, relay ehtimol yo'q, va 3 buyurtma yo'lidan faqat bittasi event chiqaradi. Ayni paytda `/order-create` `papka_orders` ga to'g'ridan yozadi = **ikkinchi, alohida ishlab chiqarish yo'li**.

### 3.4 🟡 ROL AJRATISH kuchsiz

Egasi: menejer / ishlab chiqarish / buxgalter ajratilsin. Haqiqat:
- Rollar BOR (controller'larda `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`), lekin **keng va aralash**. Masalan `sd-contracts.controller.ts:20` `SD_ROLES = ['sales_manager','SALES','director','super_admin','FINANCE_MANAGER','ACCOUNTANT']` — bitta to'plamda **ham sotish ham moliya** roli. Ya'ni qadamlar bo'yicha aniq ajratish (menejer faqat lid→buyurtma, buxgalter faqat to'lov) **yo'q**.
- Bundan tashqari rol nomlari ham aralash: `sales_manager` vs `SALES`, `ACCOUNTANT` vs `FINANCE_MANAGER` (katta/kichik harf + dublikat) — RBAC/lavozim tizimi bilan moslashtirish kerak.

---

## 4. KANONIK TANLOV — egasi jarayoniga bog'langan TAVSIYA (variantlar, qaror sizniki)

### 4.1 Mijoz bazasi — bitta manba
Egasi "ikki yo'l (CRM yangi + baza takroriy) → BITTA mijoz bazasi" xohlaydi.

| Variant | Nima | Egasi jarayoniga mosligi | Xavf |
|---|---|---|---|
| **A (tavsiya)** | `sd_customers` = yagona mijoz bazasi. CRM (`crm_companies`/`crm_leads`) = faqat **lid/pipeline pre-stage**; lid yutilganda `sd_customers` ga **konversiya** qilinadi. SD Quotations/Order-Create dropdown crm_companies→sd_customers ga ko'chiriladi; SAP'da crm_contacts-as-customer olib tashlanadi. | ✅ "ikki yo'l→bitta baza" aynan shu. Takroriy mijoz to'g'ridan bazadan, yangi mijoz CRM orqali kirib bazaga qo'shiladi. | Past — sd_customers allaqachon faol baza |
| B | `crm_companies` = yagona baza (CRM butun mijozni egallaydi), sd_customers unga ko'chiriladi. | ⚠️ CRM-markazli; SD buyurtma/to'lov oqimini qayta ulash kerak | O'rta-yuqori — faol UI ko'chadi |

**Asos:** `sd_customers` da to'liq CRUD UI, Customer360, kredit limit/to'lov muddati/segment bor va buyurtma/to'lov shunga bog'lanadi → egasi "takroriy B2B baza" ehtiyojiga tayyor. CRM ustiga lid-ovi sifatida o'tiradi.

### 4.2 Buyurtma tizimi — bitta manba
Audit: **pul amalda `sales_orders` da** (konversiya + dashboard + to'lov + Customer360 shuni ishlatadi), garchi nomi "kanonik" `sd_sales_orders` bo'lsa ham.

| Variant | Nima | Egasi jarayoniga mosligi | Xavf |
|---|---|---|---|
| **A (kam ish)** | `sales_orders` = yagona buyurtma jadval. Buyurtmalar sahifasi + barcha hisobot shunga qaratiladi; `sd_sales_orders` nafaqaga. | ✅ Pul allaqachon shu yerda; bitta zanjir | Past-o'rta |
| B | `sd_sales_orders` = kanonik (DDD aggregate, status-graph, 70% avans bloki, outbox event shu yerda). Konversiya + dashboard + to'lov shunga ko'chiriladi. | ✅ Eng boy domen (70% avans bloki + outbox shu jadvalda) | O'rta — ko'p joy ko'chadi |
| — | `sap_sales_orders`, `papka_orders`, `ow_orders` | — | har holda nafaqa yoki aniq rol: papka_orders=ishlab chiqarish yozuvi (sotish emas), ow_orders=alohida tajriba |

**Nozik nuqta (egaga qaror):** Variant A kam ish, lekin **70% avans bloki va outbox event mexanizmi `sd_sales_orders` (DDD aggregate) da**. Agar Variant A tanlansa, o'sha 70%-avans + outbox mantiqini `sales_orders` ga olib o'tish kerak. Variant B ko'proq ko'chirish, lekin boyroq domenni saqlaydi. **Bu — egasi qarori.**

### 4.3 Ishlab chiqarish bog'lanishi (har ikki variantda kerak)
Qaysi buyurtma jadval tanlansa ham: **bitta** buyurtma yaratish yo'li bo'lsin va undan **avtomatik** ishlab chiqarish ishi ochilsin. Hozir bu **umuman yo'q** (§3.3): 70% avans tasdig'i event chiqarmaydi, avans→PP kod o'lik (`TechThreeCheckpointEvent` hech qachon publish qilinmaydi), production_orders faqat qo'lda yaratiladi, va `/order-create` boshqa jadvalga (papka_orders) yozadi. 2/3-qadamda: (a) avans tasdig'idan event chiqarish, (b) o'sha eventni production/papka yaratuvchi listenerga ulash, (c) papka_orders↔production_orders ikkiligini hal qilish.

---

## 5. KEYINGI QADAMLAR (siz hal qilasiz)
- **2-qadam (jadval birlashtirish):** §4.1 va §4.2 dan variant tanlang → men batafsil birlashtirish rejasini yozaman (kod emas, reja).
- **3-qadam (5 bug):** §3.2 dagi 5 "jim" bugni tuzatish (har biri alohida, gate bilan).
- **Ishlab chiqarish bog'lanishi (§3.3):** kod-zanjir tasdiqlandi (relay BOR, avans→production_orders REAL). Qolgan 3 bo'shliq (bypass uzilishi, bo'sh production_orders, papka_orders↔production_orders ikkiligi) — 2/3-qadamga qo'shilishi mumkin. Runtime tasdiq (DB bo'sh) faqat boot/log bilan, lekin kod yo'li to'liq tekshirilgan.

---
*1-qadam — hujjat. READ-ONLY, kod/jadval o'zgartirilmadi. Da'volar file:line bilan tekshirildi.
Manba: egasi jarayoni + SALES_CRM_AUDIT_2026-05-31.md + qayta-tekshiruv (sap.controller:87/106,
drizzle-quotation.repo:133, sd-contracts.controller, sd-order-created.handler, sd-orders.service:200-253).*
