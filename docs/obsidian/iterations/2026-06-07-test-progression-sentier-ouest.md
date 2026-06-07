# 2026-06-07 22:11 — TEST helpers progression sentier ouest

Phase du cycle : **TEST**
Chantier : **level-design**
Run automatique : `riw-build-quotidien` (heure Reunion).

## Contexte

Validation de la feature livree la veille (phase DEV) :
`WEST_BLOCKOUT_PATH_LENGTH` et `getNearestPathProgress` dans
`apps/game-client/src/world/westBlockout.ts`.

## Tests

Logique rejouee a l'identique (port JS de la donnee + algo, hors Three.js) :

- longueur totale = **114.557** unites monde ;
- depart -> `normalized` = **0.0000**, `lateral` = 0 ;
- point milieu ("Montee ravine") -> `normalized` = 0.6155, `lateral` = 0 ;
- point de vue Maido / Mafate -> `normalized` = **1.0000**, `lateral` = 0 ;
- monotone le long des 18 points du sentier : **OK** ;
- borne [0,1] respectee y compris hors sentier.

Revue statique du module :

- aucun `any`, aucun DOM, aucune logique gameplay, aucun import externe ;
- conforme CLAUDE.md (`world/` pur).

## Limite sandbox

- Le sandbox Linux ne peut PAS executer tsc/lint : `node_modules` installes
  sous Windows (symlinks I/O error).
- A relancer cote Windows :
  `corepack pnpm --filter @riw/game-client typecheck` puis `lint`.

## Bugs trouves

- Aucun bug bloquant.
- Note comportement (pas un bug) : pour une position tres eloignee du sentier,
  `normalized` reste dans [0,1] mais devient peu significatif (projection sur le
  segment le plus proche). Le consommateur HUD devra **gater sur `lateral`**
  (seuil "sur le sentier") avant d'afficher un lieu. -> polish en phase FIX.

## Suite

- Phase FIX (prochain run) : ajouter un helper de seuil lateral
  (ex. `isOnWestPath`) ou une doc explicite, puis passer au chantier props-design.
