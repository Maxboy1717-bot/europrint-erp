# Core Module - NestJS Organizational Structure Management

A production-ready NestJS module for managing organizational structure with Departments, Positions, and Dashboard Panels. Built with CQRS, Domain-Driven Design, Drizzle ORM, and comprehensive validation.

## Quick Overview

This module provides:
- **Departments**: Hierarchical organizational structure with department heads
- **Positions**: Job positions with salary ranges and hierarchy levels
- **Dashboard Panels**: User-specific widget configurations for dashboard customization

## File Structure

```
core/
├── domain/                              # Domain Layer (Business Logic)
│   ├── aggregates/
│   │   ├── department.aggregate.ts     # Department entity
│   │   ├── position.aggregate.ts       # Position entity
│   │   └── panel.aggregate.ts          # Panel entity + PanelLayout interface
│   └── repositories/
│       └── i-core.repo.ts              # Repository interface
│
├── infrastructure/                      # Infrastructure Layer (Data Access)
│   └── repositories/
│       └── drizzle-core.repo.ts        # Drizzle ORM implementation
│
├── application/                         # Application Layer (Use Cases)
│   ├── commands/                        # Write operations
│   │   ├── create-department.command.ts
│   │   ├── update-department.command.ts
│   │   ├── delete-department.command.ts
│   │   ├── create-position.command.ts
│   │   ├── update-position.command.ts
│   │   ├── delete-position.command.ts
│   │   └── save-panel.command.ts
│   └── queries/                         # Read operations
│       ├── get-departments.query.ts
│       ├── get-positions.query.ts
│       ├── get-org-chart.query.ts
│       └── get-my-panel.query.ts
│
├── presentation/                        # Presentation Layer (API)
│   ├── dto/
│   │   └── core.dto.ts                 # Zod validation schemas
│   ├── departments.controller.ts       # Department endpoints
│   ├── positions.controller.ts         # Position endpoints
│   └── panels.controller.ts            # Panel endpoints
│
├── core.module.ts                       # Module registration
├── INDEX.md                             # Architecture documentation
├── INTEGRATION.md                       # Integration guide
└── README.md                            # This file
```

## Features

### Department Management
- Create, read, update, delete departments
- Hierarchical structure (parent-child relationships)
- Department head assignment
- Active/inactive status
- Automatic timestamp tracking
- Code uniqueness validation

### Position Management
- Create, read, update, delete positions
- Salary range configuration (min/max with validation)
- Hierarchy levels (1-10)
- Department association
- Active/inactive status
- Code uniqueness validation

### Dashboard Panels
- User-specific dashboard configurations
- Widget layout persistence with positioning (x, y, w, h)
- Multiple widget types: chart, table, kpi, calendar, map
- Custom widget configuration via JSONB
- Default panel fallback
- Automatic upsert (create or update)

### Security
- JWT authentication required on all endpoints
- Role-based access control (SUPER_ADMIN, HR_MANAGER)
- Proper authorization checks per endpoint
- User context injection

### Data Validation
- Zod schema validation for all requests
- Business rule validation in command handlers
- Code uniqueness checking
- Salary range validation (minSalary <= maxSalary)
- Entity existence validation
- Uzbek-language error messages

## API Reference

### Department Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/core/departments` | JWT | All | List all departments |
| GET | `/core/departments/:id` | JWT | All | Get single department |
| GET | `/core/departments/org-chart` | JWT | All | Get hierarchical org structure |
| POST | `/core/departments` | JWT | SUPER_ADMIN, HR_MANAGER | Create department |
| PUT | `/core/departments/:id` | JWT | SUPER_ADMIN, HR_MANAGER | Update department |
| DELETE | `/core/departments/:id` | JWT | SUPER_ADMIN | Delete department |

### Position Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/core/positions` | JWT | All | List all positions |
| GET | `/core/positions/:id` | JWT | All | Get single position |
| POST | `/core/positions` | JWT | SUPER_ADMIN, HR_MANAGER | Create position |
| PUT | `/core/positions/:id` | JWT | SUPER_ADMIN, HR_MANAGER | Update position |
| DELETE | `/core/positions/:id` | JWT | SUPER_ADMIN | Delete position |

### Panel Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/core/panels/my` | JWT | All | Get current user's panel |
| POST | `/core/panels/my` | JWT | All | Save/update current user's panel |
| GET | `/core/panels/default` | JWT | All | Get system default panel |

## Request/Response Examples

### Create Department

**Request:**
```json
POST /core/departments
{
  "name": "Engineering",
  "code": "ENG",
  "description": "Engineering Department",
  "headId": "user-123"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clv1234abcd...",
    "name": "Engineering",
    "code": "ENG",
    "headId": "user-123",
    "parentId": null,
    "description": "Engineering Department",
    "isActive": true,
    "createdAt": "2026-04-10T12:00:00Z",
    "updatedAt": "2026-04-10T12:00:00Z"
  }
}
```

### Create Position

