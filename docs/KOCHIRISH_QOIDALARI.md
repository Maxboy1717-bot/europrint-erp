# EUROPRINT ERP — V1→V2 KO'CHIRISH QOIDALARI

> **V1 kodini V2 ga ko'chirish tartibi. Har modul uchun 6 bosqichli jarayon.**
> "Ko'chirish" = rewrite (nusxa ko'chirish emas). Parazit V1 kodi yo'qoladi.
> Qoida: V2 tayyor bo'lguncha V1 ishlaydi (zero-downtime). Keyin V1 o'chiriladi.
> Bog'liq: [V2_PAPKA_STRUKTURASI.md](V2_PAPKA_STRUKTURASI.md) · [PARAZIT_KOD_QOIDALARI.md](PARAZIT_KOD_QOIDALARI.md) · [SPRINT_REJA.md](SPRINT_REJA.md)

---

## 1. KO'CHIRISH NIMA?

```
V1 → V2 ko'chirish = 3 narsa:

1. KOD KO'CHIRISH (asosiy):
   V1 modules/[modul]/ → o'chir (parazit)
   V2 modules/[modul]/ → DDD bilan qayta yoz (clean)
   ❌ Nusxa ko'chirma (parazit pattern ham ko'chib ketadi)
   ✅ Mantiqni tushun → qayta yoz (toza)

2. SCHEMA SAQLASH (o'zgartirma):
   V1 da to'g'ri tuzilgan DB schema → V2 da ham shu jadval
   shared/db/schema-*.ts → O'ZGARTIRMA (kanonik)
   Faqat migration bilan yangi ustun/jadval qo'sh

3. MA'LUMOT KO'CHIRISH (agar kerak):
   V1 dan V2 ga data migration (eski format → yangi format)
   Faqat agar DB tuzilmasi o'zgartirish kerak bo'lsa
```

---

## 2. KO'CHIRISH BOSQICHLARI (Har Modul Uchun)

### BOSQICH 0: Tahlil (1-2 soat)
```bash
# V1 modulida nima bor?
ls -la apps/api/src/modules/[modul]/

# Endpointlar ro'yxati:
grep -rn "@Get\|@Post\|@Patch\|@Delete" apps/api/src/modules/[modul]/

# Qaysilari HAQIQATAN ishlaydi?
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3030/api/[modul]/[endpoint]
# 200 + real data → ishlaydi (V2 da saqlash)
# 200 + [] yoki hardcoded → parazit (V2 da qayta yoz)
# 404/500 → ishlamaydi (V2 da yangi yoz)

# FE da ishlatilganmi?
grep -rn "/api/[modul]" artifacts/erp-dashboard/src/
```

**Natija: ro'yxat** (har endpoint: ishlaydi/parazit/yo'q)

### BOSQICH 1: Domenni tushunish (1-2 soat)
```
Savollar:
✅ Bu modulning asosiy vazifasi nima? (1 jumlada)
✅ Bu modul qanday ma'lumot yaratadi? (jadvallar)
✅ Bu modul boshqa modullardan nima oladi? (events)
✅ Bu modul boshqa modullarga nima beradi? (events)
✅ Asosiy biznes qoidalari qanday? (validation, hisob, holat o'zgarishi)

Javoblar → MODUL_SHARTNOMASI.md dagi jadval egasi xaritasini yangilash
```

### BOSQICH 2: Domain yaratish (toza)
```
apps/api/src/modules/[modul]/domain/

entities/[modul]-[entity].entity.ts:
  - Private constructor (static create() method)
  - Barcha validatsiya entity ichida
  - Domain events (entity.domainEvents array)
  - Result<T> qaytaradi

value-objects/ (agar kerak):
  - Immutable, equals() metodi bor
  - Misol: Salary(amount, currency), PhoneNumber(value)

events/:
  - Har event class (payload + readonly fields)
  - Nomlash: [ModulEntity][Amal]Event

repositories/ (faqat interface):
  - IHrEmployeeRepository
  - Faqat metod imzolari, implementatsiya yo'q
```

