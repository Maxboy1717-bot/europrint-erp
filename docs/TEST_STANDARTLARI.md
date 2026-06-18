# EUROPRINT ERP — TEST STANDARTLARI

> **Qanday test yoziladi, nima test qilinadi, nima test qilinmaydi.**
> Backend_Reja/14_Test.md = test nima quriladi (reja). Bu = QANDAY yoziladi (standart).
> Qoida: Real DB, mock emas (repository layer uchun).
> Bog'liq: [LOYIHA_QOIDALARI.md](../LOYIHA_QOIDALARI.md) §9 · [XAVF_REESTRI.md](XAVF_REESTRI.md) R-18

---

## 1. ASOSIY QOIDALAR

### Qoida T-1: Repository layer = real DB (mock emas!)
```
WHY: V1 da mock test → repository PASS, real DB FAIL (migration farq).
     Bu muammo bizni qiynadi. Endi: repository test = real test DB.

MOCK qachon ruxsat etiladi:
✅ External API (Yandex, SMS, Email) → mock
✅ EventEmitter2 → mock (unit test uchun)
✅ Domain logic (service unit test) → repository mock OK
❌ HECH QACHON repository implementatsiya → mock (integration test)
```

### Qoida T-2: Test turi va joylashuvi
```
apps/api/src/modules/[modul]/
  domain/
    __tests__/                     ← unit test (domain logic)
      hr-employee.entity.spec.ts
      salary.value-object.spec.ts
  application/
    __tests__/                     ← unit test (service, mock repo)
      hr-employee.service.spec.ts
  infrastructure/
    __tests__/                     ← integration test (real DB!)
      hr-employee.repository.spec.ts
  presentation/
    __tests__/                     ← e2e test (supertest)
      hr-employee.controller.e2e-spec.ts
```

### Qoida T-3: Test nomi formati
```typescript
describe('HrEmployeeService', () => {
  describe('create', () => {
    it('should create employee and emit HrEmployeeCreatedEvent', async () => {
      // ...
    });

    it('should return Err when org_function_id not found', async () => {
      // ...
    });

    it('should return Err when email already exists', async () => {
      // ...
    });
  });

  describe('findById', () => {
    it('should return Ok with employee data', async () => { ... });
    it('should return Err HR_NOT_FOUND when id does not exist', async () => { ... });
  });
});
```

---

## 2. UNIT TEST — DOMAIN VA APPLICATION

### Domain entity testi:
```typescript
// hr-employee.entity.spec.ts
import { HrEmployee } from '../hr-employee.entity';
import { Ok, Err } from '@common/result';

describe('HrEmployee', () => {
  describe('create', () => {
    it('should create valid employee', () => {
      const result = HrEmployee.create({
        full_name: 'Ali Valiev',
        org_function_id: 1,
        base_salary: 5_000_000,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.full_name).toBe('Ali Valiev');
        expect(result.value.status).toBe('ACTIVE');
      }
    });

    it('should return Err when full_name is empty', () => {
      const result = HrEmployee.create({ full_name: '', org_function_id: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('HR_VALIDATION_ERROR');
      }
    });
  });
});
```

### Application service testi (mock repo):
```typescript
// hr-employee.service.spec.ts
import { HrEmployeeService } from '../hr-employee.service';
import { IHrEmployeeRepository } from '../../domain/repositories/hr-employee.repository.interface';

describe('HrEmployeeService', () => {
  let service: HrEmployeeService;
  let mockRepo: jest.Mocked<IHrEmployeeRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IHrEmployeeRepository>;

    mockEventEmitter = { emit: jest.fn() } as any;
    service = new HrEmployeeService(mockRepo, mockEventEmitter);
  });

  describe('create', () => {
    it('should save employee and emit event', async () => {
      mockRepo.findByEmail.mockResolvedValue(null); // email yo'q
      mockRepo.save.mockResolvedValue({ id: 1, full_name: 'Ali', ...rest });

      const result = await service.create({ full_name: 'Ali', org_function_id: 1 });

      expect(result.ok).toBe(true);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'hr.employee.created',
        expect.objectContaining({ employeeId: 1 })
      );
    });

    it('should return Err when email duplicate', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 99 }); // email bor!

      const result = await service.create({ email: 'ali@test.com', ...rest });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('HR_EMAIL_DUPLICATE');
      expect(mockRepo.save).not.toHaveBeenCalled(); // save chaqirilmasin!
    });
  });
});
```

---

## 3. INTEGRATION TEST — REPOSITORY (Real DB)

