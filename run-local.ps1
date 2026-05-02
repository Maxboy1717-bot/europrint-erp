# ──────────────────────────────────────────────────────────────────────────────
# EuroPrint ERP — Local Windows runner
# Ishlatish: PowerShell'da `.\run-local.ps1`
# ──────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "═══ EuroPrint ERP — Local Windows ═══" -ForegroundColor Cyan
Write-Host ""

# 1. Node/pnpm tekshiruv
function Test-Command($name) {
  return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "node")) { throw "Node.js o'rnatilmagan. https://nodejs.org dan o'rnating." }
if (-not (Test-Command "pnpm")) { throw "pnpm o'rnatilmagan. 'npm install -g pnpm' bilan o'rnating." }
if (-not (Test-Command "psql")) { Write-Warning "psql topilmadi — DB skriptlarini qo'lda ishga tushiring." }

Write-Host "✓ Node:  $(node --version)" -ForegroundColor Green
Write-Host "✓ pnpm:  $(pnpm --version)" -ForegroundColor Green

# 2. .env tekshirish
$apiEnv = Join-Path $root "apps\api\.env"
if (-not (Test-Path $apiEnv)) {
  throw ".env fayli topilmadi: $apiEnv. README.md ga qarang."
}
Write-Host "✓ .env tayyor" -ForegroundColor Green
Write-Host ""

# 3. Dependencies
$nodeModules = Join-Path $root "node_modules"
if (-not (Test-Path $nodeModules)) {
  Write-Host "→ pnpm install (birinchi marta — ~10 daqiqa)..." -ForegroundColor Yellow
  Push-Location $root
  pnpm install
  Pop-Location
  Write-Host "✓ Dependencies o'rnatildi" -ForegroundColor Green
}
Write-Host ""

# 4. Backend va Frontend parallel ishga tushirish
Write-Host "→ Backend (port 8080) va Frontend (port 20806) ishga tushiriladi..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Brauzerda oching: http://localhost:20806/erp-dashboard/" -ForegroundColor Cyan
Write-Host "Login: admin / Admin123!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To'xtatish: Ctrl+C" -ForegroundColor Gray
Write-Host ""

# Backend yangi terminal'da
$backendCmd = "cd '$root'; pnpm --filter @europrint/api run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# 3 sekund kuting (backend boshlanishi uchun)
Start-Sleep -Seconds 3

# Frontend yangi terminal'da
$frontendCmd = "cd '$root'; pnpm --filter @workspace/erp-dashboard run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "✓ Ikki terminal ochildi (backend + frontend)" -ForegroundColor Green
Write-Host "Brauzer: http://localhost:20806/erp-dashboard/" -ForegroundColor Cyan
