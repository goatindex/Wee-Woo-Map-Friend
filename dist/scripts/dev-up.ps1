# .SYNOPSIS
#   Start or stop local dev backend (Flask) and static frontend server with health checks.
# .DESCRIPTION
#   Creates/uses .venv, installs backend requirements (unless -NoInstall), ensures backend .env,
#   starts Flask on the chosen port and Python http.server for the frontend, then probes /health and /index.html.
# .PARAMETER BackendPort
#   Port for the Flask backend (default 5000)
# .PARAMETER FrontendPort
#   Port for the static frontend server (default 8000)
# .PARAMETER BackendHost
#   Host for the Flask backend (default 127.0.0.1)
# .PARAMETER VenvPython
#   Path to python.exe inside .venv (auto-created if missing)
# .PARAMETER Stop
#   Stop previously started processes recorded in .dev/run.json
# .PARAMETER NoInstall
#   Skip "pip install -r backend/requirements.txt"
# .EXAMPLE
#   powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1
# .EXAMPLE
#   powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -BackendPort 5001 -FrontendPort 8001
# .EXAMPLE
#   powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -Stop
# Requires: Windows PowerShell 5.1+
# Purpose: Spin up local test infrastructure (backend + frontend) with health checks and version checks.
# Usage examples (run from repo root or any location):
#   powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -BackendPort 5001 -FrontendPort 8001
#   powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -Stop   # stops previously started processes

[CmdletBinding()]
param(
  [int]$BackendPort = 5000,
  [int]$FrontendPort = 8000,
  [string]$BackendHost = '127.0.0.1',
  # Path to venv python; if missing, script will attempt to create .venv using system python
  [string]$VenvPython = (Join-Path (Join-Path $PSScriptRoot '..') '.venv\Scripts\python.exe'),
  [switch]$Stop,
  [switch]$NoInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO ] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[ OK  ] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN ] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[FAIL ] $msg" -ForegroundColor Red }

function Get-RepoRoot {
  # scripts/ is one level below repo root
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Ensure-Directory($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }
}

function Wait-HttpOk($url, [int]$timeoutSec = 10) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
    }
    catch { }
    Start-Sleep -Milliseconds 300
  }
  return $false
}

function Port-InUse([int]$port) {
  try {
    $probe = Test-NetConnection -ComputerName '127.0.0.1' -Port $port -WarningAction SilentlyContinue
    return [bool]$probe.TcpTestSucceeded
  }
  catch { return $false }
}

function Show-PythonVersions($pythonExe) {
  try { & $pythonExe --version } catch { Write-Warn "Python not available at $pythonExe" }
  try { & $pythonExe -m pip --version } catch { Write-Warn "pip not available (yet)" }
  foreach ($pkg in @('Flask', 'requests', 'python-dotenv')) {
    try {
      $info = & $pythonExe -m pip show $pkg 2>$null
      if ($LASTEXITCODE -eq 0 -and $info) {
        $ver = ($info | Select-String '^Version:' | ForEach-Object { $_.ToString().Split(':')[1].Trim() })
        if ($ver) { Write-Host "$pkg $ver" } else { Write-Host "$pkg (installed)" }
      }
      else { Write-Host "$pkg (not installed)" }
    }
    catch { Write-Host "$pkg (not installed)" }
  }
}

function Get-PidsFile { Join-Path (Get-RepoRoot) ".dev\run.json" }

function Stop-Previous {
  $pidsFile = Get-PidsFile
  if (-not (Test-Path $pidsFile)) { Write-Warn "No PID file found ($pidsFile). Nothing to stop."; return }
  $data = Get-Content $pidsFile -Raw | ConvertFrom-Json
  foreach ($p in @($data.backendPid, $data.frontendPid)) {
    if ($p -and $p -gt 0) {
      try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Ok "Stopped PID $p" } catch { Write-Warn "Could not stop PID $p" }
    }
  }
  Remove-Item $pidsFile -ErrorAction SilentlyContinue
}

