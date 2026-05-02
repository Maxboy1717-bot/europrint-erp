# EuroPrint ERP - Diagnose script (ASCII only)
# Usage: .\diagnose-all.ps1

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:3000"
$LogFile = Join-Path $PSScriptRoot "backend.log"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  EuroPrint ERP - Diagnose" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Backend check
Write-Host "[1/4] Backend check..." -ForegroundColor Yellow
try {
  $null = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
  Write-Host "  OK - Backend running on port 3000" -ForegroundColor Green
} catch {
  Write-Host "  ERROR - Backend not responding" -ForegroundColor Red
  Write-Host "  Start it first: pnpm --filter @europrint/api run dev:unsafe" -ForegroundColor Yellow
  exit 1
}

# 2. Login
Write-Host ""
Write-Host "[2/4] Admin login..." -ForegroundColor Yellow
try {
  $loginBody = @{ username = "admin"; password = "Admin123!" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 10
  $token = $r.access_token
  if (-not $token) { $token = $r.token }
  if (-not $token) { $token = $r.accessToken }
  if (-not $token) {
    Write-Host "  ERROR - Token not found" -ForegroundColor Red
    exit 1
  }
  Write-Host "  OK - Login successful" -ForegroundColor Green
} catch {
  Write-Host "  ERROR - $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
$headers = @{ "Authorization" = "Bearer $token" }

# 3. Test endpoints
Write-Host ""
Write-Host "[3/4] Testing endpoints..." -ForegroundColor Yellow
Write-Host ""

$endpoints = @(
  "/api/auth/me",
  "/api/director/dashboard",
  "/api/director/summary",
  "/api/director/hr",
  "/api/director/finance",
  "/api/director/production",
  "/api/director/ai-summary",
  "/api/director/wms-rental",
  "/api/director/ideal-vs-actual",
  "/api/director/alerts",
  "/api/director/company-state/history",
  "/api/company-state/current",
  "/api/europrint-control/director-summary",
  "/api/europrint-control/director-kpis",
  "/api/europrint-control/validation-summary",
  "/api/coordination/councils",
  "/api/crm/leads",
  "/api/crm/deals",
  "/api/crm/contacts",
  "/api/sd/customers?limit=50",
  "/api/sd/kpi/team?year=2026&month=4",
  "/api/sd/reports/funnel",
  "/api/sap/sales-orders",
  "/api/marketing/segments",
  "/api/marketing/ai/hot-leads",
  "/api/marketing/leads/sources/summary",
  "/api/marketing/dashboard/stats",
  "/api/marketing/campaigns",
  "/api/marketing/inbox/stats",
  "/api/marketing/website/blog",
  "/api/marketing/nps/stats",
  "/api/marketing/churn-risk",
  "/api/marketing/leads",
  "/api/marketing/leads/automation/overdue-leads",
  "/api/marketing/leads/loss-analysis",
  "/api/marketing/content/posts",
  "/api/marketing/exhibitions",
  "/api/marketing/pr",
  "/api/marketing/budget?year=2026",
  "/api/marketing/settings",
  "/api/marketing/settings/social-api",
  "/api/users",
  "/api/papka-orders"
)

$results = @()
$ok = 0
$err500 = 0
$err400 = 0
$err401 = 0
$other = 0

foreach ($ep in $endpoints) {
  $shortName = if ($ep.Length -gt 55) { $ep.Substring(0, 55) + "..." } else { $ep }
  $errBody = ""
  try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl$ep" -Headers $headers -Method Get -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
    $code = $resp.StatusCode
    $marker = "OK   "
    $color = "Green"
    $ok++
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if (-not $code) { $code = 0 }
    if ($code -eq 500) { $err500++; $marker = "500  "; $color = "Red" }
    elseif ($code -eq 400) { $err400++; $marker = "400  "; $color = "Yellow" }
    elseif ($code -eq 401) { $err401++; $marker = "401  "; $color = "Magenta" }
    else { $other++; $marker = "ERR  "; $color = "DarkRed" }
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $errBody = $reader.ReadToEnd()
      $reader.Close()
    } catch { $errBody = $_.Exception.Message }
  }
  Write-Host ("  [{0}] {1,-58} {2}" -f $marker, $shortName, $code) -ForegroundColor $color
  $results += [PSCustomObject]@{
    Endpoint = $ep
    Status = $code
    Error = $errBody
  }
}

# 4. Backend log analysis
Write-Host ""
Write-Host "[4/4] Backend log analysis..." -ForegroundColor Yellow

