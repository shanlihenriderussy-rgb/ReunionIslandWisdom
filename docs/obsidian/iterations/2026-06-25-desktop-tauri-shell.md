# 2026-06-25 — Bascule programme installable : PWA + zip + desktop Tauri

> Lie a [[../04-decisions]] ADR-009 (PWA + zip + MCP) et ADR-010 (Tauri desktop).
> Choix Shan : cible = "les deux" (PWA + desktop) ; serveur = client -> serveur distant.

## Contexte

Tournant demande par Shan : passer le projet en "programme installable et
zippable", style production engine, pilote via un contrat MCP Claude + Codex.

## Diff

PWA (deja pose par run precedent, conserve) :

- `apps/game-client/public/manifest.webmanifest` — nom, icones, `display: standalone`, `theme_color`.
- `apps/game-client/public/sw.js` — service worker : app shell network-first, assets `/assets/*` cache-first, WS jamais intercepte.
- `apps/game-client/public/icons/` — 192 / 512 / 512-maskable / 180 / favicon.
- `apps/game-client/index.html` — `<link rel=manifest>`, theme-color, apple-touch-icon.
- `apps/game-client/src/main.ts` — enregistrement SW en `import.meta.env.PROD` uniquement.

Zip (deja pose) :

- `tools/package-web-release.ps1` — build + stage `dist` + README_INSTALL + `Compress-Archive` -> `output/*.zip`.
- racine `package.json` — `cook:web`, `package:web`, `release:web`.

Desktop Tauri (ce run) :

- `apps/game-client/src-tauri/Cargo.toml` — crate `riw`, Tauri 2, profil release LTO/strip.
- `apps/game-client/src-tauri/tauri.conf.json` — `frontendDist ../dist`, `beforeBuildCommand` = build client, bundle `msi` + `nsis`, CSP `connect-src` limite a self + `wss://riw-game-server.fly.dev`.
- `apps/game-client/src-tauri/src/main.rs` + `src/lib.rs` — entree minimale, zero plugin.
- `apps/game-client/src-tauri/build.rs`, `capabilities/default.json` (`core:default`), `.gitignore` (`/target`), `icons/` (ico + png).
- `apps/game-client/package.json` — scripts `tauri` / `tauri:dev` / `tauri:build` + devDep `@tauri-apps/cli`.
- racine `package.json` — `desktop:dev`, `cook:desktop`.
- `mcp/riw-build-cook.mcp.json` — phase `cook-desktop` + artifact `desktopInstaller`.

## Tests

- `corepack pnpm install` : OK, `@tauri-apps/cli` installe.
- `corepack pnpm --filter @riw/game-client typecheck` : OK.
- `corepack pnpm --filter @riw/game-client lint` : OK.
- Rust disponible : `rustc 1.95.0`, `cargo 1.95.0`.
- `corepack pnpm cook:web` : OK.
  - Zip : `output/reunion-island-wisdom-web-0.1.0-20260625-054947.zip`.
- `corepack pnpm cook:desktop` : OK.
  - App : `apps/game-client/src-tauri/target/release/riw.exe`.
  - MSI : `apps/game-client/src-tauri/target/release/bundle/msi/Reunion Island Wisdom_0.1.0_x64_en-US.msi` (22,82 Mo).
  - Setup EXE : `apps/game-client/src-tauri/target/release/bundle/nsis/Reunion Island Wisdom_0.1.0_x64-setup.exe` (21,76 Mo).

Warnings :

- Vite : chunk JS > 500 kB (`index-DXgBlotc.js` 860,43 kB / gzip 233,09 kB).
- `pnpm install` : build scripts `esbuild`, `msgpackr-extract` ignores par la politique pnpm ; build Vite/Tauri passe quand meme.
- Tauri a telecharge WiX et NSIS au premier build, puis a produit les deux bundles.

## Risques

- WebView2 requis au 1er lancement Windows (fourni par l'installeur NSIS si configure).
- SmartScreen : binaire non signe -> avertissement. Signature reportee.
- GLB 18 Mo encore dans le bundle : alourdit zip + installeur. A sortir (deja en dette).
- Cache SW sur gros GLB a surveiller (eviction / mise a jour).

## Suite

1. Lancer le `.msi` ou le `setup.exe` sur Windows et verifier le premier lancement WebView2.
2. Sortir le GLB 18 Mo du build client (perf + poids paquet).
3. Brancher l'auto-progression objectif Fournaise sur la position joueur.
4. Decision signature de code Windows si distribution publique.
