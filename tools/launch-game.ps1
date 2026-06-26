param(
  [switch]$NoServer,
  [switch]$NoBrowser,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $toolsDir
$logDir = Join-Path $root ".logs\runtime"
$clientUrl = "http://localhost:5173/"
$clientHealthUrl = "http://127.0.0.1:5173/"
$serverHealthUrl = "http://127.0.0.1:2567/health"

function Test-HttpOk {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  }
  catch {
    return $false
  }
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 45
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-HttpOk -Url $Url) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw "Service non pret apres $TimeoutSeconds s : $Url"
}

function Stop-WorkspaceListener {
  param(
    [int]$Port,
    [string]$Label
  )

  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    if ($processInfo -and $processInfo.CommandLine -like "*Reunion Island Wisdom*") {
      Write-Host "$Label : ancien process workspace sur port $Port stoppe (pid $($listener.OwningProcess))."
      Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

function Start-WorkspaceProcess {
  param(
    [string]$Name,
    [string]$Command,
    [string]$PidFile,
    [string]$LogFile,
    [string]$ErrorLogFile
  )

  $existingPid = $null
  if (Test-Path -LiteralPath $PidFile) {
    $existingPid = Get-Content -Raw -LiteralPath $PidFile
    $existingPid = $existingPid.Trim()
  }

  if ($existingPid -and (Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue)) {
    Write-Host "$Name deja lance (pid $existingPid)."
    return
  }

  $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
  $process = Start-Process -FilePath "powershell" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $encodedCommand) `
    -WorkingDirectory $root `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError $ErrorLogFile `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -LiteralPath $PidFile -Value $process.Id -NoNewline
  Write-Host "$Name lance (pid $($process.Id)). Log: $LogFile"
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Push-Location $root
try {
  if (-not $SkipInstall -and -not (Test-Path -LiteralPath (Join-Path $root "node_modules"))) {
    Write-Host "Installation pnpm..."
    corepack pnpm install
    if ($LASTEXITCODE -ne 0) {
      throw "Installation pnpm echouee."
    }
  }

  if (-not $NoServer -and -not (Test-HttpOk -Url $serverHealthUrl)) {
    Stop-WorkspaceListener -Port 2567 -Label "Serveur RIW"
    Start-WorkspaceProcess `
      -Name "Serveur RIW" `
      -Command "Set-Location '$root'; corepack pnpm dev:server" `
      -PidFile (Join-Path $logDir "server.pid") `
      -LogFile (Join-Path $logDir "server.log") `
      -ErrorLogFile (Join-Path $logDir "server.err.log")
  }

  if (-not (Test-HttpOk -Url $clientHealthUrl)) {
    Stop-WorkspaceListener -Port 5173 -Label "Client RIW"
    Start-WorkspaceProcess `
      -Name "Client RIW" `
      -Command "Set-Location '$root'; corepack pnpm --filter @riw/game-client exec vite --host 0.0.0.0 --strictPort" `
      -PidFile (Join-Path $logDir "client.pid") `
      -LogFile (Join-Path $logDir "client.log") `
      -ErrorLogFile (Join-Path $logDir "client.err.log")
  }

  if (-not $NoServer) {
    Wait-HttpOk -Url $serverHealthUrl -TimeoutSeconds 45
  }
  Wait-HttpOk -Url $clientHealthUrl -TimeoutSeconds 60

  if (-not $NoBrowser) {
    Start-Process $clientUrl
  }

  Write-Host "Jeu pret : $clientUrl"
  if (-not $NoServer) {
    Write-Host "Serveur pret : $serverHealthUrl"
  }
}
finally {
  Pop-Location
}
