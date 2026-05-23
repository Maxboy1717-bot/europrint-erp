# scripts/add-module-headers.ps1
# Adds a /** @module ... @description ... */ header to every TS/TSX source
# file that doesn't already have a leading /** doc-block. Idempotent. Only
# modifies leading content (prepends comment block); never touches code.

[CmdletBinding()]
param(
    [string]$RootPath = (Resolve-Path "$PSScriptRoot\.."),
    [switch]$DryRun,
    [int]$Limit = 0
)

$ErrorActionPreference = 'Stop'

function Get-ModuleDescription {
    param([string]$Path)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($Path)
    $rel  = $Path -replace [regex]::Escape($RootPath + [IO.Path]::DirectorySeparatorChar), ''
    $rel  = $rel -replace '\\', '/'

    if ($name -match '\.controller$')      { return @{ ShortName=$name; Desc="NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data." } }
    if ($name -match '\.service$')         { return @{ ShortName=$name; Desc="Business-logic service. Returns Result<T> from @common/result; never throws raw Errors." } }
    if ($name -match '\.module$')          { return @{ ShortName=$name; Desc="NestJS @Module() definition. Providers, controllers, and imports for this feature slice." } }
    if ($name -match '\.repo$' -or $name -match '\.repository$') { return @{ ShortName=$name; Desc="Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>." } }
    if ($name -match '\.guard$')           { return @{ ShortName=$name; Desc="NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise." } }
    if ($name -match '\.interceptor$')     { return @{ ShortName=$name; Desc="NestJS interceptor. Wraps request/response pipeline." } }
    if ($name -match '\.pipe$')            { return @{ ShortName=$name; Desc="NestJS pipe. Transforms or validates the request payload before the handler runs." } }
    if ($name -match '\.filter$')          { return @{ ShortName=$name; Desc="NestJS exception filter. Converts thrown errors to HTTP responses." } }
    if ($name -match '\.dto$')             { return @{ ShortName=$name; Desc="DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer." } }
    if ($name -match '\.handler$')         { return @{ ShortName=$name; Desc="CQRS command/query handler. execute() applies one use-case; returns Result<T>." } }
    if ($name -match '\.event$')           { return @{ ShortName=$name; Desc="Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus." } }
    if ($name -match '\.vo$')              { return @{ ShortName=$name; Desc="Value object. Immutable domain primitive with validation in its factory." } }
    if ($name -match '\.entity$')          { return @{ ShortName=$name; Desc="Domain entity. Aggregate root or child entity (Drizzle row + behavior)." } }
    if ($name -match '\.strategy$')        { return @{ ShortName=$name; Desc="Passport strategy. Extracts and validates auth credentials from the request." } }
    if ($name -match '\.decorator$')       { return @{ ShortName=$name; Desc="Custom NestJS decorator. Metadata attachment for guards/interceptors." } }
    if ($name -match '\.constants?$')      { return @{ ShortName=$name; Desc="Named-constant exports (business thresholds, enums, lookup tables)." } }
    if ($name -match '\.types$' -or $name -match '\.interface$') { return @{ ShortName=$name; Desc="Type-only exports (interfaces, type aliases, enums). No runtime code." } }
    if ($name -match '\.config$')          { return @{ ShortName=$name; Desc="Configuration loader. Wraps env vars via @nestjs/config ConfigService." } }
    if ($name -match '\.cron$')            { return @{ ShortName=$name; Desc="Scheduled cron job. @nestjs/schedule registered task." } }
    if ($name -match '\.processor$')       { return @{ ShortName=$name; Desc="BullMQ queue processor. Consumes jobs of one queue." } }
    if ($name -match '\.gateway$')         { return @{ ShortName=$name; Desc="NestJS WebSocket gateway. Socket.IO handlers." } }
    if ($name -match '\.spec$' -or $name -match '\.test$') { return @{ ShortName=$name; Desc="Jest / Vitest test suite." } }
    if ($name -match '\.seed$')            { return @{ ShortName=$name; Desc="Database seeder. Runs idempotent fixture inserts." } }
    if ($name -match 'index$')             { return @{ ShortName=$name; Desc="Barrel re-export file. Surfaces the public API of this folder." } }

    if ($rel -match 'lib/db/.*schema/')    { return @{ ShortName=$name; Desc="Drizzle ORM schema. Table definitions, CHECK constraints, FK relations." } }
    if ($rel -match 'erp-dashboard/.*pages/') { return @{ ShortName=$name; Desc="React page component. Route-level UI." } }
    if ($rel -match 'erp-dashboard/.*components/') { return @{ ShortName=$name; Desc="React UI component." } }
    if ($rel -match 'erp-dashboard/.*hooks/') { return @{ ShortName=$name; Desc="React custom hook." } }
    if ($rel -match 'erp-dashboard/.*store/') { return @{ ShortName=$name; Desc="Zustand / state-store slice." } }
    if ($rel -match 'erp-dashboard/.*lib/')   { return @{ ShortName=$name; Desc="Frontend utility / library module." } }
    if ($rel -match 'erp-dashboard/.*routes/') { return @{ ShortName=$name; Desc="Frontend route definition." } }
    if ($rel -match 'erp-dashboard/.*locales/') { return @{ ShortName=$name; Desc="i18n locale data." } }

    return @{ ShortName=$name; Desc="Source module. See exports for details." }
}

function Should-Skip {
    param([string]$Content, [string]$Path)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $true }
    $trimmed = $Content.TrimStart()
    if ($trimmed.StartsWith('/**')) { return $true }
    if ($Path -match '\\migrations\\\d+_') { return $true }
    return $false
}

$files = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path "$RootPath\apps","$RootPath\artifacts","$RootPath\lib" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch 'node_modules|dist|\.next|coverage|test-results|playwright-report|\.git' }

if ($Limit -gt 0) { $files = $files | Select-Object -First $Limit }

$modified = 0
$skipped = 0
$skippedReasons = @{}
$errors = 0
$samples = @()

foreach ($f in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($f.FullName)
        if (Should-Skip -Content $content -Path $f.FullName) {
            $skipped++
            $reason = if ([string]::IsNullOrWhiteSpace($content)) { 'empty' }
                      elseif ($content.TrimStart().StartsWith('/**')) { 'already-has-docblock' }
                      else { 'generated-or-migration' }
            if (-not $skippedReasons.ContainsKey($reason)) { $skippedReasons[$reason] = 0 }
            $skippedReasons[$reason]++
            continue
        }

        $info = Get-ModuleDescription -Path $f.FullName
        $header = "/**`r`n * @module $($info.ShortName)`r`n * @description $($info.Desc)`r`n */`r`n`r`n"

        if (-not $DryRun) {
            [System.IO.File]::WriteAllText($f.FullName, $header + $content, [System.Text.UTF8Encoding]::new($false))
        } else {
            if ($samples.Count -lt 3) { $samples += "[$($f.Name)] $($info.Desc)" }
        }
        $modified++
    } catch {
        $errors++
        Write-Warning "Error on $($f.FullName): $_"
    }
}

"Modified : $modified"
"Skipped  : $skipped"
"Errors   : $errors"
"--- Skip reasons:"
$skippedReasons.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "  $($_.Key) : $($_.Value)" }
if ($DryRun -and $samples.Count -gt 0) { "--- Samples:"; $samples | ForEach-Object { $_ } }
