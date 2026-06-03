# ASL HOLAT HISOBOTI — POS / Ombor / Kassir / Kommunikatsiya / Kanban (2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'zgartirilmadi. Har modul **brauzer (:20806, Super Admin sessiyasi)
> + kod + jonli DB (:5432)** bilan tekshirildi. Verify-don't-trust: har da'vo brauzerda ko'rildi.

---

## 1. HAR MODUL — AYNAN QANDAY (brauzer dalili bilan)

### A. OMBOR — eng kuchli modul, asosan ISHLAYDI ✅
| Sahifa | Holat | Brauzer dalili |
|---|---|---|
| `/wms/overview` (Moliya nazorati) | ✅ ISHLAYDI, real data | Jami qiymat 248,710,000 so'm · 12 ombor (5 qoldiqli) · 23 stok qator · kam-qoldiq alert (Qalam QC-HOLD 10/50) · so'nggi harakatlar (Kirim/Chiqim/Ichki chiqim real) |
| `/wms/warehouses` (Omborlar) | ✅ 9 ombor turi, config-driven | Hom ashyo, Rulon qog'oz, Ho'jalik, Tayyor mahsulot, Ishlab chiqarish, Brak/defekt, Makulatura, Asbob-uskuna, Bo'lim — har biri kategoriya + kirim/chiqim oqimi + Karantin/QC/birlik teglari |
| `/wms/warehouse-stock/:id` | ✅ **EXCEL JADVAL** (vizyon #1 ✅) | Ustunlar: MATERIAL/KOD/QOLDIQ/REZERV/MAVJUD/BIRLIK/AMAL. Kartochka EMAS. Faqat **ko'rish** (view-only) |
| `/pos-monitor` (POS Monitor) | ✅ TO'LIQ FUNKSIONAL | ERP SSO (alohida login YO'Q ✅), tablar: To'liq Kirim(QC+barcode)/To'liq Chiqim/Karantin-QC/Harakatlar/Hisobotlar · barcode+klaviatura skaner+kamera · Excel stok jadval (har qatorda Kirim/Chiqim) · Kirim dialog real+wired (Miqdor+Sabab+submit) · P2P Qabul bo'limi |
| `/wms/procurement` (Xarid P2P) | ⚠️ spine ishlaydi, **xom UI** | So'rov yaratish (9 ombor turi) + org-sxema tasdiq zanjiri BOR, lekin **raw ID formasi** ("Ta'minotchi xodim ID: masalan 5", "Rahbar user ID: 35") — foydalanuvchi ID bilmaydi, ishlatib bo'lmaydi |
| Material 360 | ⚠️ page bor | `WarehouseMaterial360.tsx` — to'liqligi alohida tekshirilmadi |

