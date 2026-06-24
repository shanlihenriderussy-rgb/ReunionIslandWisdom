# Reunion Island Wisdom

MMORPG 3D web/PWA situé à La Réunion.

## Stack

- `apps/game-client` : Vite + TypeScript + Three.js + Rapier + Colyseus client
- `apps/game-server` : Colyseus authoritative server
- `packages/shared` : protocoles et schemas partagés
- `packages/content` : contenu jeu typé

## Lancement

```bash
corepack enable
pnpm install
pnpm dev
```

Client : http://localhost:5173  
Serveur : ws://localhost:2567

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

Contrat MCP local : `mcp/riw-build-cook.mcp.json`.