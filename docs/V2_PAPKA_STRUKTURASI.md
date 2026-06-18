# EUROPRINT V2 — PAPKA STRUKTURASI VA LEGACY AJRATISH

> **V1 va V2 kodlari qanday ajratilgan. Qaerda nima yoziladi.**
> Bu qoida V2 build boshlashdan oldin aniq belgilangan bo'lishi shart.
> ⚠️ V2 = ALOHIDA ILOVA EMAS — xuddi shu `apps/api/` ichida, lekin TOZA DDD tuzilma.
> Bog'liq: [PARAZIT_KOD_QOIDALARI.md](PARAZIT_KOD_QOIDALARI.md) · [SPRINT_REJA.md](SPRINT_REJA.md)

---

## 1. QAROR: V2 = Strangler Fig Pattern

```
V2 = Xuddi shu monorepo, xuddi shu DB, xuddi shu NestJS app.
LEKIN: har modul V2 da qayta yoziladi → V1 moduli O'CHIRILADI.
"Strangler Fig" = yangi daraxt eski daraxtni asta o'rab bosadi.
```

**Nima uchun alohida `apps/api-v2/` emas?**
- Bir xil DB, bir xil auth, bir xil Docker — ikkilamaslik
- Bir xil NestJS config va middleware — takrorlanish yo'q
- Gradual migration: frontend bir URL da ishlaydi
- Muslimbek bitta kontekstda ishlaydi — chalg'itmaslik

---

## 2. JORIY PAPKA TUZILMASI (V1 holat)

```
Uzbek-Language-Module/
├── apps/api/src/
│   ├── modules/           ← V1 va qisman V2 (ARALASH — muammo shu yerda)
│   │   ├── hr/            ← V1: qisman ishlaydi
│   │   ├── sd/            ← V1: qisman ishlaydi
│   │   ├── pp/            ← V1: qisman ishlaydi
│   │   ├── mes/           ← V1: stub lardan iborat
│   │   ├── qc/            ← V1: ko'p stub
│   │   ├── wms/           ← V1: ikkita stok muammo
│   │   ├── fin/           ← V1: GL stub
│   │   ├── legacy/        ← V1: eski kod (tozalanmagan)
│   │   └── ...
│   ├── shared/
│   └── common/
├── artifacts/erp-dashboard/src/
│   ├── pages/             ← V1 va V2 aralash (175+ sahifa)
│   └── ...
└── docs/
    └── V2-REBUILD/        ← V2 REJA (kod emas, hujjat)
```

---

## 3. V2 MAQSADLI PAPKA TUZILMASI

```
Uzbek-Language-Module/
├── apps/api/src/
│   ├── modules/                    ← V2 MODUL PAPKASI (toza DDD)
│   │   ├── [modul]/               ← har bir modul
│   │   │   ├── domain/            ← entity, value-object, event, repository interface
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   ├── events/
│   │   │   │   └── repositories/  ← faqat INTERFACE (I prefix)
│   │   │   ├── application/       ← service, use-case, command, query, handler
│   │   │   │   ├── services/
│   │   │   │   └── handlers/
│   │   │   ├── infrastructure/    ← Drizzle repository, external API
│   │   │   │   └── repositories/  ← Drizzle implementatsiya (I prefix impl)
│   │   │   └── presentation/      ← controller, DTO, guard
│   │   │       ├── controllers/
│   │   │       └── dto/
│   │   │
│   │   ├── hr/                    ← V2 (Sprint 1 da to'liq quriladi)
│   │   ├── sd/                    ← V2 (Sprint 2)
│   │   ├── pp/                    ← V2 (Sprint 3)
│   │   ├── mes/                   ← V2 (Sprint 4)
│   │   ├── qc/                    ← V2 (Sprint 5)
│   │   ├── wms/                   ← V2 (Sprint 6)
│   │   ├── fin/                   ← V2 (Sprint 7)
│   │   ├── crm/                   ← V2 (Sprint 8)
│   │   ├── ai-iot/                ← V2 (Sprint 9)
│   │   └── dir/                   ← V2 (Sprint 9)
│   │
│   ├── _legacy/                   ← V1 KOD (O'CHIRILISH KUTMOQDA)
│   │   ├── README.md              ← "Bu papkadagi hamma narsa o'chiriladi"
│   │   └── [eski-modul]/         ← V2 moduli qurilgandan keyin shu yerga
│   │
│   ├── shared/                    ← IKKALA VERSION UCHUN
│   │   ├── db/                    ← Drizzle schema (barcha modul)
│   │   └── events/                ← EventEmitter2 tizimlari
│   │
│   └── common/                    ← IKKALA VERSION UCHUN
│       ├── result/                ← Result<T>, Ok, Err
│       ├── guards/                ← JwtAuthGuard, RolesGuard
│       ├── errors/                ← AppErr, xato kodlari
│       └── filters/               ← GlobalExceptionFilter
│
├── artifacts/erp-dashboard/src/
│   ├── pages/                     ← V2 SAHIFALAR (Sprint bo'yicha qo'shiladi)
│   ├── _legacy-pages/             ← V1 SAHIFALAR (V2 qurilganda o'chiriladi)
│   │   └── README.md              ← "Bu papkadagi sahifalar o'chiriladi"
│   ├── hooks/                     ← V2 React hooks
│   ├── api/                       ← V2 API funksiyalari
│   └── types/                     ← V2 TypeScript tipalari
│
└── docs/
    ├── V2-REBUILD/                ← V2 REJA va HUJJATLAR (kod emas)
    │   ├── Backend_Reja/          ← 18 faz reja
    │   └── ...
    └── migration/                 ← V2 DB migration SQL
        └── seed/                  ← V2 seed SQL
```

