# Core Module - Complete Structure

## Overview
This module manages user dashboard **Panels** (widget layout configuration). Built with NestJS, CQRS pattern, Drizzle ORM, and DDD principles.

> Note: Department / Position / Org-chart management was removed from this module
> (the dedicated controllers + their CQRS slice were deleted). Department and
> position data is now served via the `compatibility` module
> (`resources.controller.ts`: `/api/departments`, `/api/positions`,
> `/api/org-departments`). Org structure UI uses `/org-structure/hierarchy`.

## Directory Structure

```
core/
├── domain/
│   ├── aggregates/
│   │   └── panel.aggregate.ts            # Panel aggregate with PanelLayout interface
│   └── repositories/
│       └── i-core.repo.ts                # ICoreRepo interface (panel methods) + CORE_REPO symbol
│
├── infrastructure/
│   └── repositories/
│       └── drizzle-core.repo.ts          # DrizzleCoreRepo implementation (user_panels table)
│
├── application/
│   ├── commands/
│   │   └── save-panel.command.ts         # SavePanelCommand + handler
│   └── queries/
│       └── get-my-panel.query.ts         # GetMyPanelQuery + handler
│
├── presentation/
│   ├── dto/
│   │   └── core.dto.ts                   # Zod schemas for panel DTOs
│   └── panels.controller.ts              # Panel endpoints
│
└── core.module.ts                        # Module registration
```

## API Endpoints

### Panels
- `GET /core/panels/my` — Get current user's panel layout (authenticated)
- `POST /core/panels/my` — Save/update current user's panel (authenticated)
- `GET /core/panels/default` — Get system default panel (authenticated)

## Key Features

### Panels
- User-specific dashboard configurations
- Widget layout persistence (x, y, w, h)
- Widget types: chart, table, kpi, calendar, map
- Default panel fallback
- Upsert functionality

### Validation
- Zod schema validation for all DTOs
- Uzbek-language error messages

### Data Persistence
- PostgreSQL with Drizzle ORM
- Automatic UUID generation using createId()
- Timezone-aware timestamps
- JSONB storage for panel layouts

## Command/Query Pattern

All business logic follows CQRS:
- Commands: write operations (save panel)
- Queries: read operations (get panel)
- Result<T> pattern: `{ ok: boolean; data?: T; error?: string }`

## Dependencies
- @nestjs/core, @nestjs/common
- @nestjs/cqrs
- drizzle-orm, postgres
- zod (validation)
- @paralleldrive/cuid2 (ID generation)

## Usage Example

```typescript
// Get my panel
const panel = await queryBus.execute(new GetMyPanelQuery(userId));

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

## Notes
- All endpoints require JWT authentication
- Role-based access control via RolesGuard
- Logger per class for debugging
- Follows DDD (Domain-Driven Design) principles
- Repository pattern for data access
