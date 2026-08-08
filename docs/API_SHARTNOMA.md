# EUROPRINT ERP — API SHARTNOMA (Kontrakt)

> **FE va BE o'rtasidagi KELISHUV. Ikkalasi ham bu shartnomaga amal qiladi.**
> FE shu formatni kutadi. BE shu formatda qaytaradi. Og'ish = XATO.
> Bog'liq: [FE_STANDARTLAR.md](../FE_STANDARTLAR.md) · [STANDARTLAR.md](../STANDARTLAR.md) §8 API

---

## 1. ASOSIY TAMOYILLAR

```
Prefix:      /api/[modul]/[resurs]          masalan: /api/hr/employees
Method:      GET/POST/PATCH/DELETE           PUT ishlatilmaydi (PATCH)
Auth:        JWT Bearer (httpOnly cookie)
Format:      JSON (Content-Type: application/json)
Encoding:    UTF-8
ID:          INTEGER (number) — UUID emas
Sana:        ISO8601 timestamptz: "2026-06-18T14:30:00.000Z"
Pul:         NUMERIC (sonlar) — string emas: 1500000.00
Boolean:     true/false — "true"/"false" string emas
Null:        null JSON — undefined emas
```

---

## 2. SUCCESS JAVOB FORMATLARI

### 2.1 Bitta obyekt (GET /:id, POST, PATCH)
```json
{
  "id": 42,
  "first_name": "Abdulloh",
  "last_name": "Toshmatov",
  "org_function_id": 7,
  "base_salary": 3500000.00,
  "status": "active",
  "created_at": "2026-05-01T09:00:00.000Z",
  "updated_at": "2026-06-18T14:30:00.000Z"
}
```

### 2.2 Ro'yxat (pagination bilan — GET /)
```json
{
  "data": [
    { "id": 1, "first_name": "Abdulloh", "..." },
    { "id": 2, "first_name": "Bobur", "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 93,
    "totalPages": 5
  }
}
```

**FE uchun:** `const employees = Array.isArray(data?.data) ? data.data : []`

### 2.3 Oddiy muvaffaqiyat (DELETE, void operatsiyalar)
```json
{
  "success": true
}
```

### 2.4 Ro'yxat (pagination yo'q — kichik lookup jadvallar)
```json
{
  "data": [
    { "id": 1, "name_uz": "Boshlang'ich", "coefficient": 1.00 },
    { "id": 2, "name_uz": "Assistent", "coefficient": 1.25 }
  ]
}
```
**Eslatma:** 100 dan ortiq yozuv bo'lishi mumkin bo'lsa — pagination MAJBURIY.

---

## 3. XATO JAVOB FORMATLARI

### 3.1 Standart xato
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Xodim #42 topilmadi",
    "field": null
  }
}
```

### 3.2 Validatsiya xatosi (400)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ma'lumotlar noto'g'ri",
    "details": [
      { "field": "first_name", "message": "Ism kamida 2 harf bo'lishi kerak" },
      { "field": "base_salary", "message": "Maosh musbat son bo'lishi kerak" }
    ]
  }
}
```

### 3.3 HTTP status kodlari

| Status | Holat | Misol |
|--------|-------|-------|
| `200` | Muvaffaqiyatli GET/PATCH | Ma'lumot qaytdi |
| `201` | Muvaffaqiyatli CREATE | Yangi yozuv yaratildi |
| `204` | Muvaffaqiyatli DELETE | O'chirildi, tana yo'q |
| `400` | Noto'g'ri so'rov | Validatsiya xatosi, format xato |
| `401` | Autentifikatsiya yo'q | Token yo'q yoki eskirgan |
| `403` | Ruxsat yo'q | Rol yetarli emas |
| `404` | Topilmadi | `id` bo'yicha yozuv yo'q |
| `409` | Ziddiyat | Unique qiymat allaqachon bor |
| `422` | Qayta ishlash xatosi | Biznes qoida buzilishi |
| `429` | Rate limit | Haddan ko'p so'rov |
| `500` | Server xatosi | Kutilmagan xato |
| `501` | Hali tayyor emas | `NOT_IMPLEMENTED` |

---

## 4. PAGINATION PARAMETRLARI

```
GET /api/hr/employees?page=2&limit=20&search=Abdulloh&status=active
```

| Parametr | Tur | Default | Izoh |
|----------|-----|---------|------|
| `page` | integer | `1` | Sahifa raqami (1 dan boshlanadi) |
| `limit` | integer | `20` | Sahifadagi elementlar (maks: 100) |
| `search` | string | `""` | Qidiruv (ILIKE `%search%`) |
| `sort` | string | `"created_at"` | Saralash ustuni |
| `order` | `asc`\|`desc` | `"desc"` | Saralash tartibi |

