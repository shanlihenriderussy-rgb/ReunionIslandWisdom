param(
  [switch]$SkipBuild,
  [string]$Version = ""
)

$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $toolsDir
$clientDir = Join-Path $root "apps\game-client"
$distDir = Join-Path $clientDir "dist"
$outputDir = Join-Path $root "output"
if ([string]::IsNullOrWhiteSpace($Version)) {
  $packageJson = Get-Content -Raw -LiteralPath (Join-Path $root "package.json") | ConvertFrom-Json
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $Version = "$($packageJson.version)-$stamp"
}

$stageName = "reunion-island-wisdom-web-$Version"
$stageDir = Join-Path $outputDir $stageName

if (-not $SkipBuild) {
  Push-Location $root
  try {
    corepack pnpm --filter "@riw/game-client" build
    if ($LASTEXITCODE -ne 0) {
      throw "Build client echoue : package annule."
    }
  }
  finally {
    Pop-Location
  }
}

$required = @(
  "index.html",
  "manifest.webmanifest",
  "sw.js",
  "icons\icon-192.png",
  "icons\icon-512.png"
)

foreach ($relative in $required) {
  $path = Join-Path $distDir $relative
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Package invalide : fichier manquant dans dist -> $relative"
  }
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
if (Test-Path -LiteralPath $stageDir) {
  Remove-Item -LiteralPath $stageDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stageDir | Out-Null

Copy-Item -Path (Join-Path $distDir "*") -Destination $stageDir -Recurse -Force

$installReadme = @"
Reunion Island Wisdom — package web installable

Contenu : build statique Vite/PWA.
Version : $Version

Test local :
  Extraire le zip dans un dossier vide.
  Se placer dans le dossier extrait, la ou se trouve index.html.
  python -m http.server 5173
  ouvrir http://localhost:5173

Installation navigateur :
  1. Servir le dossier en HTTP local ou HTTPS.
  2. Ouvrir Chrome/Edge.
  3. Utiliser Installer l'application dans la barre d'adresse.

Serveur multijoueur :
  Lancer le serveur Colyseus a part :
  corepack pnpm --filter @riw/game-server start

Note :
  Le zip ne contient pas les sources lourdes RGE ALTI.
  Il contient uniquement le build web distribuable.
"@
Set-Content -LiteralPath (Join-Path $stageDir "README_INSTALL.txt") -Value $installReadme -NoNewline

$zipPath = Join-Path $outputDir "$stageName.zip"
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -Path (Join-Path $stageDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Package OK: $zipPath"