# ============================================================================
# Backend log'idan faqat SQL xatolarini ajratib olish
# Ishlatish: backend log'ini fayl sifatida saqlang va shu skriptga bering
#
# Yoki backend run qilayotganda real-time:
#   pnpm --filter @europrint/api run dev:unsafe 2>&1 | Tee-Object -FilePath backend.log
#
# Keyin: .\extract-sql-errors.ps1 -LogFile backend.log
# ============================================================================

param(
  [string]$LogFile = "backend.log"
)

if (-not (Test-Path $LogFile)) {
  Write-Host "Log fayl topilmadi: $LogFile" -ForegroundColor Red
  Write-Host ""
  Write-Host "Backend log'ini saqlash uchun:" -ForegroundColor Yellow
  Write-Host "  pnpm --filter @europrint/api run dev:unsafe 2>&1 | Tee-Object -FilePath backend.log" -ForegroundColor White
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Backend SQL xatolarini ajratib olish" -ForegroundColor Cyan
Write-Host "  Log: $LogFile" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$content = Get-Content $LogFile -Raw
$lines = Get-Content $LogFile

# Pattern'lar
$sqlErrorPattern = '\[GlobalExceptionFilter\] \[CRITICAL\] INTERNAL_SERVER_ERROR \(500\) on (\S+):\s*(.+)'
$badRequestPattern = '\[GlobalExceptionFilter\] \[WARNING\] BAD_REQUEST \(400\) on (\S+):\s*(.+)'
$unauthorizedPattern = '\[GlobalExceptionFilter\] \[WARNING\] UNAUTHORIZED \(401\) on (\S+):\s*(.+)'

$errors500 = @{}
$errors400 = @{}
$errors401 = @{}

# Ko'p satrli regex bilan qidirish
$sqlMatches = [regex]::Matches($content, $sqlErrorPattern)
foreach ($m in $sqlMatches) {
  $endpoint = $m.Groups[1].Value
  $errorText = $m.Groups[2].Value
  if (-not $errors500.ContainsKey($endpoint)) {
    $errors500[$endpoint] = $errorText
  }
}

$badMatches = [regex]::Matches($content, $badRequestPattern)
foreach ($m in $badMatches) {
  $endpoint = $m.Groups[1].Value
  $errorText = $m.Groups[2].Value
  if (-not $errors400.ContainsKey($endpoint)) {
    $errors400[$endpoint] = $errorText
  }
}

$authMatches = [regex]::Matches($content, $unauthorizedPattern)
foreach ($m in $authMatches) {
  $endpoint = $m.Groups[1].Value
  if (-not $errors401.ContainsKey($endpoint)) {
    $errors401[$endpoint] = $true
  }
}

# Ekranga chiqarish
Write-Host "═══ 500 INTERNAL SERVER ERROR ($($errors500.Count) ta) ═══" -ForegroundColor Red
Write-Host ""
foreach ($ep in $errors500.Keys | Sort-Object) {
  Write-Host "ENDPOINT: $ep" -ForegroundColor Yellow
  $errMsg = $errors500[$ep]
  if ($errMsg.Length -gt 800) { $errMsg = $errMsg.Substring(0, 800) + "..." }
  Write-Host "XATO: $errMsg" -ForegroundColor Gray
  Write-Host "----------------------------------------------------------------------------" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "═══ 400 BAD REQUEST ($($errors400.Count) ta) ═══" -ForegroundColor Yellow
Write-Host ""
foreach ($ep in $errors400.Keys | Sort-Object) {
  Write-Host "ENDPOINT: $ep" -ForegroundColor Yellow
  $errMsg = $errors400[$ep]
  if ($errMsg.Length -gt 600) { $errMsg = $errMsg.Substring(0, 600) + "..." }
  Write-Host "XATO: $errMsg" -ForegroundColor Gray
  Write-Host "----------------------------------------------------------------------------" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "═══ 401 UNAUTHORIZED — Token muammosi ($($errors401.Count) ta) ═══" -ForegroundColor Magenta
Write-Host ""
foreach ($ep in $errors401.Keys | Sort-Object) {
  Write-Host "  $ep" -ForegroundColor White
}

# Faylga saqlash
$reportPath = Join-Path $PSScriptRoot "sql-errors-report.txt"
$report = "EuroPrint Backend Errors Report`nSana: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$report += "═══ 500 ERRORS ($($errors500.Count)) ═══`n`n"
foreach ($ep in $errors500.Keys | Sort-Object) {
  $report += "ENDPOINT: $ep`n"
  $report += "ERROR:    $($errors500[$ep])`n"
  $report += ("-" * 80) + "`n`n"
}
$report += "`n═══ 400 ERRORS ($($errors400.Count)) ═══`n`n"
foreach ($ep in $errors400.Keys | Sort-Object) {
  $report += "ENDPOINT: $ep`n"
  $report += "ERROR:    $($errors400[$ep])`n"
  $report += ("-" * 80) + "`n`n"
}
$report += "`n═══ 401 ERRORS ($($errors401.Count)) ═══`n`n"
foreach ($ep in $errors401.Keys | Sort-Object) {
  $report += "  $ep`n"
}

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host ""
Write-Host "Hisobot saqlandi: $reportPath" -ForegroundColor Cyan
Write-Host ""

# Yetishmayotgan jadvallar/ustunlarni topish
Write-Host "═══ AVTOMATIK TAHLIL ═══" -ForegroundColor Cyan
Write-Host ""

$missingTables = @{}
$missingColumns = @{}

foreach ($errMsg in $errors500.Values + $errors400.Values) {
  # FROM "table_name" yoki UPDATE "table_name"
  $tableMatches = [regex]::Matches($errMsg, '(?:FROM|UPDATE|INTO)\s+"?(\w+)"?')
  foreach ($tm in $tableMatches) {
    $t = $tm.Groups[1].Value
    if ($t -notmatch '^(SELECT|COUNT|SUM|COALESCE|FILTER|WHERE|AND|OR|CASE)$') {
      if (-not $missingTables.ContainsKey($t)) { $missingTables[$t] = 0 }
      $missingTables[$t]++
    }
  }
}

if ($missingTables.Count -gt 0) {
  Write-Host "Eng ko'p ishlatiladigan jadvallar (xato bergan SQL'larda):" -ForegroundColor Yellow
  $missingTables.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
    Write-Host ("  {0,-40} {1} ta xato" -f $_.Key, $_.Value) -ForegroundColor White
  }
}

Write-Host ""
