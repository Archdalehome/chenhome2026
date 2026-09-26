<#
.SYNOPSIS
  Smoke test for the Casa Plume Pages Functions API (Cloudflare D1 + R2).

  NOTE: This file is intentionally ASCII-only. Windows PowerShell 5.1 reads
  .ps1 files as ANSI unless they carry a UTF-8 BOM, which would corrupt
  non-ASCII text and even break parsing. Keep it ASCII.

.EXAMPLE
  # Local: npm run build && npm run dev:setup && npm run db:init:local
  #        then "npm run preview:cf" in another terminal
  npm run smoke:local

.EXAMPLE
  # Production, including auth checks
  powershell -File dev/smoke-test.ps1 -BaseUrl https://chenhome2026.pages.dev -Email you@example.com -Password 'secret'

.EXAMPLE
  # Also write a subscriber row and test the R2 upload round-trip
  powershell -File dev/smoke-test.ps1 -Email you@example.com -Password 'secret' -Write -Upload
#>
[CmdletBinding()]
param(
  [string]$BaseUrl = 'http://127.0.0.1:8788',
  [string]$Email = '',
  [string]$Password = '',
  [switch]$Write,
  [switch]$Upload
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$script:failures = 0

function Ok([string]$message) { Write-Host "  [OK]   $message" -ForegroundColor Green }
function Bad([string]$message) { Write-Host "  [FAIL] $message" -ForegroundColor Red; $script:failures++ }
function Info([string]$message) { Write-Host "  [--]   $message" -ForegroundColor DarkGray }

function Get-Json([string]$path) {
  try { return Invoke-RestMethod -Uri "$BaseUrl$path" -Method Get -TimeoutSec 25 } catch { return $null }
}

function Get-Status([string]$path) {
  try { return (Invoke-WebRequest -Uri "$BaseUrl$path" -UseBasicParsing -TimeoutSec 25).StatusCode }
  catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode } else { return 0 } }
}

Write-Host "`n=== Casa Plume smoke test: $BaseUrl ===`n" -ForegroundColor Cyan

# 1. Static assets
Write-Host '1) Static assets'
try {
  $homePage = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 25
  if ($homePage.StatusCode -eq 200 -and $homePage.Content -match 'Casa Plume') { Ok 'GET / -> 200 with expected content' }
  else { Bad 'GET / returned unexpected content' }
} catch { Bad "GET / failed: $($_.Exception.Message)" }

foreach ($path in @('/shop', '/collections', '/about', '/cart', '/sitemap.xml', '/robots.txt')) {
  $status = Get-Status $path
  if ($status -eq 200) { Ok "$path -> 200" } else { Bad "$path -> $status (expected 200)" }
}

# Pages redirects /404.html -> /404, so check a real unknown path instead
$status = Get-Status '/this-page-should-not-exist'
if ($status -eq 404) { Ok 'Unknown path -> 404 (custom 404 page in use)' } else { Bad "Unknown path -> $status (expected 404)" }

# 2. Public API (D1 through Pages Functions)
Write-Host "`n2) Public API"
$products = Get-Json '/api/products'
if ($products -is [System.Array] -and $products.Count -gt 0) { Ok "GET /api/products -> $($products.Count) products" }
elseif ($null -eq $products) { Bad 'GET /api/products failed (D1 binding missing, or schema.sql not applied?)' }
else { Bad 'GET /api/products returned an empty list' }

$collections = Get-Json '/api/collections'
if ($collections -is [System.Array] -and $collections.Count -gt 0) { Ok "GET /api/collections -> $($collections.Count) collections" }
else { Bad 'GET /api/collections failed' }

$homeContent = Get-Json '/api/home-content'
if ($homeContent -is [System.Array] -and $homeContent.Count -gt 0) { Ok "GET /api/home-content -> $($homeContent.Count) sections" }
else { Bad 'GET /api/home-content failed' }

# 3. Auth guards
Write-Host "`n3) Auth"
$session = Get-Json '/api/auth/session'
if ($null -ne $session) { Ok "GET /api/auth/session -> authenticated=$($session.authenticated)" }
else { Bad 'GET /api/auth/session failed' }

