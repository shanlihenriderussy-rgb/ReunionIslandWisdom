# AGENTS.md - apps/game-client

## Secteur

Client jouable.
Stack : Vite + TypeScript + Three.js + DOM HUD.

Fichiers pivots :

```txt
src/main.ts
src/game/GameApp.ts
src/game/InputController.ts
src/game/camera.ts
src/game/collision.ts
src/render/world.ts
src/render/biomeScenic.ts
src/ui/hud.ts
src/network/NetworkClient.ts
src/styles.css
src/design-tokens.css
```

## Lecture obligatoire

Avant patch client :

1. `../../CLAUDE.md`
2. `../../docs/obsidian/09-direction-artistique.md`
3. `../../docs/obsidian/20-systeme-jeu-zones.md`
4. fichiers touches

Si HUD/UI :

1. `../../docs/obsidian/23-design-system-hud.md`
2. `../../docs/design-system/hud/tokens.css`
3. `src/design-tokens.css`

## Regles client

- Pas de React.
- Pas de framework UI.
- Three.js imperative seulement.
- `world.ts` = rendu monde, pas logique gameplay.
- HUD = DOM, pas dans `world.ts`.
- Client envoie des intentions. Serveur decide.
- Pas de secret dans `VITE_*`.
- Pas de donnees sensibles dans `localStorage`.
- Pas de PNJ visibles ou props random sans decision.
- Pas de mini-map/gauges/inventaire fake si gameplay non branche.

## Visuel

Direction : low-poly stylise, tropical, lisible, Reunion credible.

Avant ajout visuel :

- zone cible ;
- reference `docs/Refs` ;
- role gameplay ;
- budget perf ;
- note Obsidian.

`?visualZone=all&mapDebug` = audit technique, pas cible visuelle.
Travailler zone par zone.

## Validation

```powershell
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
corepack pnpm --filter @riw/game-client build
```

Si visuel :

```powershell
corepack pnpm dev:client
```

Verifier `http://localhost:5173/` ou `http://localhost:5173/?mapDebug`.
Si screenshot headless noir/inconclusif : ne pas le presenter comme preuve finale.
