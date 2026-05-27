# ============================================================================
# EuroPrint ERP — Windows'da local dev ishga tushirish
# ============================================================================
# Backend (NestJS, :3030) va Frontend (Vite, :20806) ni har biri alohida
# PowerShell oynasida ishga tushiradi.
#
# Ishlatish (PowerShell'da, shu papkadan):
#   .\run-dev.ps1
#
# Agar "running scripts is disabled" xatosi chiqsa, bir martalik:
#   powershell -ExecutionPolicy Bypass -File .\run-dev.ps1
#
# Talab: Node >=20, pnpm >=9, ishlab turgan PostgreSQL (:5432) va Redis (:6379).
# ============================================================================
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

function Info($m) { Write-Host "[run-dev] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[run-dev] $m" -ForegroundColor Yellow }

# --- 1. Talablar ------------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "node topilmadi. Node >=20 o'rnating." }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw "pnpm topilmadi. 'corepack enable' qiling." }

# --- 2. node_modules --------------------------------------------------------
if (-not (Test-Path "$root\node_modules")) {
  Info "node_modules yo'q — pnpm install..."
  pnpm install
} else {
  Info "node_modules mavjud."
}

# --- 3. PostgreSQL :5432 tekshirish -----------------------------------------
$pg = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $pg) { Warn "PostgreSQL :5432 da javob bermayapti — backend DB ga ulanmasligi mumkin." }
$redis = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $redis) { Warn "Redis :6379 da javob bermayapti — ba'zi funksiyalar ishlamasligi mumkin." }

# --- 4. lib/db build (backend dist/cjs ni require qiladi) -------------------
if (-not (Test-Path "$root\lib\db\dist\cjs\index.js")) {
  Info "lib/db build qilinmoqda..."
  pnpm --filter '@workspace/db' run build
} else {
  Info "lib/db allaqachon build qilingan."
}

# --- 5. Backend va Frontend ni alohida oynalarda ishga tushirish ------------
Info "Backend oynasi ochilmoqda → http://localhost:3030"
Start-Process powershell -ArgumentList @(
  '-NoExit','-Command',
  "Set-Location '$root'; Write-Host 'BACKEND (NestJS :3030)' -ForegroundColor Green; pnpm --filter '@europrint/api' run dev:unsafe"
)

Info "Frontend oynasi ochilmoqda → http://localhost:20806/erp-dashboard/"
Start-Process powershell -ArgumentList @(
  '-NoExit','-Command',
  "Set-Location '$root'; Write-Host 'FRONTEND (Vite :20806)' -ForegroundColor Green; pnpm --filter '@workspace/erp-dashboard' run dev"
)

Info "Ikkala oyna ochildi. Brauzerda oching: http://localhost:20806/erp-dashboard/"
Info "To'xtatish: ochilgan oynalarda Ctrl+C yoki oynalarni yoping."
