# Refaktoring Skriptlari — Ishlatish Qo'llanmasi

## Tezkor Boshlash

```bash
# Butun tizim holati — birinchi shu bilan boshlang
bash apps/api/scripts/progress.sh
```

## Faza Skriptlari

| Skript | Nima qiladi | `--fix` |
|--------|-------------|---------|
| `progress.sh` | Barcha 8 faza jarayonini ko'rsatadi | — |
| `faza1.sh` | @Roles, boilerplate, fayl hajmi | ✅ |
| `faza2.sh` | compatibility/ Controller→Service holati | — |
| `faza3.sh` | remaining/ Controller→Service holati | — |
| `faza45.sh` | crm,hr,finance... SQL controller holati | — |
| `faza6.sh` | TypeScript `any` hisobot | — |
| `faza7.sh` | AuditInterceptor holati | ✅ |
| `faza8.sh` | Result<T,E> va try/catch holati | — |

## Ishlatish

```bash
# Faqat hisobot (o'zgartirish yo'q)
bash apps/api/scripts/faza1.sh

# Avtomatik tuzatish (git commit dan keyin)
bash apps/api/scripts/faza1.sh --fix
```

## Tartib

```
1. progress.sh   → Holat ko'rish
2. faza1.sh      → Xavfsizlik tuzatish
3. faza2.sh      → compatibility/ nazorat
4. faza3.sh      → remaining/ nazorat
5. faza45.sh     → Asosiy modullar nazorat
6. faza6.sh      → any nazorat
7. faza7.sh      → AuditInterceptor
8. faza8.sh      → Result<T,E>
9. audit.sh      → Final tekshiruv
```
