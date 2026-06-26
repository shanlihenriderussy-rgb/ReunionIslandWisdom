param()

$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $toolsDir
$logDir = Join-Path $root ".logs\runtime"

function Stop-ProcessTree {
  param([int]$RootPid)

  $children = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ParentProcessId -eq $RootPid }

  foreach ($child in $children) {
    Stop-ProcessTree -RootPid $child.ProcessId
  }

  Stop-Process -Id $RootPid -Force -ErrorAction SilentlyContinue
}

foreach ($name in @("client", "server")) {
  $pidFile = Join-Path $logDir "$name.pid"
  if (-not (Test-Path -LiteralPath $pidFile)) {
    continue
  }

  $pidValue = (Get-Content -Raw -LiteralPath $pidFile).Trim()
  if ($pidValue) {
    $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
    if ($process) {
      Stop-ProcessTree -RootPid $process.Id
      Write-Host "$name stoppe (pid $($process.Id))."
    }
  }

  Remove-Item -LiteralPath $pidFile -Force
}

$workspaceProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.CommandLine -like "*Reunion Island Wisdom*" -and
    ($_.CommandLine -like "*dev:client*" -or
      $_.CommandLine -like "*dev:server*" -or
      $_.CommandLine -like "*vite --host*" -or
      $_.CommandLine -like "*tsx watch*")
  }

foreach ($processInfo in $workspaceProcesses) {
  Stop-ProcessTree -RootPid $processInfo.ProcessId
}

Write-Host "Services RIW arretes."
