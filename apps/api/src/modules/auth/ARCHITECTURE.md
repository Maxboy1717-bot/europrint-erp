# AUTH Module - DDD Architecture

## Tarqibiy tuzilma (Structure)

```
auth/
├── domain/                          # Domain Layer (Business Logic)
│   ├── aggregates/
│   │   └── auth-user.aggregate.ts   # User aggregate root
│   ├── value-objects/
│   │   └── password.vo.ts           # Password value object with bcrypt
│   ├── events/
│   │   └── user-logged-in.event.ts  # Domain event
│   ├── repositories/
│   │   └── i-auth.repo.ts           # Repository interface (port)
│   └── types/
│       └── index.ts                 # JWT payload, authenticated user types
├── application/                     # Application Layer (Use Cases)
│   └── commands/
│       ├── login.handler.ts         # Login command handler
│       ├── logout.handler.ts        # Logout command handler
│       └── change-password.handler.ts # Change password command handler
├── infrastructure/                  # Infrastructure Layer
│   ├── repositories/
│   │   └── drizzle-auth.repo.ts     # Drizzle ORM implementation
│   ├── strategies/
│   │   └── jwt.strategy.ts          # Passport JWT strategy
│   ├── guards/
│   │   └── jwt-auth.guard.ts        # JWT authentication guard
│   └── decorators/
│       ├── current-user.decorator.ts # @CurrentUser() decorator
│       └── public.decorator.ts       # @Public() decorator
├── presentation/                    # Presentation Layer (API)
│   ├── controllers/
│   │   └── auth.controller.ts       # REST endpoints
│   └── dto/
│       ├── login.dto.ts             # Login DTO with Zod
│       └── change-password.dto.ts   # Password change DTO
└── auth.module.ts                   # Module definition

```

## Domain Layer - Aggregate & Value Objects

### AuthUserAggregate
- **Javobgarlik**: Foydalanuvchi hisobini boshqarish
- **Metodlar**:
  - `verifyPassword()` - Parol tekshirish
  - `incrementFailedAttempts()` - Muvaffaqiyatsiz urinishni hisoblash
  - `lockAccount()` - Hisobni 30 daqiqaga qulfla
  - `resetFailedAttempts()` - Failed attempts qaytaarish

### PasswordValueObject
- **Javobgarlik**: Parol xavfsizilik va hashing
- **Validatsiya**:
  - Min 8 ta belgi
  - Kamida 1 ta katta harf
  - Kamida 1 ta kichik harf
  - Kamida 1 ta raqam
  - Kamida 1 ta maxsus belgi (!@#$%^&*...)

## Application Layer - Handlers

### LoginHandler (Command)
```typescript
// Kirish logikasi:
1. Foydalanuvchini username bo'yicha qidirish
2. Akkaunt qulflanganligini tekshirish
3. Akkaunt faolligi tekshirish
4. Parol verificatsiyasi
5. Failed attempts qo'shish (agar xato bo'lsa)
6. 5+ muvaffaqiyatsiz urinish → akkaunt qulfla (30 min)
7. JWT token generate qilish
8. LastLogin update qilish
9. Audit log yozish
```

**Result Pattern**: 
```typescript
{ ok: true; data: { accessToken, user } } | { ok: false; error: string }
```

### LogoutHandler (Command)
- Token blacklist (Redis - placeholder)
- Audit log

### ChangePasswordHandler (Command)
- Eski parol verificatsiyasi
- Yangi parol validatsiyasi
- Parol hash update
- Audit log

## Infrastructure Layer

### DrizzleAuthRepo
- Drizzle ORM bilan users jadvaliga qo'llanish
- Token blacklist qo'llanish (Redis integration placeholder)
- Login history qo'llanish

### JwtStrategy
- Passport.js JWT strategiyasi
- Token validatsiyasi
- User activeness check

## Presentation Layer - Controller

### AuthController Routes

| Method | Route | Role | Throttle | Izoh |
|--------|-------|------|----------|------|
| POST | /auth/login | Public | 5/min | Tizimga kirish |
| POST | /auth/logout | Authenticated | 100/min | Tizimdan chiqish |
| PATCH | /auth/change-password | Authenticated | 100/min | Parolni o'zgartirish |
| GET | /auth/me | Authenticated | 100/min | Joriy user ma'lumotlari |
| GET | /auth/health | Public | - | Xizmat holati |

## Security Features

1. **Failed Login Attempts Tracking**
   - 5 ta muvaffaqiyatsiz urinish → account lock (30 min)
   - Reset after successful login

2. **Password Security**
   - bcrypt hashing (10 salt rounds)
   - Complexity validation (8+ chars, mixed case, numbers, special chars)

3. **JWT Token Management**
   - TTL: 15 minutes (configurable via JWT_ACCESS_TOKEN_TTL; legacy fallback JWT_EXPIRES_IN)
   - Blacklist support (Redis - placeholder)

4. **Audit Logging**
   - Har bir login urinishi logged
   - IP address, device info qo'llaniladi
   - Success/failure status recorded

## Environment Variables

```env
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_TTL=15m
```

## Usage Examples

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!@"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Get Current User
```bash
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response:
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```

### Change Password
```bash
PATCH /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "oldPassword": "SecurePass123!@",
  "newPassword": "NewSecure456!@",
  "confirmPassword": "NewSecure456!@"
}
```