---

## 4. MODUL V2 GA O'TKAZISH TARTIBI (Sprint bo'yicha)

```
SPRINT boshlanganda:
1. Eski `modules/[modul]/` ni `_legacy/[modul]/` ga ko'chir
2. `modules/[modul]/` ni DDD tuzilma bilan qayta yoz
3. Test yoz, PASS bo'lsin
4. `_legacy/[modul]/` ni O'CHIR

SPRINT tugaganda:
✅ `modules/[modul]/` = to'liq V2 DDD
❌ `_legacy/[modul]/` = yo'q (o'chirilgan)
```

**Qoida (Q-46 bilan bog'liq):** V2 modul qurilguncha V1 moduli ISHLASHI kerak. Parallel ishlash davri: ikkalasi birga turishi mumkin (eski endpoint + yangi endpoint). V2 tayyor bo'lganda V1 o'chiriladi.

---

## 5. FE SAHIFA V2 GA O'TKAZISH

```
V1 sahifa: artifacts/erp-dashboard/src/pages/[Modul]/[Sahifa].tsx
           → artifacts/erp-dashboard/src/_legacy-pages/[Modul]/[Sahifa].tsx

V2 sahifa: artifacts/erp-dashboard/src/pages/[Modul]/[Sahifa].tsx
           (to'liq qayta yozilgan — useQuery + useMutation + EP komponentlar)
```

---

## 6. QAYERDA NIMA YOZILADI (Qoidalar)

| Narsa | Qayerda | Misol |
|-------|---------|-------|
| Yangi V2 backend modul | `apps/api/src/modules/[modul]/` | hr/domain/entities/ |
| Yangi V2 FE sahifa | `artifacts/erp-dashboard/src/pages/[Modul]/` | pages/hr/ |
| Kanonik Drizzle schema | `apps/api/src/shared/db/schema-*.ts` | schema-core.ts |
| DB migration SQL | `docs/migration/d[N]-*.sql` | d6-qc-params.sql |
| Seed SQL | `docs/migration/seed/seed-*.sql` | seed-01-roles.sql |
| Test factory | `apps/api/src/common/factories/` | employee.factory.ts |
| Domain event tip | `apps/api/src/modules/[modul]/domain/events/` | SalesOrderCreatedEvent |
| V2 reja hujjat | `docs/V2-REBUILD/Backend_Reja/` | 04_Bosqich1_ORG_HR.md |
| ADR | `docs/adr/` | ADR-007-*.md |
| Eskirgan V1 BE | `apps/api/src/_legacy/` | _legacy/old-hr/ |
| Eskirgan V1 FE | `artifacts/erp-dashboard/src/_legacy-pages/` | _legacy-pages/OldHR/ |

---

## 7. IMPORT QOIDALARI

```typescript
// ✅ V2 modul ichida import:
// Domain → boshqa domenga bog'liq EMAS (faqat shared/ orqali)
// Application → domain + shared
// Infrastructure → application + shared/db
// Presentation → application + common/guards

// ✅ Modullar arasi bog'liqlik — faqat event orqali:
// SD → PP: event emit (SalesOrderCreatedEvent) — import emas!
// PP → MES: event emit (WorkOrderCreatedEvent) — import emas!

// ❌ TAQIQ — modul A boshqa modul B ning servisini to'g'ridan import:
import { PpWorkOrderService } from '../pp/application/services/pp-work-order.service';
// ✅ TO'G'RI — event orqali:
this.eventEmitter.emit('work_order.created', new WorkOrderCreatedEvent(...));

// ✅ Shared import (barcha modullar uchun):
import { Result, Ok, Err } from '@common/result';
import { AppErr } from '@common/errors';
import { db } from '@shared/db';
```

---

## 8. `_legacy/` VA `_legacy-pages/` README

Ushbu fayllar yaratiladi:

```markdown
# _legacy/ — V1 Eskirgan Kod

Bu papkadagi barcha fayllar OLINADI.
V2 moduli qurilgandan so'ng bu papkadagi tegishli modul DARHOL o'chiriladi.

O'chirish tartibi (Sprint tugaganda):
1. `rm -rf _legacy/[modul]/`
2. `git add -p` (faqat o'chirilgan fayllar)
3. `git commit -m "chore: remove v1 [modul] (v2 ready)"`

ESLATMA: Bu fayllarni TAHRIR QILMANG.
```

---

*EuroPrint ERP · V2 Papka Strukturasi · Versiya: 2026-06-18*