### BOSQICH 3: Application qavatini yaratish
```
apps/api/src/modules/[modul]/application/

services/[modul]-[entity].service.ts:
  - IRepository inject (concrete emas)
  - EventEmitter2 inject
  - Har metod → Result<T> qaytaradi
  - Har muhim amal → event emit
  - Biznes mantiq faqat shu yerda

handlers/ (event listenerlar):
  - @OnEvent('boshqa.modul.event')
  - async, real amal (DB yozuv yoki emit)
  - Idempotent (ikki marta chaqirilsa xato bermaydi)
```

### BOSQICH 4: Infrastructure (Drizzle)
```
apps/api/src/modules/[modul]/infrastructure/

repositories/drizzle-[modul].repository.ts:
  - IRepository implement
  - DrizzleService inject
  - Faqat DB operatsiya (mantiq yo'q)
  - Parametrized query (SQL injection yo'q)
  - N+1 YO'Q (JOIN ishlatish)
```

### BOSQICH 5: Presentation (Controller + DTO)
```
apps/api/src/modules/[modul]/presentation/

controllers/[modul]-[entity].controller.ts:
  - @Roles() har endpointda
  - Service chaqirish + unwrap
  - Result.ok ? 200 : throw HttpException
  - Hech qanday biznes mantiq

dto/create-[entity].dto.ts:
  - @IsString(), @IsInt(), @IsOptional()
  - @MaxLength(), @Min(), @Max()
  - @Transform() agar kerak
  - @Exclude() maxfiy maydonlar uchun
```

### BOSQICH 6: Cleanup va test
```bash
# V2 tayyor bo'lganda:

# 1. Test yoz va pass bo'lsin:
pnpm test:integration --testPathPattern=[modul]

# 2. E2E tekshir:
curl -H "Authorization: Bearer $HR_MANAGER_TOKEN" \
  http://127.0.0.1:3030/api/[modul]/[endpoint]
# → real data qaytishi kerak

# 3. V1 ni _legacy ga ko'chir:
git mv apps/api/src/modules/[modul] apps/api/src/_legacy/[modul]

# 4. V2 yangi joyda:
# apps/api/src/modules/[modul]/ = yangi DDD tuzilma

# 5. Typecheck PASS:
npx tsc -p apps/api/tsconfig.json --noEmit

# 6. V1 o'chir:
git rm -r apps/api/src/_legacy/[modul]/
git commit -m "chore([modul]): remove v1 (v2 ready)"
```

---

## 3. NIMA KO'CHIRILADI, NIMA QAYTA YOZILADI

| Narsa | Ko'chirish | Qayta yozish | Izoh |
|-------|-----------|-------------|------|
| DB schema (pgTable) | ✅ Saqlash | — | Kanonik shared/db/ |
| Seed SQL | ✅ Saqlash | — | Idempotent, to'g'ri |
| DTO (validatsiya to'g'ri) | ✅ Saqlash | — | Faqat class-validator |
| Domain entity logic | — | ✅ Qayta yoz | DDD, Result<T> |
| Service (real DB) | Qisman | ✅ Qayta yoz | DDD, event emit |
| Repository (Drizzle) | Qisman | ✅ Qayta yoz | Interface + impl |
| Controller | — | ✅ Qayta yoz | @Roles(), slim |
| `return { ok: true }` stub | — | ✅ Qayta yoz | Real DB |
| Event listener (no-op) | — | ✅ Qayta yoz | Real DB amal |
| Test | — | ✅ Qayta yoz | Factory, real DB |
| FE sahifa (real API) | Qisman | Takomillashtir | EP komponent |
| FE sahifa (hardcoded) | — | ✅ Qayta yoz | useQuery + real |

---

## 4. ZERO-DOWNTIME STRATEGIYA

```
Problem: V2 qurilayotganda V1 ishlashi kerak.
Solution: Sprint davomida PARALLEL operatsiya.

SPRINT BOSHLANADI:
  V1: /api/[modul]/* → ishlaydi (foydalanuvchilar ishlatadi)
  V2: qurilmoqda (test muhitda)

SPRINT DAVOMIDA:
  V2 endpoint tayyor → test muhitda sinov
  V1 endpoint hali ishlab turadi

SPRINT TUGAYDI:
  V2 barcha endpoint test PASS →
  V1 o'chiriladi → V2 faollashtiradi
  Foydalanuvchi: hech narsa sezmas (bir xil URL)

AGAR V2 DA BUG TOPILSA (Sprint ichida):
  V2 to'xtating, V1 davom etadi
  Bug tuzating, V2 yana test
```

