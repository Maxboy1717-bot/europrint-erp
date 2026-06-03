# Deleted routes / pages / modules — removal log

**Purpose:** a permanent record of everything removed root-and-branch (tomir kesish) during the
DARAJA 1 cleanup and beyond, so nothing silently reappears. If a deleted route/page/module shows
up again, this file is the evidence it was intentionally removed.

**Rule:** Q-39 (kod qotirish) — a removed thing is NOT recreated; a working function is not changed
without permission; no regression (after a change, what worked before must still work — verify).

**Root-and-branch (tomir kesish) checklist per removal:**
1. page/component file deleted
2. router entry removed
3. sidebar entry removed
4. imports cleaned (no dangling references)
5. removal-only helpers/types deleted (only if nothing else uses them)
6. tests deleted/updated
7. logged here

Before deleting a controller/route, confirm the frontend does NOT call it (grep). If it does —
STOP and ask the owner.

## Log

| Date | Removed | Kind | Files / refs removed | Reason | Replacement / canonical | Commit |
|------|---------|------|----------------------|--------|-------------------------|--------|
| 2026-06-03 | `bull`, `@nestjs/bull`, `bcryptjs` | npm deps | apps/api/package.json deps + pnpm-lock | `bull` + `@nestjs/bull` are a dead old-queue pair (live queue stack is `@nestjs/bullmq` + `bullmq`); `bcryptjs` unused (code uses native `bcrypt`). NB: `node-telegram-bot-api` was on the remove-list but is USED (telegram.service.ts:9) so it was KEPT. | `bullmq` / `@nestjs/bullmq` / `bcrypt` | 1.1 (chore(deps)) |
