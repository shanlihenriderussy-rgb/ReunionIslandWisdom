# 2026-06-26 - Fichiers de lancement / installation Windows

## Objectif

Rendre le jeu lancable par commandes simples, sans repasser par les details Tauri/Vite.

## Ajouts

- `tools/launch-game.ps1` : installe si `node_modules` manque, lance serveur Colyseus + client Vite, attend les health checks en `127.0.0.1`, ouvre `http://localhost:5173/` pour rester aligne avec Colyseus local.
- `tools/stop-game.ps1` : arrete les processus lances par le launcher via `.logs/runtime/*.pid`.
- `tools/build-desktop-release.ps1` : build web + tentative bundle Tauri complet, fallback `cargo build --release` si le binding natif `@tauri-apps/cli-win32-x64-msvc` est bloque par Windows Application Control.
- `tools/launch-desktop.ps1` : lance `apps/game-client/src-tauri/target/release/riw.exe`, avec rebuild optionnel.

## Scripts racine

- `corepack pnpm launch:web`
- `corepack pnpm launch:web:no-browser`
- `corepack pnpm stop:web`
- `corepack pnpm launch:desktop`
- `corepack pnpm cook:desktop`
- `corepack pnpm release:desktop`

## Note

Le fallback Cargo produit/rafraichit `riw.exe`.
Il ne regenere pas les installeurs MSI/NSIS si Tauri CLI JS reste bloque par Windows Application Control.