**Server validatsiya:**
- `limit` > 100 bo'lsa → 400 xato
- `page` < 1 bo'lsa → 400 xato

---

## 5. ID VA MUNOSABATLAR

```json
// ✅ TO'G'RI — integer ID, nested lookup:
{
  "id": 42,
  "org_function_id": 7,
  "org_function": {
    "id": 7,
    "name_uz": "Bosma mashinasi operatori",
    "razryad_level": { "id": 3, "name_uz": "Mutaxassis" }
  }
}

// ❌ XATO — UUID, string ID:
{ "id": "uuid-here", "org_function_id": "uuid-here" }

// ❌ XATO — nested o'rniga flat (FE da join qilish mumkin emas):
{ "id": 42, "org_function_id": 7 }  // org_function detail yo'q → N+1
```

---

## 6. SANA VA VAQT FORMATI

```json
// ✅ TO'G'RI — ISO8601 timestamptz (always UTC Z):
{
  "created_at": "2026-06-18T09:30:00.000Z",
  "delivery_date": "2026-07-15T00:00:00.000Z"
}

// ❌ XATO — Unix timestamp:
{ "created_at": 1750240200 }

// ❌ XATO — string sana:
{ "created_at": "18.06.2026" }

// FE da ko'rsatish:
// new Date(employee.created_at).toLocaleDateString('uz-UZ')
// → "18.06.2026"
```

---

## 7. QUERY PARAMETRLAR STANDART

```
Sana filtri:   ?dateFrom=2026-01-01&dateTo=2026-12-31   (ISO8601 date)
ID filtri:     ?departmentId=5&statusId=2               (integer)
Multi-select:  ?status=active&status=on_leave           (repeat param)
Boolean:       ?isActive=true                           (string "true"/"false")
```

---

## 8. XATO KODLARI KATALOĞI

| Kod | HTTP | Ma'nosi |
|-----|------|---------|
| `NOT_FOUND` | 404 | Yozuv topilmadi |
| `VALIDATION_ERROR` | 400 | Kiritma validatsiya xatosi |
| `UNAUTHORIZED` | 401 | Token yo'q yoki eskirgan |
| `FORBIDDEN` | 403 | Rol yetarli emas |
| `CONFLICT` | 409 | Unique cheklov buzilishi |
| `BUSINESS_RULE` | 422 | Biznes qoida buzilishi |
| `NOT_IMPLEMENTED` | 501 | Hali tayyor emas |
| `INTERNAL` | 500 | Kutilmagan server xatosi |

---

## 9. ENDPOINT NOMLASH QOIDALARI

```
GET    /api/hr/employees              → ro'yxat (pagination bilan)
GET    /api/hr/employees/:id          → bitta
POST   /api/hr/employees              → yaratish
PATCH  /api/hr/employees/:id          → yangilash (to'liq emas)
DELETE /api/hr/employees/:id          → o'chirish (soft delete)

GET    /api/hr/employees/:id/shifts   → bog'liq resurs (xodim smena'lari)
POST   /api/hr/employees/:id/activate → maxsus amal

// ❌ XATO — verb URL da:
POST /api/hr/createEmployee
GET  /api/hr/getEmployees
POST /api/hr/deleteEmployee/:id
```

---

## 10. FE — BE KONTRAKT TEKSHIRUVI

```bash
# FE API call'lari BE da bormi:
node scripts/check-fe-api-urls.mjs

# FE apiRequest imzosi to'g'rimi:
# apiRequest('GET', '/api/hr/employees')   ← ✅
# apiRequest('/api/hr/employees')          ← ❌ method yo'q
```

---

## 11. VERSIYALASH

Hozirda: versiya yo'q (`/api/` prefix faqat).  
Kelajak o'zgarish bo'lsa: `/api/v2/` prefix qo'shiladi (eski `/api/` saqlanadi, backcompat).

---

## 12. FAYL YUKLASH

```
POST /api/storage/upload
Content-Type: multipart/form-data

Response:
{ "url": "/storage/files/2026/06/filename.pdf", "size": 102400 }

// Ruxsat etilgan: jpg, jpeg, png, pdf, xlsx, docx
// Maks hajm: 10MB (STORAGE_MAX_FILE_SIZE env)
// Saqlash: /uploads/ (Docker volume yoki GCS_BUCKET)
```

---

*EuroPrint ERP · API Shartnoma · Versiya: 2026-06-18*