---

## 5. DATA MIGRATION (Jadval tuzilmasi o'zgarganda)

```sql
-- Misol: V2 da yangi REQUIRED ustun qo'shiladi
-- Eski ma'lumot uchun backfill kerak:

-- 1. Ustun NULL bilan qo'sh (migration):
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER;

-- 2. Backfill (eski qatorlar uchun):
UPDATE hr_employees
SET razryad_level_id = 1  -- yoki biznes mantiq bo'yicha
WHERE razryad_level_id IS NULL;

-- 3. Constraint qo'sh (backfill dan keyin):
ALTER TABLE hr_employees
  ADD CONSTRAINT fk_employee_razryad
  FOREIGN KEY (razryad_level_id) REFERENCES razryad_levels(id);

-- QOIDA: Migration va backfill ALOHIDA SQL fayl:
-- docs/migration/d6-add-razryad-to-employees.sql
-- docs/migration/d6b-backfill-razryad.sql
-- ⚠️ OWNER TASDIQLASHI KERAK (Q-35)
```

---

## 6. ROLLBACK REJASI (Ko'chirish muvaffaqiyatsiz bo'lsa)

```bash
# Agar V2 production da muammo bo'lsa:

# 1. V1 kodini qayta faollashtirish:
git revert [v2-merge-commit]
# YOKI:
git checkout [v1-tag] -- apps/api/src/modules/[modul]/

# 2. DB rollback (agar migration bo'lsa):
# Har migration uchun "down" migration yozilgan bo'lishi kerak!
psql $DATABASE_URL < docs/migration/d6-down-*.sql

# 3. Restart:
pm2 restart europrint-api

# Rollback vaqti maqsadi: < 5 daqiqa
```

---

## 7. MODUL KO'CHIRISH TARTIBI (Sprint Bog'liqlik)

```
SPRINT 1: auth → org → hr (poydevor)
  auth BIRINCHI (boshqa hammasiga kerak)
  org IKKINCHI (hr uchun kerak)
  hr UCHINCHI (boshqa modul xodimlarga havola)

SPRINT 2: mm (material_cards) → sd (buyurtmalar)
  mm birinchi (SD materialga havola)

SPRINT 3: pp (ishlanma)
  SD buyurtmasi kerak

SPRINT 4: mes (smena)
  PP work_order kerak

SPRINT 5: qc (sifat)
  MES session kerak

SPRINT 6: wms (ombor)
  QC inspection kerak

SPRINT 7: fin (buxgalteriya)
  WMS transaction kerak (GL posting)

SPRINT 8: crm
  SD customers kerak

SPRINT 9: ai, iot, dir
  MES, QC, HR ma'lumot kerak

❌ TAQIQ: tartibsiz ko'chirish
   (wms oldiga mes ko'chirmaslik — FK muammo)
```

---

## 8. KO'CHIRISH TEKSHIRUV CHECKLISTI

Har modul ko'chirilgandan keyin tekshir:

```
□ Domain entity Result<T> qaytaradi
□ Service event emit qiladi (golden thread)
□ Repository real DB (N+1 yo'q)
□ Controller @Roles() bor (har endpoint)
□ Unit test ≥ 80% branch coverage
□ Integration test real DB (factory + cleanup)
□ E2E test: 200 OK + 401 + 403
□ V1 _legacy papkaga ko'chirildi
□ V1 o'chirildi (tsc 0 xato bilan)
□ FE sahifa real API ishlatadi (hardcoded yo'q)
□ Event katalogi yangilandi (EVENT_KATALOGI.md)
□ SPRINT_DOD.md checklisti to'liq
```

---

*EuroPrint ERP · V1→V2 Ko'chirish Qoidalari · Versiya: 2026-06-18*
