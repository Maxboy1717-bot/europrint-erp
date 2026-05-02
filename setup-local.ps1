# ──────────────────────────────────────────────────────────────────────────────
# EuroPrint ERP — Birinchi marta sozlash
# Ishlatish: PowerShell'da `.\setup-local.ps1`
#
# Bu skript:
#   1. pnpm install
#   2. Drizzle push (DB jadvallari)
#   3. Admin seed
#   4. Master Data seed (departments, positions, permissions)
# ──────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "═══ EuroPrint ERP — Setup ═══" -ForegroundColor Cyan
Write-Host ""

# 1. Pre-flight
if ($null -eq (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
  throw "pnpm topilmadi. 'npm install -g pnpm' bilan o'rnating."
}
if (-not (Test-Path (Join-Path $root "apps\api\.env"))) {
  throw "apps\api\.env yo'q. Avval .env faylini yarating (qo'llanmaga qarang)."
}

# 2. Dependencies
Write-Host "→ pnpm install..." -ForegroundColor Yellow
Push-Location $root
pnpm install
Pop-Location
Write-Host "✓ Dependencies tayyor" -ForegroundColor Green
Write-Host ""

# 3. Drizzle push
Write-Host "→ Database jadvallarini yaratish (drizzle-kit push)..." -ForegroundColor Yellow
Push-Location (Join-Path $root "lib\db")
try {
  pnpm exec drizzle-kit push
  Write-Host "✓ DB jadvallari tayyor" -ForegroundColor Green
} catch {
  Write-Warning "drizzle-kit push xato berdi. Migration fayllarini qo'lda ishga tushiring:"
  Write-Host "  psql -U postgres -h localhost -d europrint -f drizzle\0000_nice_kylun.sql"
}
Pop-Location
Write-Host ""

# 4. Admin seed
Write-Host "→ Admin user yaratish..." -ForegroundColor Yellow
Push-Location (Join-Path $root "apps\api")
pnpm seed
Pop-Location
Write-Host "✓ Admin yaratildi (login: admin / Admin123!)" -ForegroundColor Green
Write-Host ""

# 5. Master Data seed
Write-Host "→ Master Data seed (110+ pos, 18 dept, 250+ perm)..." -ForegroundColor Yellow
Push-Location (Join-Path $root "apps\api")
try {
  pnpm seed:master-data
  Write-Host "✓ Master Data tayyor" -ForegroundColor Green
} catch {
  Write-Warning "Master Data seed xato — hozir bu ixtiyoriy"
}
Pop-Location
Write-Host ""

Write-Host "═══ Setup tugadi! ═══" -ForegroundColor Cyan
Write-Host "Endi `.\run-local.ps1` ishga tushiring." -ForegroundColor Yellow