**Request:**
```json
POST /core/positions
{
  "title": "Senior Software Engineer",
  "code": "SSENGINEER",
  "departmentId": "clv1234abcd...",
  "level": 8,
  "minSalary": 6000000,
  "maxSalary": 9000000
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clv5678efgh...",
    "title": "Senior Software Engineer",
    "code": "SSENGINEER",
    "departmentId": "clv1234abcd...",
    "level": 8,
    "minSalary": 6000000,
    "maxSalary": 9000000,
    "isActive": true,
    "createdAt": "2026-04-10T12:00:00Z",
    "updatedAt": "2026-04-10T12:00:00Z"
  }
}
```

### Save Panel Layout

**Request:**
```json
POST /core/panels/my
{
  "name": "Revenue Dashboard",
  "layout": [
    {
      "widgetId": "kpi-revenue",
      "widgetType": "kpi",
      "position": { "x": 0, "y": 0, "w": 4, "h": 3 },
      "config": { "metric": "total_revenue", "currency": "UZS" }
    },
    {
      "widgetId": "chart-sales",
      "widgetType": "chart",
      "position": { "x": 4, "y": 0, "w": 8, "h": 4 },
      "config": { "type": "line", "dataSource": "sales_api" }
    }
  ]
}
```

### Get Org Chart

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "department": {
        "id": "clv1234...",
        "name": "Engineering",
        "code": "ENG",
        ...
      },
      "positions": [
        {
          "id": "clv5678...",
          "title": "Senior Engineer",
          ...
        }
      ],
      "children": [
        {
          "department": {
            "id": "clv9999...",
            "name": "Backend Team",
            "parentId": "clv1234...",
            ...
          },
          "positions": [...],
          "children": []
        }
      ]
    }
  ]
}
```

## Error Handling

All endpoints return consistent Result<T> format:

```typescript
// Success
{ ok: true, data: T }

// Failure
{ ok: false, error: "Error message in Uzbek" }
```

Common errors:
- `Departament topilmadi` - Department not found
- `Lavoza topilmadi` - Position not found
- `Bu kod allaqachon ishlatilgan` - Code already taken
- `Minimal maoshi maksimaldan katta bo'lishi mumkin emas` - Min salary > max
- `Noto'g'ri ma'lumotlar` - Invalid input data

## Data Validation Rules

### Department
- `name`: 2-255 characters (required)
- `code`: 2-10 uppercase letters (required, unique)
- `headId`: valid UUID (optional)
- `parentId`: valid UUID referencing existing department (optional)
- `description`: max 1000 characters (optional)

### Position
- `title`: 2-255 characters (required)
- `code`: 2-10 uppercase letters (required, unique)
- `departmentId`: valid UUID referencing existing department (required)
- `level`: 1-10 integer (required)
- `minSalary`: non-negative decimal (required)
- `maxSalary`: non-negative decimal (required, >= minSalary)

### Panel Layout
- `name`: max 255 characters (optional)
- `layout`: array of PanelLayout (required)
  - `widgetId`: string (required)
  - `widgetType`: 'chart' | 'table' | 'kpi' | 'calendar' | 'map' (required)
  - `position`: { x: number, y: number, w: number, h: number } (required)
  - `config`: arbitrary object (required)

## Database Schema

### departments table
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

### positions table
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

### user_panels table
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

## Installation

1. Copy module to your project structure
2. Install dependencies:
   ```bash
   npm install drizzle-orm postgres zod @nestjs/cqrs @paralleldrive/cuid2
   ```

3. Import in your app module:
   ```typescript
   import { CoreModule } from '@modules/core/core.module';
   
   @Module({
     imports: [CoreModule],
   })
   export class AppModule {}
   ```

4. Ensure auth infrastructure is configured (JwtAuthGuard, RolesGuard, etc.)

5. Create database tables using Drizzle migrations

## Architecture

### Design Patterns
- **Domain-Driven Design (DDD)**: Aggregate roots, value objects, repositories
- **CQRS (Command Query Responsibility Segregation)**: Separation of commands and queries
- **Repository Pattern**: Abstraction for data access
- **Dependency Injection**: NestJS DI for loose coupling

### Error Handling
- **Result<T> Pattern**: Type-safe error handling without try/catch
- **Validation**: Zod schemas + custom business logic validation
- **Logging**: Logger per class for debugging

### Testing Ready
- Dependency injection for easy mocking
- Command/Query pattern simplifies unit testing
- DTOs with validation for integration testing

## Performance Tips

1. **Add database indexes** on frequently queried columns:
   ```sql
   CREATE INDEX idx_departments_code ON departments(code);
   CREATE INDEX idx_departments_parent_id ON departments(parent_id);
   CREATE INDEX idx_positions_department_id ON positions(department_id);
   CREATE INDEX idx_user_panels_user_id ON user_panels(user_id);
   ```

2. **Cache org chart** for large organizational structures

3. **Paginate** department and position lists if data grows large

4. **Monitor** database query performance with slow query logs

## Future Enhancements

- Department logo/image support
- Position templates for quick creation
- Bulk operations (CSV import)
- Org chart visualization
- Department performance metrics
- Panel version history
- Real-time collaboration features

## Support

For issues or questions:
1. Check INTEGRATION.md for usage examples
2. Review INDEX.md for detailed structure
3. Check error messages for validation issues
4. Enable logging for debugging

## License

This module is part of the Uzbek Language Platform application.

## Documentation Files

- **INDEX.md** - Complete module architecture and structure
- **INTEGRATION.md** - Integration guide with examples
- **README.md** - This file (overview)
