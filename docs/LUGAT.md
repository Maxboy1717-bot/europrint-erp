# EUROPRINT ERP — LUGAT VA ATAMALAR

> EuroPrint ERP da ishlatiladigan barcha atamalar: o'zbek ↔ ingliz ↔ DB ustun nomi.
> Yangi ish boshlashdan oldin o'qing. Taxmin qilmang — shu yerdan tekshiring.

---

## 1. ISHLAB CHIQARISH TERMINLARI

| O'zbek | Ingliz | DB / Kod | Izoh |
|--------|--------|----------|------|
| Gofra | Corrugated | `direction='gofra'` | Karton qadoq ishlab chiqarish |
| Offset | Offset printing | `direction='offset'` | Ko'p rangli bosma texnologiya |
| Silkscreen | Silk-screen | `direction='silkscreen'` | Ip-parda bosma |
| Flexi | Flexography | `direction='flexi'` | Elastik bosma plitalar |
| Laklash | Lacquering | `post_press.lacquer=true` | Bosma ustiga lak |
| Laminatsiya | Lamination | `post_press.lamination=true` | Plyonka yopish |
| Kesim | Die-cutting | `kesim_schema` JSONB | Shaklga kesish |
| Raskroy | Layout/Nesting | `raskroy_per_list` | Listdan kesim soni |
| Maket | Mock-up/Artwork | `maket_approved` BOOLEAN | Dizayn namunasi |
| Tiraj | Print run | `quantity` | Bosma miqdori |
| Brak | Defect/Scrap | `quantity_rejected` | Yaroqsiz mahsulot |
| Profil (gofra) | Flute profile | `gofra_profile` | B, C, E, BC, EB |
| CMYK | CMYK | `print_params.colors` | Rang modeli |
| Pantone | Pantone | `print_params.pantone` | Maxsus rang tizimi |

---

## 2. TASHKILOT TERMINLARI

| O'zbek | Ingliz | DB / Kod | Izoh |
|--------|--------|----------|------|
| Karta | Card / Function | `org_functions` | Lavozim ta'rifi (asosiy ob'ekt) |
| Razryad | Grade / Rank | `razryad_levels` | Malaka darajasi 1-6 |
| Smena | Shift | `shift_schedules` | Ish smena jadvali |
| Smena topshiruvi | Shift handover | `shift_handovers` | Smena o'tkazish protokoli |
| Otdeleniye | Division | org tuzilma L2 | Vysotskiy 7 model bo'linmasi |
| Bo'lim | Department | `org_departments` | Otdeleniye ichidagi bo'lim |
| Seksiya | Section | org tuzilma L4 | Bo'lim ichidagi seksiya |
| Sektor | Sector | org tuzilma L5 | Seksiya ichidagi sektor |
| ЦКП | KPI target | `kpi_targets` | Maqsad ko'rsatkich |
| INPS | Social Insurance | `8%` foiz | Ijtimoiy to'lov (xodimdan) |
| NDFL | Income Tax | `12%` foiz | Daromad solig'i |

---

## 3. ERP TEXNIK TERMINLARI

