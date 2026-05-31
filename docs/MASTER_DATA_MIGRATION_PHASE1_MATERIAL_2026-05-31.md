# Master-Data Migration — FAZA 1 REJA: MATERIAL — 2026-05-31

> **Bu faqat REJA.** Migration kodi yozilmaydi, DB o'zgartirilmaydi. Har qadam alohida,
> tasdiqdan keyin. Asos = **kod dalili** (Faza 0'da jonli DB bo'sh chiqdi — row-count bilan
> hukm chiqarib bo'lmaydi), barcha topilma grep/Read bilan tasdiqlangan.
> ⚠️ Faza 0 darsi: hech qanday raqam taxmin qilinmaydi — faqat tasdiqlangan dalil.

## 1. Maqsad
Material tushunchasi uchun **yagona kanonik jadval** ni belgilash va dublikat/parallel
implementatsiyani aniqlash (hozircha o'chirmasdan — siz qaror qilasiz).

## 2. Kanonik jadval qarori: ✅ `material_cards`

**Dalil (kod, file:line bilan tasdiqlangan):** `material_cards` — yagona **faol yoziladigan**,
jonli ma'lumot oqimiga ulangan jadval. 6+ yozuvchi:

| Yozuvchi (BE) | Amal |
|---|---|
| `modules/erp/erp.repository.ts:133` | INSERT (yangi karta) |
| `erp.repository.ts:36`, `:140` | UPDATE / soft-delete (is_active=false) |
| `modules/pos/application/services/procurement-request.service.ts:266` | INSERT (xarid so'rovidan) |
| `procurement-request.service.ts:293` | UPDATE current_stock |
| `modules/compatibility/resources.service.ts:75` | INSERT |
| `modules/compatibility/warehouse-barcode-ops.service.ts:35,71` | UPDATE barcode |
| `modules/pos/application/services/warehouse-config.service.ts:121` | UPDATE current_stock |
| `modules/compatibility/pos-warehouse-integration-movement.service.ts:154` | UPDATE |

**Controller:** `@Controller('material-cards')` (`compatibility/resources.controller.ts:63`).
**Domen:** o'zbekcha/ombor-yo'naltirilgan (32 ustun): `kod, xom_ashyo, xom_ashyo_ru, unit_of_measure,
format_a/format_b, grammage, current_stock/reserved_stock/available_stock, min/max_stock,
reorder_point, unit_price, last_purchase_price, supplier_name, vendor_id, raw_material_id,
warehouse_id, abc_segment, barcode, is_active`.

→ Bu **bosmaxona ombor/POS katalogi** — tizimning ishlaydigan qismi.

## 3. Dublikat/parallel: 🟡 MM moduli (`materials` + `raw_materials`) — DORMANT, WIRED

`materials` va `raw_materials` — alohida **MM (Material Management) DDD moduli**ning bir qismi.

| Xususiyat | Tafsilot (tasdiqlangan) |
|---|---|
| Struktura | To'liq DDD: `mm/{application,domain,infrastructure,presentation}` + 4 controller (mm-materials, mm-raw-materials, mm-uoms, mm-vendors) |
| `materials` controller | `@Controller('mm/materials')` (`mm-materials.controller.ts:42`) — **REAL CRUD**: Zod `CreateMaterialSchema` (code/name/**type: raw\|wip\|finished\|consumable**/baseUomId/categoryId/stdCost), `MaterialModule` service, `JwtAuthGuard` |
| `materials` yozuvchi | `mm/infrastructure/repositories/drizzle-material.repo.ts:107` (`db.insert(materials)`), `:131` (update) |
| `raw_materials` controller | `@Controller('raw-materials')` (`mm-raw-materials.controller.ts:29`) |
| Domen | inglizcha/normallashtirilgan (UOM, category, vendor FK bilan) — "to'g'ri" master-data dizayni |
| **Jonli DB holati** | `materials` jadvali **umuman migratsiya qilinmagan** (to_regclass=null); `raw_materials` bor lekin **0 qator** |

→ Ya'ni MM moduli — `material_cards`'ga **parallel, idealizatsiya qilingan, lekin tugatilmagan**
implementatsiya (loyihada ma'lum pattern: jonli compatibility-qatlam yonida toza DDD moduli).
**Bu "wired-stub" (route bor, kod real, lekin jadval/data yo'q)** → sizning qoidangiz bo'yicha
**avtomatik O'CHIRILMAYDI — siz qaror qilasiz.**

## 4. `raw_materials` — dublikat EMAS, lekin o'lik bog'lanish

- `material_cards.raw_material_id` ustuni `raw_materials`'ga ishora qiladi (sxema darajasida).
- LEKIN `raw_material_id` **kodda hech qayerda ishlatilmaydi** (grep = 0) → bu **o'lik (dead) ustun**,
  jonli bog'lanish yo'q.
- Demak `raw_materials` MM moduli bilan birga turadi (alohida jonli lug'at emas). MM qaroriga qo'shiladi.

## 5. 🔴 Migration hajmi: DATA YO'Q

- Kanonik (`material_cards`) — jonlida 0 qator (lokal nusxa bo'sh).
- Dublikat (`materials`) — **jadval ham yo'q**; `raw_materials` — 0 qator.
- **Ko'chiriladigan ma'lumot: YO'Q.** Bu data-migration EMAS, balki **kod/modul qarori**.

## 6. Variantlar (siz tanlaysiz)

| Variant | Nima | Xavf | Izoh |
|---|---|---|---|
| **A — MM modulni nafaqaga (retire)** | mm-materials + mm-raw-materials controller/route + `materials`/`raw_materials` pgTable'larni o'chirish; `material_cards` yagona qoladi | 🟡 O'RTA | FAQAT agar hech bir jonli FE sahifa `/api/mm/*` ga bog'liq bo'lmasa (5-band tekshiruvi shart) |
| **B — MM modulni DORMANT qoldirish** | Hech narsa o'chirmaymiz, lekin hujjatda "dublikat material tizimi, ishlatilmaydi" deb belgilaymiz; `material_cards` kanonik deb e'lon | 🟢 PAST | Eng xavfsiz; tartibsizlik qoladi lekin hech narsa buzilmaydi |
| **C — MM modulni tugatish** | `material_cards`'ni MM moduliga ko'chirish (UOM/category/vendor normallashtirish) | 🔴 YUQORI | Katta refactor; jonli ombor/POS oqimini buzish xavfi — TAVSIYA ETILMAYDI |

**Tavsiyam: B (dormant qoldirish) yoki A (tekshiruvdan keyin retire).**
`material_cards` aniq kanonik; MM moduli tugatilmagan parallel — uni tugatish (C) jonli tizimni
buzadi. Eng to'g'ri: `material_cards`'ni rasmiy kanonik deb belgilash; MM moduli haqida A yoki B
ni siz tanlaysiz.

## 7. ⚠️ Ijro oldidan TEKSHIRILISHI SHART (hozir tool nosozligi sabab yopilmadi)

1. **Jonli FE consumer:** birorta jonli sahifa `/api/mm/materials` yoki `/api/mm/raw-materials`
   ga bog'liqmi? (Faza 0'da ishonchsiz grep `/api/mm/materials`=0 chiqdi, lekin sed-artefakt
   shubhasi bor — toza qayta tekshirish kerak.) Agar bog'liq sahifa bo'lsa → A varianti bloklanadi.
2. **MM app.module registratsiya:** MM controller'lar route sifatida ulanganmi (app.module imports)?
3. **PRODUCTION:** prod DB'da `materials`/`raw_materials` da real qator bormi? (Agar bo'lsa,
   verdikt o'zgaradi — A retire xavfli bo'ladi.)

## 8. Keyingi qadam (REJA — ijro EMAS)
- Agar siz **A** desangiz: avval 7-banddagi 3 tekshiruvni bajaraman (read-only), keyin har bir
  o'chirishni alohida commit + gate (tsc/build/route-scan) bilan, sizning tasdig'ingiz bilan.
- Agar **B** desangiz: faqat hujjat + memory'da "material_cards kanonik, MM dormant" deb belgilayman
  (kod tegmaydi).
- Customer tushunchasi: production data kelguncha **kutiladi** (Faza 0: sd_customers vs customers noaniq).

---
*Faza 1 reja. Kod yozilmadi, DB tegmadi. Ijro — sizning tasdiqingizdan keyin, bittadan.*
