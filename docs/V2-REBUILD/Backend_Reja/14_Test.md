# 14 — TEST STRATEGIYASI

> Test piramidasi · Jest konfiguratsiya · domain test · repo test · e2e · coverage talablari.
> Maqsad: har yangi funksiya = kamida 1 real test (mock emas, round-trip).

---

## 14.1 Test piramidasi

```
           [e2e]           ← 5% (kritik yo'llar: login, order create)
          [integration]    ← 25% (repository — real DB, real SQL)
         [unit]            ← 70% (domain aggregate + service logic)
```

- **Unit**: domain ob'ektlar, Result<T> pattern, biznes qoidalar. Mock DB RUXSAT.
- **Integration (repository)**: real PostgreSQL (test DB yoki testcontainer). Mock TAQIQ.
- **e2e**: real HTTP so'rov → real DB. Faqat kritik yo'llar.

---

## 14.2 Jest konfiguratsiya

```json
// jest.config.js (root):
{
  "projects": [
    {
      "displayName": "unit",
      "testMatch": ["**/*.spec.ts"],
      "testPathIgnorePatterns": [".*integration.*", ".*e2e.*"]
    },
    {
      "displayName": "integration",
      "testMatch": ["**/*.integration.spec.ts"],
      "globalSetup": "<rootDir>/test/setup-db.ts",
      "globalTeardown": "<rootDir>/test/teardown-db.ts"
    }
  ],
  "coverageThreshold": {
    "global": { "statements": 70, "branches": 60, "functions": 70 }
  }
}
```

---

## 14.3 Domain (Unit) Test namunasi

```ts
// hr-employee.domain.spec.ts
describe('HrEmployee domain', () => {
  it('should calculate razryad salary with coefficient', () => {
    const emp = HrEmployee.create({
      baseSalary: 3_000_000,
      razryadId: 3,
    });
    const razryad = { coefficient: 1.35 }; // razryad_levels dan
    const result = emp.calculateGrossSalary(razryad);

    expect(result.ok).toBe(true);
    expect(result.value.gross).toBe(4_050_000); // 3_000_000 * 1.35
  });

  it('should return Err if base salary is 0', () => {
    const emp = HrEmployee.create({ baseSalary: 0, razryadId: 1 });
    const result = emp.calculateGrossSalary({ coefficient: 1.0 });
    expect(result.ok).toBe(false);
  });
});
```

---

## 14.4 Repository (Integration) Test namunasi

```ts
// sales-order.repository.integration.spec.ts
// ⚠️ REAL DB — mock ishlatilmaydi
describe('SalesOrderRepository (integration)', () => {
  let db: DatabaseConnection;
  let repo: DrizzleSalesOrderRepository;

  beforeAll(async () => {
    db = await createTestDb(); // test DB yoki testcontainer
    repo = new DrizzleSalesOrderRepository(db);
  });

  afterAll(async () => { await db.destroy(); });
  afterEach(async () => { await db.execute(sql`TRUNCATE sales_orders CASCADE`); });

  it('should create and find order', async () => {
    const created = await repo.create({
      customer_id: 1, total: 1_000_000, status: 'DRAFT'
    });
    expect(created.ok).toBe(true);

    const found = await repo.findById(created.value.id);
    expect(found.ok).toBe(true);
    expect(found.value.total).toBe(1_000_000);
  });

  it('should return Err for non-existent id', async () => {
    const found = await repo.findById(99999);
    expect(found.ok).toBe(false);
  });
});
```

---

## 14.5 Service Test namunasi

```ts
// sd-order.service.spec.ts (unit — mock repo)
describe('SalesOrderService', () => {
  let service: SalesOrderService;
  let mockRepo: jest.Mocked<ISalesOrderRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
    } as any;
    service = new SalesOrderService(mockRepo, /* ... */);
  });

  it('should confirm order and emit event', async () => {
    mockRepo.findById.mockResolvedValue(Ok({ id: 1, status: 'DRAFT', customerId: 5 }));
    mockRepo.update = jest.fn().mockResolvedValue(Ok({ id: 1, status: 'CONFIRMED' }));

    const result = await service.confirmOrder(1, userId);

    expect(result.ok).toBe(true);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { status: 'CONFIRMED' });
    // Event emit tekshiruvi (eventBus mock):
  });
});
```

---

## 14.6 Test ma'lumotlar fabrikasi

```ts
// test/factories/sales-order.factory.ts
export const salesOrderFactory = {
  build: (overrides: Partial<CreateSalesOrderDto> = {}): CreateSalesOrderDto => ({
    customer_id: 1,
    total: 1_000_000,
    currency: 'UZS',
    status: 'DRAFT',
    notes: 'Test order',
    ...overrides,
  }),
};

// Foydalanish:
const dto = salesOrderFactory.build({ total: 5_000_000 });
```

---

## 14.7 Muhim qoidalar

1. **Mock DB faqat unit testda.** Integration test = real DB.
2. **`as unknown as T` test mock da ham taqiq.** Factory pattern ishlatilsin.
3. **Har test izolyatsiya:** `TRUNCATE ... CASCADE` yoki `ROLLBACK` har test dan keyin.
4. **Test nom konventsiyasi:** `it('should [action] when [condition]')`.
5. **Stub endpoint → test yozma.** Faqat real endpoint uchun test.
6. **UUID v5+ bo'lmasa ESM import xatosi.** `jest.config.js` da `transformIgnorePatterns` tekshir.
7. **Coverage 70%** — maqsad, lekin bitta muhim yo'l = 100 stub dan yaxshi.

---

## 14.8 Coverage tekshirish

```bash
# Unit + integration:
pnpm test --coverage --testPathPattern="(spec|integration.spec)"

# Faqat unit:
pnpm test:unit --coverage

# Bitta modul:
pnpm test --testPathPattern="apps/api/src/modules/sd"

# CI tekshiruv (0 fail kerak):
pnpm test:ci
```

---

## 14.9 Acceptance kriterlari

```
☐ Har yangi domain aggregate: kamida 2 unit test (happy path + error case)
☐ Har yangi repository: kamida 2 integration test (create + findById)
☐ Har yangi service: kamida 1 unit test (mock repo bilan)
☐ E2e: login, order create, GL posting — 3 kritik yo'l
☐ Coverage: statements ≥ 70% globally
☐ 0 failing test ci/cd da
☐ UUID ESM import xatosi yo'q
```
