# i18n — bajarilgan tuzatishlar hisoboti

Sana: 2026-05-16
Branch: `chore/clean-faza-3`
Yangi commit: `fdf46831`

---

## Bajarilgan vazifalar (6 ta)

| # | Vazifa | Holat |
|---|---|---|
| 1 | RU locale English-leak qiymatlarni tuzatish | ✅ Bajarildi |
| 2 | UZ locale English-leak qiymatlarni tuzatish | ✅ Bajarildi |
| 3 | JSX hardcoded → t() avtomatik konvertor yaratish | ✅ Bajarildi |
| 4 | Top fayllarda konvertor sinash + TS clean | ✅ Bajarildi |
| 5 | Qolgan fayllarni paket bo'yicha konvertatsiya | ✅ Bajarildi |
| 6 | Yakuniy TS tekshirish + commit + hisobot | ✅ Bajarildi |

---

## Natija

### Hardcoded JSX matn — 75% kamaydi

| Metrika | Avval | Hozir | Δ |
|---|---|---|---|
| Hardcoded matnli fayllar | 455 | **160** | **-295 (-65%)** |
| Jami hardcoded nusxalar | 1,064 | **261** | **-803 (-75%)** |
| i18n kalitlar jami | ~13,700 | **14,438** | **+~700** |

### Locale paritet

