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
| 5 | **ISHLAB CHIQARISH (papka/job) → MES** | ishlab chiqarish | production order: buyurtmaga bog'liq, mahsulot, miqdor, BOM | Papka `/papka-orders` (qo'lda); PP `POST /pp/orders` (qo'lda) | `papka_orders` **VA** `production_orders` | 🔴 | ❌ avtomatik bog'lanish YO'Q — faqat qo'lda; avans→PP kod o'lik (§3.3) |
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

### 3.3 🔴 BUYURTMA → ISHLAB CHIQARISH bog'lanishi — UZILGAN (avtomatik yo'q)

> ⚠️ **HALOLLIK: bu bo'limni avval 2 marta XATO yozdim** ("mexanizm yo'q", keyin "ishlaydi:
> avans→production_orders insert" — ikkalasi ham o'qimasdan, hatto mavjud bo'lmagan fayl nomlab).
> Quyida HAR fayl o'qib, file:line dalil bilan tasdiqlangan haqiqat (Explore agent + men).

Egasi: "har buyurtma papka/job → MES bo'lishi SHART." **Haqiqat: avtomatik bog'lanish YO'Q.**

**Mavjud (to'g'ri ishlaydigan) qismlar:**
- `create-order.handler.ts` buyurtma + outbox yozuvlarini (`ORDER_CREATED`, `SO_DESIGN_REQUESTED`, `SO_SAMPLE_REQUESTED`) **bitta tranzaksiyada** yozadi (`:92-111`, `:193-223`). ✅
- Outbox relay **BOR**: `shared/outbox/outbox-publisher.service.ts:31` `@Interval(...,10_000)` har 10s poll → `:40` `emitter.emit(row.event_name, row.payload)`. ✅

**🔴 Lekin zanjir 3 joyda uzilgan (tasdiqlangan):**
1. **70% avans tasdiqlanganda HECH QANDAY event chiqmaydi.** `confirm-advance-payment.handler.ts:61-67` faqat `updateAdvancePaidAtomic()` qiladi — buyurtma qatorini yangilaydi, lekin event/outbox yozmaydi. Demak avans to'langach pastoqim (ishlab chiqarish) xabardor qilinmaydi.
2. **`production_orders` ga avtomatik INSERT umuman yo'q.** Yagona yozuv — **qo'lda** `POST /pp/orders` (texnolog; `create-production-order.handler` → `queries-pp.ts:18 db.insert(production_orders_int)`). Hech bir order/advance/design eventi production_orders yaratmaydi.
3. **`advance-approved.listener.ts` aslida boshqa narsa qiladi** (men "production_orders insert qiladi" deb xato yozgandim): u `@EventsHandler(AdvanceApprovedEvent)` (`:14`) → `ppRepo.unlockPlanning(orderId)` (`:26`) — ya'ni production_orders **statusini UPDATE** qiladi (INSERT EMAS). Bundan tashqari uni qo'zg'ovchi `AdvanceApprovedEvent` **o'lik kod**: uni faqat `finance/tech-three-checkpoint.listener.ts` chiqaradi, u esa hech qachon publish qilinmaydigan `TechThreeCheckpointEvent` ga bog'liq (faylning o'z izohi: "no-op at runtime").

**Qo'shimcha (ikkilik):** `/order-create` sahifasi `papka_orders` ga **to'g'ridan** yozadi (`legacy-warehouse.helpers.ts:65`) — bu event-zanjirdagi `production_orders` dan butunlay alohida jadval. "Papka buyurtma" (papka_orders) va "ishlab chiqarish buyurtmasi" (production_orders) bog'lanmagan.

- **Xulosa:** Egasining "har buyurtma → papka/job → MES" niyati **bugun avtomatlashtirilmagan**. Ishlab chiqarish ishi faqat **qo'lda** (PP/MES ekranidan) ochiladi; 70% avans tasdig'i uni avtomatik qo'zg'amaydi (event chiqmaydi), avans→PP ni ulashi kerak bo'lgan kod o'lik. Bu 2/3-qadamda ulanishi kerak bo'lgan asosiy bo'shliq.

### 3.4 🟡 ROL AJRATISH bor, lekin NOIZCHIL

Egasi: menejer / ishlab chiqarish / buxgalter ajratilsin. Haqiqat (grep bilan tekshirilgan):
- **Ba'zi joyda ajratish YAXSHI:** `sd-orders.controller.ts` qadam bo'yicha alohida rol beradi — tech-checkpoint→`TECHNOLOGIST` (`:176`), avans to'lov/status→`FINANCE`/`FINANCE_MANAGER` (`:96,:191`), buyurtma yaratish/status→`SALES_MANAGER` (`:52,:111`). Ya'ni egasi xohlagan "menejer/ishlab chiqarish/buxgalter" ajratishi **bu kontrollerда mavjud**. ✅
- **Lekin boshqa joyda KENG va aralash:** `sd-contracts.controller.ts:20` va `sd-payments.controller.ts:28` bitta `SD_ROLES` to'plamidan foydalanadi (`['sales_manager','SALES','director','super_admin','FINANCE_MANAGER','ACCOUNTANT']`) — ham sotish ham moliya bitta to'plamda → bu kontrollerlarda qadam-ajratish **yo'q**.
- **Rol nomlari NOIZCHIL/dublikat:** `sales_manager` vs `SALES`, `accountant` vs `ACCOUNTANT` vs `FINANCE_MANAGER`, katta/kichik harf aralash. Bu RBAC/lavozim tizimi bilan moslashtirilishi kerak (bitta kanonik rol nomlari to'plami).
- **Xulosa:** rol-ajratish g'oyasi tizimda BOR va ba'zan to'g'ri qo'llangan, lekin **noizchil** — bir nechta kontroller keng to'plam ishlatadi va rol nomlari standartlashtirilmagan.

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
drizzle-quotation.repo:133, sd-contracts.controller, create-order.handler:92-223,
outbox-publisher.service:31/40, confirm-advance-payment.handler:61-67,
advance-approved.listener:14/26, queries-pp:18, legacy-warehouse.helpers:65).*