if ($Stop) { Stop-Previous; return }

$repoRoot = Get-RepoRoot
Write-Info "Repo root: $repoRoot"

# Ensure venv exists or create one
if (-not (Test-Path $VenvPython)) {
  Write-Warn ".venv Python not found at: $VenvPython"
  Write-Info "Attempting to create virtual environment (.venv) using system Python..."
  try {
    python --version | Out-Null
  }
  catch {
    Write-Err "System Python not found in PATH. Install Python or adjust -VenvPython path."
    exit 1
  }
  Push-Location $repoRoot
  try { python -m venv .venv } catch { Write-Err "Failed to create virtual environment"; Pop-Location; exit 1 }
  Pop-Location
  if (-not (Test-Path $VenvPython)) { Write-Err "Virtual environment creation appears to have failed."; exit 1 }
}

Write-Info "Using Python: $VenvPython"
Show-PythonVersions -pythonExe $VenvPython

if (-not $NoInstall) {
  Write-Info "Installing backend requirements..."
  & $VenvPython -m pip install -r (Join-Path $repoRoot 'backend\requirements.txt') | Write-Host
}

# Ensure backend/.env exists
$envFile = Join-Path $repoRoot 'backend\.env'
if (-not (Test-Path $envFile)) {
  $example = Join-Path $repoRoot 'backend\.env.example'
  if (Test-Path $example) {
    Copy-Item $example $envFile -Force
    Write-Warn "Created backend\\.env from example. Edit it to set WILLYWEATHER_API_KEY and ALLOWED_ORIGINS as needed."
  }
  else {
    Write-Warn "No backend\\.env or example found. Proceeding with default envs."
  }
}

# Start backend
if (Port-InUse -port $BackendPort) { Write-Warn "Port $BackendPort already in use. Will only run health check."; $backendProc = $null }
else {
  Write-Info "Starting backend on http://${BackendHost}:${BackendPort} ..."
  $backendProc = Start-Process -FilePath $VenvPython -ArgumentList (Join-Path $repoRoot 'backend\app.py') -WorkingDirectory $repoRoot -PassThru
}

$healthUrl = "http://${BackendHost}:${BackendPort}/health"
if (Wait-HttpOk -url $healthUrl -timeoutSec 12) { Write-Ok "Backend healthy at $healthUrl" } else { Write-Err "Backend failed health check at $healthUrl" }

# Start frontend
if (Port-InUse -port $FrontendPort) { Write-Warn "Port $FrontendPort already in use. Will only run health check."; $frontendProc = $null }
else {
  Write-Info "Starting frontend on http://127.0.0.1:$FrontendPort ..."
  $frontendProc = Start-Process -FilePath $VenvPython -ArgumentList "-m http.server $FrontendPort" -WorkingDirectory $repoRoot -PassThru
}

$indexUrl = "http://127.0.0.1:$FrontendPort/index.html"
if (Wait-HttpOk -url $indexUrl -timeoutSec 8) { Write-Ok "Frontend serving $indexUrl" } else { Write-Err "Frontend failed check for $indexUrl" }

# Record PIDs for easy teardown
Ensure-Directory (Join-Path $repoRoot '.dev')
$runInfo = [ordered]@{
  startedAt   = (Get-Date).ToString('s')
  repoRoot    = $repoRoot
  backend     = "http://${BackendHost}:${BackendPort}"
  frontend    = "http://127.0.0.1:$FrontendPort"
  backendPid  = ($backendProc.Id  | ForEach-Object { $_ })
  frontendPid = ($frontendProc.Id | ForEach-Object { $_ })
}
$runInfo | ConvertTo-Json | Set-Content (Get-PidsFile)

Write-Host ""; Write-Ok "Ready"
Write-Host "Backend: $($runInfo.backend)" -ForegroundColor Gray
Write-Host "Frontend: $($runInfo.frontend)" -ForegroundColor Gray
Write-Host "(Stop later with: powershell -File scripts/dev-up.ps1 -Stop)" -ForegroundColor DarkYellow