**Stok manbai:** yangi `warehouse_stock` = **canonical** (POS Monitor + overview undan o'qiydi, mos 15125). Eski parallel jadval (`pos_stock_ledger`, `current_stock`) hali bor lekin yangi sahifalar tegmaydi.
**Hukm A:** Ombor moduli — **ISHLAYDI + real data + Excel jadval**. Kamchilik: P2P UI xom, Karantin/QC to'liq 5-bosqich emas, view-only stok.

### B. KASSIR — KATTA NOMUVOFIQLIK ❌
| Sahifa | Holat | Brauzer dalili |
|---|---|---|
| `/accounting/cash-register` (Kassa) | ❌ **NOTO'G'RI KONSEPT** | Bu **chakana sotuv POS** (do'kon kassasi): shtrix-kod skanerlab tovar qo'shish, Naqd/Karta/O'tkazma, QQS 12%, Olingan naqd, Qaytim, "Sotishni yakunlash" |
| `/accounting/payroll-automation` (Ish Haqi) | ⚠️ BO'SH | Payroll-hisoblash UI (Maosh/AI hisoblash) bor, lekin 0 shartnoma, 0 hisob-kitob, "Ma'lumot topilmadi" |

Egasi vizyoni (#2): kassir = oylik/avans tarqatuvchi + hamma naqd nazorati + podotchet/qarz + Kanban→kassir + reyting navbati + kunlik PDF. **Bularning HECH BIRI yo'q.** `employee_inventory_ledger=0` (podotchet bo'sh). Bor narsa: chakana POS (noto'g'ri) + payroll-calc (bo'sh) — **disconnected**.
**Hukm B:** Kassir vizyoni ~10% — bor narsalar boshqa maqsadli.

### C. KOMMUNIKATSIYA MARKAZI — qurilgan-lekin-ishlatilmagan QOBIQ ⚠️
`/coordination?tab=baskets`: struktura BOR (3-Savat: Kiruvchi/Kutish/Chiquvchi · Doklad↑/Rasporyajenie↓ · 5 Kengash · ШВБ metodologiya · 24h qoida · "Yangi hujjat"/"Doklad yozish") — lekin **BUTUNLAY BO'SH**: 0 doklad, 0 rasporyajenie, 0 bajarildi, har savat "Savat bo'sh". DB: `cc_documents=0`, `cc_branches=0` (backend seed: 14 shablon + 34 qadam, lekin 0 real hujjat).
**Hukm C:** to'liq struktura + backend bor, lekin **bir marta ham ishlatilmagan** (bo'sh qobiq).

### D. KANBAN — dvigatel ISHLAYDI, lekin maxfiylik?, 3-savat MOCK, axlat-data ⚠️
`/kanban`: boy + funksional — 8 ko'rinish (Kanban/Ro'yxat/Muddatlar/Mening rejam/Kalendar/Gant/Dashboard/Resurslar) · domen-doskalar (Buyurtmalar/Rekruting/Strategik) · "Barcha rollar" filtri · "Yangi doska" (super_admin) · drag-drop ustunlar.
- ❌ Doskalar **test-axlat** bilan to'la (ustunlar: "Salom", "savol", "1231322"; karta: "Nima").
- ❌ **3-Savat shu sahifada MOCK** — `ThreeBasketsPanel.tsx` da **hardcoded** kartalar (Yangi shartnoma loyhasi/Moliyaviy hisobot so'rovi/QC tekshirish natijasi/...), chunki haqiqiy CC = 0. Ya'ni **soxta demo**.
- ⚠️ Rol-asoslilik (#3): "Barcha rollar" filtri bor (qisman belgi), lekin haqiqiy maxfiylik (oddiy xodim faqat o'zinikini ko'radi) **tasdiqlanmadi** (men super_admin'man).
**Hukm D:** dvigatel bor (~50%), lekin axlat-data + mock 3-savat + maxfiylik isbotsiz.

### E. SOZLAMA — deyarli YO'Q ❌
Faqat **3 modulda** settings route: `sd/settings`, `marketing/settings`, `qc/settings`. Qolgan modullar (Ombor, Moliya, HR, Kanban, CC, Ta'minot...) sozlama sahifasiz. Vizyon #6 "har bo'limda sozlama (config-driven)" = bajarilmagan (warehouse_types config-driven, lekin UI sozlama emas).

### F. BOG'LANISH — modullar ALOHIDA, zanjir UZILGAN ❌ (eng asosiy muammo)
- Ombor ichida: warehouse_stock canonical, POS Monitor ↔ overview ulangan ✅.
- Modullararo: P2P so'rov **CC/Kanban'ga ulanmagan** (raw forma) · CC bo'sh · Kassir retail-POS, hech narsaga ulanmagan · Kanban 3-savat mock.
- Vizyon #11 zanjiri (Savdo→AI→ombor→ta'minotchi→CC→Kanban→kassir→ombor) **end-to-end YO'Q** — qismlar bor, ulanmagan.

---

## 2. VIZYON vs HOZIRGI (1–11 nuqta)

| # | Vizyon nuqtasi | Holat | Izoh |
|---|---|---|---|
| 1 | Material = Excel jadval (kartochka emas) | ✅ BOR | warehouse-stock Excel jadval (view-only) |
| 2 | Kassir: oylik/avans/naqd nazorat/podotchet/reyting/PDF | ❌ YO'Q | Retail POS bor (noto'g'ri); payroll-calc bo'sh; podotchet bo'sh |
| 3 | Kanban rol-asosli MAXFIY; super_admin sozlaydi | ⚠️ QISMAN | Rol filtri + super_admin yaratish bor; haqiqiy maxfiylik tasdiqlanmagan |
| 4 | CC + 3 Savat + Kassir+Kanban birlashishi | ⚠️ UZILGAN | 3-savat 2 joyda (CC bo'sh + Kanban mock); Kassir ulanmagan |
| 5 | Office uslubi + download cheklash (sabab bilan) | ❌ YO'Q | Download-cheklash siyosati topilmadi |
| 6 | Har bo'limda sozlama (config-driven) | ❌ QISMAN | Faqat 3 modul (sd/marketing/qc) |
| 7 | Inventar 360 profili | ⚠️ TO'LIQ EMAS | Page bor (WarehouseMaterial360), to'liqligi tekshirilmagan |
| 8 | So'rovnoma/schyot-faktura (xodim ombordan so'raydi) | ⚠️ TO'LIQ EMAS | Backend bor (20 fayl, pos_material_requests) lekin bo'sh (0 qator) |
| 9 | AI kameralar ombor nazorati | ❌ YO'Q | HR davomat kamerasi + iot-agent bor; ombor uchun emas |
| 10 | Makulatura/chiqindi ombori | ✅ BOR | "Makulatura ombori" turi (waste_collect→sell) |
| 11 | Savdo→AI→ombor→ta'minotchi→CC→Kanban→kassir→ombor zanjiri | ❌ UZILGAN | Qismlar bor, end-to-end integratsiya yo'q |

---

## 3. BOG'LANISH XARITASI

```
✅ ISHLAYDIGAN bog'lanish:
   POS Monitor ──► warehouse_stock (issue/receive, atomik) ──► /wms/overview ko'rsatadi
   P2P qabul ──► warehouse_stock prixod + material_movements

❌ UZILGAN bog'lanish (vizyon yadrosi):
   Savdo buyurtma ──✗──► AI ombor tekshiruvi ──✗──► ta'minotchiga avto-so'rov
   P2P so'rov ──✗──► Kommunikatsiya Markazi (raw forma, CC'ga ulanmagan)
   Kommunikatsiya ──✗──► Kanban (3-savat mock, real CC bo'sh)
   Kanban ──✗──► Kassir (kassir retail-POS, ulanmagan)
   Kassir ──✗──► xodim profili podotchet/qarz (bo'sh, ulanmagan)
   Pul (oylik/avans/xarid) ──✗──► Kanban→kassir oqimi (yo'q)
```

---

## 4. NEGA "10% HAM YOQMADI, BALLONSIZ MASHINA" — AYNAN SABABLAR

1. **Modullar ALOHIDA ishlaydi, BIR-BIRIGA ULANMAGAN.** Vizyonning yuragi = integratsiya (zanjir). Dvigatel (Ombor, Kanban) bor, lekin g'ildirak (bog'lanish) yo'q → "ballonsiz mashina".
2. **Kassir butunlay noto'g'ri** — chakana do'kon kassasi qilingan, egasi esa "naqd nazorat + oylik/avans hub" istaydi. Eng muhim modul mavjud emas.
3. **Kommunikatsiya Markazi bo'sh qobiq** — chiroyli struktura, 0 hujjat, hech kim ishlatmagan.
4. **Kanban 3-Savat SOXTA (mock)** — chiroyli ko'rinadi, lekin hardcoded demo; haqiqiy CC bo'sh.
5. **Xom developer-formalar** — P2P so'rov "user ID 35 kiriting" so'raydi (foydalanuvchi uchun emas).
6. **Test-axlat data** — "Salom/savol/1231322" kabi ustunlar professional ko'rinmaydi.
7. **Vizyonning eng muhim qismlari yo'q** — kassir-hub, integratsiya zanjiri, download cheklash, har-modul sozlama, AI ombor kamerasi.

> Ya'ni: alohida sahifalar ochilsa "ishlaydi", lekin egasi vizyon bo'yicha **butun tizimni bir oqim sifatida** ishlatmoqchi — u oqim yo'q. Shuning uchun "yoqmadi".

---

## 5. UMUMIY — necha % vizyon bajarilgan

| Modul | Bajarilgan % | Holat |
|---|---|---|
| A. Ombor | **~65%** | Ishlaydi + real data + Excel; P2P UI xom, Karantin/QC to'liq emas |
| B. Kassir | **~10%** | Noto'g'ri konsept (retail POS), payroll bo'sh |
| C. Kommunikatsiya | **~30%** | Struktura+backend bor, 0 hujjat (ishlatilmagan) |
| D. Kanban | **~50%** | Dvigatel ishlaydi; maxfiylik?, 3-savat mock, axlat |
| E. Sozlama | **~20%** | 3 modul; config-driven qisman |
| F. Integratsiya (zanjir) | **~15%** | Ombor ichi ulangan; modullararo uzilgan |

**Umumiy vizyon bajarilishi: ~25–30%.** Asosiy "tana" (Ombor + Kanban dvigatel) bor va ishlaydi; lekin vizyonning **yuragi (integratsiya zanjiri + kassir-hub + CC foydalanish)** yo'q. Shuning uchun alohida modul "ishlaydi" bo'lsa-da, butun tizim egasiga "ishlamayotgandek" tuyuladi.

> **Keyingi qadam (egasi rejasi uchun):** 1) Kassir konseptini qayta belgilash (retail POS emas, naqd-nazorat hub). 2) Integratsiya zanjirini ulash (P2P→CC→Kanban→Kassir→Ombor). 3) Kanban 3-savatni mock'dan real CC'ga ulash. 4) Test-axlat data tozalash. 5) Har modulga sozlama + download-siyosat + AI ombor kamerasi qo'shish.

*Tahlil 2026-06-02 — brauzer (Super Admin) + kod + jonli DB. Hech narsa o'zgartirilmadi.*