$status = Get-Status '/api/subscribers'
if ($status -eq 401 -or $status -eq 403) { Ok "GET /api/subscribers without session -> $status (correctly denied)" }
else { Bad "GET /api/subscribers without session -> $status (expected 401/403)" }

# 4. Admin flow
if ($Email -and $Password) {
  Write-Host "`n4) Admin account"
  $web = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $body -ContentType 'application/json' -WebSession $web -TimeoutSec 25 | Out-Null
    Ok "Login succeeded: $Email"
    try {
      $subs = Invoke-RestMethod -Uri "$BaseUrl/api/subscribers" -WebSession $web -TimeoutSec 25
      Ok "GET /api/subscribers with session -> $($subs.Count) rows"
    } catch { Bad 'GET /api/subscribers with session failed' }
  } catch { Bad "Login failed: $($_.Exception.Message)" }

  $badBody = @{ email = $Email; password = 'definitely-wrong-password' } | ConvertTo-Json -Compress
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $badBody -ContentType 'application/json' -TimeoutSec 25 | Out-Null
    Bad 'Login with a wrong password SUCCEEDED - authentication is broken'
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    if ($code -eq 401) { Ok 'Login with a wrong password -> 401' } else { Bad "Login with a wrong password -> $code (expected 401)" }
  }
} else {
  Info 'No -Email/-Password given, skipping admin checks'
}

# 5. Optional write test
if ($Write) {
  Write-Host "`n5) Subscribe (write)"
  $testEmail = "smoke+$(Get-Random)@example.com"
  $body = @{ email = $testEmail } | ConvertTo-Json -Compress
  try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/subscribe" -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 25
    Ok "POST /api/subscribe -> ok (alreadySubscribed=$($result.alreadySubscribed))"
  } catch { Bad "POST /api/subscribe failed: $($_.Exception.Message)" }
} else {
  Info 'No -Write given, skipping subscribe test'
}

# 6. Optional R2 upload round-trip (uses curl.exe, shipped with Windows 10+)
if ($Upload) {
  Write-Host "`n6) R2 upload (write)"
  if (-not ($Email -and $Password)) {
    Bad '-Upload requires -Email and -Password'
  } elseif (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
    Info 'curl.exe not found, skipping upload test'
  } else {
    $pngPath = Join-Path $env:TEMP 'casaplume-smoke.png'
    $jarPath = Join-Path $env:TEMP 'casaplume-smoke-cookies.txt'
    [System.IO.File]::WriteAllBytes(
      $pngPath,
      [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
    )

    $loginFile = Join-Path $env:TEMP 'casaplume-smoke-login.json'
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
    Set-Content -LiteralPath $loginFile -Value $loginBody -Encoding ASCII
    # --data-binary @file: PowerShell would otherwise mangle the JSON quotes
    $loginJson = curl.exe -s -c $jarPath -X POST "$BaseUrl/api/auth/login" -H 'Content-Type: application/json' --data-binary "@$loginFile"
    if ($loginJson -match 'authenticated') { Ok 'Login via curl.exe succeeded (cookie jar written)' }
    else { Bad "Login via curl.exe failed: $loginJson" }

    $uploadJson = curl.exe -s -b $jarPath -X POST "$BaseUrl/api/upload" -F "file=@$pngPath;type=image/png"
    $url = $null
    try { $url = ($uploadJson | ConvertFrom-Json).url } catch { }
    if ($url) {
      Ok "POST /api/upload -> $url"
      $headers = (curl.exe -sI -b $jarPath "$BaseUrl$url") -join ' '
      if ($headers -match '200') { Ok 'GET uploaded image -> 200' } else { Bad "GET uploaded image failed: $headers" }
      if ($headers -match 'image/png') { Ok 'Uploaded image served with Content-Type: image/png' } else { Bad 'Uploaded image Content-Type is not image/png' }
    } else {
      Bad "POST /api/upload failed: $uploadJson"
    }

    Remove-Item -LiteralPath $pngPath, $jarPath, $loginFile -Force -ErrorAction SilentlyContinue
  }
} else {
  Info 'No -Upload given, skipping R2 upload test'
}

Write-Host ''
if ($script:failures -eq 0) {
  Write-Host 'All checks passed.' -ForegroundColor Green
  exit 0
}
Write-Host "$script:failures check(s) failed." -ForegroundColor Red
exit 1
