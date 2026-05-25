# Agent 4 — AIsha Frontend Integration Report

**Date:** 2026-05-15
**Status:** Done

## Deliverable file paths

| Asset | Path |
| --- | --- |
| AishaPanel (chat) | `artifacts/erp-dashboard/src/components/aisha/AishaChatPanel.tsx` |
| useAisha hook | `artifacts/erp-dashboard/src/hooks/useAisha.ts` |
| Zod schemas | `artifacts/erp-dashboard/src/lib/api/aisha.schema.ts` |
| UZ locale | `artifacts/erp-dashboard/src/locales/uz/aisha.json` |
| RU locale | `artifacts/erp-dashboard/src/locales/ru/aisha.json` |
| DirectorDashboard mount | `artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx` (line 31 import, line 222 JSX) |
| i18n registry update | `artifacts/erp-dashboard/src/lib/i18n/constants.ts`, `artifacts/erp-dashboard/src/lib/i18n/loader.ts` |

## Key counts

- `uz/aisha.json`: **53 keys** (all flat strings — required by the i18n loader & completeness test).
- `ru/aisha.json`: **53 keys** — identical key set to UZ. Parity test passes.

## DirectorDashboard mounted

**YES.** File: `artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx`.
Rendered as a fixed bottom-right floating card (`<AishaChatPanel isDirector />`)
inside the existing dashboard tree — no grid disruption, no layout regression.

## TypeScript errors delta

| Phase | `tsc --noEmit` errors |
| --- | --- |
| Baseline (before this task) | 204 |
| After all changes | **204** |
| New errors introduced | **0** |

The only AIsha-area error is the pre-existing
`src/aisha/hooks/use-wake-word.ts(27,66): Cannot find module '@picovoice/porcupine-web'`
which predates this task and is in the legacy wake-word panel (not touched).

## Files created

1. `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/src/lib/api/aisha.schema.ts`
2. `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/src/hooks/useAisha.ts`
3. `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/src/components/aisha/AishaChatPanel.tsx`

## Files edited

1. `artifacts/erp-dashboard/src/lib/i18n/constants.ts` — added `'aisha'` to `TRANSLATION_MODULES`.
2. `artifacts/erp-dashboard/src/lib/i18n/loader.ts` — imported and registered `uzAisha` / `ruAisha`.
3. `artifacts/erp-dashboard/src/locales/uz/aisha.json` — added flat chat keys; legacy nested keys converted to flat dotted form so the loader (which keys flat `Record<string, string>`) and the completeness test (which asserts every value is a non-empty string) both pass.
4. `artifacts/erp-dashboard/src/locales/ru/aisha.json` — RU parity, same shape.
5. `artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx` — imported `AishaChatPanel` and mounted it at the bottom of the page tree (fixed bottom-right floating card).

## Backend API contract used (read from controllers)

| Endpoint | Method | Used by |
| --- | --- | --- |
| `/api/aisha/chat` | POST | `useAisha.sendMessage` → `useMutation` (validated via `AishaChatResponseSchema`) |
| `/api/aisha/wake/config` | GET | `useAisha` → `useQuery` (validated via `AishaWakeConfigSchema`) |
| `/api/aisha/stream/:sessionId` | SSE | `useAisha.useStreamSubscription` (validated via `AishaStreamEventSchema`) |
| `/api/aisha/voice/transcribe` | POST | Not wired in this iteration (kept for future mic upload) |
| `/api/aisha/voice/synthesize` | POST | Not wired in this iteration (TTS playback) |

`AishaChatRequestSchema` and `AishaChatResponseSchema` follow the spec
exactly (`{ message (1..2000), sessionId? }` and
`{ success, data: { reply, sessionId, toolsUsed? } }`). The wake-config
schema accepts both the spec envelope and the actual backend response shape
via a union, then normalises to a single view-model in
`normaliseWakeConfig()`.

## Constraints honoured

- All HTTP calls go through `apiRequest` from `@/lib/queryClient` (no raw `fetch`).
- No `any` types; no `as unknown` stubs; no non-null assertions.
- Every function ≤ 30 lines (`sendMessage`, `startListening`, sub-components, helpers all split where needed).
- `AishaChatPanel.tsx` is 192 lines (≤ 300).
- `useAisha.ts` is 207 lines (≤ 300).
- Existing `AishaPanel.tsx` and its tests left untouched (no breakage).
- Existing `aisha-i18n.spec.ts` still passes (uz and ru have identical flat key sets).
- Existing `completeness.test.ts` still passes after the JSON flattening.
- No commit performed — supervisor reviews the diff.

## Grep verification

```
grep -rE "AishaChatPanel|useAisha" artifacts/erp-dashboard/src --include="*.tsx" --include="*.ts" -l
```

Returns:
- `pages/DirectorDashboard.tsx` (mount)
- `components/aisha/AishaChatPanel.tsx`
- `hooks/useAisha.ts`
- `components/aisha/AishaPanel.tsx` (`useAishaStore` substring — unrelated)
- `components/aisha/__tests__/*` (legacy test — unrelated)
- `components/aisha/TransparencyPanel.tsx` (`useAishaStore` — unrelated)
- `aisha/store.ts` (`useAishaStore` definition — unrelated)
