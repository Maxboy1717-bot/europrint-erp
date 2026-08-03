# MODUL 3 — DESIGN (DIZAYN) — TO'LIQ CHUQUR TAHLIL (rasmiy, intervyu uchun)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | QAT'IY READ-ONLY — hech narsa o'zgartirilmadi
> Usul: har sahifa→FE fayl→endpoint→BE handler→DB jadval. Jonli DB (_audit/q.cjs) + BE kod.
> ⭐ VERIFY-DON'T-TRUST: halol 501 ≠ echo yolg'on — ajratildi. Har da'vo file:line/DB dalili bilan.

---

# QADAM 1 — KASHF

## Jami: 6 alohida sahifa (13 route)
| # | Sahifa | Route(lar) |
|---|---|---|
| 1 | Design Dashboard | /design/dashboard |
| 2 | **Design Orders (intake)** | /design/orders ⭐ |
| 3 | Design Order Detail | /design-orders/:id |
| 4 | Design Approval | /design/approval |
| 5 | AI Design Generator | /design/generator |
| 6 | **Design Extended** | /design/ai-review + /3d-mockup + /brand-guidelines + /comparison + /templates + /tools + /costing + /library (**8 route→1**) |

> ⚠️ `components/dizayn-new/` (DataTable, AppSidebar, EmptyState) = **dizayn-tizimi UI atomlari**, modul SAHIFASI EMAS — sanalmaydi.

## BE controllerlar
- `design.controller.ts` — asosiy (requestDesign real + createOrder 501 + statistics real + notifications/tooling/messages stub)
- `design-extended.controller.ts` — generate/approve/reject/verify/mockup/status (REAL)

## DB jadvallari
- ✅ MAVJUD (0 qator): `design_orders`, `ow_tech_cards`, `papka_orders`
- ❌ **YO'Q:** `design_order_messages`, `design_revisions`, `design_notifications`

---

# QADAM 2 — HAR SAHIFA (A–G)

## 🟡 1. Design Dashboard — `/design/dashboard`
**A.** FE: `pages/DesignDashboard.tsx`. **FUNKSIYA:** Dizayn buyurtmalari umumiy paneli — statistika, oxirgi buyurtmalar, bildirishnomalar.
**B.** ✅ `/design`, `/design/statistics` (design.controller:163) REAL o'qish. 🔴 `GET /design/notifications` (design.controller:159) = **notImplemented**.
**C.** design_orders(0). FE pul hisoblamaydi.
**D.** 🔴 Bildirishnoma ro'yxati o'lik (notImplemented).
**E.** 🟡 (statistika real, bildirishnoma stub). **F.** Bildirishnoma: ❌ (501). **G.** Bildirishnomalar ro'yxatini ko'ra olmaydi.

## 🔴 2. Design Orders — `/design/orders` ⭐⭐ ENG MUHIM (intake — kirish nuqtasi)
**A.** FE: `pages/DesignOrders.tsx:84`. **FUNKSIYA:** Yangi dizayn so'rovini kiritish formasi — savdo/menejer mijoz uchun yangi dizayn buyurtma beradi.
**B.** **"Yaratish" tugmasi** → `POST /api/design/orders` (DesignOrders.tsx:84). **🔴 BE = 501** (design.controller:196-206 `NotImplementedException`: "Use POST /design (requestDesign)"). Real yo'l `POST /design` (design.controller:110, CQRS `RequestDesignCommand`) — **lekin forma uni ISHLATMAYDI** (FE↔BE drift).
**Forma maydonlari:** clientName, clientCompany, clientPhone, clientEmail, productType, productName, brandName, quantity, description, requirements, priority, deadline (DesignOrders.tsx:8-20). ⚠️ **Fayl maydoni UMUMAN YO'Q** — faqat matn.
**C.** design_orders(0). Forma submit → 501 → hech narsa saqlanmaydi.
**D.** 🔴 **FE-BE drift** — forma `/design/orders`ga POST qiladi, BE 501 qaytaradi; real route `/design`.
**E.** 🔴. **F. Design request intake:** ❌ — yangi dizayn so'rovi shu sahifadan KIRITILMAYDI. **G.** Yangi dizayn buyurtma bera olmaydi (forma "Xato" beradi); dizayn fayl/rasm biriktira olmaydi (maydon yo'q).