$logErrors500 = @{}
$logErrors400 = @{}
if (Test-Path $LogFile) {
  $logContent = Get-Content $LogFile -Raw
  $sqlPattern = '\[GlobalExceptionFilter\] \[CRITICAL\] INTERNAL_SERVER_ERROR \(500\) on (\S+):\s*(.+?)(?=\r?\n\[|\r?\n\{)'
  $badPattern = '\[GlobalExceptionFilter\] \[WARNING\] BAD_REQUEST \(400\) on (\S+):\s*(.+?)(?=\r?\n\[|\r?\n\{)'

  foreach ($m in [regex]::Matches($logContent, $sqlPattern, 'Singleline')) {
    $logErrors500[$m.Groups[1].Value] = $m.Groups[2].Value
  }
  foreach ($m in [regex]::Matches($logContent, $badPattern, 'Singleline')) {
    $logErrors400[$m.Groups[1].Value] = $m.Groups[2].Value
  }
  Write-Host "  Log 500 errors: $($logErrors500.Count)" -ForegroundColor Red
  Write-Host "  Log 400 errors: $($logErrors400.Count)" -ForegroundColor Yellow
} else {
  Write-Host "  WARNING - backend.log not found" -ForegroundColor Yellow
  Write-Host "  Run backend like this for clean log:" -ForegroundColor Gray
  Write-Host '  pnpm --filter @europrint/api run dev:unsafe 2>&1 | Tee-Object -FilePath backend.log' -ForegroundColor White
}

# Report
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  REPORT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host ("Total endpoints: {0}" -f $endpoints.Count) -ForegroundColor White
Write-Host ("OK 200/201:      {0}" -f $ok) -ForegroundColor Green
Write-Host ("FAIL 500:        {0}" -f $err500) -ForegroundColor Red
Write-Host ("FAIL 400:        {0}" -f $err400) -ForegroundColor Yellow
Write-Host ("AUTH 401:        {0}" -f $err401) -ForegroundColor Magenta
Write-Host ("OTHER:           {0}" -f $other) -ForegroundColor DarkRed
Write-Host ""

if ($err500 -gt 0 -or $err400 -gt 0) {
  Write-Host "--- FAILED ENDPOINTS WITH SQL ERRORS ---" -ForegroundColor Red
  Write-Host ""
  foreach ($r in $results) {
    if ($r.Status -ne 200 -and $r.Status -ne 201 -and $r.Status -ne 401) {
      Write-Host "[$($r.Status)] $($r.Endpoint)" -ForegroundColor Yellow
      $sqlError = ""
      if ($logErrors500.ContainsKey($r.Endpoint)) { $sqlError = $logErrors500[$r.Endpoint] }
      elseif ($logErrors400.ContainsKey($r.Endpoint)) { $sqlError = $logErrors400[$r.Endpoint] }
      if ($sqlError) {
        $shortSql = if ($sqlError.Length -gt 400) { $sqlError.Substring(0, 400) + "..." } else { $sqlError }
        Write-Host "  SQL: $shortSql" -ForegroundColor Gray
      }
      Write-Host ""
    }
  }
}

# Save report
$reportPath = Join-Path $PSScriptRoot "diagnose-report.txt"
$report = "EuroPrint Diagnose Report`n"
$report += "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$report += "=== SUMMARY ===`n"
$report += "Total:  $($endpoints.Count)`n"
$report += "OK:     $ok`n"
$report += "500:    $err500`n"
$report += "400:    $err400`n"
$report += "401:    $err401`n"
$report += "Other:  $other`n`n"
$report += "=== ALL ENDPOINTS ===`n`n"
foreach ($r in $results) {
  $report += "[$($r.Status)] $($r.Endpoint)`n"
  if ($r.Error -and $r.Status -ne 200 -and $r.Status -ne 201) {
    $report += "RESPONSE: $($r.Error)`n"
  }
  $sqlError = ""
  if ($logErrors500.ContainsKey($r.Endpoint)) { $sqlError = $logErrors500[$r.Endpoint] }
  elseif ($logErrors400.ContainsKey($r.Endpoint)) { $sqlError = $logErrors400[$r.Endpoint] }
  if ($sqlError) {
    $report += "SQL ERROR: $sqlError`n"
  }
  $report += ("-" * 80) + "`n"
}

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Report file: $reportPath" -ForegroundColor Cyan
Write-Host "Send this file to AI assistant for fix." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
