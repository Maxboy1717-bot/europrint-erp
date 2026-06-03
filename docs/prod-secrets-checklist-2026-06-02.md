# Pre-production secrets checklist — apps/api/.env (2026-06-02)

**Status:** Owner action (NOT code). These live in `apps/api/.env`, which is gitignored
(not committed) — confirmed by the 2026-06-01 pentest. The items below are dev
placeholders/defaults that MUST be replaced with strong values + secret injection before
any production deployment. No secret values are reproduced here.

## 1. JWT_SECRET — dev placeholder 🔴
- Current value is a **development placeholder** (starts with `local-dev`, ~62 chars,
  literally contains "please-change-in-prod"). It satisfies the ≥32-char rule but is a
  human-readable dev string, not a strong random secret.
- Code already enforces presence + length: `apps/api/src/config/jwt.config.ts` throws if
  unset; `apps/api/src/config/env.schema.ts` requires ≥32 chars.
- **Action:** set a cryptographically random value in the prod `.env`
  (e.g. `openssl rand -hex 32`). Also rotate `JWT_REFRESH_SECRET` similarly.

## 2. ADMIN_SEED_PASSWORD — dev default 🔴
- Current value is the known dev default (`Admin123!`).
- Read by `apps/api/src/database/seeds/admin.seed.ts` (which hard-fails if unset — no code
  fallback, per the 2026-06-01 pentest).
- **Action:** set a strong unique admin password in the prod `.env` before running the seed.

## 3. Third-party API keys — plaintext in .env 🟠
- AI providers and other third-party integration keys are stored in plaintext in the local
  `.env`. Normal for local dev.
- **Action:** for production, inject secrets from a secrets manager / platform env vars
  rather than a plaintext `.env` file on disk.

## Notes
- All of the above are `.env` / configuration changes — **owner responsibility, not code**.
  No source changes are required or planned for these.
- Source: Stage P0 security pack, Subagent 3 read-only `.env` shape check (2026-06-02).
- Process note: do not pass secret values through subagents; report shape/length only.
