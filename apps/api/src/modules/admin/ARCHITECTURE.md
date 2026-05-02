# ADMIN Module - DDD Architecture

## Tarqibiy tuzilma (Structure)

```
admin/
├── domain/                                      # Domain Layer
│   ├── aggregates/
│   │   └── user.aggregate.ts                    # User aggregate root
│   ├── entities/
│   │   └── system-settings.entity.ts            # System settings entity
│   └── repositories/
│       ├── i-user.repo.ts                       # User repository interface
│       └── i-settings.repo.ts                   # Settings repository interface
├── application/                                 # Application Layer
│   ├── commands/
│   │   ├── create-user.handler.ts              # Create user command
│   │   ├── update-user-role.handler.ts         # Update role command
│   │   └── update-settings.handler.ts          # Update settings command
│   └── queries/
│       └── list-users.handler.ts               # List users query
├── infrastructure/                              # Infrastructure Layer
│   ├── repositories/
│   │   ├── drizzle-user.repo.ts                # Drizzle user implementation
│   │   └── drizzle-settings.repo.ts            # Drizzle settings implementation
│   ├── guards/
│   │   └── roles.guard.ts                       # Role-based access control
│   ├── decorators/
│   │   └── roles.decorator.ts                   # @Roles() decorator
│   └── interceptors/
│       └── audit.interceptor.ts                 # Audit logging interceptor
├── presentation/                                # Presentation Layer
│   ├── controllers/
│   │   ├── admin-users.controller.ts           # Users management endpoints
│   │   └── admin-settings.controller.ts        # Settings endpoints
│   └── dto/
│       ├── create-user.dto.ts                  # Create user DTO
│       └── update-settings.dto.ts              # Update settings DTO
└── admin.module.ts                              # Module definition

```

## Domain Layer

### UserAggregate
**Javobgarlik**: Tizim foydalanuvchilarini boshqarish

**Rollar**:
- `SUPER_ADMIN` - Tizimni to'liq boshqarish
- `DIRECTOR` - Tadbir boshqarish
- `DEPARTMENT_HEAD` - Bo'lim boshqarish
- `ACCOUNTANT` - Moliya operatsiyalari
- `EMPLOYEE` - Oddiy foydalanuvchi

**Metodlar**:
- `activate()` / `deactivate()` - Akkauntni faollashtirish/o'chirish
- `changeRole()` - Rolni o'zgartirish (SoD tekshiruvi bilan)
- `assignDepartment()` / `assignPosition()` - Bo'lim va lavozimni tayinlash
- `resetPassword()` - Parol reset

### SystemSettings Entity
**Javobgarlik**: Tizim global sozlamalarini boshqarish

**Maydonlar**:
- `advancePercent` (0-100) - §8.1: Oldindan to'lash foizи
- `freeStorageDays` - §8.4: Bepul saqlash kunlari
- `storageDailyRate` - §8.4: Kunlik saqlash narxi
- `maxUsers` - §8.6: Maksimal foydalanuvchilar soni
- `maintenanceMode` - Texnik xizmat rejimi

**Faqat SUPER_ADMIN yangilashi mumkin** (§8.6)

## Application Layer - Handlers

### CreateUserHandler (Command)
```typescript
// Yaratish logikasi:
1. Username takrorlanganligini tekshirish
2. Email takrorlanganligini tekshirish
3. Parol hash (bcrypt)
4. User aggregate yaratish
5. Bo'lim va lavozimni tayinlash (agar berilsa)
6. Repositoryga saqlash
7. Audit log yozish
8. Bildirishnoma yuborish (yangi user uchun)
```

### UpdateUserRoleHandler (Command)
- Foydalanuvchini ID bo'yicha topish
- Eski role log
- Yangi role tayinlash
- SoD (Separation of Duties) tekshiruvi
- Audit log (old role → new role)

### UpdateSettingsHandler (Command)
```typescript
// Cheklov:
- Faqat SUPER_ADMIN (§8.6)
- advance_percent: 0-100 (§8.1)
- free_storage_days: >= 0 (§8.4)
- storage_daily_rate: >= 0 (§8.4)

// Natija:
Result<void>
```

### ListUsersHandler (Query)
```typescript
// Filtrlash:
- role: string
- departmentId: number
- isActive: boolean

// Pagination:
- page (default: 1)
- limit (default: 20, max: 100)

// Natija:
PaginatedResult<UserAggregate>
```

## Infrastructure Layer

