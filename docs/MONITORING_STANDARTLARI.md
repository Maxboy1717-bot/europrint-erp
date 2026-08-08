# EUROPRINT ERP — MONITORING VA LOGGING STANDARTLARI

> **Tizim holati qanday kuzatiladi. Nima loglanadi. Nima loglanmaydi.**
> Noto'g'ri log = secret chiqishi yoki muammo o'tkazib yuboriladi.
> Qoida: strukturalangan log (JSON), secret hech qachon, har xato log.
> Bog'liq: [XAVFSIZLIK_STANDARTLARI.md](XAVFSIZLIK_STANDARTLARI.md) §6 · [XAVF_REESTRI.md](XAVF_REESTRI.md) R-04 · [MUHIT_STANDARTLARI.md](MUHIT_STANDARTLARI.md) §4

---

## 1. LOG DARAJALARI (Qachon Nima Ishlatiladi)

```typescript
// NestJS Logger (mavjud):
const logger = new Logger('HrEmployeeService');

// ERROR — doim loglanadi (prod + dev):
// Kutilmagan xatolar, DB muvaffaqiyatsizligi, xavfsizlik hodisasi
logger.error('Employee yaratishda xato', error.stack, { employeeId, userId });

// WARN — doim loglanadi:
// Kutilgan lekin g'ayriodatiy holat, deprecated ishlatish, retry
logger.warn('OTP limit: 5 urinishdan oshdi', { userId, ip });

// LOG (= INFO) — prod va dev:
// Muhim biznes hodisalari (buyurtma yaratildi, smena boshlandi)
logger.log('Sales order yaratildi', { orderId, customerId, amount });

// DEBUG — faqat dev (NODE_ENV=development):
// Tafsilotli debugging ma'lumoti
logger.debug('findAll query parametrlari', { page, limit, search });

// VERBOSE — faqat maxsus debug sessiyasida:
logger.verbose('SQL query natijasi', { rows: result.length });
```

---

## 2. LOG FORMATI (Strukturalangan JSON)

```typescript
// ✅ TO'G'RI — strukturalangan log:
logger.log('Xodim yaratildi', {
  action: 'hr.employee.create',
  employeeId: 123,
  orgFunctionId: 5,
  createdBy: userId,
  ip: request.ip,
  duration_ms: Date.now() - startTime,
});

// ❌ XATO — string concatenation:
logger.log(`User ${userId} created employee ${employeeId}`); // qidirib bo'lmaydi!

// ❌ TAQIQ — maxfiy ma'lumot:
logger.log('Login', { username, password });          // PAROL!
logger.log('Token', { token: jwt });                  // JWT!
logger.log('Config', { db_url: DATABASE_URL });       // SECRET!
logger.log('API call', { key: process.env.API_KEY }); // API KEY!
```

---

## 3. NIMA LOGLANADI (MAJBURIY)

```
✅ Har autentifikatsiya: login muvaffaqiyat, login muvaffaqiyatsiz (IP bilan)
✅ Har avtorizatsiya muvaffaqiyatsizligi: 403 (userId, endpoint, rol)
✅ Har muhim biznes amal: buyurtma yaratildi, smena boshlandi, to'lov qilindi
✅ Har DB tranzaksiya xatosi (rollback sababini o'z ichiga olsin)
✅ Har external API chaqiruvi: url, davomiyligi, status kodi (body emas!)
✅ Har event emit: event nomi, aggregate_id
✅ Har scheduled job: boshlandi, tugadi, qancha element qayta ishlandi
✅ Har health check muvaffaqiyatsizligi
✅ Server startup: port, NODE_ENV, DB connection OK
```

---

## 4. NIMA LOGLANMAYDI (TAQIQ)

```
❌ Parollar (hatto hash bo'lsa ham)
❌ JWT tokenlar (access yoki refresh)
❌ API kalitlari (Yandex, SMS, boshqa)
❌ DATABASE_URL (foydalanuvchi nomi va parolni o'z ichiga oladi)
❌ Shaxsiy ma'lumot (PassportID, bank hisob, SSN)
❌ Foydalanuvchi mazmuni (xabar, izoh — faqat ID)
❌ So'rov tanasi (body) to'liq (filtr parol va token maydonlarini)
❌ Stack trace production da (faqat loglarda, javobda emas)
```