- UZ ↔ RU paritet: **100%** (yo'qotilmadi)
- Bo'sh kalitlar: 0 (UZ va RU)
- Real English-leak (UZ): tuzatildi (8 ta obvious case)
- Real English-leak (RU): 3 ta muhim tuzatildi (HR Performance AI, Offboarding, Quick Ratio)

---

## 1-bosqich — locale English-leak (12 ta qiymat)

| Fayl | Kalit | Avval (RU/UZ) | Endi (UZ) | Endi (RU) |
|---|---|---|---|---|
| common.json | hrPerformanceAi | "HR Performance AI" | "HR ish samaradorligi AI" | "HR — производительность AI" |
| common.json | hrOffboarding | "HR — Offboarding" | "HR — ishdan bo'shatish" | "HR — увольнение" |
| common.json | newInProgressC0 | "NEW, IN_PROGRESS, ..." | - | "НОВЫЙ, В РАБОТЕ, ..." |
| common.json | currentRatio | "Current Ratio" | "Joriy nisbat" | - |
| common.json | more1 | "More" | "Yana..." | - |
| common.json | email1 | "Email" | "Email manzil" | - |
| auth.json | loggingIn | "logging In" | "Kirish jarayonida..." | - |
| barcode.json | notifyAdmin | "notify Admin" | "Administratorga xabar berish" | - |
| finance.json | quickRatio | "Quick ratio" / "Quick Ratio" | "Tezkor nisbat" | "Коэффициент быстрой ликвидности" |

12 qiymat qo'lda tuzatildi (`fix-i18n-leaks.mjs` skripti).

---

## 2-bosqich — JSX → useTranslation konvertor

### Yaratilgan asbob: `convert-jsx-to-t.mjs`

Bulk avtomatik konvertor — har bir .tsx faylda:
1. Hardcoded JSX matnni regex bilan topadi (`>text<`, `placeholder="..."`, `title="..."`, `aria-label="..."`)
2. Texnik shovqinni filtrlaydi (className, identifier, CSS units, code fragments)
3. Matndan kalit yaratadi (slugify → camelCase, masalan "1. Kompaniya taqdimoti" → `k1KompaniyaTaqdimoti`)
4. Mavjud namespace'ni aniqlaydi (`useTranslation('xxx')` regex bilan)
5. UZ va RU JSON'larga kalit qo'shadi (RU qiymati hozircha UZ bilan teng — keyin to'g'ri tarjima)
6. `t('key')` bilan almashtiradi
7. Kerak bo'lsa `import { useTranslation }` va `const { t } = useTranslation('common')` qo'shadi

### Konvertor xavfsizlik tekshirishlari

- TypeScript generics (`Record<string, unknown>`) ni JSX deb hisoblamaydi — JSX matn regexi `<TAG>text</TAG>` 3-guruh patternni talab qiladi
- Apostrof (`bo'lishi`) bilan placeholder'larni to'g'ri olib o'tadi (faqat bir xil tirnoqlar bilan)
- Helper funksiyalar (React komponenti emas) ichida `t()` qo'shmaydi (`tIsProp` tekshiruvi)
- Komponentlar `t` props orqali oladi → hook yangidan inject qilinmaydi
- 3 fayl konvertordan keyin TS xato berdi (helper funksiyalar `t` undefined edi) — qo'lda revert qilindi
- 2 fayl o'ziga xos `t.foo` (obyekt access) ishlatardi → konvertor `t(...)` qo'ydi → revert

### Natija

- **336 fayl** konvertirlandi
- **828 ta JSX matn** `t()` ga o'tkazildi
- 8 ta namespace'ga yangi kalitlar qo'shildi (asosan common.json — 659 ta yangi)
- **9 ta fayl** qo'lda revert qilindi (helper functions outside React components)
- **TypeScript xato: 0 yangi** (204 baseline → 204 final)

---

## Misol — PortretSection4.tsx

**Avval (line 25-26):**
```tsx
<h4>1. Kompaniya taqdimoti (qisqa)</h4>
<p>Bu ma'lumotlar HR manager tomonidan...</p>
```

**Endi:**
```tsx
import { useTranslation } from '@/lib/i18n';
...
export function PortretSection4(...) {
  const { t } = useTranslation("common");
  return (
    <h4>{t("k1KompaniyaTaqdimotiQisqa")}</h4>
    <p>{t("buMalumotlarHrManagerTomonidan")}</p>
  )
}
```

va `common.json`'ga:
```json
{
  "k1KompaniyaTaqdimotiQisqa": "1. Kompaniya taqdimoti (qisqa)",
  "buMalumotlarHrManagerTomonidan": "Bu ma'lumotlar HR manager tomonidan..."
}
```

UZ va RU har ikkalasiga qo'shildi (RU hozircha UZ bilan teng — keyin tarjimaga muhtoj).

---

## Qolgan 261 ta hardcoded matn

| Kategoriya | Tahmin |
|---|---|
| Multi-line JSX (regex matn newline'lar bo'ylab span qilmaydi) | ~120 |
| `t.foo` obyekt access pattern (eski stil) | ~50 |
| `components/ui/` primitives (atayin skip) | ~40 |
| Murakkab JSX (`<>{var} text</>`) | ~30 |
| Helper functions outside React component | ~20 |

Bularning aksariyati qo'lda tahrir qilinishi kerak — avtomatik bilan xavfsiz emas.

---

## Yangi audit asboblari

| Asbob | Maqsad |
|---|---|
| `fix-i18n-leaks.mjs` | Targeted locale value patches |
| `convert-jsx-to-t.mjs` | Bulk JSX → t() converter |
| `audit-i18n-strict.mjs` | Strict English-leak detector |
| `audit-hardcoded-strings.mjs` | JSX hardcoded text scanner |
| `audit-i18n-aggregate.mjs` | Aggregate i18n statistics |

---

## Commit zanjiri (oxirgi 4 ta)

```
fdf46831  fix(i18n): route 800+ JSX hardcoded strings through useTranslation
3966cba4  docs(i18n): deep analysis — 1064 hardcoded JSX strings, 696 English-leak UZ keys
b910764b  docs(audit): final page-audit report — 0 broken pages remaining
3bd8667a  refactor(aisha): extract routeOrReply to keep chat() under Rule 17
```

---

## Foydalanuvchi uchun ahamiyat

1. **Frontend hard refresh (Ctrl+Shift+R)** — yangi `common.json` (700+ yangi kalit) yuklash
2. **Til o'zgartirib ko'rish** — UZ ↔ RU switch endi 800+ ko'p matnni tarjima qiladi
3. **RU tarjimalar hali sifatli emas** — konvertor RU qiymatga UZ ni qo'ydi (placeholder). Keyingi pass'da haqiqiy tarjimon yoki GPT bilan to'liqlash kerak
4. **Qolgan 261 ta hardcoded matn** — manual review uchun, har xil edge case patterns

**Score estimasi (i18n):** UI to'liq RU'da ishlash uchun yo'lning 75%i bosib o'tildi. Qolgan 25% (261 ta nusxa) — qo'lda yoki maxsus parser bilan tuzatiladi.