## 🟡 3. Design Order Detail — `/design-orders/:id`
**A.** FE: `pages/DesignOrderDetail.tsx`. **FUNKSIYA:** Bitta dizayn buyurtmasi tafsiloti, xabarlar, ilovalar, holat.
**B.** ✅ `GET /design/orders/:id` REAL. 🔴 Xabar yuborish → `POST /design/orders/:id/messages` = **501** (design.controller:213, `design_order_messages` jadval YO'Q). 🔴 Xabar ro'yxati `GET .../messages` = **501** (:190).
**C.** ⚠️ `attachments: string[]` (DesignOrderDetail.tsx:54) — **faqat ko'rsatish, fayl yuklash YO'Q**.
**D.** 🔴 table missing (`design_order_messages`) → xabarlashish o'lik.
**E.** 🟡. **F.** Asset upload: ❌ (faqat string ro'yxati). **G.** Buyurtma bo'yicha xabar yoza olmaydi; dizayn faylini yuklay olmaydi.

## 🟢 4. Design Approval — `/design/approval`
**A.** FE: `pages/DesignApproval.tsx`. **FUNKSIYA:** Dizaynlarni tasdiqlash/rad etish (menejer/mijoz tasdig'i).
**B.** ✅ Tasdiqlash → `POST /design-extended/:id/approve` (design-extended:101) REAL. ✅ Rad → `:id/reject` (:108) REAL. ✅ Tekshirish → `:id/verify` (:85) REAL. ✅ Maket → `:id/mockup` (:93) REAL. Hammasi svc delegatsiya.
**C.** design_orders(0). **D.** —.
**E.** 🟢. **F. Approval workflow:** ✅ REAL. **G.** —. ⚠️ LEKIN tasdiqlangach ishlab chiqarishga avtomatik o'tmaydi (pastda — handoff uzilgan).

## 🟡 5. AI Design Generator — `/design/generator`
**A.** FE: `pages/AIDesignGenerator.tsx`. **FUNKSIYA:** AI yordamida dizayn variantlari yaratish + asbob-uskuna ma'lumoti.
**B.** ✅ "Generatsiya" → `POST /design-extended/generate` (design-extended:54, `svc.generateDesigns`) REAL. ✅ `/dashboard/summary` REAL. 🔴 `GET /design/tooling` (design.controller:175) = **notImplemented**. 🔴 `/design/orders` (POST orqali yaratish) — 501.
**C.** design_orders(0). **D.** 🔴 tooling stub.
**E.** 🟡. **F.** vizyon: ko'rsatilmagan (AI qatlam). **G.** Asbob-uskuna ma'lumotini ko'ra olmaydi (501).

## 🟡 6. Design Extended — `/design/ai-review` + 7 boshqa (**8 route→1 sahifa**)
**A.** FE: `pages/DesignExtended.tsx`. **FUNKSIYA:** Ko'p funksiya bitta sahifada: AI-ko'rib chiqish, 3D-maket, brend qoidalari, taqqoslash, shablon, asbob, tannarx, kutubxona. 8 menyu havola shu yerga.
**B.** ✅ `/design/orders`, `/templates` REAL o'qish; `/integration/mro/equipment`. ⚠️ **Library** (LibraryService) ulanmagan (oldingi orphan tahlil — modul providers'da yo'q).
**C.** **D.** 🟡 8 route→1; library o'lik.
**E.** 🟡. **F.** vizyon: ko'rsatilmagan. **G.** 8 menyu bir sahifaga olib boradi (chalkash); kutubxona ishlamaydi.

---

# QADAM 3 — MODUL UMUMIY

## Sahifa jadvali
| Sahifa | Holat | Asosiy muammo | Vizyon % |
|---|---|---|---|
| Design Dashboard | 🟡 | bildirishnoma stub | ~50 |
| **Design Orders (intake)** | 🔴 | **forma 501 (FE drift)** | ❌ ~10 |
| Design Order Detail | 🟡 | messages jadval yo'q, upload yo'q | ~40 |
| Design Approval | 🟢 | (handoff uzilgan) | ~70 |
| AI Design Generator | 🟡 | tooling stub | ~50 |
| Design Extended (8→1) | 🟡 | library o'lik, 8→1 | ~40 |

**Jami: 1 🟢 · 4 🟡 · 1 🔴 → taxminan ~45% real (sahifa darajasi).**
⚠️ LEKIN kirish nuqtasi (intake) BUZUQ.

## ⭐ VISION WATCH-ITEM VERDIKTLARI
| Watch | Holat | Dalil |
|---|---|---|
| **Design request intake** (so'rov kiritish) | 🔴 **BUZUQ** | DesignOrders forma `/design/orders`→501. Real `/design` bor, forma ishlatmaydi (FE drift, design.controller:196) |
| **Approval workflow** (tasdiqlash) | 🟢 **REAL** | design-extended approve/reject/verify (:85-108) |
| **Asset/file upload** (fayl biriktirish) | 🔴 **YO'Q** | Hech qaysi formada fayl maydoni yo'q; attachments=string ro'yxati (ko'rsatish) |
| **Design↔production handoff** | 🔴 **UZILGAN** | approveDesign `ow_tech_cards/papka`ga YOZMAYDI (grep=0). Tasdiqlangan dizayn ishlab chiqarishga avtomatik o'tmaydi (handoff faqat SD Phase 4 fan-out'da, alohida) |
| **Notification** (bildirishnoma) | 🔴 **STUB** | `GET /design/notifications` = notImplemented (design.controller:159) |

## ⭐ CHAIN MUAMMOSI — design-create FRAGMENTATSIYASI (kod izohida hujjatlangan!)
design.controller:200-206 izohi o'zi tan oladi: **4 joyda tarqoq:**
1. `POST /design/orders` `createOrder` → **501** (DesignOrders forma shuni ishlatadi)
2. `POST /design` `requestDesign` → **REAL** (CQRS, lekin FE ishlatmaydi)
3. `design/orders/orders.service.ts` `OrdersService` → **orphan** (ulanmagan)
4. **2+ schema ta'rifi** `design_orders` (schema-compat-4, schema-misc, pp-design) — drift

➡️ Dizayn buyurtma yaratish 4 xil joyda, lekin foydalanuvchi ishlatadigani (DesignOrders forma) — 501.

## DB MUAMMOLARI
- ❌ **3 jadval YO'Q:** `design_order_messages` (xabar o'lik), `design_revisions`, `design_notifications`
- ⚠️ **`design_orders` 2+ schema ta'rifi** (compat-4 ╳ misc ╳ pp-design) — Drizzle drift
- ow_tech_cards/papka_orders MAVJUD (0 qator) — handoff maqsadi bor, lekin design approve ularga yozmaydi

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Design intake BUZUQ** — yangi dizayn so'rovi kiritib bo'lmaydi (forma 501, real yo'l ulanmagan). ENG MUHIM — kirish nuqtasi
2. 🔴 **Fayl yuklash YO'Q** — dizayn moduli, lekin dizayn fayl/rasm biriktirib bo'lmaydi (maydon yo'q)
3. 🔴 **Design→production handoff UZILGAN** — tasdiqlangan dizayn ishlab chiqarishga avtomatik o'tmaydi
4. 🔴 **Xabar + bildirishnoma o'lik** — `design_order_messages` jadval yo'q + notifications stub
5. 🟡 **Create fragmentatsiya** — 4 joyda tarqoq (kod izohida "later cleanup" deb belgilangan)

---

## XULOSA (egasiga)
Design **tasdiqlash qismi ishlaydi** (approve/reject/verify real), LEKIN **eng muhim kirish nuqtasi va dizayn modulining mohiyati buzuq:**
- **Yangi dizayn so'rovi kiritib bo'lmaydi** — forma 501 (real yo'l bor, ulanmagan, arzon kod-fix)
- **Dizayn fayl yuklash UMUMAN YO'Q** — dizayn moduli uchun kritik
- **Tasdiqlangan dizayn ishlab chiqarishga o'tmaydi** — handoff uzilgan
- **Xabar/bildirishnoma o'lik** — jadval yo'q + stub

> Hech narsa o'zgartirilmadi (read-only). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
