<#
.SYNOPSIS
    Rebuilds the LOCAL development database from scratch.

.DESCRIPTION
    Deletes the development SQLite file, applies every migration and loads the
    approved base data (data/knowledge). With -WithDummyData it also loads the
    DUMMY_ test data.

    Only works with NODE_ENV=development and SQLite. It never touches PostgreSQL
    or production data. Asks for confirmation unless -Force is given.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File ".\scripts\reset-db.ps1"
    powershell -ExecutionPolicy Bypass -File ".\scripts\reset-db.ps1" -WithDummyData -Force
#>
[CmdletBinding()]
param(
    [switch]$WithDummyData,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir '.env.development'

if ($env:NODE_ENV -and $env:NODE_ENV -ne 'development') {
    throw "Refusing to run: NODE_ENV is '$($env:NODE_ENV)'. This script only resets the development database."
}
if (-not (Test-Path $EnvFile)) {
    throw '.env.development not found. Run scripts/setup.ps1 first.'
}

# Read DB settings from .env.development
$settings = @{}
foreach ($line in Get-Content $EnvFile) {
    if ($line -match '^\s*([A-Z_]+)\s*=\s*(.*)\s*$') { $settings[$Matches[1]] = $Matches[2] }
}
$dialect = if ($settings['DB_DIALECT']) { $settings['DB_DIALECT'] } else { 'sqlite' }
if ($dialect -ne 'sqlite') {
    throw "Refusing to run: DB_DIALECT is '$dialect'. This script only resets the local SQLite database."
}
$storage = if ($settings['DB_STORAGE']) { $settings['DB_STORAGE'] } else { './data/helper-abi.development.sqlite' }
$dbPath = if ([System.IO.Path]::IsPathRooted($storage)) { $storage } else { Join-Path $RootDir $storage }
$dbPath = [System.IO.Path]::GetFullPath($dbPath)

Write-Host "Development database: $dbPath" -ForegroundColor Cyan
if (-not $Force) {
    $answer = Read-Host 'This deletes ALL local development data (raids, collected intel...). Type YES to continue'
    if ($answer -ne 'YES') {
        Write-Host 'Cancelled.' -ForegroundColor Yellow
        exit 0
    }
}

foreach ($suffix in @('', '-journal', '-wal', '-shm')) {
    $file = "$dbPath$suffix"
    if (Test-Path $file) { Remove-Item $file -Force }
}
Write-Host 'Old database removed.' -ForegroundColor Green

Push-Location $RootDir
try {
    pnpm db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'Migrations failed' }
    pnpm db:seed:base
    if ($LASTEXITCODE -ne 0) { throw 'Base seed failed' }
    if ($WithDummyData) {
        pnpm db:seed:dev
        if ($LASTEXITCODE -ne 0) { throw 'Dummy seed failed' }
    }
} finally {
    Pop-Location
}

Write-Host "`nDatabase ready." -ForegroundColor Green