```typescript
// ✅ TO'G'RI — request log filtri:
function sanitizeRequestBody(body: Record<string, unknown>) {
  const SENSITIVE_KEYS = ['password', 'token', 'secret', 'api_key', 'pin'];
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) =>
      SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))
        ? [k, '[FILTERED]']
        : [k, v]
    )
  );
}
```

---

## 5. REQUEST/RESPONSE LOGGING (Interceptor)

```typescript
// apps/api/src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip } = req;
    const userId = req.user?.id;
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateId();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          // Faqat sekin so'rovlar (> 300ms) log qilinadi (performance):
          if (duration > 300) {
            this.logger.warn('SEKIN SO\'ROV', { method, url, duration, userId });
          }
          // Muhim endpointlar uchun:
          if (url.includes('/auth/login')) {
            this.logger.log('Login OK', { userId, ip });
          }
        },
        error: (error) => {
          this.logger.error('HTTP Xato', {
            method, url, userId, ip,
            status: error.status || 500,
            message: error.message,
            requestId,
          });
        },
      }),
    );
  }
}
```

---

## 6. XATO KUZATISH (Error Tracking)

```typescript
// GlobalExceptionFilter (mavjud yoki kerak):
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const userId = request.user?.id;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.message;

      // 4xx → WARN (foydalanuvchi xatosi)
      if (status >= 400 && status < 500) {
        this.logger.warn('Client xato', { status, message, url: request.url, userId });
      }

      response.status(status).json({
        error: {
          code: this.extractCode(exception),
          message: this.sanitizeMessage(message),
          // ❌ stack trace response da emas!
        }
      });
    } else {
      // 500 → ERROR (server xatosi)
      this.logger.error('Server xato', {
        message: (exception as Error).message,
        stack: (exception as Error).stack, // faqat log da!
        url: request.url,
        userId,
      });

      response.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Ichki xato' }
        // ❌ stack trace, DB xato, exception message ochiq emas!
      });
    }
  }
}
```

---

## 7. HEALTH CHECK (Monitoring Uchun)

```typescript
// GET /health (mavjud):
@Public()
@Get('health')
async health() {
  const dbOk = await this.checkDb();
  const status = dbOk ? 'ok' : 'degraded';

  return {
    status,
    db: dbOk ? 'ok' : 'error',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  };
}
```

### Monitoring tekshiruvi (har 30 sekund):
```bash
# Uptime kuzatish skripti (15_DevOps.md da):
curl -sf http://127.0.0.1:3030/health | jq '.status'
# "ok" → yaxshi
# "degraded" → DB muammo → tekshir
# curl fail (connection refused) → app tushib qoldi → restart
```

---

## 8. LOG AYLANTIRISH (Rotation)

```bash
# .gitignore da bo'lishi shart:
backend.log*
*.log.*
logs/

# Winston rotation (ixtiyoriy, prod uchun):
# npm install winston winston-daily-rotate-file
const transport = new DailyRotateFile({
  filename: 'logs/europrint-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '100m',
  maxFiles: '14d',   // 14 kun saqlash
  zippedArchive: true,
});
```

---

## 9. PERFORMANCE MONITORING

```typescript
// Sekin DB so'rovlari:
// 1. pg_stat_statements faollashtiring (prod PostgreSQL):
//    shared_preload_libraries = 'pg_stat_statements'

// 2. Har kunda tekshirish:
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

// 3. Node.js memory monitoring:
setInterval(() => {
  const used = process.memoryUsage();
  if (used.heapUsed > 512 * 1024 * 1024) { // 512MB
    logger.warn('Yuqori xotira iste\'moli', {
      heapMB: Math.round(used.heapUsed / 1024 / 1024),
    });
  }
}, 60_000); // har daqiqa
```

---

## 10. OGOHLANTIRISH QOIDALARI (Alert)

| Holat | Chegara | Xabar | Ustuvorlik |
|-------|---------|-------|-----------|
| API down | 1 daqiqa | Telegram/Email | P0 - darhol |
| DB ulanish xatosi | 30 sekund | Telegram | P0 - darhol |
| 5xx error rate > 1% | 5 daqiqa | Log | P1 - 1 soat |
| Memory > 512MB | doimiy | Log | P1 - bugun |
| Sekin query > 1s | > 10 marta/daqiqa | Log | P2 - sprint |
| Outbox relay stop | 1 daqiqa | Log | P1 - 1 soat |

---

*EuroPrint ERP · Monitoring va Logging Standartlari · Versiya: 2026-06-18*
