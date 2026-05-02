# ============================================================================
# EuroPrint ERP — Barcha endpoint'larni avtomatik testlash
# Ishlatish: .\test-all-endpoints.ps1
#
# Bu skript:
#   1. Admin sifatida login qiladi
#   2. Barcha asosiy endpoint'larga so'rov yuboradi
#   3. Status kodlarini va xato matnlarini yig'adi
#   4. Hisobot chiqaradi: muvaffaqiyatli vs xato endpointlar
# ============================================================================

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  EuroPrint ERP — Endpoint Test" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Backend tirikligini tekshirish
Write-Host "→ Backend tirikligini tekshirish..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
  Write-Host "  [OK] Backend ishlayapti" -ForegroundColor Green
} catch {
  Write-Host "  [XATO] Backend javob bermayapti: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Avval backend'ni ishga tushiring: pnpm --filter @europrint/api run dev:unsafe" -ForegroundColor Yellow
  exit 1
}

# 2. Admin sifatida login
Write-Host ""
Write-Host "→ Admin login..." -ForegroundColor Yellow
try {
  $loginBody = @{ username = "admin"; password = "Admin123!" } | ConvertTo-Json
  $loginResult = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
    -Method Post `
    -Body $loginBody `
    -ContentType "application/json" `
    -TimeoutSec 10
  $token = $loginResult.access_token
  if (-not $token) { $token = $loginResult.token }
  if (-not $token) { $token = $loginResult.accessToken }
  if (-not $token) {
    Write-Host "  [XATO] Token topilmadi. Javob:" -ForegroundColor Red
    $loginResult | ConvertTo-Json -Depth 3
    exit 1
  }
  Write-Host "  [OK] Login muvaffaqiyatli" -ForegroundColor Green
} catch {
  Write-Host "  [XATO] Login bermadi: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

$headers = @{ "Authorization" = "Bearer $token" }

# 3. Barcha endpoint'larni testlash
Write-Host ""
Write-Host "→ Endpoint'larni testlash..." -ForegroundColor Yellow
Write-Host ""

# Endpoint ro'yxati (frontend log'idan olingan)
$endpoints = @(
  # Auth
  "/api/auth/me"
  # Director
  "/api/director/dashboard"
  "/api/director/summary"
  "/api/director/hr"
  "/api/director/finance"
  "/api/director/production"
  "/api/director/ai-summary"
  "/api/director/wms-rental"
  "/api/director/ideal-vs-actual"
  "/api/director/alerts"
  "/api/director/company-state/history"
  # Company state
  "/api/company-state/current"
  # EuroPrint Control
  "/api/europrint-control/director-summary"
  "/api/europrint-control/director-kpis"
  "/api/europrint-control/validation-summary"
  # Coordination
  "/api/coordination/councils"
  # CRM
  "/api/crm/leads"
  "/api/crm/deals"
  "/api/crm/contacts"
  # SD
  "/api/sd/customers?limit=50"
  "/api/sd/kpi/team?year=2026&month=4"
  "/api/sd/reports/funnel"
  # SAP
  "/api/sap/sales-orders"
  # Marketing
  "/api/marketing/segments"
  "/api/marketing/ai/hot-leads"
  "/api/marketing/leads/sources/summary"
  "/api/marketing/dashboard/stats"
  "/api/marketing/campaigns"
  "/api/marketing/inbox/stats"
  "/api/marketing/website/blog"
  "/api/marketing/nps/stats"
  "/api/marketing/churn-risk"
  "/api/marketing/leads"
  "/api/marketing/leads/automation/overdue-leads"
  "/api/marketing/leads/loss-analysis"
  "/api/marketing/content/posts"
  "/api/marketing/exhibitions"
  "/api/marketing/pr"
  "/api/marketing/budget?year=2026"
  "/api/marketing/settings"
  "/api/marketing/settings/social-api"
  # Other
  "/api/users"
  "/api/papka-orders"
)

$results = @()
$success = 0
$failed = 0

foreach ($ep in $endpoints) {
  $url = "$BaseUrl$ep"
  $shortName = $ep
  if ($shortName.Length -gt 60) { $shortName = $shortName.Substring(0, 60) + "..." }

  try {
    $response = Invoke-WebRequest -Uri $url -Headers $headers -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    $status = $response.StatusCode
    $color = "Green"
    $marker = "[OK]"
    $success++
    $errorMsg = ""
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if (-not $status) { $status = "ERR" }
    $color = "Red"
    $marker = "[FAIL]"
    $failed++

    # Xato matnini olish
    $errorMsg = ""
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $errorBody = $reader.ReadToEnd()
      $reader.Close()
      if ($errorBody.Length -gt 500) { $errorBody = $errorBody.Substring(0, 500) + "..." }
      $errorMsg = $errorBody
    } catch {
      $errorMsg = $_.Exception.Message
    }
  }

  Write-Host ("  {0,-7} {1,-65} {2}" -f $marker, $shortName, $status) -ForegroundColor $color

  $results += [PSCustomObject]@{
    Endpoint = $ep
    Status = $status
    Error = $errorMsg
  }
}

# 4. Hisobot
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  HISOBOT" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Jami:           $($endpoints.Count)" -ForegroundColor White
Write-Host "Muvaffaqiyatli: $success" -ForegroundColor Green
Write-Host "Xato berdi:     $failed" -ForegroundColor Red
Write-Host ""

if ($failed -gt 0) {
  Write-Host "============================================================================" -ForegroundColor Red
  Write-Host "  XATO BERGAN ENDPOINT'LAR (batafsil)" -ForegroundColor Red
  Write-Host "============================================================================" -ForegroundColor Red
  Write-Host ""

  $results | Where-Object { $_.Status -ne 200 -and $_.Status -ne 201 } | ForEach-Object {
    Write-Host "ENDPOINT: $($_.Endpoint)" -ForegroundColor Yellow
    Write-Host "STATUS:   $($_.Status)" -ForegroundColor Red
    if ($_.Error) {
      Write-Host "XATO:" -ForegroundColor Red
      Write-Host $_.Error -ForegroundColor Gray
    }
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor DarkGray
  }
}

# 5. Faylga saqlash
$reportPath = Join-Path $PSScriptRoot "endpoint-test-report.txt"
$report = @"
EuroPrint ERP — Endpoint Test Report
Sana: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Jami:           $($endpoints.Count)
Muvaffaqiyatli: $success
Xato berdi:     $failed

============================================================================
BATAFSIL
============================================================================

"@
foreach ($r in $results) {
  $report += "`nENDPOINT: $($r.Endpoint)`n"
  $report += "STATUS:   $($r.Status)`n"
  if ($r.Error) {
    $report += "XATO:`n$($r.Error)`n"
  }
  $report += "----------------------------------------------------------------------------`n"
}
$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host ""
Write-Host "Hisobot saqlandi: $reportPath" -ForegroundColor Cyan
Write-Host ""
