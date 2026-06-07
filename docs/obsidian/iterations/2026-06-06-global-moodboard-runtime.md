---
type: iteration
date: 2026-06-06 18:31 +04:00
tags:
  - direction-artistique
  - moodboard
  - level-design
  - saint-paul
  - saint-gilles
---

# Iteration - B0 Global vers runtime jouable

## Reference

- Image source : `docs/Refs/Moodboards par zone/B0. Global/B0. Global.png`
- Capture runtime :

![[2026-06-06-global-moodboard-runtime/moodboard-scenic-thirdperson.png]]

![[2026-06-06-global-moodboard-runtime/moodboard-scenic-mapdebug.png]]

![[2026-06-06-global-moodboard-runtime/moodboard-scenic-mobile-mapdebug.png]]

## Lecture du moodboard

Le resultat cible ne vient pas d'une seule texture.

Il vient de 5 couches :

1. **Relief fort** : falaises, ravines, volcans, cotes decoupees.
2. **Chemin lisible** : le regard comprend ou marcher.
3. **Grappes d'assets** : palmiers, rochers, feuillages, cases, panneaux, pontons.
4. **Ambiance** : ciel clair, lagon turquoise, brume douce, soleil chaud.
5. **Cadrage** : camera plus basse, elements au premier plan, horizon visible.

## Meilleure option retenue

Ne pas essayer de transformer toute l'ile d'un coup.

Faire un **vertical slice scenic** sur Saint-Paul / Saint-Gilles :

- terrain IGN conserve ;
- blockout jouable conserve ;
- ajout d'une couche `ScenicMoodboard_SaintPaulSaintGilles` ;
- props CC0 places en grappes autour du chemin ;
- kiosk snack procedural pour eviter les artefacts noirs de GLB ;
- ecume et patchs lagon proceduraux ;
- camera third-person abaissee pour sortir du rendu "carte inclinee".

## Implementation V1

Fichiers runtime :

- `apps/game-client/src/world/westScenic.ts` : donnees scenic + collisions simples.
- `apps/game-client/src/render/westScenic.ts` : pose terrain-following, kiosk, ecume, lagon, nuages.
- `apps/game-client/src/render/world.ts` : branchement de la couche scenic.
- `apps/game-client/src/game/collision.ts` : colliders scenic.
- `apps/game-client/src/game/camera.ts` : camera jouable plus basse.

## Validation

- [x] 35 props scenic places sur le contour reel de l'ile.
- [x] 0 prop scenic hors contour.
- [x] Kiosk procedural sans materiau noir.
- [x] Nuages caches en `?mapDebug` pour garder la carte lisible.
- [x] Vue jouable plus proche du moodboard.
- [x] `corepack pnpm typecheck` OK.
- [x] `corepack pnpm lint` OK.
- [x] `corepack pnpm build` OK.

## Limites

- Les bords de plage restent encore decoupes par le mesh terrain.
- Le chemin est encore un ruban blockout ; il doit devenir un vrai sentier sable/terre integre.
- Les palmiers/rochers Kenney aident, mais les assets Reunion custom restent necessaires.
- La vue carte montre le slice ouest comme un diorama local, pas encore toute l'ile au niveau moodboard.

## Suite

- Transformer le ruban chemin en sentier naturel avec bordures irregulieres.
- Ajouter une vraie cascade/ravine locale sur la sortie sud.
- Creer trois assets Reunion custom : snack creole, panneau ravine, petit arret Car Jaune.
- Refaire le meme vertical slice sur Salazie ensuite, pas sur toute l'ile en une passe.
