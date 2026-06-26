param(
  [switch]$SkipWebBuild,
  [switch]$Launch
)

$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $toolsDir
$clientDir = Join-Path $root "apps\game-client"
$tauriDir = Join-Path $clientDir "src-tauri"
$exePath = Join-Path $tauriDir "target\release\riw.exe"
$bundleDir = Join-Path $tauriDir "target\release\bundle"

if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

Push-Location $root
try {
  if (-not $SkipWebBuild) {
    corepack pnpm --filter "@riw/game-client" build
    if ($LASTEXITCODE -ne 0) {
      throw "Build web client echoue."
    }
  }

  $tauriCliOk = $false
  Write-Host "Tentative bundle Tauri complet (msi/nsis)..."
  try {
    corepack pnpm --filter "@riw/game-client" tauri:build
    if ($LASTEXITCODE -eq 0) {
      $tauriCliOk = $true
    }
    else {
      Write-Warning "Tauri CLI JS bloque ou indisponible. Fallback Cargo release."
    }
  }
  catch {
    Write-Warning "Tauri CLI JS bloque ou indisponible. Fallback Cargo release."
  }

  if (-not $tauriCliOk) {
    Push-Location $tauriDir
    try {
      cargo build --release
      if ($LASTEXITCODE -ne 0) {
        throw "Cargo release echoue."
      }
    }
    finally {
      Pop-Location
    }
  }

  if (-not (Test-Path -LiteralPath $exePath)) {
    throw "Executable introuvable : $exePath"
  }

  $exe = Get-Item -LiteralPath $exePath
  Write-Host "Executable OK: $($exe.FullName) ($([Math]::Round($exe.Length / 1MB, 2)) Mo)"

  if (Test-Path -LiteralPath $bundleDir) {
    Get-ChildItem -LiteralPath $bundleDir -Recurse -Include "*.msi", "*.exe" -ErrorAction SilentlyContinue |
      Where-Object { -not $_.PSIsContainer } |
      ForEach-Object {
        Write-Host "Installer: $($_.FullName) ($([Math]::Round($_.Length / 1MB, 2)) Mo)"
      }
  }

  if ($Launch) {
    Start-Process -FilePath $exePath -WorkingDirectory (Split-Path $exePath)
  }
}
finally {
  Pop-Location
}
