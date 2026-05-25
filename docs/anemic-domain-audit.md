# Anemic Domain Audit — Sprint 2 Task A.18

**Sana:** 2026-05-16
**Skript:** `scripts/audit-anemic-domain.mjs`
**Manba ma'lumot:** `docs/anemic-domain-audit.txt` (xom skript chiqishi)

---

## Yakuniy hisob

| Metrika | Soni |
|---|---:|
| Skanlangan aggregate fayllar | **40** |
| Kamida bitta anemic-domain belgisi bor | **39 / 40 (97.5%)** |
| `public` mutable field bilan | **26** |
| `constructor(public …)` bilan (faqat mutable, `readonly` chiqarib tashlangan) | **18** |
| Mutlaqo anemic (metod ham, getter ham yo'q) | **5** |

> Bu Sprint 2 task A.18 ning **audit qismi**. Refactor (A.19) alohida ish.

---

## Eng yomon misollar (real biznes logic vs. public state)

| Aggregate | Metodlar | Public mutable fields | Notiqo |
|---|---:|---:|---|
| `sd/sales-order.aggregate.ts` | 21 | 10 (orderNumber, status, totalAmount, …) | Eng "boy" aggregate, lekin state hali ham public — har metod field'larni to'g'ridan-to'g'ri yangilab yuboradi |
| `crm/lead.aggregate.ts` | 16 | 14 (firstName, status, aiScore, …) | Sprint 2 A.4/A.5 ning markaziy maqsadi (Lead.qualify, Lead.convertToDeal) |
| `crm/deal.aggregate.ts` | 10 | 13 (status, totalAmount, …) | Sprint 2 A.6/A.7 (Deal.markAsWon, Deal.markAsLost) |
| `security/security-incident.aggregate.ts` | 4 | 15 (status, severity, assignedTo, …) | Domain logic yo'q, DTO ko'rinishida |
| `qc/inspection.aggregate.ts` | 5 | 10 | Test natijasini yangilaydi, lekin state public |
| `admin/user.aggregate.ts` | 14 | 1 (username) | Yaxshi metoddorlar, faqat 1 ta field public |
| `auth/auth-user.aggregate.ts` | 16 | 0 ta mutable | **Eng yaxshi** — `constructor(public readonly …)` pattern, 16 metod |

---

## To'liq anemic (deyarli DTO)

Bu 5 ta fayl aggregate emas, balki immutable record:

- `core/domain/aggregates/department.aggregate.ts` [`Department`]
- `core/domain/aggregates/panel.aggregate.ts` [`Panel`]
- `core/domain/aggregates/position.aggregate.ts` [`Position`]
- `notifications/domain/aggregates/notification.aggregate.ts`
- `pp/domain/aggregates/work-center.aggregate.ts` [`WorkCenter`]

Bularning ikkita yo'li:
1. Ular haqiqatan ham DTO/record — `.aggregate.ts` qo'shimchasini olib tashlang va `value-objects/` yoki `entities/` ga ko'chiring.
2. Yo aslida biznes logic kerak — sprint plan'iga A.18b-A.18f vazifalarini qo'shing.

---

## Yaxshi misol — qanday bo'lishi kerak

`auth/auth-user.aggregate.ts` 0 ta public mutable field, 16 ta metod bilan. Pattern:

```typescript
export class AuthUserAggregate {
  constructor(
    public readonly id: string,
    public readonly username: string,
    private _hashedPassword: HashedPassword,    // private + setter via method only
    private _isLocked: boolean,
    private _lastLoginAt: Date | null,
  ) {}

  get isLocked(): boolean { return this._isLocked; }
  get lastLoginAt(): Date | null { return this._lastLoginAt; }

  authenticate(password: string): Result<void> {
    if (this._isLocked) return Err(AppErr('LOCKED', '...'));
    // verify ... mutate state via method, not direct assignment
    this._lastLoginAt = new Date();
    return Ok();
  }

  lockOut(reason: string): void {
    this._isLocked = true;
    this._lockReason = reason;
    this.publishEvent(new UserLockedEvent(this.id, reason));
  }
}
```

State **faqat metod orqali** o'zgaradi. Bu DDD'ning markaziy invariantining ta'minlanishi.

---

## Sprint 2 A.18 — yakun

Bu task **audit qismi** tugadi. Topilmalar:

- **39 / 40 aggregate** kamida bitta anemic belgi bilan. Bu Sprint 2 ning markaziy muammosi (A.4-A.7, A.12, A.18-A.19).
- 1 ta toza aggregate: `auth/auth-user.aggregate.ts` — namuna sifatida ishlatilsin.
- 5 ta haqiqatan DTO — `.aggregate.ts` suffix noto'g'ri qo'yilgan.
- 31 ta haqiqiy aggregate refactoring kerak (publuc state → private + getter + method-only mutation).

Keyingi qadam: Sprint 2 A.19 — `scripts/audit-anemic-domain-fix.mjs` kodemod yozish, yoki har aggregate'ni qo'lda refactor qilish (har biri ~30 daqiqa = ~15 soat = 2 ish kuni faqat refactor).

Boshlash uchun ustuvor 3 ta:
1. **`crm/lead.aggregate.ts`** — A.4 + A.5 (qualify, convertToDeal) — chunki bu DDD'ning birinchi ta'sir qilgan joyi (kotirovkalar 16 metod + 14 public field)
2. **`crm/deal.aggregate.ts`** — A.6 + A.7 (markAsWon, markAsLost)
3. **`hr/leave-request.aggregate.ts`** — A.12 (HR business rule layer)

---

## Yangilash takrori

```bash
node scripts/audit-anemic-domain.mjs > docs/anemic-domain-audit.txt
# 30 soniyada chiqadi
```

Refactor o'sib borgani sari "Aggregates with at least one issue" raqami pasayadi. Maqsad: **0 / 40**.