### DrizzleUserRepo (IUserRepo Implementation)
```typescript
// Metodlar:
- findById(id) - ID bo'yicha topish
- findByUsername(username) - Username bo'yicha topish
- findByEmail(email) - Email bo'yicha topish
- findAll(filters) - Pagination bilan barcha users
- create(user) - Yangi user yaratish
- update(user) - User o'zgartirish
- softDelete(id) - Yumshoq o'chirish (isActive: false)
- restore(id) - O'chirilgan user qaytarish
```

### DrizzleSettingsRepo (ISettingsRepo Implementation)
- `getSettings()` - Global sozlamalarni olish
- `save(settings)` - Sozlamalarni saqlash

### RolesGuard
- Reflector-dan @Roles() metadatalarni o'qish
- User role tekshirish
- Ruxsatsiz kirish blokida ForbiddenException

### AuditInterceptor
```typescript
// Logga yoziladi:
- method (GET, POST, PATCH)
- url
- userId
- username
- statusCode
- duration (ms)
```

## Presentation Layer - Controllers

### AdminUsersController

| Method | Route | Role | Izoh |
|--------|-------|------|------|
| POST | /admin/users | SUPER_ADMIN, DIRECTOR | Yangi user yaratish |
| GET | /admin/users | SUPER_ADMIN, DIRECTOR | Foydalanuvchilar ro'yxati |
| PATCH | /admin/users/:id/role | SUPER_ADMIN | Rolni o'zgartirish |
| DELETE | /admin/users/:id | SUPER_ADMIN | Foydalanuvchini o'chirish |

### AdminSettingsController

| Method | Route | Role | Izoh |
|--------|-------|------|------|
| GET | /admin/settings | SUPER_ADMIN, DIRECTOR | Global sozlamalar |
| PATCH | /admin/settings | SUPER_ADMIN | Sozlamalarni o'zgartirish |

## Security Features

### Role-Based Access Control (RBAC)
```typescript
// Guardga:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
```

### Audit Logging
```typescript
// Har bir admin amali logga yoziladi:
- Foydalanuvchi ID
- Username
- Qanday amali bajarildi
- IP address
- Natija
- Vaqt
```

### Separation of Duties (SoD)
- Role o'zgarishi SoD qoidasini buzmasa
- Conflicting roles assignment blokida

### Throttling
- Admin uchun: 100 request/min
- Auth uchun: 5 request/min (login)

## Database Schema Integration

```sql
-- users jadvali quyidagilarni o'z ichiga oladi:
- id (PK)
- username (UNIQUE)
- email (UNIQUE)
- passwordHash
- role (enum: SUPER_ADMIN, DIRECTOR, ...)
- departmentId (FK)
- positionId (FK)
- isActive
- lastLogin
- failedLoginAttempts
- lockUntil
- createdAt
- updatedAt
- deletedAt (soft delete uchun)

-- system_settings jadvali:
- id (PK)
- advance_percent
- free_storage_days
- storage_daily_rate
- max_users
- maintenance_mode
- updated_at
- updated_by
```

## Usage Examples

### Create User
```bash
POST /admin/users
Authorization: Bearer ...
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!@",
  "role": "employee",
  "departmentId": 1,
  "positionId": 2
}

Response:
{
  "ok": true,
  "data": {
    "id": 5,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee"
  }
}
```

### List Users with Filters
```bash
GET /admin/users?page=1&limit=20&role=employee&isActive=true
Authorization: Bearer ...

Response:
{
  "ok": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

### Update Settings
```bash
PATCH /admin/settings
Authorization: Bearer ... (SUPER_ADMIN)
Content-Type: application/json

{
  "advancePercent": 30,
  "freeStorageDays": 7,
  "storageDailyRate": 0.5
}

Response:
{
  "ok": true,
  "message": "Settings updated successfully"
}
```

### Update User Role
```bash
PATCH /admin/users/5/role
Authorization: Bearer ... (SUPER_ADMIN)
Content-Type: application/json

{
  "role": "department_head"
}

Response:
{
  "ok": true,
  "message": "Role updated successfully"
}
```

## Integration with AUTH Module

- JwtAuthGuard foydalanish
- CurrentUser decorator-dan foydalanish
- AuthenticatedUser type-dan foydalanish
- Token validation har bir request uchun

## Error Handling

Barcha handlers Result pattern-ni qo'llanadi:
```typescript
type Result =
  | { ok: true; data: T }
  | { ok: false; error: string }
```

try/catch EMAS - error bo'lsa exception throw, controller unda catch qiladi.
