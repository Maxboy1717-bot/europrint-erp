# Core Module - Complete Structure

## Overview
This module manages organizational structure including Departments, Positions, and Panels (dashboard widgets configuration). Built with NestJS, CQRS pattern, Drizzle ORM, and DDD principles.

## Directory Structure

```
core/
├── domain/
│   ├── aggregates/
│   │   ├── department.aggregate.ts       # Department aggregate root
│   │   ├── position.aggregate.ts         # Position aggregate root
│   │   └── panel.aggregate.ts            # Panel aggregate with PanelLayout interface
│   └── repositories/
│       └── i-core.repo.ts                # ICoreRepo interface + CORE_REPO symbol
│
├── infrastructure/
│   └── repositories/
│       └── drizzle-core.repo.ts          # DrizzleCoreRepo implementation
│                                          # Defines: departments, positions, userPanels tables
│
├── application/
│   ├── commands/
│   │   ├── create-department.command.ts  # CreateDepartmentCommand + handler
│   │   ├── update-department.command.ts  # UpdateDepartmentCommand + handler
│   │   ├── delete-department.command.ts  # DeleteDepartmentCommand + handler
│   │   ├── create-position.command.ts    # CreatePositionCommand + handler
│   │   ├── update-position.command.ts    # UpdatePositionCommand + handler
│   │   ├── delete-position.command.ts    # DeletePositionCommand + handler
│   │   └── save-panel.command.ts         # SavePanelCommand + handler
│   └── queries/
│       ├── get-departments.query.ts      # GetDepartmentsQuery + handler
│       ├── get-positions.query.ts        # GetPositionsQuery + handler
│       ├── get-org-chart.query.ts        # GetOrgChartQuery + handler (builds tree)
│       └── get-my-panel.query.ts         # GetMyPanelQuery + handler
│
├── presentation/
│   ├── dto/
│   │   └── core.dto.ts                   # Zod schemas for all DTOs
│   ├── departments.controller.ts         # Department endpoints
│   ├── positions.controller.ts           # Position endpoints
│   └── panels.controller.ts              # Panel endpoints
│
└── core.module.ts                        # Module registration
```

## API Endpoints

### Departments
- `GET /core/departments` — List departments (authenticated)
- `GET /core/departments/:id` — Get single department (authenticated)
- `GET /core/departments/org-chart` — Get hierarchical org structure (authenticated)
- `POST /core/departments` — Create (SUPER_ADMIN, HR_MANAGER)
- `PUT /core/departments/:id` — Update (SUPER_ADMIN, HR_MANAGER)
- `DELETE /core/departments/:id` — Delete (SUPER_ADMIN only)

### Positions
- `GET /core/positions` — List positions (authenticated, ?departmentId filter)
- `GET /core/positions/:id` — Get single position (authenticated)
- `POST /core/positions` — Create (SUPER_ADMIN, HR_MANAGER)
- `PUT /core/positions/:id` — Update (SUPER_ADMIN, HR_MANAGER)
- `DELETE /core/positions/:id` — Delete (SUPER_ADMIN only)

### Panels
- `GET /core/panels/my` — Get current user's panel layout (authenticated)
- `POST /core/panels/my` — Save/update current user's panel (authenticated)
- `GET /core/panels/default` — Get system default panel (authenticated)

## Key Features

### Departments
- Hierarchical structure (parent-child relationships)
- Department head assignment
- Active/inactive status
- Unique code validation
- Automatic timestamp management

### Positions
- Salary ranges (minSalary, maxSalary)
- Hierarchy levels (1-10)
- Department association
- Unique code validation
- Salary validation (min <= max)

### Panels
- User-specific dashboard configurations
- Widget layout persistence (x, y, w, h)
- Widget types: chart, table, kpi, calendar, map
- Default panel fallback
- Upsert functionality

### Validation
- Zod schema validation for all DTOs
- Code uniqueness checking
- Salary range validation
- Department existence validation
- Parent department validation
- Uzbek-language error messages

### Data Persistence
- PostgreSQL with Drizzle ORM
- Automatic UUID generation using createId()
- Timezone-aware timestamps
- JSONB storage for panel layouts
- Foreign key relationships

## Command/Query Pattern

All business logic follows CQRS:
- Commands: Create, Update, Delete operations
- Queries: Read operations with optional filtering
- Result<T> pattern: `{ ok: boolean; data?: T; error?: string }`
- No try/catch blocks - error handling via Result type

## Dependencies
- @nestjs/core, @nestjs/common
- @nestjs/cqrs
- @nestjs/jwt (for auth guards)
- drizzle-orm, postgres
- zod (validation)
- @paralleldrive/cuid2 (ID generation)

## Usage Example

```typescript
// Create department
const result = await commandBus.execute(
  new CreateDepartmentCommand({
    name: 'IT Departments',
    code: 'IT',
    description: 'Information Technology Division'
  })
);

// Get org chart
const chart = await queryBus.execute(new GetOrgChartQuery());

// Save user panel
await commandBus.execute(
  new SavePanelCommand(userId, {
    name: 'My Dashboard',
    layout: [{
      widgetId: 'w1',
      widgetType: 'kpi',
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: { metric: 'revenue' }
    }]
  })
);
```

## Error Handling
All error messages are in Uzbek language:
- "Departament topilmadi" - Department not found
- "Bu kod allaqachon ishlatilgan" - Code already taken
- "Noto'g'ri ma'lumotlar" - Invalid data
- "Minimal maoshi maksimaldan katta bo'lishi mumkin emas" - Min salary cannot exceed max

## Notes
- All endpoints require JWT authentication via JwtAuthGuard
- Role-based access control via RolesGuard
- Logger per class for debugging
- Follows DDD (Domain-Driven Design) principles
- No side effects in aggregates
- Repository pattern for data access