```typescript
// hr-employee.repository.spec.ts
import { DrizzleService } from '@common/database/drizzle.service';
import { HrEmployeeRepository } from '../hr-employee.repository';
import { EmployeeFactory } from '@common/factories/employee.factory';
import { db } from '@shared/db'; // test DB (process.env.DATABASE_URL_TEST)

describe('HrEmployeeRepository (integration)', () => {
  let repo: HrEmployeeRepository;
  let factory: EmployeeFactory;

  beforeAll(async () => {
    // Test DB ga ulanish (real PostgreSQL)
    repo = new HrEmployeeRepository(new DrizzleService());
    factory = new EmployeeFactory(new DrizzleService());
  });

  afterEach(async () => {
    // Har test dan keyin tozalash (test izolyatsiyasi)
    await db.delete(hr_employees).where(like(hr_employees.full_name, 'TEST_%'));
  });

  afterAll(async () => {
    // Barcha test tugagach DB ulanishini yopish
    await drizzleService.close();
  });

  it('should save and retrieve employee', async () => {
    const created = await factory.create({ full_name: 'TEST_Ali' });

    const found = await repo.findById(created.id);
    expect(found?.full_name).toBe('TEST_Ali');
  });

  it('should return null for non-existent id', async () => {
    const found = await repo.findById(999999);
    expect(found).toBeNull();
  });

  it('should soft-delete employee', async () => {
    const created = await factory.create({ full_name: 'TEST_Soft' });

    await repo.softDelete(created.id);

    const found = await repo.findById(created.id);
    expect(found).toBeNull(); // soft delete → findById topmasin

    const withDeleted = await repo.findByIdIncludeDeleted(created.id);
    expect(withDeleted?.deleted_at).not.toBeNull();
  });
});
```

---

## 4. E2E TEST — CONTROLLER (Supertest)

```typescript
// hr-employee.controller.e2e-spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { getTestToken } from '@common/test-helpers/auth.helper';

describe('HrEmployeeController (e2e)', () => {
  let app: INestApplication;
  let hrManagerToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Test tokenlar (real JWT, test user)
    hrManagerToken = await getTestToken('hr_manager');
    employeeToken = await getTestToken('employee');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/hr/employees', () => {
    it('should return 200 for hr_manager', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/hr/employees')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
      });
    });

    it('should return 403 for employee role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/hr/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/hr/employees');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/hr/employees', () => {
    it('should create employee with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/hr/employees')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          full_name: 'TEST_E2E_Employee',
          org_function_id: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/hr/employees/${res.body.id}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);
    });

    it('should return 400 with invalid data (whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/hr/employees')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          full_name: 'Test',
          unknownField: 'hacker_payload', // whitelist false qilmasin
        });

      expect(res.status).toBe(400); // forbidNonWhitelisted → 400
    });
  });
});
```

---

## 5. FACTORY PATTERN (Test ma'lumot yaratish)

```typescript
// apps/api/src/common/factories/employee.factory.ts
// Mavjud — Drizzle hr_employees sxema yaratilgandan keyin faollashtiring.

// Factory ishlatish:
const emp = await employeeFactory.create({
  full_name: 'TEST_Ali',
  org_function_id: 1,
});
// → real DB ga INSERT, real id qaytadi
// → afterEach da CLEANUP qiling!

// Ko'p yaratish:
const emps = await employeeFactory.createMany(5, { status: 'ACTIVE' });

// Cleanup:
await employeeFactory.cleanup(emp.id);
```

---

## 6. QAMROV MAQSADLARI (Coverage Targets)

| Layer | Maqsad | Ustuvor |
|-------|--------|---------|
| Domain (entity, value-object) | ≥ 90% | Kritik — biznes mantiq |
| Application (service) | ≥ 80% | Muhim — orkestratsiya |
| Infrastructure (repository) | ≥ 70% | Real DB test |
| Presentation (controller) | ≥ 60% | E2E (happy + auth test) |

```bash
# Coverage tekshirish:
pnpm --filter @europrint/api run test:cov

# CI da minimum qamrov tekshirish (jest.config.ts):
coverageThreshold: {
  global: {
    branches: 60,
    functions: 70,
    lines: 70,
    statements: 70,
  },
},
```

---

## 7. NIMA TEST QILINMAYDI

```
❌ Drizzle ORM ichki mantiq (Drizzle o'zi test qilgan)
❌ NestJS framework DI, module bootstrap
❌ bcrypt/JWT kutubxona ichki mantiq
❌ Third-party API real chaqiruv (mock yoz)
❌ DB migration (idempotent script o'zi tekshiradi)
❌ i18n string tarjima (fayllarni grep bilan)

✅ NIMA TEST QILINADI:
✅ Har Result<T> — ok va err tarmoqlari
✅ Har biznes qoida (razryad hisob, narx formulasi)
✅ Guard roli tekshirish (403/401)
✅ Validation (400 bad request)
✅ Event emit (service emit qildimi?)
✅ Soft delete (topilmay qolishi)
✅ Pagination (meta.total, meta.page)
```

---

## 8. JEST KONFIGURATSIYA

```typescript
// apps/api/jest.config.ts
export default {
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testMatch: [
    '**/__tests__/**/*.spec.ts',       // unit
    '**/__tests__/**/*.e2e-spec.ts',   // e2e
  ],
  // Integration test uchun real DB (DATABASE_URL_TEST):
  setupFilesAfterFramework: ['<rootDir>/src/common/test-helpers/setup.ts'],
};
```

```bash
# Faqat unit testlar (tez):
pnpm test:unit

# Integration (DB kerak):
DATABASE_URL_TEST=postgres://... pnpm test:integration

# E2E (server kerak):
DATABASE_URL_TEST=postgres://... pnpm test:e2e

# Hammasi:
pnpm test
```

---

*EuroPrint ERP · Test Standartlari · Versiya: 2026-06-18*
