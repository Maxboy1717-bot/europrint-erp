# ADR-005: `Result<T>` pattern — xato boshqaruvi

**Sana:** 2026-05-14
**Holat:** ✅ QABUL QILINGAN

---

## Muammo

Exception-based xato boshqaruvi:
- `try/catch` har joyda
- Business error va infrastructure error farqlanmaydi
- Controller va service orasida xato tiplari aniq emas

## Qaror

**`Result<T>` pattern — barcha service va repository qaytadi.**

```ts
// Result tiplari:
type Result<T> = Ok<T> | Err;
const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });
const Err = (message: string, code?: string): Err => ({ ok: false, error: { message, code } });

// Service:
async findById(id: number): Promise<Result<Employee>> {
  const emp = await this.db.select().from(hrEmployees).where(eq(hrEmployees.id, id)).limit(1);
  if (!emp[0]) return Err(`Employee ${id} topilmadi`, 'NOT_FOUND');
  return Ok(emp[0]);
}

// Controller:
const result = await this.service.findById(id);
if (!result.ok) throw new NotFoundException(result.error.message);
return result.value;
```

## `throw` qachon ruxsat:

1. **DB transaction rollback:** `throw new Error()` → Drizzle tx catch → rollback
2. **Queue retry:** NestJS queue job → throw → avtomatik retry
3. **HTTP exception filter:** Controller da `throw new NotFoundException()`

## Oqibat

- `as unknown as T` production kodda = TAQIQ
- `throw` = faqat yuqoridagi 3 holat
- Service return type = `Promise<Result<T>>` (hech qachon `Promise<T | null>`)
