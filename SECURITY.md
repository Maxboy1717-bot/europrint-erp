# Security Policy

## Supported versions

Only the latest `main` branch receives security updates. Older tagged releases
are not supported.

| Version | Supported |
|---------|-----------|
| `main`  | ✅ |
| < main  | ❌ |

---

## Reporting a vulnerability

**Do not open public GitHub issues for security vulnerabilities.** Instead:

1. **Email:** `security@europrint.uz` (PGP key below) — or contact the maintainer privately.
2. **Subject line:** `[SECURITY] <short title>`
3. **Include:**
   - Affected component(s) and file paths
   - Step-by-step reproduction
   - Expected vs. observed behaviour
   - Severity assessment (Critical / High / Medium / Low)
   - Any proof-of-concept code or exploit

You should receive an acknowledgement within **48 hours** and an initial
assessment within **7 days**. Critical issues get patches within **14 days**;
others within 30 days.

We treat coordinated disclosure as the default. Once a fix is shipped, we'll
credit you in the release notes (unless you prefer to remain anonymous).

---

## Built-in protections

The application ships with these defences enabled by default:

### Transport
- **TLS:** required in production (terminate at Nginx, see `nginx.conf`)
- **HSTS:** `max-age=31536000; includeSubDomains` (Helmet + Nginx duplicate)
- **HTTP methods blocked:** `CONNECT`, `TRACE`, `PROPFIND` (`main.ts`)

### Headers (via Helmet + Nginx)
- **CSP:** `default-src 'self'; script-src 'self'; object-src 'none'` …
- **X-Frame-Options:** `DENY`
- **X-Content-Type-Options:** `nosniff`
- **Referrer-Policy:** `strict-origin-when-cross-origin`

### Authentication
- **JWT:** signed with `JWT_SECRET` (≥32 chars enforced) and `JWT_REFRESH_SECRET`
- **bcrypt rounds:** 12 (admin), 10 (regular users)
- **Login rate limit:** 5 attempts per 60 seconds per IP
- **Global rate limit:** 100 requests per 60 seconds per IP

### Input validation
- **Zod schemas** on every `@Body()`, `@Query()`, `@Param()`
- **Parameterised SQL** via Drizzle ORM (no `sql.raw(variable)` allowed)
- **File uploads:** 50 MB limit, 1 file per request

### Authorisation
- **JwtAuthGuard** + **RolesGuard** + **SodGuard** + **PermissionGuard**
  registered globally
- **`@Public()`** decorator required to opt out (whitelisted endpoints only)
- **Segregation of duties** enforced (approver ≠ requester for financial ops)

### Database
- **Daily backups** to `${BACKUP_DIR}` with 30-day retention
- **Connection pool:** max 20, idle timeout 30s
- **PGSSLMODE=require** in production

### Operational
- **Swagger UI:** disabled in production (`NODE_ENV=production` gate)
- **Stack traces:** never returned to clients (Global exception filter)
- **Sensitive env vars** never logged (Pino redactor configured)
- **Docker:** runs as non-root user `nodejs:1001`

---

## Known operational gaps

Tracked in `DEPLOYMENT.md` §10. Production checklist:

1. **JWT in localStorage** — XSS would steal sessions.
   _Mitigation: strict CSP in Nginx, WAF in front (Cloudflare/AWS WAF)._
2. **Legacy fix-schema-*.sql files** — apply via consolidated migration 0011.
3. **No automated SAST/DAST in CI** — manual `pnpm audit` weekly.

---

## Cryptographic dependencies

| Library | Purpose | Version policy |
|---------|---------|----------------|
| `bcrypt` | password hashing | latest stable |
| `jsonwebtoken` | JWT signing/verification | latest stable, RS256 not HS256 for prod (TODO) |
| `crypto` (Node) | random secrets, HMAC | runtime-bundled |
| `pg` (driver) | TLS to PostgreSQL | latest stable |

We do not bundle our own crypto. Update via `pnpm up --latest` before each
production release.

---

## Reporter PGP key

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[ public key will be published once first vulnerability is reported ]
-----END PGP PUBLIC KEY BLOCK-----
```

---

## Audit history

| Date | Auditor | Scope | Outcome |
|------|---------|-------|---------|
| 2026-05-14 | Internal | Full read-only audit (10 categories) | 25 issues found; 17 fixed in PR #9 |
| (future) | _External_ | Pen test | _scheduled before prod_ |

---

*This policy is reviewed quarterly and on each major release.*
