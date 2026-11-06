<#
.SYNOPSIS
    Prepares a Windows machine to develop Helper-ABI.

.DESCRIPTION
    1. Checks Node.js 26+, pnpm 12+ and uv (installs pnpm/uv if missing).
    2. Installs Python 3.15 through uv (does not touch the system Python).
    3. Creates .env.development from .env.example with a random INGEST_TOKEN.
    4. Installs JavaScript and Python dependencies.
    5. Applies database migrations and loads the approved base data.

    Safe to run several times. Run from any folder:
        powershell -ExecutionPolicy Bypass -File ".\scripts\setup.ps1"
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RootDir = Split-Path -Parent $PSScriptRoot

$RequiredNodeMajor = 26
$RequiredPnpm = '12.18.0'
$RequiredPython = '3.15'

function Write-Step([string]$Message) { Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "    OK  $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "    !!  $Message" -ForegroundColor Yellow }

function Update-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# ---------------------------------------------------------------- Node.js
Write-Step 'Checking Node.js'
if (-not (Test-Command 'node')) {
    throw "Node.js is not installed. Run: winget install --id OpenJS.NodeJS.LTS --exact"
}
$nodeVersion = (node --version).TrimStart('v')
if ([int]($nodeVersion.Split('.')[0]) -lt $RequiredNodeMajor) {
    throw "Node.js $nodeVersion found; $RequiredNodeMajor+ required. Run: winget upgrade --id OpenJS.NodeJS.LTS --exact"
}
Write-Ok "Node.js $nodeVersion"

# ---------------------------------------------------------------- pnpm
# Node 25+ no longer ships Corepack, so pnpm is installed with npm (user folder, no admin).
Write-Step 'Checking pnpm'
$pnpmVersion = if (Test-Command 'pnpm') { (pnpm --version) } else { '' }
if ($pnpmVersion -ne $RequiredPnpm) {
    Write-Warn "pnpm '$pnpmVersion' found; installing $RequiredPnpm"
    npm install --global "pnpm@$RequiredPnpm"
    Update-SessionPath
    $pnpmVersion = pnpm --version
}
Write-Ok "pnpm $pnpmVersion"

# ---------------------------------------------------------------- uv + Python
Write-Step 'Checking uv (Python manager)'
if (-not (Test-Command 'uv')) {
    Write-Warn 'uv not found; installing with winget (user scope)'
    winget install --id astral-sh.uv --exact --scope user --accept-source-agreements --accept-package-agreements
    Update-SessionPath
}
Write-Ok (uv --version)

Write-Step "Installing Python $RequiredPython with uv (system Python is not modified)"
uv python install $RequiredPython
Write-Ok (uv python find $RequiredPython)

# ---------------------------------------------------------------- .env.development
Write-Step 'Preparing .env.development'
$envExample = Join-Path $RootDir '.env.example'
$envDev = Join-Path $RootDir '.env.development'
if (Test-Path $envDev) {
    Write-Ok '.env.development already exists (left untouched)'
} else {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $token = ([System.BitConverter]::ToString($bytes) -replace '-', '').ToLower()
    $content = (Get-Content $envExample -Raw) -replace 'INGEST_TOKEN=.*', "INGEST_TOKEN=$token"
    [System.IO.File]::WriteAllText($envDev, $content, (New-Object System.Text.UTF8Encoding $false))
    Write-Ok '.env.development created with a random INGEST_TOKEN'
}

# ---------------------------------------------------------------- Dependencies
Write-Step 'Installing JavaScript dependencies (pnpm install)'
Push-Location $RootDir
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed' }

    Write-Step 'Installing Python dependencies (uv sync)'
    uv sync --directory services
    if ($LASTEXITCODE -ne 0) { throw 'uv sync failed' }

    Write-Step 'Preparing the development database (migrations + approved base data)'
    pnpm db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'Database migrations failed' }
    pnpm db:seed:base
    if ($LASTEXITCODE -ne 0) { throw 'Base data load failed' }
} finally {
    Pop-Location
}

Write-Host "`nSetup complete. Next steps:" -ForegroundColor Green
Write-Host '  pnpm check     # run every quality check'
Write-Host '  pnpm dev       # start API (http://127.0.0.1:4000) and panel (http://127.0.0.1:5173)'
