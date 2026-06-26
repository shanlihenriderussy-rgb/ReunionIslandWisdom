# Reunion Island Wisdom

MMORPG 3D web/PWA situé à La Réunion.

## Stack

- `apps/game-client` : Vite + TypeScript + Three.js + Rapier + Colyseus client
- `apps/game-server` : Colyseus authoritative server
- `packages/shared` : protocoles et schemas partagés
- `packages/content` : contenu jeu typé

## Lancement

```powershell
corepack enable
corepack pnpm install
corepack pnpm launch:web
```

Client : http://localhost:5173  
Serveur : ws://localhost:2567

Arret des services locaux :

```powershell
corepack pnpm stop:web
```

Smoke test sans ouvrir le navigateur :

```powershell
corepack pnpm launch:web:no-browser
corepack pnpm stop:web
```

## Programme installable / zip

PWA web installable : manifest + service worker dans `apps/game-client/public/`.

```powershell
corepack pnpm release:web
```

Sortie : `output/reunion-island-wisdom-web-<version>-<timestamp>.zip`

Sans rebuild, depuis un `dist` existant :

```powershell
corepack pnpm package:web
```

Desktop Windows :

```powershell
corepack pnpm launch:desktop
```

Rebuild desktop :

```powershell
corepack pnpm cook:desktop
```

Sortie executable : `apps/game-client/src-tauri/target/release/riw.exe`

Contrat MCP local : `mcp/riw-build-cook.mcp.json`.
