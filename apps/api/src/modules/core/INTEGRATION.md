# Core Module Integration Guide

## Quick Start

### 1. Import CoreModule in your main app module:

```typescript
import { CoreModule } from '@modules/core/core.module';

@Module({
  imports: [
    // ... other modules
    CoreModule,
  ],
})
export class AppModule {}
```

### 2. Ensure dependencies are installed:

```bash
npm install drizzle-orm postgres zod @nestjs/cqrs @paralleldrive/cuid2
```

### 3. Database Setup

The module uses Drizzle ORM with PostgreSQL. Three tables are created:

#### departments table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  head_id TEXT,
  parent_id UUID REFERENCES departments(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### positions table
```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  level INTEGER DEFAULT 1,
  min_salary DECIMAL(18, 2) DEFAULT 0,
  max_salary DECIMAL(18, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_panels table
```sql
CREATE TABLE user_panels (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'My Dashboard',
  layout JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Authentication Setup

The module requires these auth decorators and guards to be available:

```typescript
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';
import { Roles } from '@auth/decorators/roles.decorator';
```

Make sure your JWT strategy provides a user object with at least an `id` field.

### 5. Common Types

```typescript
// Ensure this type exists
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

## API Usage Examples

### Create a Department

```bash
POST /core/departments
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "IT Department",
  "code": "IT",
  "description": "Information Technology",
  "headId": "user-123"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "id": "clv1234...",
    "name": "IT Department",
    "code": "IT",
    "headId": "user-123",
    "parentId": null,
    "description": "Information Technology",
    "isActive": true,
    "createdAt": "2026-04-10T12:00:00Z",
    "updatedAt": "2026-04-10T12:00:00Z"
  }
}
```

### Create a Sub-Department

```bash
POST /core/departments
{
  "name": "IT Development",
  "code": "ITDEV",
  "parentId": "clv1234...",
  "headId": "user-456"
}
```

### Create a Position

```bash
POST /core/positions
{
  "title": "Senior Developer",
  "code": "SENDEV",
  "departmentId": "clv1234...",
  "level": 7,
  "minSalary": 5000000,
  "maxSalary": 7000000
}
```

### Get Org Chart

```bash
GET /core/departments/org-chart
Authorization: Bearer <token>
```

Response:
```json
{
  "ok": true,
  "data": [
    {
      "department": { /* Department object */ },
      "positions": [ /* Position array */ ],
      "children": [ /* Sub-departments */ ]
    }
  ]
}
```

### Save User Dashboard Panel

```bash
POST /core/panels/my
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Analytics Dashboard",
  "layout": [
    {
      "widgetId": "revenue-kpi",
      "widgetType": "kpi",
      "position": { "x": 0, "y": 0, "w": 4, "h": 3 },
      "config": { "metric": "total_revenue", "currency": "UZS" }
    },
    {
      "widgetId": "sales-chart",
      "widgetType": "chart",
      "position": { "x": 4, "y": 0, "w": 8, "h": 4 },
      "config": { "type": "line", "period": "monthly" }
    }
  ]
}
```

### Get My Panel

```bash
GET /core/panels/my
Authorization: Bearer <token>
```

### List Departments with Filter

```bash
GET /core/departments?isActive=true&parentId=null
GET /core/departments?isActive=true
```

### List Positions with Filter

```bash
GET /core/positions?departmentId=clv1234...&isActive=true
GET /core/positions?departmentId=clv1234...
```

## Role-Based Access

### SUPER_ADMIN - Full Access
- Create, update, delete departments
- Create, update, delete positions
- Manage all dashboard panels

### HR_MANAGER - Limited Admin
- Create, update departments (cannot delete)
- Create, update positions (cannot delete)
- Manage own dashboard

### Authenticated Users
- View departments and org chart
- View positions
- Manage own dashboard panel

## Error Handling

All endpoints return consistent Result<T> format:

```typescript
// Success
{ ok: true, data: { /* entity */ } }

// Failure
{ ok: false, error: "Descriptive error message in Uzbek" }
```

Common errors:
- "Departament topilmadi" - Department not found
- "Lavoza topilmadi" - Position not found
- "Bu kod allaqachon ishlatilgan" - Code already in use
- "Minimal maoshi maksimaldan katta bo'lishi mumkin emas" - Invalid salary range
- "Noto'g'ri ma'lumotlar" - Invalid input data

## Validation Rules

### Department
- name: 2-255 characters required
- code: 2-10 characters, uppercase letters only, must be unique
- headId: optional, valid UUID if provided
- parentId: optional, valid UUID if provided
- parentId must reference an existing department
- description: optional, max 1000 characters

### Position
- title: 2-255 characters required
- code: 2-10 characters, uppercase letters only, must be unique
- departmentId: valid UUID required, must reference existing department
- level: 1-10 integer required
- minSalary: non-negative decimal required
- maxSalary: non-negative decimal required
- minSalary must be <= maxSalary

### Panel
- name: optional, max 255 characters
- layout: array of PanelLayout objects required
  - widgetId: string required
  - widgetType: one of ['chart', 'table', 'kpi', 'calendar', 'map']
  - position: object with x, y, w, h (all numbers)
  - config: object with arbitrary properties

## Database Migrations

If using Drizzle migrations, the tables are defined in:
```
infrastructure/repositories/drizzle-core.repo.ts
```

Generate migrations:
```bash
npx drizzle-kit generate:pg --schema=src/modules/core/infrastructure/repositories/drizzle-core.repo.ts
```

## Testing

Example test structure:

```typescript
describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(DepartmentsController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  it('should create a department', async () => {
    const dto: CreateDepartmentDto = {
      name: 'Test',
      code: 'TST',
    };

    const result = { ok: true, data: { /* ... */ } };
    jest.spyOn(commandBus, 'execute').mockResolvedValue(result);

    expect(await controller.create(dto, { id: 'user-1' })).toEqual(result);
  });
});
```

## Troubleshooting

### Module not found
- Ensure `CoreModule` is imported in your app module
- Check file paths are correct relative to your src directory

### Database connection errors
- Verify PostgreSQL is running
- Check connection string in @shared/db
- Ensure tables are created or run migrations

### Auth errors
- Verify JWT tokens are valid
- Check user roles are set correctly
- Ensure JwtAuthGuard and RolesGuard are properly configured

### Validation errors
- Check DTO values against schema definitions
- Verify code values are uppercase letters only
- Ensure all required fields are provided

## Performance Considerations

- Panel layouts stored as JSONB for flexible queries
- Department parentId allows efficient hierarchical queries
- Consider adding indexes on frequently queried fields:
  ```sql
  CREATE INDEX idx_departments_code ON departments(code);
  CREATE INDEX idx_departments_parent_id ON departments(parent_id);
  CREATE INDEX idx_positions_department_id ON positions(department_id);
  CREATE INDEX idx_user_panels_user_id ON user_panels(user_id);
  ```

## Future Enhancements

- Add department logo/icon support
- Position templates for quick creation
- Department performance metrics dashboard
- Bulk position creation from CSV
- Org chart visualization with drag-drop
- Panel sharing between users
- Panel version history
