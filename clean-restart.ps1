# EuroPrint - Clean Restart Script (Windows PowerShell 5.1 mos)
# Foydalanish:
#   .\clean-restart.ps1           - tozalash + backend run
#   .\clean-restart.ps1 -NoStart  - faqat tozalash

param([switch]$NoStart)

$ErrorActionPreference = 'Continue'

function Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

# 1) Eski Node protsesslarini to'xtatish
Step "1/6  Eski Node protsesslarini to'xtatish"
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "    Stop PID $($_.Id)"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Portlarni egallagan protsesslarni topib o'chirish
foreach ($port in 3000, 20806, 20807, 5173) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object {
            $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "    Port $port band edi (PID $($p.Id) - $($p.ProcessName)) -- to'xtatildi"
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
Start-Sleep -Milliseconds 500

# 2) dist/ tozalash
Step "2/6  apps/api/dist/ tozalash"
$distPath = "apps\api\dist"
if (Test-Path $distPath) {
    Remove-Item -Recurse -Force $distPath -ErrorAction SilentlyContinue
    Write-Host "    $distPath o'chirildi"
} else {
    Write-Host "    $distPath yo'q (allaqachon toza)"
}

# 3) SWC va Nest cache
Step "3/6  Cache'larni tozalash"
$caches = @(
    "apps\api\.swc",
    "apps\api\node_modules\.cache",
    ".turbo",
    "node_modules\.cache"
)
foreach ($c in $caches) {
    if (Test-Path $c) {
        Remove-Item -Recurse -Force $c -ErrorAction SilentlyContinue
        Write-Host "    $c o'chirildi"
    }
}

# 4) Vite cache
Step "4/6  Vite cache tozalash"
Get-ChildItem -Path . -Recurse -Force -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq ".vite" -and $_.FullName -notlike "*\node_modules\*" } |
    ForEach-Object {
        Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
        Write-Host "    $($_.FullName) o'chirildi"
    }

# 5) PostgreSQL holati
Step "5/6  PostgreSQL servisi tekshiruvi"
$pg = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pg) {
    if ($pg.Status -ne 'Running') {
        Write-Host "    PostgreSQL to'xtagan, ishga tushiraman..."
        Start-Service $pg.Name -ErrorAction SilentlyContinue
    } else {
        Write-Host "    PostgreSQL ishlayapti ($($pg.Name))"
    }
} else {
    Write-Host "    PostgreSQL servisi topilmadi (ehtimol Docker'da)"
}

# 6) Backend run
if ($NoStart) {
    Write-Host ""
    Write-Host "OK: Tozalash yakunlandi (-NoStart)" -ForegroundColor Green
    return
}

Step "6/6  Backend ishga tushirish"
Write-Host "    DIQQAT: Brauzer'da Ctrl+Shift+R bosing!" -ForegroundColor Yellow
Write-Host ""
pnpm --filter @europrint/api run dev:unsafe
