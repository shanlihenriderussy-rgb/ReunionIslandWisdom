# 2026-06-15 18:53 — FIX level-design : seuil "sur le sentier" ouest

## Contexte

Phase FIX du cycle quotidien. Chantier `level-design`.
La progression sentier ouest (`getNearestPathProgress`) renvoie toujours un
`normalized` dans [0,1], meme quand le joueur est loin du trace. Peu fiable pour
afficher un "lieu actuel".

## Diff

Fichier : `apps/game-client/src/world/westBlockout.ts`

- Ajout const `WEST_BLOCKOUT_PATH_HALF_WIDTH = 3.5` (demi-largeur du sentier, u monde).
- Ajout fonction pure `isOnWestPath(x, z, halfWidth?)` : vrai si `lateral <= halfWidth`.
- Aucun rendu, aucun DOM, pas de `any`. Reste un module pur.

## Tests

- Logique rejouee en isole (node), seuil 3.5 :
  - (-77,7) sur sentier -> true OK
  - (-83,21) depart -> true OK
  - (-36,8) fin Maido -> true OK
  - (0,0) centre map -> false OK
  - (-77,20) au large -> false OK (lateral 4.63)
  - (-78.5,7) bord plage -> true OK (lateral 1.42)
- 6/6 conformes.
- typecheck / lint / build : a relancer sous Windows (sandbox ne peut pas).

## Risques

- Seuil 3.5 u arbitraire : a ajuster au playtest selon largeur visuelle du blockout.
- Pas d'impact runtime tant que `isOnWestPath` n'est pas appele par le HUD/gameloop.

## Suite

- Chantier suivant (round-robin) : props-design.
- Plus tard : brancher `isOnWestPath` sur l'affichage "lieu actuel" cote HUD.
