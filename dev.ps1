$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = Join-Path $repoRoot '.venv\Scripts\python.exe'
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'

if (-not (Test-Path $pythonExe)) {
    Write-Error "Python virtual environment not found at $pythonExe"
}

Write-Host 'Starting backend (FastAPI) in background...'
$backendJob = Start-Job -Name 'mock-draft-backend' -ScriptBlock {
    param($backendPathArg, $pythonExeArg)
    Set-Location $backendPathArg
    & $pythonExeArg -m uvicorn main:app --reload
} -ArgumentList $backendPath, $pythonExe

try {
    Write-Host 'Starting frontend (Vite) in foreground...'
    Set-Location $frontendPath
    npm run dev
}
finally {
    Write-Host 'Stopping backend job...'
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
}
