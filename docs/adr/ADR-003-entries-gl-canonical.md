# ADR-003: `entries` kanonik GL jadvali (SAP#76)

**Sana:** 2026-05-27 (SAP#76 belgilangan)
**Holat:** ✅ QABUL QILINGAN — o'zgartirilmaydi
**Qaror qabul qildi:** Egasi (arxitektura auditi asosida)

---

## Muammo

Ikkita parallel GL modeli:
- `entries` — haqiqiy GL yozuvlari, UI ishlatadi, accounts bilan FK
- `gl_journal_entries` + `gl_lines` — 0 qator, parallel model, hech kim ishlatmaydi

## Qaror

**`entries` = kanonik GL.** `gl_journal_entries` va `gl_lines` = TEGMA (SAP#76).

Sabab:
1. `entries` da real data bor (yoki bo'lishi kerak)
2. `gl_journal_entries` = eski arxitektura qoldig'i, 0 qator
3. Ikki parallel GL model = balans buzilishi xavfi

## Qoida (o'zgartirilmaydi)

```bash
grep -rn "gl_journal_entries\|glJournalEntries" apps/api/src/
# 0 bo'lishi shart
```

## Oqibat

- Barcha GL posting: `db.insert(entries).values(...)` FAQAT
- `gl_journal_entries`, `gl_lines` → hech qachon INSERT/UPDATE
- Bu qaror Q-35 shart emas — egasi allaqachon tasdiqlagan (SAP#76)