| Qisqartma | To'liq nom | Izoh |
|-----------|------------|------|
| OEE | Overall Equipment Effectiveness | Uskunalar umumiy samaradorligi = mavjudlik × unumdorlik × sifat |
| BOM | Bill of Materials | Materiallar ro'yxati (texkarta uchun) |
| CRP | Capacity Requirements Planning | Quvvat talabi rejalashtirish |
| MRP | Material Requirements Planning | Material talabi rejalashtirish |
| GL | General Ledger | Bosh daftar (moliya yozuvlari) |
| AR | Accounts Receivable | Debitorlik (to'lanishi kerak summa) |
| AP | Accounts Payable | Kreditorlik (to'lash kerak summa) |
| WMS | Warehouse Management System | Ombor boshqaruvi |
| MES | Manufacturing Execution System | Ishlab chiqarish ijro tizimi |
| QC | Quality Control | Sifat nazorati |
| PP | Production Planning | Ishlab chiqarish rejalashtirish |
| SD | Sales Distribution | Savdo taqsimoti |
| MM | Materials Management | Materiallar boshqaruvi |
| POS | Point of Sale | Savdo nuqtasi (EuroPrint: ombor kirim/chiqim) |
| IoT | Internet of Things | Narsalar interneti (sensorlar) |
| RBAC | Role-Based Access Control | Rolga asoslangan kirish nazorati |
| JWT | JSON Web Token | Autentifikatsiya tokeni |
| DDD | Domain-Driven Design | Domenga yo'naltirilgan dizayn |
| ADR | Architecture Decision Record | Arxitektura qaror hujjati |

---

## 4. KANONIK JADVAL NOMLARI (nima deyiladi ↔ qaysi jadval)

| "Shunaqa jadval bor" deb aytilsa | Haqiqiy kanonik jadval |
|----------------------------------|------------------------|
| "Xodimlar jadvali" | `hr_employees` |
| "Lavozimlar jadvali" | `org_functions` (positions emas!) |
| "Buyurtmalar jadvali" | `sales_orders` (orders emas!) |
| "Tech-karta (master)" | `technology_cards` (tech_cards emas!) |
| "Ombor qoldig'i" | `warehouse_stock` (stocks/wms_stock emas!) |
| "GL yozuvlari / buxgalteriya" | `entries` (gl_journal_entries emas!) |
| "Ish markazlari" | `work_centers` (pp_work_centers emas!) |
| "Material kartochka" | `material_cards` |
| "Mijozlar" | `sd_customers` yoki `customers` (kontekstga qarab) |
| "O'lchov birliklari" | `unit_of_measures` (units emas!) |
| "Ombor harakati" | `warehouse_transactions` |
| "Joriy balans" | `current_stock` (VIEW — faqat o'qish) |

---

## 5. MODULDAGI HARAKAT TURLARI

```
Ombor harakati (warehouse_transactions.transaction_type):
  RECEIPT      ← Kirim (xarid / ishlab chiqarish)
  ISSUE        ← Chiqim (ishlab chiqarishga berish / sotish)
  TRANSFER     ← Joydan joyga ko'chirish
  ADJUSTMENT   ← Inventarizatsiya tuzatishi
  RETURN       ← Qaytarish

GL yozuv tomoni (entries.side):
  DEBIT        ← Debet
  CREDIT       ← Kredit

Ish buyurtmasi holati (work_orders.status):
  PLANNED      ← Rejalashtirilgan
  RELEASED     ← Tasdiqlangan / chiqarilgan
  IN_PROGRESS  ← Bajarilmoqda
  COMPLETED    ← Tugallangan
  CANCELLED    ← Bekor qilingan

Sifat tekshiruv natijasi (quality_checks.status):
  PENDING      ← Kutilmoqda
  IN_PROGRESS  ← Tekshirilmoqda
  PASSED       ← O'tdi
  FAILED       ← Rad etildi (qayta ishlov kerak)

CRM lead bosqichi (crm_pipeline_stages.code):
  NEW → QUALIFICATION → PROPOSAL → NEGOTIATION → CLOSED_WON / CLOSED_LOST
```

---

## 6. MUHIM ATAMALAR (Aralashtirilmasligi kerak)

| ❌ Aralashtiriladi | ✅ Farq |
|-------------------|---------|
| `positions` va `org_functions` | positions = 0 FK (legacy). org_functions = 29 FK (kanonik karta) |
| `tech_cards` va `technology_cards` | tech_cards = buyurtma nusxasi. technology_cards = master spek |
| `orders` va `sales_orders` | orders = PP ga tegishli. sales_orders = SD kanonik |
| `stocks` va `warehouse_stock` | stocks = eski, noto'g'ri. warehouse_stock = kanonik |
| `entries` va `gl_journal_entries` | entries = kanonik GL. gl_journal_entries = 0 qator, SAP#76 |
| `material_id` va `material_card_id` | material_card_id = eski nom. material_id = kanonik |
| `unit` va `unit_of_measure` | unit_of_measure = eski ustun nomi. unit = yangi kanonik |
| POS = kassir | POS Monitor = zavod ombori kirim/chiqim (kassir emas!) |

---

## 7. GOFRA PROFILLARI

| Profil | Qalinlik | Qo'llanish |
|--------|----------|------------|
| `B` | ~3mm | Engil qadoq |
| `C` | ~4mm | Ko'p qo'llaniladigan |
| `E` | ~1.5mm | Yupqa gofra (maket uchun) |
| `BC` | ~7mm | Ikki qavatli (og'ir yuklar) |
| `EB` | ~5mm | Ikki qavatli (o'rtacha) |

---

## 8. O'LCHOV BIRLIKLARI (unit_of_measures.code)

| Kod | Ma'nosi | Misol |
|-----|---------|-------|
| `PCS` | Dona | 1000 PCS gofra qutilar |
| `M2` | Kvadrat metr | Karton materiallar |
| `M` | Metr | Rulonlar |
| `KG` | Kilogramm | Siyoh, yapishqoq |
| `L` | Litr | Suyuq materiallar |
| `SHEET` | List | Karton listlari |
| `ROLL` | Rulon | Materiali rulonlarda |

---

*EuroPrint ERP · Lugat · Versiya: 2026-06-18*
