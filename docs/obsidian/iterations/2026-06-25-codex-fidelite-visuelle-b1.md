# 2026-06-25 - Codex fidelite visuelle B1 Saint-Paul / Saint-Gilles

## Reference cible

- Source : `docs/Refs/Moodboards par zone/B1. Saint-Paul  Saint-Gilles — littoral ouest (zone de départ)/B1. Saint-Paul  Saint-Gilles — littoral ouest (zone de départ).png`
- Cible : lagon turquoise, sable clair, ecume blanche, rochers gris/noirs, vegetation tropicale lisible, petit village creole, ponton/barque, chemin clair.

## Prompt execute

Voir [[../26-cowork-claude-codex-fidelite-visuelle]] section "Prompt Codex 5.5".

## Ecart constate

| Reference B1 | Ecart runtime | Action Codex |
| --- | --- | --- |
| Lagon turquoise + recifs visibles | Les patchs lagon/foam existaient mais seulement en `?mapDebug` | Lagon patches + ecume visibles en vue normale |
| Shoreline sable + eau | La shoreline n'ajoutait que le sable, pas le trim mer | Ajout du trim mer turquoise le long de la cote ouest |
| Village creole distant | Kiosk seul, pas d'arriere-plan habite | Ajout de 4 petites cases creoles procedurales, distantes |
| Ponton + barque | Absents de la vue normale | Ajout ponton bois + barque low-poly proceduraux |
| Chemin clair sable/terre | Sentier trop orange / route posee | Palette du ruban sentier adoucie vers sable/terre claire |
| Lisibilite code | Deux fonctions collees sans ligne vide | Nettoyage format `sampleHeight` / `distanceToPath` |

## Diff runtime

- `apps/game-client/src/render/westScenic.ts`
  - `createWestVectorShoreline` ajoute maintenant `sea` + `sand`.
  - `createLagoonPatches` et `createFoamBands` ne sont plus reserves a `?mapDebug`.
  - Ajout procedural : `createCreoleVillage`, `createCreoleHouse`, `createWoodPier`, `createFishingBoat`.
- `apps/game-client/src/render/westBlockout.ts`
  - couleurs du chemin reorientees vers sable/terre claire.
- `apps/game-client/src/render/westVegetation.ts`
  - nettoyage de format.

## Contraintes respectees

- Pas d'asset externe.
- Pas de package ajoute.
- Pas de logique gameplay dans `world.ts`.
- Ajouts justifies par la reference B1.
- Scope limite a Saint-Paul / Saint-Gilles.

## Validation

- `corepack pnpm --filter @riw/game-client typecheck` : OK.
- `corepack pnpm --filter @riw/game-client lint` : OK.
- `corepack pnpm --filter @riw/game-client build` : OK.
- Capture Playwright desktop :
  - `iterations/2026-06-25-codex-fidelite-visuelle-b1/b1-runtime-desktop-final.png`.

## Reste

- Revalider par capture desktop/mobile.
- Corriger l'element clair trop proche du premier plan gauche (probable prop/ponton/palmier/cote trop pres camera) : il coupe encore la lecture lagon.
- Reduire HUD mock pour mieux voir la scene.
- Aligner zone active/HUD/objectifs pour sortir du no-go public.
- Remplacer les cases procedurales par GLB custom quand la direction B1 est validee.
