param(
  [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $toolsDir
$exePath = Join-Path $root "apps\game-client\src-tauri\target\release\riw.exe"

if ($Rebuild -or -not (Test-Path -LiteralPath $exePath)) {
  & (Join-Path $toolsDir "build-desktop-release.ps1")
  if ($LASTEXITCODE -ne 0) {
    throw "Build desktop echoue."
  }
}

if (-not (Test-Path -LiteralPath $exePath)) {
  throw "Executable introuvable : $exePath"
}

Start-Process -FilePath $exePath -WorkingDirectory (Split-Path $exePath)
Write-Host "Jeu desktop lance : $exePath"
