# Spawn zone sync — 2026-06-27

## Contexte

Le spawn initial et le focus de la carte étaient hardcodés sur `WEST_BLOCKOUT_SPAWN` même quand
`?visualZone=fournaise` était actif. Résultat : le joueur apparaissait en mer côté Ouest en mode
Fournaise, et la carte restait centrée sur Saint-Paul.

## Changements

**`apps/game-client/src/game/GameApp.ts`**

- Remplacé la fonction `getInitialWestSpawn()` par `getInitialSpawn()` (zone-aware) :
  - `?visualZone=fournaise` → `FOURNAISE_SPAWN` (65.9, 9, -35, yaw: π)
  - `?spawn=maido` → dernier point de `WEST_BLOCKOUT_PATH` (debug sentier)
  - défaut → `WEST_BLOCKOUT_SPAWN` (Saint-Paul / Saint-Gilles)
- `configureScene()` utilise `getInitialSpawn()` au lieu de `WEST_BLOCKOUT_SPAWN` hardcodé.
- `updateMapDebugCamera()` centre la vue carte sur `getInitialSpawn().x/z` au lieu de l'origine.
- Import `FOURNAISE_SPAWN` depuis `../render/fournaise`.

## Résultat

- `?visualZone=fournaise` : spawn rebord cratère Dolomieu, carte centrée sur la Fournaise.
- `?visualZone=west` (défaut) : spawn Saint-Paul / Saint-Gilles, carte centrée sur l'Ouest.
- `?spawn=maido` : spawn fin sentier Ouest (mode debug inchangé).

## MAJ 2026-06-27 (Claude) — serveur aligne + decision actee

- Decision Shan (ADR-016) : defaut = Ouest, confirme. Le client portait temporairement un defaut Fournaise (chantier combat) -> remis sur Ouest.
- Serveur aligne : `ReunionWorldRoom.startZone` passe a `saint-paul-saint-gilles` (avant : `piton-de-la-fournaise`). Client et serveur coherents -> fin de la desync.
- Note : `?visualZone=fournaise` ne deplace que le client ; le serveur reste Ouest -> a la Fournaise, desync (les cibles combat ne sont coherentes que si le serveur y est aussi). Cf. ADR-016 (combat dormant au spawn Ouest).

## Refs

- [[02-backlog]] P1 "choisir la zone active"
- [[12-phase-1-level-design]] spawn Fournaise
- [[04-decisions]] ADR-016
